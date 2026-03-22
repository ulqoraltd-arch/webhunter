
import { NextResponse } from 'next/server';
import { resolveMx } from 'dns/promises';

/**
 * DEBUG API: MX Record Diagnostic
 * Verifies if a domain has active mail exchange nodes.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const domain = email.split('@')[1];

    if (!domain) {
      return NextResponse.json({ error: 'Invalid email identifier.' }, { status: 400 });
    }

    const records = await resolveMx(domain);
    
    if (records && records.length > 0) {
      // Sort by priority
      records.sort((a, b) => a.priority - b.priority);
      
      return NextResponse.json({
        success: true,
        isValid: true,
        exchange: records[0].exchange,
        priority: records[0].priority,
        allRecords: records
      });
    }

    return NextResponse.json({
      success: true,
      isValid: false,
      reason: 'No MX records found for this domain.'
    });
  } catch (error: any) {
    console.error('[DEBUG] MX Diagnostic Failed:', error.message);
    return NextResponse.json({
      success: false,
      error: error.code === 'ENODATA' || error.code === 'ENOTFOUND' ? 'Domain does not exist or has no mail servers.' : error.message
    }, { status: 500 });
  }
}
