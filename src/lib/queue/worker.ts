
/**
 * PRODUCTION WORKER HUB (AXIOS + CHEERIO ONLY)
 * Optimized for high-throughput cross-process telemetry via Redis.
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

/**
 * Publishes telemetry to the Redis bridge for Socket.IO broadcasting.
 */
async function emitTelemetry(campaignId: string, event: string, payload: any) {
  try {
    await redis.publish('campaign-telemetry', JSON.stringify({
      campaignId,
      event,
      payload
    }));
  } catch (err: any) {
    console.error('[WORKER TELEMETRY ERROR]:', err.message);
  }
}

/* ================= DISCOVERY WORKER ================= */

export const discoveryWorker = new Worker(
  DISCOVERY_QUEUE_NAME,
  async (job: Job) => {
    const { campaignId, adminId, runId, keyword, start, targetCount } = job.data;

    try {
      console.log(`[DISCOVERY] Processing keyword: ${keyword} (start: ${start})`);

      // Emit pagination status
      await emitTelemetry(campaignId, 'campaign:progress', {
        domain: `[Searching Page ${Math.floor(start/10) + 1}]`,
        emailsFound: 0,
        node: `Discovery Node: ${keyword}`,
      });

      // 1. Fetch Serper Results
      const { domains, hasMore } = await discoverDomains(keyword, start);

      if (domains.length === 0) {
        console.log(`[DISCOVERY] No results found for: ${keyword}`);
        return { discovered: 0 };
      }

      // 2. Queue Scraping Jobs for each unique domain
      for (const domain of domains) {
        await scrapingQueue.add(`scrape-${domain}`, {
          domain,
          campaignId,
          adminId,
          runId,
          targetCount,
        });
      }

      // 3. Stop Condition check
      const campaignSnap = await getDoc(doc(firestore, 'admins', adminId, 'campaigns', campaignId));
      const currentDomainsWithEmails = campaignSnap.data()?.totalDomainsFetched || 0;

      if (hasMore && currentDomainsWithEmails < targetCount) {
        // Queue next page with delay to prevent rate limit
        await discoveryQueue.add(`discover-${keyword}-${start + 10}`, {
          ...job.data,
          start: start + 10,
        }, { delay: 3000 });
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
      // 1. Global Quota check
      const campSnap = await getDoc(campaignRef);
      if (!campSnap.exists()) return { status: 'aborted' };
      
      const currentYield = campSnap.data().totalDomainsFetched || 0;
      if (currentYield >= targetCount) {
        if (campSnap.data().status !== 'Completed') {
          await updateDoc(campaignRef, { status: 'Completed', updatedAt: serverTimestamp() });
          await emitTelemetry(campaignId, 'campaign:completed', { campaignId });
        }
        return { status: 'target_met' };
      }

      // 2. Report Node Attempt
      await emitTelemetry(campaignId, 'campaign:progress', {
        domain,
        emailsFound: 0,
        node: 'Axios Scanning...',
      });

      // 3. Update Run Dispatched Metrics
      await updateDoc(runRef, { progressUrlsProcessed: increment(1), updatedAt: serverTimestamp() });

      // 4. Perform Axios Extraction (Fast)
      const result = await scrapeDomain(domain);

      if (result.status === 'no_emails' || result.emails.length === 0) {
        return { status: 'skipped_no_emails' };
      }

      // 5. SUCCESS -> Target Yield Update
      const emailCount = result.emails.length;
      
      await Promise.all([
        updateDoc(runRef, {
          progressDomainsWithEmails: increment(1),
          totalEmailsExtracted: increment(emailCount),
          validEmailsExtracted: increment(emailCount),
          updatedAt: serverTimestamp(),
        }),
        updateDoc(campaignRef, {
          totalDomainsFetched: increment(1), // THIS tracks the 1000 domain quota
          totalEmailsExtracted: increment(emailCount),
          validEmailsCount: increment(emailCount),
          updatedAt: serverTimestamp(),
        }),
      ]);

      // 6. Persistence
      const domainCol = collection(firestore, 'admins', adminId, 'campaigns', campaignId, 'runs', runId, 'domains');
      const domainDoc = await addDoc(domainCol, {
        domainName: domain,
        adminUserId: adminId,
        campaignId,
        campaignRunId: runId,
        emailCount,
        status: 'success',
        pageUrls: result.pagesScanned,
        createdAt: serverTimestamp(),
      });

      const emailCol = collection(firestore, 'admins', adminId, 'campaigns', campaignId, 'runs', runId, 'domains', domainDoc.id, 'emails');
      for (const email of result.emails) {
        await addDoc(emailCol, {
          emailAddress: email,
          isValid: true,
          validationStatus: 'valid',
          createdAt: serverTimestamp(),
        });
      }

      // 7. Stream Yield Telemetry
      await emitTelemetry(campaignId, 'campaign:progress', {
        domain,
        emailsFound: emailCount,
        node: 'Yield Found',
      });

      return { status: 'success', emails: emailCount };
    } catch (error: any) {
      console.error(`[SCRAPER ERROR] ${domain}:`, error.message);
      throw error;
    }
  },
  { 
    connection: redis as any, 
    concurrency: 10, // Optimized for VPS
    limiter: { max: 20, duration: 1000 }
  }
);

console.log('>>> Workers Operational: Discovery & Scraping listening on Redis.');
