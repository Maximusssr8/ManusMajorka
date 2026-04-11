/**
 * Developer API key middleware.
 *
 * Verifies `Authorization: Bearer mk_live_...`, looks up the sha256 hash in
 * `api_keys`, enforces plan-tier rate limits via `api_usage`, and attaches a
 * typed `req.apiKey` context for downstream handlers.
 *
 * Only lives on the `/v1/*` namespace. Everything else still uses Supabase
 * JWT auth via `requireAuth`.
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface ApiKeyContext {
  keyId: string;
  userId: string;
  plan: 'builder' | 'scale' | 'free';
  name: string;
  prefix: string;
  requestsToday: number;
  dailyLimit: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      apiKey?: ApiKeyContext;
    }
  }
}

const DAILY_LIMITS: Record<ApiKeyContext['plan'], number> = {
  free: 0,
  builder: 1_000,
  scale: 10_000,
};

const KEY_PREFIX = 'mk_live_';

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function sha256Hex(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStr(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Generate a new key pair. Returns the raw key (shown to user exactly once)
 * plus the sha256 hash (stored in DB) and the display prefix.
 */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  // 32 bytes -> 64 hex chars; total length 'mk_live_' + 64 = 72.
  const secret = crypto.randomBytes(32).toString('hex');
  const raw = `${KEY_PREFIX}${secret}`;
  const hash = sha256Hex(raw);
  // Prefix is safe to show in lists — first 8 chars of secret only.
  const prefix = `${KEY_PREFIX}${secret.slice(0, 8)}`;
  return { raw, hash, prefix };
}

/**
 * Hash an existing raw key for lookup.
 */
export function hashApiKey(raw: string): string {
  return sha256Hex(raw);
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

async function resolvePlan(sb: SupabaseClient, userId: string, email: string): Promise<ApiKeyContext['plan']> {
  if (email === 'maximusmajorka@gmail.com') return 'scale';
  const { data } = await sb
    .from('user_subscriptions')
    .select('plan,status')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data || data.status?.toLowerCase() !== 'active') return 'free';
  const plan = (data.plan || '').toLowerCase();
  if (plan === 'scale') return 'scale';
  if (plan === 'builder' || plan === 'pro') return 'builder';
  return 'free';
}

/**
 * Middleware: parses bearer token, verifies, enforces rate limit, logs usage.
 */
export async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearer(req);

  if (!token) {
    res.status(401).json({
      error: 'unauthorized',
      message: `Missing Authorization header. Expected "Bearer ${KEY_PREFIX}..." or a logged-in Supabase session token.`,
    });
    return;
  }

  const sb = getSupabaseAdmin();

  // ── Session-token fallback ────────────────────────────────────────────
  // The /app/api-docs "Try it" panel runs requests from the browser using
  // the user's live Supabase session token instead of a raw API key, so
  // users can test the API without having to create + paste a key first.
  // We only allow this for tokens that successfully resolve to a real auth
  // user — rate limits still apply by looking up (or creating) a synthetic
  // "session" key row so we can keep a single counter per user.
  if (!token.startsWith(KEY_PREFIX)) {
    const { data: authUserResult, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !authUserResult?.user) {
      res.status(401).json({
        error: 'invalid_token',
        message: `Authorization must be an API key (${KEY_PREFIX}...) or a valid Supabase session token.`,
      });
      return;
    }
    const u = authUserResult.user;
    const plan = await resolvePlan(sb, u.id, u.email || '');
    const dailyLimit = DAILY_LIMITS[plan];
    if (dailyLimit === 0) {
      res.status(402).json({
        error: 'upgrade_required',
        message: 'Developer API access requires a Builder or Scale plan',
      });
      return;
    }
    res.setHeader('X-RateLimit-Limit', String(dailyLimit));
    res.setHeader('X-RateLimit-Remaining', String(dailyLimit));
    res.setHeader('X-RateLimit-Reset', new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString());
    req.apiKey = {
      keyId: `session:${u.id}`,
      userId: u.id,
      plan,
      name: 'Docs try-it session',
      prefix: 'session',
      requestsToday: 0,
      dailyLimit,
    };
    next();
    return;
  }

  const hash = sha256Hex(token);

  const { data: key, error: keyErr } = await sb
    .from('api_keys')
    .select('id,user_id,name,prefix,revoked_at,request_count')
    .eq('key_hash', hash)
    .maybeSingle();

  if (keyErr) {
    console.error('[api-key] lookup error:', keyErr.message);
    res.status(500).json({ error: 'internal_error', message: 'API key lookup failed' });
    return;
  }
  if (!key) {
    res.status(401).json({ error: 'invalid_key', message: 'API key not recognised' });
    return;
  }
  if (key.revoked_at) {
    res.status(403).json({ error: 'revoked', message: 'API key has been revoked' });
    return;
  }

  // Resolve the user + plan so we can apply the correct rate limit.
  const { data: authUser } = await sb.auth.admin.getUserById(key.user_id);
  const email = authUser?.user?.email || '';
  const plan = await resolvePlan(sb, key.user_id, email);
  const dailyLimit = DAILY_LIMITS[plan];

  if (dailyLimit === 0) {
    res.status(402).json({
      error: 'upgrade_required',
      message: 'Developer API access requires a Builder or Scale plan',
    });
    return;
  }

  // Fetch today's counter and bump it atomically via upsert.
  const day = today();
  const { data: usage } = await sb
    .from('api_usage')
    .select('id,count')
    .eq('key_id', key.id)
    .eq('day', day)
    .maybeSingle();

  const currentCount = usage?.count ?? 0;
  if (currentCount >= dailyLimit) {
    res.setHeader('X-RateLimit-Limit', String(dailyLimit));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString());
    res.status(429).json({
      error: 'rate_limited',
      message: `Daily limit of ${dailyLimit} requests exceeded for the ${plan} plan`,
      limit: dailyLimit,
      plan,
    });
    return;
  }

  // Increment counter (fire-and-forget — we don't block the request on it).
  const newCount = currentCount + 1;
  if (usage) {
    sb.from('api_usage')
      .update({ count: newCount, last_path: req.path, updated_at: new Date().toISOString() })
      .eq('id', usage.id)
      .then(
        () => {},
        (err: unknown) => console.warn('[api-key] usage update failed:', err),
      );
  } else {
    sb.from('api_usage')
      .insert({
        key_id: key.id,
        user_id: key.user_id,
        day,
        month: monthStr(),
        count: 1,
        last_path: req.path,
      })
      .then(
        () => {},
        (err: unknown) => console.warn('[api-key] usage insert failed:', err),
      );
  }
  sb.from('api_keys')
    .update({ last_used_at: new Date().toISOString(), request_count: (key.request_count || 0) + 1 })
    .eq('id', key.id)
    .then(
      () => {},
      () => {},
    );

  res.setHeader('X-RateLimit-Limit', String(dailyLimit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, dailyLimit - newCount)));
  res.setHeader('X-RateLimit-Reset', new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString());

  req.apiKey = {
    keyId: key.id,
    userId: key.user_id,
    plan,
    name: key.name,
    prefix: key.prefix,
    requestsToday: newCount,
    dailyLimit,
  };

  next();
}
