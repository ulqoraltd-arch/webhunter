import Redis from 'ioredis';

/**
 * PRODUCTION REDIS CONFIGURATION
 * 
 * Optimized for high-throughput with BullMQ.
 * Uses maxRetriesPerRequest: null as required by BullMQ to handle blocking commands.
 */
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const redis = new Redis(redisConfig);

redis.on('error', (err) => {
  console.error('[REDIS] Connection Error:', err);
});

redis.on('connect', () => {
  console.log('[REDIS] Connected to production instance');
});
