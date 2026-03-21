
import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/redis';
import { SCRAPING_QUEUE_NAME } from './config';
import { processDomainExtraction } from '@/app/lib/scraper-engine';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';

const { firestore } = initializeFirebase();

/**
 * PRODUCTION WORKER
 * 
 * Handles the actual scraping jobs from BullMQ.
 * Emits progress to Socket.IO and saves results to Firestore.
 */
export const scrapingWorker = new Worker(
  SCRAPING_QUEUE_NAME,
  async (job: Job) => {
    const { domain, campaignId, adminId, runId } = job.data;
    
    console.log(`[WORKER] Processing domain: ${domain} for campaign: ${campaignId}`);

    try {
      const result = await processDomainExtraction(job.data, Math.floor(Math.random() * 100));

      if (result.status === 'success') {
        const validCount = result.emails.filter(e => e.isValid).length;
        const flaggedCount = result.emails.length - validCount;

        // 1. Persist to Firestore (Using Client SDK in Node environment)
        const runRef = doc(firestore, "admins", adminId, "campaigns", campaignId, "runs", runId);
        const campaignRef = doc(firestore, "admins", adminId, "campaigns", campaignId);

        await updateDoc(runRef, {
          progressUrlsProcessed: increment(1),
          progressDomainsWithEmails: increment(1),
          totalEmailsExtracted: increment(result.emails.length),
          validEmailsExtracted: increment(validCount),
          flaggedEmailsExtracted: increment(flaggedCount),
          updatedAt: serverTimestamp()
        });

        await updateDoc(campaignRef, {
          totalDomainsFetched: increment(1),
          totalEmailsExtracted: increment(result.emails.length),
          validEmailsCount: increment(validCount),
          flaggedEmailsCount: increment(flaggedCount),
          updatedAt: serverTimestamp()
        });

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
          createdAt: serverTimestamp()
        });

        const emailCol = collection(firestore, "admins", adminId, "campaigns", campaignId, "runs", runId, "domains", domainDocRef.id, "emails");
        for (const email of result.emails) {
          await addDoc(emailCol, {
            emailAddress: email.address,
            adminUserId: adminId,
            campaignId: campaignId,
            campaignRunId: runId,
            scrapedDomainId: domainDocRef.id,
            isValid: email.isValid,
            validationStatus: email.validationStatus,
            urlFoundOn: result.pagesScanned[0],
            createdAt: serverTimestamp()
          });
        }

        // 2. Emit Real-time Update via Socket.IO
        if (global.io) {
          global.io.to(campaignId).emit('progress-update', {
            campaignId,
            domain,
            emailsFound: result.emails.length,
            node: result.metadata.apiNode,
            timestamp: new Date().toISOString()
          });
        }
      }

      return result;
    } catch (error) {
      console.error(`[WORKER] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  { connection: redis, concurrency: 10 }
);

scrapingWorker.on('completed', (job) => {
  console.log(`[WORKER] Job ${job.id} completed successfully`);
});

scrapingWorker.on('failed', (job, err) => {
  console.error(`[WORKER] Job ${job?.id} failed with error: ${err.message}`);
});
