import type { Request, Response, NextFunction } from 'express';

/**
 * adminAuth — secondary defence layer that wraps the existing
 * requireAuth + requireAdmin chain with two extra checks:
 *
 *   1. X-Admin-Token header must equal ADMIN_SECRET (env var). Even
 *      if a valid JWT is presented for the right user, without this
 *      header the request is denied.
 *
 *   2. Per-IP rate limit: more than 5 failed attempts in any window
 *      → 60-minute IP ban. Also a hard cap of 10 successful requests
 *      per minute per IP to discourage scraping.
 *
 * This middleware MUST be combined with requireAuth + requireAdmin
 * in the router chain — it does not validate the JWT itself, only
 * the secret header and the rate limit. Compose like:
 *
 *   router.use(requireAuth, adminAuth, requireAdmin);
 *
 * Why a separate file: keeps the JWT-based requireAdmin focused on
 * identity, and isolates the per-request secret + abuse controls.
 */

const ADMIN_SECRET = process.env.ADMIN_SECRET;

interface IpRecord {
  failures: number;
  bannedUntil: number;
  windowStart: number;
  hits: number;
}

const ipMap = new Map<string, IpRecord>();
const BAN_AFTER_FAILURES = 5;
const BAN_DURATION_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function isBanned(ip: string): boolean {
  const r = ipMap.get(ip);
  if (!r) return false;
  if (r.bannedUntil > Date.now()) return true;
  if (r.bannedUntil > 0 && r.bannedUntil <= Date.now()) {
    // ban expired — reset
    ipMap.delete(ip);
    return false;
  }
  return false;
}

function recordFailure(ip: string): void {
  const r = ipMap.get(ip) ?? { failures: 0, bannedUntil: 0, windowStart: Date.now(), hits: 0 };
  r.failures += 1;
  if (r.failures >= BAN_AFTER_FAILURES) {
    r.bannedUntil = Date.now() + BAN_DURATION_MS;
    console.warn(`[adminAuth] IP banned for 60 minutes after ${r.failures} failed attempts: ${ip}`);
  }
  ipMap.set(ip, r);
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const r = ipMap.get(ip) ?? { failures: 0, bannedUntil: 0, windowStart: now, hits: 0 };
  if (now - r.windowStart > RATE_LIMIT_WINDOW_MS) {
    r.windowStart = now;
    r.hits = 0;
  }
  r.hits += 1;
  ipMap.set(ip, r);
  return r.hits <= RATE_LIMIT_MAX;
}

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);

  // Layer 0: server is misconfigured
  if (!ADMIN_SECRET) {
    console.error('[adminAuth] CRITICAL: ADMIN_SECRET not set — denying all admin requests');
    return res.status(503).json({ error: 'Admin not configured' });
  }

  // Layer 1: IP ban check
  if (isBanned(ip)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Layer 2: Rate limit (10/min per IP)
  if (!checkRateLimit(ip)) {
    console.warn(`[adminAuth] Rate limit exceeded: ${ip}`);
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Layer 3: X-Admin-Token secret header
  // Use a constant-time comparison to avoid timing attacks
  const provided = String(req.headers['x-admin-token'] || '');
  if (!provided || provided.length !== ADMIN_SECRET.length) {
    recordFailure(ip);
    return res.status(403).json({ error: 'Forbidden' });
  }
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ ADMIN_SECRET.charCodeAt(i);
  }
  if (mismatch !== 0) {
    recordFailure(ip);
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}
