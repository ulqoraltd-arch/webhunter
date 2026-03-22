
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * DEBUG API: Axios + Cheerio Diagnostic
 * Fetches a domain and attempts to parse common identity patterns.
 */
export async function POST(req: Request) {
  try {
    const { domain } = await req.json();
    
    // Hardened Axios Request
    const response = await axios.get(`https://${domain}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const html = $('body').html() || '';
    
    // Simple regex for test purposes
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = html.match(emailRegex) || [];

    return NextResponse.json({
      success: true,
      status: response.status,
      emails: [...new Set(foundEmails)].slice(0, 10), // Return unique samples
      message: `Successfully analyzed ${domain} content.`
    });
  } catch (error: any) {
    console.error('[DEBUG] Extraction Test Failed:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
