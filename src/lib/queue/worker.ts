/**
 * PRODUCTION WORKER HUB
 * Manages Discovery (Serper) and Scraping (Axios) queues.
 */
import { Worker, Job } from 'bullmq';
import { DISCOVERY_QUEUE_NAME, SCRAPING_QUEUE_NAME, scrapingQueue, discoveryQueue } from './config';
import { discoverDomains, scrapeDomain } from '@/app/lib/scraper-engine';
import { initializeFirebase } from '@/firebase';
import {
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  addDoc,
  getDoc,
} from 'firebase/firestore';
import { redis } from '@/lib/redis';

const { firestore } = initializeFirebase();

/* ================= DISCOVERY WORKER ================= */

export const discoveryWorker = new Worker(
  DISCOVERY_QUEUE_NAME,
  async (job: Job) => {
    const { campaignId, adminId, runId, keyword, start, targetCount } = job.data;

    try {
      // Emit pagination log
      if ((global as any).io) {
        (global as any).io.to(campaignId).emit('campaign:progress', {
          domain: `[SERP Page ${Math.floor(start/10) + 1}]`,
          emailsFound: 0,
          node: `Discovering targets for: ${keyword}`,
        });
      }

      // 1. Fetch Serper Results
      const { domains, hasMore } = await discoverDomains(keyword, start);

      // 2. Queue Scraping Jobs for each domain
      for (const domain of domains) {
        await scrapingQueue.add(`scrape-${domain}`, {
          domain,
          campaignId,
          adminId,
          runId,
          targetCount,
        });
      }

      // 3. Check if we need more domains
      const campaignSnap = await getDoc(doc(firestore, 'admins', adminId, 'campaigns', campaignId));
      const currentCount = campaignSnap.data()?.validEmailsCount || 0;

      if (hasMore && currentCount < targetCount) {
        // Queue next page with delay to prevent rate limit
        await discoveryQueue.add(`discover-${keyword}-${start + 10}`, {
          ...job.data,
          start: start + 10,
        }, { delay: 2000 });
      }

      return { discovered: domains.length };
    } catch (error: any) {
      console.error(`[DISCOVERY ERROR] ${job.id}:`, error.message);
      throw error;
    }
  },
  { connection: redis as any, concurrency: 1 }
);

/* ================= SCRAPING WORKER ================= */

export const scrapingWorker = new Worker(
  SCRAPING_QUEUE_NAME,
  async (job: Job) => {
    const { domain, campaignId, adminId, runId, targetCount } = job.data;

    const campaignRef = doc(firestore, 'admins', adminId, 'campaigns', campaignId);
    const runRef = doc(firestore, 'admins', adminId, 'campaigns', campaignId, 'runs', runId);

    try {
      // Atomic Stop Condition check
      const campSnap = await getDoc(campaignRef);
      if (!campSnap.exists()) return { status: 'aborted' };
      if (campSnap.data().validEmailsCount >= targetCount) {
        await updateDoc(campaignRef, { status: 'Completed' });
        if ((global as any).io) (global as any).io.to(campaignId).emit('campaign:completed', { campaignId });
        return { status: 'target_met' };
      }

      // 1. Dispatch Heartbeat
      await updateDoc(runRef, { progressUrlsProcessed: increment(1), updatedAt: serverTimestamp() });

      // 2. Perform Axios Extraction
      const result = await scrapeDomain(domain);

      if (result.status === 'no_emails' || result.emails.length === 0) {
        return { status: 'skipped_no_emails' };
      }

      // 3. Success -> Atomic Yield Update
      const validCount = result.emails.length;
      
      await Promise.all([
        updateDoc(runRef, {
          progressDomainsWithEmails: increment(1),
          totalEmailsExtracted: increment(validCount),
          validEmailsExtracted: increment(validCount),
          updatedAt: serverTimestamp(),
        }),
        updateDoc(campaignRef, {
          totalDomainsFetched: increment(1),
          totalEmailsExtracted: increment(validCount),
          validEmailsCount: increment(validCount),
          updatedAt: serverTimestamp(),
        }),
      ]);

      // 4. Persistence
      const domainCol = collection(firestore, 'admins', adminId, 'campaigns', campaignId, 'runs', runId, 'domains');
      const domainDoc = await addDoc(domainCol, {
        domainName: domain,
        adminUserId: adminId,
        campaignId,
        campaignRunId: runId,
        emailCount: validCount,
        status: 'success',
        pageUrls: result.pagesScanned,
        createdAt: serverTimestamp(),
      });

      // 5. Save individual emails
      const emailCol = collection(firestore, 'admins', adminId, 'campaigns', campaignId, 'runs', runId, 'domains', domainDoc.id, 'emails');
      for (const email of result.emails) {
        await addDoc(emailCol, {
          emailAddress: email,
          isValid: true,
          validationStatus: 'valid',
          createdAt: serverTimestamp(),
        });
      }

      // 6. Socket.IO Telemetry
      if ((global as any).io) {
        (global as any).io.to(campaignId).emit('campaign:progress', {
          domain,
          emailsFound: validCount,
          node: 'Axios Node Active',
        });
      }

      return { status: 'success', emails: validCount };
    } catch (error: any) {
      console.error(`[SCRAPER ERROR] ${domain}:`, error.message);
      throw error;
    }
  },
  { 
    connection: redis as any, 
    concurrency: 8,
    limiter: { max: 10, duration: 1000 }
  }
);
