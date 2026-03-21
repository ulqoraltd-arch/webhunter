import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';

export const SCRAPING_QUEUE_NAME = 'scraping-tasks';
export const PLAYWRIGHT_FALLBACK_QUEUE_NAME = 'playwright-tasks';

// PRODUCTION RATE LIMIT CONFIG
// Prevents API node bans by throttling job throughput at the Redis level.
// 100 jobs every 10 seconds (10 jobs/sec) per worker instance.
const RATE_LIMITER_CONFIG = {
  max: 100,
  duration: 10000,
};

export const scrapingQueue = new Queue(SCRAPING_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const playwrightQueue = new Queue(PLAYWRIGHT_FALLBACK_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000,
    },
  },
});
