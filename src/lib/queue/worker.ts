/**
 * PRODUCTION SCRAPING WORKER (OPTIMIZED)
 * - Atomic-safe target stop
 * - Standardized Socket.IO Telemetry
 */
import { Worker, Job } from 'bullmq';
import { SCRAPING_QUEUE_NAME } from './config';
import { processDomainExtraction } from '@/app/lib/scraper-engine';
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

const { firestore } = initializeFirebase();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

let TARGET_REACHED_CACHE: Record<string, boolean> = {};

export const scrapingWorker = new Worker(
  SCRAPING_QUEUE_NAME,
  async (job: Job) => {
    const { domain, campaignId, adminId, runId } = job.data;
    const nodeIndex = Number(job.id || 0) % 4;

    const campaignRef = doc(firestore, 'admins', adminId, 'campaigns', campaignId);

    try {
      if (TARGET_REACHED_CACHE[campaignId]) {
        return { status: 'skipped_target_met' };
      }

      const campaignSnap = await getDoc(campaignRef);
      if (!campaignSnap.exists()) {
        return { status: 'campaign_not_found' };
      }

      const campaignData = campaignSnap.data();

      // Check if target is met
      if (campaignData.validEmailsCount >= campaignData.targetEmailCount) {
        console.log(`[STOP] Target met for ${campaignId}`);
        TARGET_REACHED_CACHE[campaignId] = true;

        await updateDoc(campaignRef, {
          status: 'Completed',
          updatedAt: serverTimestamp(),
        });

        if ((global as any).io) {
          (global as any).io.to(campaignId).emit('campaign:completed', { campaignId });
        }

        return { status: 'target_met' };
      }

      // Start Extraction
      if ((global as any).io) {
        (global as any).io.to(campaignId).emit('campaign:start', { campaignId, domain });
      }

      let result;
      try {
        result = await withTimeout(
          processDomainExtraction(job.data, nodeIndex),
          25000
        );
      } catch {
        return { status: 'timeout_skipped' };
      }

      const validEmails = result.emails.filter((e: any) => e.isValid);
      const validCount = validEmails.length;
      const flaggedCount = result.emails.length - validCount;

      if (result.status === 'no_emails' || validCount === 0) {
        return { status: 'no_emails_skipped' };
      }

      const runRef = doc(firestore, 'admins', adminId, 'campaigns', campaignId, 'runs', runId);
      const domainCol = collection(firestore, 'admins', adminId, 'campaigns', campaignId, 'runs', runId, 'domains');

      // Atomic UI Updates
      await Promise.all([
        updateDoc(runRef, {
          progressUrlsProcessed: increment(1),
          progressDomainsWithEmails: increment(1),
          totalEmailsExtracted: increment(result.emails.length),
          validEmailsExtracted: increment(validCount),
          flaggedEmailsExtracted: increment(flaggedCount),
          updatedAt: serverTimestamp(),
        }),
        updateDoc(campaignRef, {
          totalDomainsFetched: increment(1),
          totalEmailsExtracted: increment(result.emails.length),
          validEmailsCount: increment(validCount),
          flaggedEmailsCount: increment(flaggedCount),
          updatedAt: serverTimestamp(),
        }),
      ]);

      // Persistence
      await addDoc(domainCol, {
        domainName: domain,
        adminUserId: adminId,
        campaignId,
        campaignRunId: runId,
        emailCount: result.emails.length,
        status: result.status,
        pageUrls: result.pagesScanned,
        metadata: JSON.stringify(result.metadata),
        lastScrapedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Real-time Update
      if ((global as any).io) {
        (global as any).io.to(campaignId).emit('campaign:progress', {
          campaignId,
          domain,
          emailsFound: validCount,
          node: result.metadata.apiNode,
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    } catch (error: any) {
      console.error(`[WORKER ERROR] Job ${job.id}:`, error.message);
      throw error;
    }
  },
  {
    connection: (global as any).redis || {},
    concurrency: 15,
    limiter: {
      max: 50,
      duration: 5000,
    },
  }
);
