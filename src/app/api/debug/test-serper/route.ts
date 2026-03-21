
import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * DEBUG API: Serper Domain Discovery Test
 * Verifies connectivity and credit usage for the Serper Intelligence node.
 */
export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'SERPER_API_KEY is not configured in .env' }, { status: 500 });
    }

    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: query, num: 10 },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const domains = response.data.organic?.map((item: any) => {
      try {
        const url = new URL(item.link);
        return url.hostname;
      } catch {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      raw: response.data,
      discoveredDomains: [...new Set(domains)],
    });
  } catch (error: any) {
    console.error('[DEBUG] Serper Test Failed:', error.response?.data || error.message);
    return NextResponse.json({
      success: false,
      error: error.response?.data || error.message,
    }, { status: 500 });
  }
}
