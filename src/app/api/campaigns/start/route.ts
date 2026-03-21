
import { NextResponse } from 'next/server';
import { scrapingQueue } from '@/lib/queue/config';

export async function POST(req: Request) {
  try {
    const { campaignId, adminId, runId, keywords, quota } = await req.json();

    // In a real production scenario, we'd use the keywords to discover 10,000+ domains.
    // For this prototype, we queue a batch of domains for the worker to process.
    const batchSize = Math.min(quota * 2, 500); // Queue up to 500 initial discovery tasks
    
    const jobs = Array.from({ length: batchSize }).map((_, i) => ({
      name: `scrape-${campaignId}-${i}`,
      data: {
        domain: `discovery-node-${i}.com`, // Simulated domain discovery
        campaignId,
        adminId,
        runId,
        retryCount: 0
      }
    }));

    await scrapingQueue.addBulk(jobs);

    return NextResponse.json({ 
      success: true, 
      message: `${jobs.length} jobs queued in BullMQ.` 
    });
  } catch (error) {
    console.error('Failed to queue campaign jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
