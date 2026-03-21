import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/redis';
import { SCRAPING_QUEUE_NAME } from './config';
import { processDomainExtraction } from '@/app/lib/scraper-engine';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';

const { firestore } = initializeFirebase();

/**
 * PRODUCTION SCRAPING WORKER
 * 
 * Features:
 * - Atomic Stop Condition: Stops processing if target count is met.
 * - Multi-Node Rotation.
 * - Socket.IO Telemetry.
 */
export const scrapingWorker = new Worker(
  SCRAPING_QUEUE_NAME,
  async (job: Job) => {
    const { domain, campaignId, adminId, runId } = job.data;
    const nodeIndex = parseInt(job.id || '0') % 4;

    try {
      // 1. ATOMIC STOP CONDITION CHECK
      const campaignRef = doc(firestore, "admins", adminId, "campaigns", campaignId);
      const campaignSnap = await getDoc(campaignRef);
      
      if (campaignSnap.exists()) {
        const data = campaignSnap.data();
        if (data.validEmailsCount >= data.targetEmailCount) {
          console.log(`[WORKER] Target reached for ${campaignId}. Skipping job.`);
          await updateDoc(campaignRef, { status: "Completed", updatedAt: serverTimestamp() });
          return { status: 'target_met' };
        }
      }

      // 2. EXTRACTION EXECUTION
      const result = await processDomainExtraction(job.data, nodeIndex);

      if (result.status === 'success') {
        const validEmails = result.emails.filter(e => e.isValid);
        const validCount = validEmails.length;
        const flaggedCount = result.emails.length - validCount;

        const runRef = doc(firestore, "admins", adminId, "campaigns", campaignId, "runs", runId);

        // 3. PERSIST METRICS
        await Promise.all([
          updateDoc(runRef, {
            progressUrlsProcessed: increment(1),
            progressDomainsWithEmails: increment(1),
            totalEmailsExtracted: increment(result.emails.length),
            validEmailsExtracted: increment(validCount),
            flaggedEmailsExtracted: increment(flaggedCount),
            updatedAt: serverTimestamp()
          }),
          updateDoc(campaignRef, {
            totalDomainsFetched: increment(1),
            totalEmailsExtracted: increment(result.emails.length),
            validEmailsCount: increment(validCount),
            flaggedEmailsCount: increment(flaggedCount),
            updatedAt: serverTimestamp()
          })
        ]);

        // 4. PERSIST DATA
        const domainCol = collection(firestore, "admins", adminId, "campaigns", campaignId, "runs", runId, "domains");
        const domainDocRef = await addDoc(domainCol, {
          domainName: domain,
          adminUserId: adminId,
          campaignId: campaignId,
          campaignRunId: runId,
          emailCount: result.emails.length,
          status: result.status,
          pageUrls: result.pagesScanned,
          metadata: JSON.stringify(result.metadata),
          lastScrapedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 5. EMIT REAL-TIME TELEMETRY
        if (global.io) {
          global.io.to(campaignId).emit('progress-update', {
            campaignId,
            domain,
            emailsFound: validCount,
            node: result.metadata.apiNode,
            timestamp: new Date().toISOString()
          });
        }
      }

      return result;
    } catch (error: any) {
      console.error(`[WORKER] Critical Failure for job ${job.id}:`, error.message);
      throw error;
    }
  },
  { 
    connection: redis, 
    concurrency: 20,
    limiter: { max: 100, duration: 10000 }
  }
);
