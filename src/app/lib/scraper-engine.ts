/**
 * WebHunter Pro - ULTRA FREE ENGINE (ADVANCED)
 * Smart scraping + hidden email decode + social hints
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

/* ================= CONFIG ================= */

const SERPER_KEYS = [
  process.env.SERPER_NODE_1_KEY,
  process.env.SERPER_NODE_2_KEY,
  process.env.SERPER_NODE_3_KEY,
  process.env.SERPER_NODE_4_KEY,
].filter(Boolean);

/* ================= GLOBAL BROWSER ================= */

let GLOBAL_BROWSER: any = null;

/* ================= TYPES ================= */

export interface ScrapingJob {
  domain: string;
  campaignId: string;
  adminId: string;
  runId: string;
  retryCount: number;
}

export interface ExtractedEmail {
  address: string;
  isValid: boolean;
  validationStatus: 'valid' | 'flagged_syntax';
}

export interface ExtractionResult {
  emails: ExtractedEmail[];
  pagesScanned: string[];
  status: 'success' | 'failed' | 'no_emails';
  metadata: {
    apiNode: string;
    speed: string;
    method: string;
  };
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

/* ================= DISCOVERY ================= */

export async function discoverDomains(keywords: string[], limitCount: number = 100) {
  const domains: string[] = [];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  const apiKey = SERPER_KEYS[Math.floor(Math.random() * SERPER_KEYS.length)];

  if (!apiKey) return [];

  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: keyword, num: Math.min(limitCount, 100) },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const results = response.data.organic || [];
    for (const item of results) {
      try {
        const url = new URL(item.link);
        if (!domains.includes(url.hostname)) {
          domains.push(url.hostname);
        }
      } catch {}
    }
  } catch (err) {
    console.error('[DISCOVERY ERROR]', err);
  }

  return domains;
}

/* ================= EMAIL LOGIC ================= */

function extractEmails(text: string) {
  return text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
}

function extractMailto($: cheerio.CheerioAPI) {
  const emails: string[] = [];
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) emails.push(href.replace('mailto:', '').split('?')[0]);
  });
  return emails;
}

function decodeCloudflareEmails($: cheerio.CheerioAPI) {
  const emails: string[] = [];
  $('[data-cfemail]').each((_, el) => {
    const encoded = $(el).attr('data-cfemail');
    if (!encoded) return;
    try {
      let email = '';
      const r = parseInt(encoded.substr(0, 2), 16);
      for (let n = 2; n < encoded.length; n += 2) {
        const code = parseInt(encoded.substr(n, 2), 16) ^ r;
        email += String.fromCharCode(code);
      }
      emails.push(email);
    } catch {}
  });
  return emails;
}

function extractSocialLinks($: cheerio.CheerioAPI) {
  const links: string[] = [];
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes('linkedin.com') || href.includes('facebook.com') || href.includes('instagram.com')) {
      links.push(href.split('?')[0]);
    }
  });
  return [...new Set(links)].slice(0, 3);
}

function validateEmail(email: string): ExtractedEmail {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return {
    address: email,
    isValid: ok,
    validationStatus: ok ? 'valid' : 'flagged_syntax',
  };
}

/* ================= AXIOS SCRAPER ================= */

async function scrapeAxios(url: string) {
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': randomUA() },
    });
    const $ = cheerio.load(res.data);
    const emails = [
      ...extractEmails($.text()),
      ...extractMailto($),
      ...decodeCloudflareEmails($),
    ];
    return { emails, socials: extractSocialLinks($) };
  } catch {
    return { emails: [], socials: [] };
  }
}

/* ================= MAIN ================= */

export async function processDomainExtraction(
  job: ScrapingJob,
  nodeIndex: number
): Promise<ExtractionResult> {
  const start = Date.now();
  const base = [
    `https://${job.domain}`,
    `https://${job.domain}/contact`,
    `https://${job.domain}/about`,
  ];

  let allEmails: string[] = [];
  let pagesScanned: string[] = [];

  for (const url of base) {
    const { emails, socials } = await scrapeAxios(url);
    allEmails.push(...emails);
    pagesScanned.push(url);
    if (allEmails.length > 5) break;
    await sleep(500);
  }

  const unique = [...new Set(allEmails)].filter(e => e.length < 100 && !e.includes('.png') && !e.includes('.jpg'));
  const validated = unique.map(validateEmail);

  return {
    emails: validated,
    pagesScanned,
    status: validated.length ? 'success' : 'no_emails',
    metadata: {
      apiNode: `Node-${nodeIndex + 1}`,
      speed: `${((Date.now() - start) / 1000).toFixed(2)}s`,
      method: 'axios-cheerio',
    },
  };
}
