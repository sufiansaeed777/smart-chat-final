/**
 * PHASE 4: Simple In-Memory Cache
 *
 * For production, consider using Redis or Memcached for distributed caching
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private defaultTTL: number = 5 * 60 * 1000) {
    // 5 minutes default
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);

    this.store.set(key, {
      value,
      expiry
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch and store
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys())
    };
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Create singleton instances for different cache types
export const botConfigCache = new Cache(10 * 60 * 1000); // 10 minutes for bot configs
export const userCache = new Cache(5 * 60 * 1000);        // 5 minutes for user data
export const generalCache = new Cache(15 * 60 * 1000);    // 15 minutes for general data

export default Cache;
