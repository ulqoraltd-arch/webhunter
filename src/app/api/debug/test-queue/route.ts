
import { NextResponse } from 'next/server';
import { scrapingQueue } from '@/lib/queue/config';

/**
 * DEBUG API: BullMQ Cluster Test
 * Manually injects a diagnostic job into the Redis-backed queue.
 */
export async function POST(req: Request) {
  try {
    const { domain, campaignId, adminId, runId } = await req.json();

    const job = await scrapingQueue.add(`debug-job-${Date.now()}`, {
      domain: domain || 'debug-test.com',
      campaignId: campaignId || 'debug-camp',
      adminId: adminId || 'debug-admin',
      runId: runId || 'debug-run',
      retryCount: 0,
      isDebug: true
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Diagnostic job successfully queued in BullMQ.'
    });
  } catch (error: any) {
    console.error('[DEBUG] Queue Test Failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
