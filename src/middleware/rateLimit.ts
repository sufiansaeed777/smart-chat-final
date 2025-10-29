/**
 * PHASE 4: Rate Limiting Implementation
 *
 * Redis-based rate limiter with sliding window algorithm
 * Falls back to in-memory storage if Redis is unavailable
 */

import { getRedisClient, isRedisAvailable, redisUtils } from '@/lib/redis';

interface RateLimitEntry {
  requests: number[];
  blocked: boolean;
  blockedUntil?: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private useRedis: boolean = false;

  constructor() {
    // Check if Redis is available
    const redisClient = getRedisClient();
    this.useRedis = redisClient !== null;

    if (this.useRedis) {
      console.log('✅ Rate limiter using Redis');
    } else {
      console.warn('⚠️  Rate limiter using in-memory storage (not recommended for production)');
    }

    // Clean up old entries every 5 minutes (for in-memory mode)
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * @param identifier Unique identifier (IP, user ID, API key)
   * @param limit Max requests allowed
   * @param windowMs Time window in milliseconds
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  async check(identifier: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    // Use Redis if available, otherwise fall back to in-memory
    if (this.useRedis && isRedisAvailable()) {
      return this.checkRedis(identifier, limit, windowMs);
    } else {
      return this.checkMemory(identifier, limit, windowMs);
    }
  }

  /**
   * Redis-based rate limiting using sorted sets (sliding window)
   */
  private async checkRedis(identifier: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    const windowStart = now - windowMs;

    try {
      // Remove old entries outside the window
      await redisUtils.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const currentCount = await redisUtils.zcount(key, windowStart, now);

      // Check if limit exceeded
      if (currentCount >= limit) {
        // Get oldest request timestamp to calculate reset time
        const oldestRequests = await redisUtils.zrange(key, 0, 0);
        const oldestTimestamp = oldestRequests.length > 0 ? parseInt(oldestRequests[0].split('-')[0]) : now;
        const resetTime = oldestTimestamp + windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter
        };
      }

      // Add current request to sorted set (score = timestamp, member = unique ID)
      await redisUtils.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiry on the key (cleanup)
      await redisUtils.expire(key, Math.ceil(windowMs / 1000) + 60);

      // Get oldest request for reset time calculation
      const requests = await redisUtils.zrange(key, 0, 0);
      const oldestTimestamp = requests.length > 0 ? parseInt(requests[0].split('-')[0]) : now;
      const resetTime = oldestTimestamp + windowMs;

      return {
        allowed: true,
        remaining: limit - (currentCount + 1),
        resetTime
      };

    } catch (error) {
      console.error('Redis rate limit check failed, falling back to memory:', error);
      // Fall back to memory on Redis error
      return this.checkMemory(identifier, limit, windowMs);
    }
  }

  /**
   * In-memory rate limiting (fallback)
   */
  private checkMemory(identifier: string, limit: number, windowMs: number): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // If blocked, check if block period is over
    if (entry?.blocked && entry.blockedUntil) {
      if (now < entry.blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.blockedUntil,
          retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
        };
      } else {
        // Unblock
        entry.blocked = false;
        entry.blockedUntil = undefined;
        entry.requests = [];
      }
    }

    // Initialize or get existing entry
    const requests = entry?.requests || [];

    // Remove requests outside the time window (sliding window)
    const recentRequests = requests.filter(time => time > now - windowMs);

    // Check if limit exceeded
    if (recentRequests.length >= limit) {
      // Block for the remaining window time
      const oldestRequest = recentRequests[0];
      const resetTime = oldestRequest + windowMs;
      const blockedUntil = resetTime;

      this.store.set(identifier, {
        requests: recentRequests,
        blocked: true,
        blockedUntil
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil,
        retryAfter: Math.ceil((blockedUntil - now) / 1000)
      };
    }

    // Add current request
    recentRequests.push(now);
    this.store.set(identifier, {
      requests: recentRequests,
      blocked: false
    });

    // Calculate reset time (when oldest request expires)
    const oldestRequest = recentRequests[0];
    const resetTime = oldestRequest + windowMs;

    return {
      allowed: true,
      remaining: limit - recentRequests.length,
      resetTime
    };
  }

  /**
   * Clean up old entries from memory
   */
  private cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, entry] of this.store.entries()) {
      // Remove entries with no recent requests
      if (entry.requests.length === 0 ||
          entry.requests[entry.requests.length - 1] < now - maxAge) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string) {
    this.store.delete(identifier);
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string): {
    requests: number;
    blocked: boolean;
    blockedUntil?: number;
  } | null {
    const entry = this.store.get(identifier);
    if (!entry) return null;

    return {
      requests: entry.requests.length,
      blocked: entry.blocked,
      blockedUntil: entry.blockedUntil
    };
  }

  /**
   * Clear all rate limit data (for testing)
   */
  clear() {
    this.store.clear();
  }

  /**
   * Clean up on shutdown
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export default rateLimiter;

// Helper function to get client identifier from request
export function getClientIdentifier(request: Request): string {
  // Try to get user ID from session (if authenticated)
  // Otherwise use IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

// Predefined rate limit configs
export const RATE_LIMITS = {
  // API endpoints
  API_GENERAL: { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  API_STRICT: { limit: 20, windowMs: 15 * 60 * 1000 },   // 20 requests per 15 minutes

  // Chat/messaging
  CHAT_MESSAGE: { limit: 50, windowMs: 60 * 1000 },       // 50 messages per minute
  CHAT_SESSION: { limit: 200, windowMs: 60 * 60 * 1000 }, // 200 messages per hour

  // Authentication
  AUTH_LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 },     // 5 attempts per 15 minutes
  AUTH_SIGNUP: { limit: 3, windowMs: 60 * 60 * 1000 },    // 3 signups per hour per IP

  // File operations
  FILE_UPLOAD: { limit: 10, windowMs: 60 * 60 * 1000 },   // 10 uploads per hour
  FILE_DOWNLOAD: { limit: 50, windowMs: 60 * 60 * 1000 }, // 50 downloads per hour

  // Expensive operations
  TRAINING: { limit: 5, windowMs: 60 * 60 * 1000 },       // 5 training operations per hour
  EMBEDDING: { limit: 20, windowMs: 60 * 60 * 1000 },     // 20 embedding operations per hour
};
