import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/redis';
import { SCRAPING_QUEUE_NAME } from './config';
import { processDomainExtraction } from '@/app/lib/scraper-engine';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';

// Initialize Firebase for the worker process
const { firestore } = initializeFirebase();

/**
 * PRODUCTION SCRAPING WORKER
 * 
 * Handles high-concurrency jobs with Redis-backed rate limiting.
 * Emits telemetry via Socket.IO and persists results to Firestore.
 */
export const scrapingWorker = new Worker(
  SCRAPING_QUEUE_NAME,
  async (job: Job) => {
    const { domain, campaignId, adminId, runId } = job.data;
    
    // Select a node based on the job ID to distribute load across the 4 nodes
    const nodeIndex = parseInt(job.id || '0') % 4;

    try {
      // Execute the actual extraction logic
      const result = await processDomainExtraction(job.data, nodeIndex);

      if (result.status === 'success') {
        const validCount = result.emails.filter(e => e.isValid).length;
        const flaggedCount = result.emails.length - validCount;

        // 1. UPDATE CAMPAIGN METRICS (Atomic Updates)
        const runRef = doc(firestore, "admins", adminId, "campaigns", campaignId, "runs", runId);
        const campaignRef = doc(firestore, "admins", adminId, "campaigns", campaignId);

        // Batch updates to minimize Firestore pressure during high-throughput
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

        // 2. LOG DOMAIN RESULTS
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

        // 3. LOG EMAIL ENTITIES
        const emailCol = collection(firestore, "admins", adminId, "campaigns", campaignId, "runs", runId, "domains", domainDocRef.id, "emails");
        const emailPromises = result.emails.map(email => 
          addDoc(emailCol, {
            emailAddress: email.address,
            adminUserId: adminId,
            campaignId: campaignId,
            campaignRunId: runId,
            scrapedDomainId: domainDocRef.id,
            isValid: email.isValid,
            validationStatus: email.validationStatus,
            urlFoundOn: result.pagesScanned[0],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        );
        await Promise.all(emailPromises);

        // 4. TELEMETRY EMISSION (Real-time Socket.IO)
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
    } catch (error: any) {
      console.error(`[WORKER] Job ${job.id} failed on node ${nodeIndex}:`, error.message);
      
      // If we hit a rate limit error from an API node, we tell BullMQ to back off
      if (error.message.includes('RATE_LIMIT')) {
        throw new Error('RETRY_WITH_BACKOFF');
      }
      
      throw error;
    }
  },
  { 
    connection: redis, 
    concurrency: 20, // Process 20 domains in parallel per worker instance
    limiter: {
      max: 50, // Strict limiter: max 50 jobs per 5 seconds to protect API nodes
      duration: 5000,
    }
  }
);

scrapingWorker.on('failed', (job, err) => {
  console.warn(`[WORKER] Extraction node failed for job ${job?.id}: ${err.message}`);
});
