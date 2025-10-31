/**
 * PHASE 4: Bot Configuration Caching with Redis
 *
 * Caches bot configurations to reduce database queries
 * Improves performance for high-traffic scenarios
 */

import { getRedisClient, isRedisAvailable, redisUtils } from '@/lib/redis';
import pool from '@/utils/db';

interface BotConfig {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  status: string;
  createdBy: string;
  fallbackMessage?: string;
  welcomeMessage?: string;
  metadata?: any;
}

const BOT_CACHE_PREFIX = 'bot:config:';
const BOT_CACHE_TTL = 300; // 5 minutes in seconds

class BotCache {
  private memoryCache: Map<string, { data: BotConfig; expiry: number }> = new Map();
  private useRedis: boolean = false;

  constructor() {
    this.useRedis = isRedisAvailable();

    if (this.useRedis) {
      console.log('✅ Bot cache using Redis');
    } else {
      console.warn('⚠️  Bot cache using in-memory storage (not recommended for production)');
    }

    // Clean up memory cache every 5 minutes
    setInterval(() => this.cleanupMemoryCache(), 5 * 60 * 1000);
  }

  /**
   * Get bot configuration by ID
   * Checks cache first, falls back to database
   */
  async getBot(botId: string, userId?: string): Promise<BotConfig | null> {
    const cacheKey = `${BOT_CACHE_PREFIX}${botId}`;

    // Try Redis cache first
    if (this.useRedis && isRedisAvailable()) {
      try {
        const cached = await redisUtils.get(cacheKey);
        if (cached) {
          const bot = JSON.parse(cached) as BotConfig;

          // Verify userId if provided
          if (userId && bot.createdBy !== userId) {
            return null;
          }

          console.log(`[BotCache] Redis hit for bot ${botId}`);
          return bot;
        }
      } catch (error) {
        console.error('[BotCache] Redis error:', error);
        // Fall through to memory cache
      }
    }

    // Try memory cache
    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached && memoryCached.expiry > Date.now()) {
      const bot = memoryCached.data;

      // Verify userId if provided
      if (userId && bot.createdBy !== userId) {
        return null;
      }

      console.log(`[BotCache] Memory hit for bot ${botId}`);
      return bot;
    }

    // Cache miss - fetch from database
    console.log(`[BotCache] Cache miss for bot ${botId}, fetching from DB`);
    return await this.fetchAndCacheBot(botId, userId);
  }

  /**
   * Fetch bot from database and cache it
   */
  private async fetchAndCacheBot(botId: string, userId?: string): Promise<BotConfig | null> {
    try {
      let query = 'SELECT * FROM bots WHERE id = $1 AND status = $2';
      const params: any[] = [botId, 'active'];

      if (userId) {
        query += ' AND "createdBy" = $3';
        params.push(userId);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      const bot = result.rows[0];

      // Normalize bot config
      const botConfig: BotConfig = {
        id: bot.id,
        name: bot.name,
        model: bot.model || 'gpt-3.5-turbo',
        systemPrompt: bot.systemPrompt || bot["systemPrompt"] || 'You are a helpful assistant.',
        temperature: parseFloat(bot.temperature) || 0.7,
        maxTokens: parseInt(bot.maxTokens || bot["maxTokens"]) || 500,
        status: bot.status,
        createdBy: bot.createdBy,
        fallbackMessage: bot.fallbackMessage,
        welcomeMessage: bot.welcomeMessage,
        metadata: bot.metadata
      };

      // Cache the bot config
      await this.cacheBot(botId, botConfig);

      return botConfig;
    } catch (error) {
      console.error('[BotCache] Database error:', error);
      return null;
    }
  }

  /**
   * Cache bot configuration
   */
  private async cacheBot(botId: string, botConfig: BotConfig): Promise<void> {
    const cacheKey = `${BOT_CACHE_PREFIX}${botId}`;
    const data = JSON.stringify(botConfig);

    // Cache in Redis
    if (this.useRedis && isRedisAvailable()) {
      try {
        await redisUtils.set(cacheKey, data, BOT_CACHE_TTL);
        console.log(`[BotCache] Cached bot ${botId} in Redis`);
      } catch (error) {
        console.error('[BotCache] Redis cache error:', error);
      }
    }

    // Cache in memory as fallback
    this.memoryCache.set(cacheKey, {
      data: botConfig,
      expiry: Date.now() + (BOT_CACHE_TTL * 1000)
    });
    console.log(`[BotCache] Cached bot ${botId} in memory`);
  }

  /**
   * Invalidate bot cache
   * Call this when bot config is updated
   */
  async invalidateBot(botId: string): Promise<void> {
    const cacheKey = `${BOT_CACHE_PREFIX}${botId}`;

    // Remove from Redis
    if (this.useRedis && isRedisAvailable()) {
      try {
        await redisUtils.del(cacheKey);
        console.log(`[BotCache] Invalidated Redis cache for bot ${botId}`);
      } catch (error) {
        console.error('[BotCache] Redis invalidation error:', error);
      }
    }

    // Remove from memory
    this.memoryCache.delete(cacheKey);
    console.log(`[BotCache] Invalidated memory cache for bot ${botId}`);
  }

  /**
   * Invalidate all bots for a specific user
   * Useful when user updates multiple bots
   */
  async invalidateUserBots(userId: string): Promise<void> {
    try {
      // Get all bot IDs for this user
      const result = await pool.query(
        'SELECT id FROM bots WHERE "createdBy" = $1',
        [userId]
      );

      // Invalidate each bot
      for (const row of result.rows) {
        await this.invalidateBot(row.id);
      }

      console.log(`[BotCache] Invalidated ${result.rows.length} bots for user ${userId}`);
    } catch (error) {
      console.error('[BotCache] Error invalidating user bots:', error);
    }
  }

  /**
   * Warm up cache with frequently accessed bots
   * Call this on application startup or periodically
   */
  async warmupCache(botIds: string[]): Promise<void> {
    console.log(`[BotCache] Warming up cache for ${botIds.length} bots`);

    for (const botId of botIds) {
      try {
        await this.fetchAndCacheBot(botId);
      } catch (error) {
        console.error(`[BotCache] Error warming up bot ${botId}:`, error);
      }
    }

    console.log('[BotCache] Cache warmup complete');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memorySize: number;
    redisAvailable: boolean;
    cacheHits?: number;
    cacheMisses?: number;
  }> {
    return {
      memorySize: this.memoryCache.size,
      redisAvailable: this.useRedis && isRedisAvailable()
    };
  }

  /**
   * Clean up expired memory cache entries
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiry <= now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[BotCache] Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Clear all cache (memory and Redis)
   * Use with caution
   */
  async clearAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    console.log('[BotCache] Cleared memory cache');

    // Clear Redis cache
    if (this.useRedis && isRedisAvailable()) {
      try {
        const redis = getRedisClient();
        if (redis) {
          // Get all bot cache keys
          const keys = await redis.keys(`${BOT_CACHE_PREFIX}*`);
          if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`[BotCache] Cleared ${keys.length} Redis cache entries`);
          }
        }
      } catch (error) {
        console.error('[BotCache] Error clearing Redis cache:', error);
      }
    }
  }
}

// Singleton instance
const botCache = new BotCache();

export default botCache;

// Helper function to get bot with caching
export async function getCachedBot(botId: string, userId?: string): Promise<BotConfig | null> {
  return await botCache.getBot(botId, userId);
}

// Helper function to invalidate bot cache
export async function invalidateBotCache(botId: string): Promise<void> {
  await botCache.invalidateBot(botId);
}
