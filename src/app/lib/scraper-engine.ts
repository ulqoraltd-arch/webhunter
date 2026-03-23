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
    'Mozilla/5.0 (Windows NT 10.0)',
    'Mozilla/5.0 (Macintosh)',
    'Mozilla/5.0 (X11; Linux x86_64)',
  ];
  return list[Math.floor(Math.random() * list.length)];
};

/* ================= EMAIL LOGIC ================= */

function extractEmails(text: string) {
  return text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
}

/* ---- mailto ---- */
function extractMailto($: cheerio.CheerioAPI) {
  const emails: string[] = [];
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) emails.push(href.replace('mailto:', '').split('?')[0]);
  });
  return emails;
}

/* ---- Cloudflare decode ---- */
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

/* ---- social hints ---- */
function extractSocialLinks($: cheerio.CheerioAPI) {
  const links: string[] = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (
      href.includes('linkedin.com') ||
      href.includes('facebook.com') ||
      href.includes('instagram.com')
    ) {
      links.push(href);
    }
  });

  return links.slice(0, 3);
}

/* ---- validation ---- */
function validateEmail(email: string): ExtractedEmail {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return {
    address: email,
    isValid: ok,
    validationStatus: ok ? 'valid' : 'flagged_syntax',
  };
}

/* ================= SERPER ================= */

async function searchSerper(domain: string, nodeIndex: number) {
  const query = `site:${domain} contact email`;

  for (let i = 0; i < SERPER_KEYS.length; i++) {
    try {
      const key = SERPER_KEYS[(nodeIndex + i) % SERPER_KEYS.length];

      const res = await axios.post(
        'https://google.serper.dev/search',
        { q: query, num: 5 },
        {
          headers: {
            'X-API-KEY': key!,
            'Content-Type': 'application/json',
          },
          timeout: 6000,
        }
      );

      return {
        links: (res.data.organic || []).map((r: any) => r.link),
        node: (nodeIndex + i) % SERPER_KEYS.length,
      };
    } catch {}
  }

  return { links: [], node: 0 };
}

/* ================= AXIOS SCRAPER ================= */

async function scrapeAxios(url: string) {
  try {
    const res = await axios.get(url, {
      timeout: 7000,
      headers: { 'User-Agent': randomUA() },
    });

    const $ = cheerio.load(res.data);

    const emails = [
      ...extractEmails($.text()),
      ...extractMailto($),
      ...decodeCloudflareEmails($),
    ];

    const socials = extractSocialLinks($);

    return { emails, socials };
  } catch {
    return { emails: [], socials: [] };
  }
}

/* ================= PLAYWRIGHT ================= */

async function scrapePlaywright(url: string) {
  let browser;

  try {
    browser = await chromium.launch({ headless: true });

    const page = await browser.newPage();
    await page.goto(url, { timeout: 15000 });

    const content = await page.content();

    return extractEmails(content);
  } catch {
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

/* ================= MAIN ================= */

export async function processDomainExtraction(
  job: ScrapingJob,
  nodeIndex: number
): Promise<ExtractionResult> {
  const start = Date.now();

  try {
    /* === SMART BASE URLS === */

    const base = [
      `https://${job.domain}`,
      `https://${job.domain}/contact`,
      `https://${job.domain}/about`,
    ];

    /* === SERPER === */

    const { links, node } = await searchSerper(job.domain, nodeIndex);

    const urls = [...new Set([...base, ...links.slice(0, 2)])];

    let emails: string[] = [];
    let socialLinks: string[] = [];

    /* === SAFE LOOP === */

    for (const url of urls) {
      const { emails: e, socials } = await scrapeAxios(url);

      emails.push(...e);
      socialLinks.push(...socials);

      await sleep(800 + Math.random() * 1200);
    }

    /* === SOCIAL BONUS SCRAPE === */

    for (const s of socialLinks.slice(0, 2)) {
      const { emails: e } = await scrapeAxios(s);
      emails.push(...e);
    }

    /* === PLAYWRIGHT FALLBACK === */

    if (emails.length === 0 && job.retryCount < 2) {
      for (const url of urls.slice(0, 2)) {
        const e = await scrapePlaywright(url);
        emails.push(...e);
      }
    }

    /* === CLEAN === */

    const unique = [
      ...new Set(
        emails.filter(
          (e) =>
            e.length < 100 &&
            !e.includes('.png') &&
            !e.includes('.jpg') &&
            !e.includes('example.com')
        )
      ),
    ];

    const validated = unique.map(validateEmail);

    return {
      emails: validated,
      pagesScanned: urls,
      status: validated.length ? 'success' : 'no_emails',
      metadata: {
        apiNode: `serper-${node}`,
        speed: `${((Date.now() - start) / 1000).toFixed(2)}s`,
        method: 'ultra-free-engine',
      },
    };
  } catch {
    return {
      emails: [],
      pagesScanned: [],
      status: 'failed',
      metadata: {
        apiNode: 'fail',
        speed: '0s',
        method: 'error',
      },
    };
  }
}