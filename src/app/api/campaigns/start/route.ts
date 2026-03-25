
import { NextResponse } from 'next/server';
import { discoveryQueue } from '@/lib/queue/config';

/**
 * INITIALIZES CAMPAIGN EXECUTION
 * Decouples start logic from workers to prevent UI hanging.
 */
export async function POST(req: Request) {
  try {
    const { campaignId, adminId, runId, keywords, quota } = await req.json();

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ error: 'At least one keyword is required.' }, { status: 400 });
    }

    // Initialize discovery chain for each keyword
    // Each keyword runs in parallel in the discovery queue
    for (const keyword of keywords) {
      await discoveryQueue.add(`init-${keyword}-${campaignId}`, {
        campaignId,
        adminId,
        runId,
        keyword,
        start: 0,
        targetCount: quota || 1000
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Engine initialized. Discovery chain active for ${keywords.length} keywords. Targeting ${quota} domains with emails.` 
    });
  } catch (error: any) {
    console.error('Failed to start campaign cluster:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
