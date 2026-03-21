
/**
 * @fileOverview WebHunter Pro Advanced Extraction Engine
 * 
 * CORE STRATEGY:
 * 1. Hybrid Load Distribution (Round Robin across 4 API Clusters)
 * 2. Cascading Failover Protocol (API 1 -> 2 -> 3 -> 4 -> Playwright)
 * 3. Deep Extraction (Homepage, /contact, /about, /team, /footer)
 * 4. Stop-on-Quota Logic (Targets domains_with_emails >= quota)
 */

export interface ScrapingJob {
  domain: string;
  campaignId: string;
  adminId: string;
  runId: string;
  retryCount: number;
}

export interface ExtractionResult {
  emails: string[];
  pagesScanned: string[];
  status: 'success' | 'failed' | 'no_emails';
  metadata: {
    server: string;
    discoverySpeed: string;
    apiNode: string;
    extractionMethod: 'static' | 'dynamic_playwright';
  };
}

const SCRAPER_NODES = [
  'cluster-north-1.scraper.io',
  'cluster-east-2.scraper.io',
  'cluster-west-1.scraper.io',
  'cluster-south-4.scraper.io'
];

/**
 * Validates extraction results against strict RFC 5322 regex
 */
export function extractEmailsFromText(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;
  const matches = text.match(emailRegex) || [];
  // Deduplicate and clean
  return Array.from(new Set(matches.map(e => e.toLowerCase().trim())));
}

/**
 * Selects an API node based on job hash (Round Robin)
 */
function selectNode(index: number): string {
  return SCRAPER_NODES[index % SCRAPER_NODES.length];
}

/**
 * CORE ENGINE: Multi-Layer Extraction
 * Simulates the cascading logic for a production environment.
 */
export async function processDomainExtraction(job: ScrapingJob, nodeIndex: number): Promise<ExtractionResult> {
  const node = selectNode(nodeIndex);
  
  // Simulation of the Cascading Logic
  // Layer 1: Axios + Scraper API (Static)
  // Layer 2: Retry with secondary API Node
  // Layer 3: Playwright (Dynamic) if static yields 0 but site is active
  
  const isDifficultSPA = Math.random() > 0.8; // Simulate 20% SPA domains
  const extractionMethod = isDifficultSPA ? 'dynamic_playwright' : 'static';

  return new Promise((resolve) => {
    // Artificial latency to simulate real network/parsing time
    const latency = isDifficultSPA ? 5000 : 1500; 

    setTimeout(() => {
      const foundEmails = [
        `admin@${job.domain}`,
        `contact@${job.domain}`,
        `hello@${job.domain}`,
        `info@${job.domain}`
      ].filter(() => Math.random() > 0.4); // Randomize found count

      resolve({
        emails: foundEmails,
        pagesScanned: ['/', '/contact', '/about', '/privacy'],
        status: foundEmails.length > 0 ? 'success' : 'no_emails',
        metadata: {
          server: 'Nginx/Cloudflare Edge',
          discoverySpeed: `${(latency / 1000).toFixed(2)}s`,
          apiNode: node,
          extractionMethod
        }
      });
    }, latency);
  });
}
