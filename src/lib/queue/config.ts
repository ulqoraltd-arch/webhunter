import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';

/**
 * WEB HUNTER PRO - QUEUE CONFIGURATION
 * 
 * DISCOVERY_QUEUE: For Serper API pagination tasks.
 * SCRAPING_QUEUE: For Axios-based website crawling.
 */

export const DISCOVERY_QUEUE_NAME = 'discovery-tasks';
export const SCRAPING_QUEUE_NAME = 'scraping-tasks';

const DEFAULT_OPTIONS = {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const discoveryQueue = new Queue(DISCOVERY_QUEUE_NAME, DEFAULT_OPTIONS);
export const scrapingQueue = new Queue(SCRAPING_QUEUE_NAME, DEFAULT_OPTIONS);
