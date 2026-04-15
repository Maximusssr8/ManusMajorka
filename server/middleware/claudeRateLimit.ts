/**
 * Stopgap per-user Claude rate limit.
 *
 * In-memory sliding window: 30 calls / 60 min per userId (or IP if unauth).
 * Process-local — good enough for a single-region Vercel deploy while the
 * full usage_tracking flow is wired up.
 */

import type { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 60 * 60 * 1000; // 60 min
const MAX_CALLS = 30;

// key -> ordered list of recent call timestamps (ms)
const hits = new Map<string, number[]>();

function identify(req: Request): string {
  const userId =
    (req as any).user?.userId ||
    (req as any).user?.sub ||
    (req as any).subscription?.userId;
  if (userId) return `u:${userId}`;
  const xf = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(xf) ? xf[0] : xf?.split(',')[0]) || req.ip || req.socket?.remoteAddress || 'anon';
  return `ip:${String(ip).trim()}`;
}

function prune(list: number[], now: number): number[] {
  const cutoff = now - WINDOW_MS;
  let i = 0;
  while (i < list.length && list[i] < cutoff) i++;
  return i === 0 ? list : list.slice(i);
}

export function claudeRateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = identify(req);
  const now = Date.now();
  const existing = hits.get(key) ?? [];
  const recent = prune(existing, now);

  if (recent.length >= MAX_CALLS) {
    const oldest = recent[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      error: 'rate_limit',
      message: 'Too many AI requests — try again in a few minutes.',
      retryAfterSec,
    });
    // Keep the pruned list so future requests see the same window.
    hits.set(key, recent);
    return;
  }

  recent.push(now);
  hits.set(key, recent);
  next();
}
