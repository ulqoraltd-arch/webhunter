
import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';

export const SCRAPING_QUEUE_NAME = 'scraping-tasks';
export const PLAYWRIGHT_FALLBACK_QUEUE_NAME = 'playwright-tasks';

export const scrapingQueue = new Queue(SCRAPING_QUEUE_NAME, {
  connection: redis,
});

export const playwrightQueue = new Queue(PLAYWRIGHT_FALLBACK_QUEUE_NAME, {
  connection: redis,
});
