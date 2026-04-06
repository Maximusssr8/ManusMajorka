/**
 * Redis response cache using Upstash.
 * Falls open (returns null) if env vars not set — zero impact on dev.
 * TTLs:
 *   products list   → 5 min  (changes rarely, biggest traffic source)
 *   creators/videos → 1 hour (Apify data, expensive to re-fetch)
 *   CJ products     → 12 hr  (supplier catalogue, stable)
 *   AI chat         → skip   (streaming, user-specific)
 */
import { Redis } from '@upstash/redis';

let _client: Redis | null = null;

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!_client) _client = new Redis({ url, token });
  return _client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return await r.get<T>(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: ttlSeconds });
  } catch { /* fail silently — never block a response */ }
}

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try { await r.del(key); } catch { /* ignore */ }
}

/** Invalidate all keys matching a prefix pattern (e.g. 'products:*') */
export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    // Scan for keys — safe for small keyset
    let cursor = 0;
    do {
      const [nextCursor, keys] = await r.scan(cursor, { match: `${prefix}*`, count: 100 });
      cursor = Number(nextCursor);
      if (keys.length) await r.del(...keys);
    } while (cursor !== 0);
  } catch { /* ignore */ }
}

export const TTL = {
  PRODUCTS_LIST:   5 * 60,       // 5 min
  PRODUCTS_STATS:  10 * 60,      // 10 min
  PRODUCTS_SUGGESTIONS: 30 * 60, // 30 min
  DAILY_BRIEF:     24 * 60 * 60, // 24 hours (per niche per day)
  CREATORS:        60 * 60,      // 1 hour
  VIDEOS:          60 * 60,      // 1 hour
  CJ_PRODUCTS:     12 * 60 * 60, // 12 hours
  MARKET_STATS:    10 * 60,      // 10 min
  TRENDING:        15 * 60,      // 15 min
} as const;
