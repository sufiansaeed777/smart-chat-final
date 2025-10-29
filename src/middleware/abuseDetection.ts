/**
 * PHASE 4: Abuse Detection System
 *
 * Redis-based abuse detection with pattern matching
 * Falls back to in-memory storage if Redis is unavailable
 */

import { getRedisClient, isRedisAvailable, redisUtils } from '@/lib/redis';

interface AbuseLog {
  identifier: string;
  type: 'spam' | 'sql_injection' | 'xss' | 'brute_force' | 'suspicious';
  timestamp: number;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

interface AbuseEntry {
  violations: AbuseLog[];
  blocked: boolean;
  blockedUntil?: number;
  score: number;
}

class AbuseDetector {
  private store: Map<string, AbuseEntry> = new Map();
  private messageHistory: Map<string, string[]> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private useRedis: boolean = false;

  // Thresholds
  private readonly SPAM_THRESHOLD = 3;
  private readonly ABUSE_SCORE_THRESHOLD = 100;
  private readonly BLOCK_DURATION = 60 * 60 * 1000; // 1 hour

  // Severity scores
  private readonly SCORES = {
    spam: 10,
    sql_injection: 50,
    xss: 50,
    brute_force: 30,
    suspicious: 20
  };

  constructor() {
    const redisClient = getRedisClient();
    this.useRedis = redisClient !== null;

    if (this.useRedis) {
      console.log('✅ Abuse detector using Redis');
    } else {
      console.warn('⚠️  Abuse detector using in-memory storage');
    }

    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Check message for abuse patterns
   */
  async checkMessage(identifier: string, message: string): Promise<{
    allowed: boolean;
    reason?: string;
    score: number;
  }> {
    if (this.useRedis && isRedisAvailable()) {
      return this.checkMessageRedis(identifier, message);
    } else {
      return this.checkMessageMemory(identifier, message);
    }
  }

  /**
   * Redis-based abuse detection
   */
  private async checkMessageRedis(identifier: string, message: string): Promise<{
    allowed: boolean;
    reason?: string;
    score: number;
  }> {
    const now = Date.now();
    const blockKey = `abuse:block:${identifier}`;
    const scoreKey = `abuse:score:${identifier}`;
    const historyKey = `abuse:history:${identifier}`;

    try {
      // Check if blocked
      const blockedUntil = await redisUtils.get(blockKey);
      if (blockedUntil && parseInt(blockedUntil) > now) {
        const score = await redisUtils.get(scoreKey);
        return {
          allowed: false,
          reason: `Blocked due to abuse. Try again after ${new Date(parseInt(blockedUntil)).toLocaleString()}`,
          score: score ? parseInt(score) : 0
        };
      }

      // Run detection checks
      let currentScore = 0;
      const scoreStr = await redisUtils.get(scoreKey);
      if (scoreStr) {
        currentScore = parseInt(scoreStr);
      }

      // 1. Check for spam (repeated messages)
      const recentMessages = await redisUtils.zrange(historyKey, 0, -1);
      const spamCheck = this.detectSpamRedis(recentMessages, message);
      if (spamCheck.isSpam) {
        currentScore += this.SCORES.spam;
      }

      // Store message in history (last 10 messages)
      await redisUtils.zadd(historyKey, now, message);
      await redisUtils.expire(historyKey, 600); // 10 minutes

      // Remove old messages (keep only last 10)
      const count = await redisUtils.zcount(historyKey, 0, now);
      if (count > 10) {
        const toRemove = count - 10;
        const oldest = await redisUtils.zrange(historyKey, 0, toRemove - 1);
        for (const msg of oldest) {
          await redisUtils.zremrangebyscore(historyKey, 0, 0);
        }
      }

      // 2. Check for SQL injection
      const sqlCheck = this.detectSQLInjection(message);
      if (sqlCheck.detected) {
        currentScore += this.SCORES.sql_injection;
      }

      // 3. Check for XSS
      const xssCheck = this.detectXSS(message);
      if (xssCheck.detected) {
        currentScore += this.SCORES.xss;
      }

      // 4. Check for suspicious patterns
      const suspiciousCheck = this.detectSuspicious(message);
      if (suspiciousCheck.detected) {
        currentScore += this.SCORES.suspicious;
      }

      // Update score in Redis
      await redisUtils.set(scoreKey, currentScore.toString(), 3600); // 1 hour TTL

      // Check if should block
      if (currentScore >= this.ABUSE_SCORE_THRESHOLD) {
        const blockedUntil = now + this.BLOCK_DURATION;
        await redisUtils.set(blockKey, blockedUntil.toString(), Math.ceil(this.BLOCK_DURATION / 1000));

        return {
          allowed: false,
          reason: 'Abuse threshold exceeded',
          score: currentScore
        };
      }

      return {
        allowed: true,
        score: currentScore
      };

    } catch (error) {
      console.error('Redis abuse detection failed, falling back to memory:', error);
      return this.checkMessageMemory(identifier, message);
    }
  }

  /**
   * In-memory abuse detection (fallback)
   */
  private checkMessageMemory(identifier: string, message: string): {
    allowed: boolean;
    reason?: string;
    score: number;
  } {
    const now = Date.now();

    // Check if already blocked
    const entry = this.store.get(identifier);
    if (entry?.blocked && entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        reason: `Blocked due to abuse. Try again after ${new Date(entry.blockedUntil).toLocaleString()}`,
        score: entry.score
      };
    }

    // Run detection checks
    const violations: AbuseLog[] = [];

    // 1. Check for spam
    const spamCheck = this.detectSpam(identifier, message);
    if (spamCheck.isSpam) {
      violations.push({
        identifier,
        type: 'spam',
        timestamp: now,
        details: 'Repeated identical messages',
        severity: 'low'
      });
    }

    // 2. Check for SQL injection
    const sqlCheck = this.detectSQLInjection(message);
    if (sqlCheck.detected) {
      violations.push({
        identifier,
        type: 'sql_injection',
        timestamp: now,
        details: sqlCheck.pattern || 'SQL injection pattern detected',
        severity: 'high'
      });
    }

    // 3. Check for XSS
    const xssCheck = this.detectXSS(message);
    if (xssCheck.detected) {
      violations.push({
        identifier,
        type: 'xss',
        timestamp: now,
        details: xssCheck.pattern || 'XSS pattern detected',
        severity: 'high'
      });
    }

    // 4. Check for suspicious patterns
    const suspiciousCheck = this.detectSuspicious(message);
    if (suspiciousCheck.detected) {
      violations.push({
        identifier,
        type: 'suspicious',
        timestamp: now,
        details: suspiciousCheck.reason || 'Suspicious payload',
        severity: 'medium'
      });
    }

    // Calculate abuse score
    let currentScore = entry?.score || 0;
    violations.forEach(v => {
      currentScore += this.SCORES[v.type];
    });

    // Check if should block
    if (currentScore >= this.ABUSE_SCORE_THRESHOLD) {
      const blockedUntil = now + this.BLOCK_DURATION;

      this.store.set(identifier, {
        violations: [...(entry?.violations || []), ...violations],
        blocked: true,
        blockedUntil,
        score: currentScore
      });

      return {
        allowed: false,
        reason: 'Abuse threshold exceeded',
        score: currentScore
      };
    }

    // Update entry
    this.store.set(identifier, {
      violations: [...(entry?.violations || []), ...violations],
      blocked: false,
      score: currentScore
    });

    return {
      allowed: true,
      score: currentScore
    };
  }

  /**
   * Detect spam from Redis message history
   */
  private detectSpamRedis(recentMessages: string[], currentMessage: string): { isSpam: boolean } {
    const identical = recentMessages.filter(msg => msg === currentMessage);
    return { isSpam: identical.length >= this.SPAM_THRESHOLD };
  }

  /**
   * Detect spam (in-memory)
   */
  private detectSpam(identifier: string, message: string): { isSpam: boolean } {
    const history = this.messageHistory.get(identifier) || [];

    // Keep last 10 messages
    history.push(message);
    if (history.length > 10) {
      history.shift();
    }
    this.messageHistory.set(identifier, history);

    // Check for identical messages
    const identical = history.filter(msg => msg === message);
    return { isSpam: identical.length >= this.SPAM_THRESHOLD };
  }

  /**
   * Detect SQL injection patterns
   */
  private detectSQLInjection(message: string): { detected: boolean; pattern?: string } {
    const sqlPatterns = [
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\bDROP\b.*\bTABLE\b)/i,
      /(\bDELETE\b.*\bFROM\b)/i,
      /('.*OR.*'.*=.*')/i,
      /(--\s*$)/i,
      /(\bEXEC\b.*\()/i,
      /(\bINSERT\b.*\bINTO\b)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(message)) {
        return { detected: true, pattern: pattern.toString() };
      }
    }

    return { detected: false };
  }

  /**
   * Detect XSS patterns
   */
  private detectXSS(message: string): { detected: boolean; pattern?: string } {
    const xssPatterns = [
      /<script[^>]*>.*<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(message)) {
        return { detected: true, pattern: pattern.toString() };
      }
    }

    return { detected: false };
  }

  /**
   * Detect suspicious patterns
   */
  private detectSuspicious(message: string): { detected: boolean; reason?: string } {
    // Extremely long messages
    if (message.length > 5000) {
      return { detected: true, reason: 'Message too long' };
    }

    // Excessive special characters
    const specialChars = message.match(/[^a-zA-Z0-9\s.,!?]/g);
    if (specialChars && specialChars.length > message.length * 0.5) {
      return { detected: true, reason: 'Excessive special characters' };
    }

    // Encoded payloads
    if (/(%[0-9a-f]{2}){10,}/i.test(message)) {
      return { detected: true, reason: 'URL-encoded payload' };
    }

    return { detected: false };
  }

  /**
   * Clean up old entries (in-memory only)
   */
  private cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, entry] of this.store.entries()) {
      if (entry.violations.length === 0 ||
          entry.violations[entry.violations.length - 1].timestamp < now - maxAge) {
        this.store.delete(key);
      }
    }

    for (const [key, history] of this.messageHistory.entries()) {
      if (history.length === 0) {
        this.messageHistory.delete(key);
      }
    }
  }

  /**
   * Reset abuse score for identifier
   */
  async reset(identifier: string): Promise<void> {
    if (this.useRedis && isRedisAvailable()) {
      await redisUtils.del(`abuse:block:${identifier}`);
      await redisUtils.del(`abuse:score:${identifier}`);
      await redisUtils.del(`abuse:history:${identifier}`);
    } else {
      this.store.delete(identifier);
      this.messageHistory.delete(identifier);
    }
  }

  /**
   * Get abuse status
   */
  async getStatus(identifier: string): Promise<{
    score: number;
    blocked: boolean;
    blockedUntil?: number;
  } | null> {
    if (this.useRedis && isRedisAvailable()) {
      const scoreStr = await redisUtils.get(`abuse:score:${identifier}`);
      const blockedStr = await redisUtils.get(`abuse:block:${identifier}`);

      if (!scoreStr) return null;

      return {
        score: parseInt(scoreStr),
        blocked: !!blockedStr,
        blockedUntil: blockedStr ? parseInt(blockedStr) : undefined
      };
    } else {
      const entry = this.store.get(identifier);
      if (!entry) return null;

      return {
        score: entry.score,
        blocked: entry.blocked,
        blockedUntil: entry.blockedUntil
      };
    }
  }

  /**
   * Clean up on shutdown
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
    this.messageHistory.clear();
  }
}

// Singleton instance
const abuseDetector = new AbuseDetector();

export default abuseDetector;
