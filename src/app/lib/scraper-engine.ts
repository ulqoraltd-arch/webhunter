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
    'Mozilla/5.0 (Windows NT 10.0)',
    'Mozilla/5.0 (Macintosh)',
    'Mozilla/5.0 (X11; Linux x86_64)',
  ];
  return list[Math.floor(Math.random() * list.length)];
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

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

/* ---- Obfuscated emails ---- */
function extractObfuscatedEmails(text: string) {
  const emails: string[] = [];

  const patterns = [
    /([a-zA-Z0-9._%+-]+)\s?\[at\]\s?([a-zA-Z0-9.-]+)\s?\[dot\]\s?([a-zA-Z]{2,})/gi,
    /([a-zA-Z0-9._%+-]+)\s?\(at\)\s?([a-zA-Z0-9.-]+)\s?\(dot\)\s?([a-zA-Z]{2,})/gi,
    /([a-zA-Z0-9._%+-]+)\s+at\s+([a-zA-Z0-9.-]+)\s+dot\s+([a-zA-Z]{2,})/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      emails.push(`${match[1]}@${match[2]}.${match[3]}`);
    }
  }

  return emails;
}

/* ---- Base64 emails ---- */
function extractBase64Emails(text: string) {
  const emails: string[] = [];

  const base64Regex = /[A-Za-z0-9+/=]{20,}/g;
  const matches = text.match(base64Regex) || [];

  for (const m of matches) {
    try {
      const decoded = Buffer.from(m, 'base64').toString('utf-8');
      const found = extractEmails(decoded);
      emails.push(...found);
    } catch {}
  }

  return emails;
}

/* ---- social links ---- */
function extractSocialLinks($: cheerio.CheerioAPI) {
  const links: string[] = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';

    if (
      href.includes('linkedin.com') ||
      href.includes('facebook.com') ||
      href.includes('instagram.com')
    ) {
      const clean = href.split('?')[0];
      links.push(clean);
    }
  });

  return [...new Set(links)].slice(0, 3);
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
      const key =
        SERPER_KEYS[Math.floor(Math.random() * SERPER_KEYS.length)];

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
        node: i,
      };
    } catch {}
  }

  return { links: [], node: 0 };
}

/* ================= AXIOS SCRAPER ================= */

async function scrapeAxios(url: string) {
  for (let i = 0; i < 2; i++) {
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
        ...extractObfuscatedEmails($.text()),
        ...extractBase64Emails($.text()),
      ];

      const socials = extractSocialLinks($);

      return { emails, socials };
    } catch {
      if (i === 1) {
        return { emails: [], socials: [] };
      }
    }
  }

  return { emails: [], socials: [] };
}

/* ================= PLAYWRIGHT ================= */

async function scrapePlaywright(url: string) {
  try {
    if (!GLOBAL_BROWSER) {
      GLOBAL_BROWSER = await chromium.launch({ headless: true });
    }

    const context = await GLOBAL_BROWSER.newContext();
    const page = await context.newPage();

    await page.goto(url, { timeout: 15000 });

    const content = await page.content();

    await context.close();

    return extractEmails(content);
  } catch {
    return [];
  }
}

/* ================= MAIN ================= */

export async function processDomainExtraction(
  job: ScrapingJob,
  nodeIndex: number
): Promise<ExtractionResult> {
  const start = Date.now();

  try {
    const base = [
      `https://${job.domain}`,
      `https://${job.domain}/contact`,
      `https://${job.domain}/about`,
    ];

    const { links, node } = await searchSerper(job.domain, nodeIndex);

    const urls = [...new Set([...base, ...links.slice(0, 2)])];

    let emails: string[] = [];
    let socialLinks: string[] = [];

    for (const url of urls) {
      const { emails: e, socials } = await scrapeAxios(url);

      emails.push(...e);
      socialLinks.push(...socials);

      await sleep(800 + Math.random() * 1500);
    }

    for (const s of socialLinks.slice(0, 2)) {
      const { emails: e } = await scrapeAxios(s);
      emails.push(...e);
    }

    if (emails.length === 0 && job.retryCount < 2) {
      for (const url of urls.slice(0, 2)) {
        const e = await scrapePlaywright(url);
        emails.push(...e);
      }
    }

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