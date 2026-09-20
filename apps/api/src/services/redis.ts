import Redis from 'ioredis';
import { env } from '../config.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));

export async function connectRedis() {
  await redis.connect();
}

export async function closeRedis() {
  await redis.quit();
}