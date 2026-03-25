import { NextResponse } from 'next/server';
import { discoveryQueue } from '@/lib/queue/config';

export async function POST(req: Request) {
  try {
    const { campaignId, adminId, runId, keywords, quota } = await req.json();

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ error: 'Keywords are required' }, { status: 400 });
    }

    // Start discovery for each keyword
    // Each keyword gets its own discovery chain
    for (const keyword of keywords) {
      await discoveryQueue.add(`init-${keyword}-${campaignId}`, {
        campaignId,
        adminId,
        runId,
        keyword,
        start: 0,
        targetCount: quota
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Engine initialized. Discovery chain active for ${keywords.length} keywords.` 
    });
  } catch (error) {
    console.error('Failed to start campaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
