/**
 * Tiered per-IP + per-user rate limit middlewares for Majorka API routes.
 *
 * Backed by Upstash Redis via `@upstash/ratelimit` (shared with
 * `server/lib/ratelimit.ts`). Fail-open when Upstash is unreachable or env
 * vars are missing — users must never be blocked by a Redis outage.
 *
 * Tiers:
 *   - ai:      20/min per user (paid tier: 60/min)       → /api/ai/*
 *   - alerts:  30/min per user                           → /api/alerts
 *   - admin:   5/min  per IP                             → /api/admin/*
 *   - public:  60/min per IP                             → fallback
 *
 * Stripe webhook is explicitly EXEMPT (Stripe retries aggressively and owns
 * its own idempotency layer).
 */
import type { Request, Response, NextFunction } from 'express';
import { rateLimitMiddleware } from '../lib/ratelimit';

function getIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0];
  return req.socket?.remoteAddress ?? 'unknown';
}

function getUserIdHint(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8')) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Skip the rate limit for Stripe webhook retries. Stripe hammers the
 * endpoint on failure and needs every request to land.
 */
export function stripeWebhookExempt(
  middleware: (req: Request, res: Response, next: NextFunction) => unknown
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/webhook' || req.path.endsWith('/stripe/webhook')) {
      return next();
    }
    return middleware(req, res, next);
  };
}

/** AI routes: 20 req/min per authenticated user (IP fallback). */
export const aiRateLimit = rateLimitMiddleware({
  prefix: 'majorka:rl:ai',
  points: 20,
  windowSec: 60,
  keyFn: (req) => getUserIdHint(req) ?? getIp(req),
});

/** Alerts routes: 30 req/min per user. */
export const alertsRateLimit = rateLimitMiddleware({
  prefix: 'majorka:rl:alerts',
  points: 30,
  windowSec: 60,
  keyFn: (req) => getUserIdHint(req) ?? getIp(req),
});

/** Admin routes: 5 req/min per IP (bot protection on sensitive surface). */
export const adminRateLimit = rateLimitMiddleware({
  prefix: 'majorka:rl:admin',
  points: 5,
  windowSec: 60,
  keyFn: (req) => getIp(req),
});

/** Public API: 60 req/min per IP. */
export const publicRateLimit = rateLimitMiddleware({
  prefix: 'majorka:rl:public',
  points: 60,
  windowSec: 60,
  keyFn: (req) => getIp(req),
});

export { getIp, getUserIdHint };
