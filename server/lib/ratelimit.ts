import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { Request, Response, NextFunction } from 'express';

// Upstash sliding-window rate limiters. Multiple instances for different
// route tiers. Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.

let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn('[ratelimit] UPSTASH_REDIS_REST_URL / TOKEN not set — rate limiting disabled');
    return null;
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const CACHE: Record<string, Ratelimit> = {};
function getLimiter(prefix: string, points: number, windowSec: number): Ratelimit | null {
  const key = `${prefix}:${points}:${windowSec}`;
  if (CACHE[key]) return CACHE[key];
  const redis = getRedis();
  if (!redis) return null;
  CACHE[key] = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(points, `${windowSec} s`),
    analytics: false,
    prefix,
  });
  return CACHE[key];
}

/**
 * Legacy helper — AI routes use 10/60s keyed by user ID. Fail-open.
 */
export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const rl = getLimiter('majorka:ai:rl', 10, 60);
  if (!rl) return { allowed: true };
  try {
    const result = await rl.limit(userId);
    if (result.success) return { allowed: true };
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  } catch (err) {
    console.error('[ratelimit] Upstash error — allowing request:', err);
    return { allowed: true };
  }
}

interface LimiterOptions {
  /** Unique prefix for this limiter (e.g. "majorka:ae-search") */
  prefix: string;
  /** Number of requests allowed in the window */
  points: number;
  /** Window length in seconds */
  windowSec: number;
  /** Key extractor — default: IP address */
  keyFn?: (req: Request) => string;
}

function getIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0];
  return req.socket?.remoteAddress ?? 'unknown';
}

/**
 * Extract a user ID hint from a Bearer token without verifying it.
 * Good enough for rate-limit bucketing — the token sub claim is opaque but stable.
 */
function getUserIdHint(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    return (payload?.sub as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Express middleware factory for rate limiting. Fail-open if Upstash is
 * unreachable so users aren't blocked on Redis hiccups.
 */
export function rateLimitMiddleware(opts: LimiterOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const rl = getLimiter(opts.prefix, opts.points, opts.windowSec);
    if (!rl) return next();

    const key = opts.keyFn ? opts.keyFn(req) : getIp(req);
    try {
      const result = await rl.limit(key);
      if (result.success) {
        res.setHeader('X-RateLimit-Limit', String(opts.points));
        res.setHeader('X-RateLimit-Remaining', String(result.remaining));
        return next();
      }
      const retryAfter = Math.max(Math.ceil((result.reset - Date.now()) / 1000), 1);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'Too many requests', retryAfter });
    } catch (err) {
      console.error(`[ratelimit:${opts.prefix}] Upstash error — allowing request:`, err);
      next();
    }
  };
}

/** Prebuilt limiter: AE live search — 30 req/min per IP. */
export const aeSearchLimiter = rateLimitMiddleware({
  prefix: 'majorka:ae-search',
  points: 30,
  windowSec: 60,
});

/** Prebuilt limiter: AI routes — 10 req/min per user (fallback IP). */
export const aiLimiter = rateLimitMiddleware({
  prefix: 'majorka:ai-route',
  points: 10,
  windowSec: 60,
  keyFn: (req) => getUserIdHint(req) ?? getIp(req),
});

/** Prebuilt limiter: Maya chat — 20 req/min per user (fallback IP). */
export const chatLimiter = rateLimitMiddleware({
  prefix: 'majorka:ai-chat',
  points: 20,
  windowSec: 60,
  keyFn: (req) => getUserIdHint(req) ?? getIp(req),
});

/** Prebuilt limiter: cron endpoint — 5 req/min. */
export const cronLimiter = rateLimitMiddleware({
  prefix: 'majorka:cron',
  points: 5,
  windowSec: 60,
});
