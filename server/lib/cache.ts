/**
 * Simple in-memory cache for API responses.
 * TTL-based, LRU-style, reset on server restart.
 *
 * Supports both ttlMs (existing API) and ttlSeconds (new set overload).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxSize = 1000;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Get remaining TTL in seconds for a key. Returns 0 if not found or expired.
   */
  getTtl(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    const remaining = entry.expiresAt - Date.now();
    if (remaining <= 0) {
      this.store.delete(key);
      return 0;
    }
    return Math.floor(remaining / 1000);
  }

  /**
   * Set a value. Accepts ttl in seconds (not ms) to match the new wrapper API.
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  /** Delete all keys starting with any of the given prefixes. */
  clearPrefixes(prefixes: string[]): number {
    let deleted = 0;
    for (const key of this.store.keys()) {
      if (prefixes.some((p) => key.startsWith(p))) {
        this.store.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  /** @deprecated — use clearPrefixes. Pattern is a substring match. */
  invalidate(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) this.store.delete(key);
    }
  }
}

export const cache = new MemoryCache();

/**
 * Express middleware wrapper for caching JSON GET responses.
 * keyFn builds the cache key from the request; ttlSeconds sets TTL.
 * Adds X-Cache: HIT|MISS, X-Cache-TTL, and Cache-Control headers.
 */
import type { Request, Response, NextFunction } from 'express';

export function cacheMiddleware(
  keyFn: (req: Request) => string,
  ttlSeconds: number,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET') {
      next();
      return;
    }
    const key = keyFn(req);
    const hit = cache.get<unknown>(key);
    if (hit !== null) {
      const remaining = cache.getTtl(key);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-TTL', String(remaining));
      res.setHeader(
        'Cache-Control',
        `public, max-age=${remaining}, stale-while-revalidate=60`,
      );
      res.json(hit);
      return;
    }

    // Wrap res.json to capture and cache the payload on the way out.
    const origJson = res.json.bind(res);
    (res as Response).json = (body: unknown) => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, body, ttlSeconds);
        }
      } catch {
        /* swallow */
      }
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-TTL', String(ttlSeconds));
      res.setHeader(
        'Cache-Control',
        `public, max-age=${ttlSeconds}, stale-while-revalidate=60`,
      );
      return origJson(body);
    };
    next();
  };
}
