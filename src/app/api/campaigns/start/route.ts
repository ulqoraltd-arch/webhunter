import { NextResponse } from 'next/server';
import { scrapingQueue } from '@/lib/queue/config';
import { discoverDomains } from '@/app/lib/scraper-engine';

export async function POST(req: Request) {
  try {
    const { campaignId, adminId, runId, keywords, quota } = await req.json();

    // Perform live discovery instead of dummy domains
    const realDomains = await discoverDomains(keywords, 100);
    
    // If no domains found initially, use some broad fallbacks or retry with different keyword
    const domainsToQueue = realDomains.length > 0 ? realDomains : [];

    const jobs = domainsToQueue.map((domain, i) => ({
      name: `scrape-${campaignId}-${i}`,
      data: {
        domain,
        campaignId,
        adminId,
        runId,
        retryCount: 0
      }
    }));

    if (jobs.length > 0) {
      await scrapingQueue.addBulk(jobs);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${jobs.length} real domains discovered and queued.`,
      count: jobs.length
    });
  } catch (error) {
    console.error('Failed to queue campaign jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
