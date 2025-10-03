import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, use Redis or another distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

/**
 * Rate limiting middleware
 * @param identifier - Unique identifier for the client (IP, user ID, API key, etc.)
 * @param config - Rate limit configuration
 * @returns NextResponse or null if within limits
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): NextResponse | null {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically (every 1000 requests)
  if (Math.random() < 0.001) {
    cleanupExpiredEntries();
  }

  if (!entry || now > entry.resetTime) {
    // First request or window expired - create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return null;
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    return NextResponse.json(
      {
        error: config.message || 'Too many requests',
        retryAfter: retryAfter,
        limit: config.maxRequests,
        windowMs: config.windowMs
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString()
        }
      }
    );
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return null;
}

/**
 * Get rate limit info for headers
 */
export function getRateLimitInfo(
  identifier: string,
  config: RateLimitConfig
): {
  limit: number;
  remaining: number;
  reset: number;
} {
  const entry = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: now + config.windowMs
    };
  }

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    reset: entry.resetTime
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  identifier: string,
  config: RateLimitConfig
): NextResponse {
  const info = getRateLimitInfo(identifier, config);

  response.headers.set('X-RateLimit-Limit', info.limit.toString());
  response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
  response.headers.set('X-RateLimit-Reset', info.reset.toString());

  return response;
}

/**
 * Clean up expired entries from store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from session/token first
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;

  // Try API key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) return `key:${apiKey}`;

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] :
             request.headers.get('x-real-ip') ||
             'unknown';

  return `ip:${ip}`;
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // Strict limit for authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.'
  },

  // Standard API limit
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'API rate limit exceeded. Please slow down your requests.'
  },

  // Generous limit for chat messages
  CHAT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many messages. Please wait before sending more.'
  },

  // Strict limit for file uploads
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Upload limit exceeded. Please try again later.'
  },

  // Very strict for password reset
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts. Please try again later.'
  }
};
