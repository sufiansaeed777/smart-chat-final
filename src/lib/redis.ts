/**
 * PHASE 4: Redis Connection Utility
 *
 * Provides Redis client for:
 * - Rate limiting
 * - Abuse detection
 * - Caching
 * - Session storage
 */

import { Redis } from 'ioredis';

// Global Redis client instance
let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 * Falls back to in-memory storage if Redis is not available
 */
export function getRedisClient(): Redis | null {
  // If already initialized, return existing client
  if (redisClient) {
    return redisClient;
  }

  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('⚠️  REDIS_URL not configured - using in-memory storage (not recommended for production)');
    return null;
  }

  try {
    // Create Redis client
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect on READONLY errors
          return true;
        }
        return false;
      }
    });

    // Handle connection events
    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });

    redisClient.on('close', () => {
      console.warn('⚠️  Redis connection closed');
    });

    return redisClient;

  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return null;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && redisClient.status === 'ready';
}

/**
 * Redis utility methods
 */
export const redisUtils = {
  /**
   * Set key with TTL (in seconds)
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  },

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    if (!client) return null;

    return await client.get(key);
  },

  /**
   * Delete key
   */
  async del(key: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    await client.del(key);
  },

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    const client = getRedisClient();
    if (!client) return 0;

    return await client.incr(key);
  },

  /**
   * Set expiry on key
   */
  async expire(key: string, seconds: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    await client.expire(key, seconds);
  },

  /**
   * Get multiple keys
   */
  async mget(...keys: string[]): Promise<(string | null)[]> {
    const client = getRedisClient();
    if (!client) return keys.map(() => null);

    return await client.mget(...keys);
  },

  /**
   * Add member to sorted set with score
   */
  async zadd(key: string, score: number, member: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    await client.zadd(key, score, member);
  },

  /**
   * Remove members from sorted set by score range
   */
  async zremrangebyscore(key: string, min: number, max: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    await client.zremrangebyscore(key, min, max);
  },

  /**
   * Count members in sorted set by score range
   */
  async zcount(key: string, min: number, max: number): Promise<number> {
    const client = getRedisClient();
    if (!client) return 0;

    return await client.zcount(key, min, max);
  },

  /**
   * Get all members from sorted set
   */
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const client = getRedisClient();
    if (!client) return [];

    return await client.zrange(key, start, stop);
  },

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    await client.hset(key, field, value);
  },

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    const client = getRedisClient();
    if (!client) return null;

    return await client.hget(key, field);
  },

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    const client = getRedisClient();
    if (!client) return {};

    return await client.hgetall(key);
  },

  /**
   * Delete hash fields
   */
  async hdel(key: string, ...fields: string[]): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    await client.hdel(key, ...fields);
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    const result = await client.exists(key);
    return result === 1;
  },

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    const client = getRedisClient();
    if (!client) return -1;

    return await client.ttl(key);
  }
};

export default redisUtils;
