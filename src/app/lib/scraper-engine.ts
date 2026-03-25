
/**
 * WebHunter Pro - ULTRA STABLE ENGINE (AXIOS + SERPER)
 * Removed Playwright. Focused on raw speed and VPS stability.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const SERPER_KEYS = [
  process.env.SERPER_NODE_1_KEY,
  process.env.SERPER_NODE_2_KEY,
  process.env.SERPER_NODE_3_KEY,
  process.env.SERPER_NODE_4_KEY,
].filter(Boolean);

let keyIndex = 0;

/* ================= TYPES ================= */

export interface SerperResult {
  domains: string[];
  hasMore: boolean;
}

export interface ExtractionResult {
  emails: string[];
  pagesScanned: string[];
  status: 'success' | 'no_emails' | 'failed';
}

/* ================= HELPERS ================= */

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const randomUA = () => {
  const list = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];
  return list[Math.floor(Math.random() * list.length)];
};

/* ================= DISCOVERY (SERPER) ================= */

export async function discoverDomains(keyword: string, start: number = 0): Promise<SerperResult> {
  const apiKey = SERPER_KEYS[keyIndex % SERPER_KEYS.length];
  keyIndex++;

  if (!apiKey) throw new Error('No Serper API keys configured in .env');

  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: keyword, num: 10, start },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const results = response.data.organic || [];
    const domains = results.map((item: any) => {
      try {
        const url = new URL(item.link);
        // Exclude big platforms to increase efficiency
        if (url.hostname.includes('linkedin.com') || url.hostname.includes('facebook.com') || url.hostname.includes('twitter.com') || url.hostname.includes('instagram.com')) {
          return null;
        }
        return url.hostname;
      } catch {
        return null;
      }
    }).filter(Boolean);

    return {
      domains: [...new Set(domains as string[])],
      hasMore: results.length >= 10,
    };
  } catch (err: any) {
    console.error(`[SERPER ERROR] Node ${keyIndex % SERPER_KEYS.length}:`, err.message);
    throw err;
  }
}

/* ================= EXTRACTION (AXIOS) ================= */

function extractEmails(text: string): string[] {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
  return text.match(regex) || [];
}

export async function scrapeDomain(domain: string): Promise<ExtractionResult> {
  // Strategy: Try home page, then common contact points
  const pagesToTry = [
    `https://${domain}`,
    `https://${domain}/contact`,
    `https://${domain}/about`,
  ];

  let allEmails: string[] = [];
  let scanned: string[] = [];

  for (const url of pagesToTry) {
    try {
      const res = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': randomUA() },
        maxRedirects: 3,
        validateStatus: (status) => status < 400,
      });

      const $ = cheerio.load(res.data);
      // Clean up the DOM to improve regex accuracy
      $('script, style, iframe, noscript, header, footer').remove();
      
      const text = $.text();
      const found = extractEmails(text);
      allEmails.push(...found);
      scanned.push(url);

      // Efficiency: If we find 3+ emails on home, don't bother crawling deeper
      if (allEmails.length >= 2) break;
      
      await sleep(1500); // Politeness delay
    } catch {
      continue;
    }
  }

  // Final filtering of extraction artifacts
  const cleanEmails = [...new Set(allEmails)].filter(e => {
    const l = e.toLowerCase();
    return !l.endsWith('.png') && !l.endsWith('.jpg') && !l.endsWith('.jpeg') && !l.endsWith('.gif') && e.length < 80;
  });

  return {
    emails: cleanEmails,
    pagesScanned: scanned,
    status: cleanEmails.length > 0 ? 'success' : 'no_emails',
  };
}
