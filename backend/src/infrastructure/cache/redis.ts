import { createClient, RedisClientType } from 'redis';
import { logger } from '../logging/logger';

let client: RedisClientType | null = null;

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (client?.isOpen) return client;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  if (!url) return null;

  try {
    client = createClient({ url });
    client.on('error', (err) => logger.error('Redis error', { err }));
    client.on('connect', () => logger.info('Redis connected'));
    await client.connect();
    return client;
  } catch (err) {
    logger.warn('Redis connection failed, caching disabled', { err });
    return null;
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

export const cacheSet = async (key: string, value: any, ttlSeconds = 300): Promise<void> => {
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch { /* silent */ }
};

export const cacheDel = async (pattern: string): Promise<void> => {
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(keys);
  } catch { /* silent */ }
};
