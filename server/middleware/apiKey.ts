/**
 * API key authentication for /v1/* routes.
 *
 * Keys are stored as SHA-256 hashes in the `api_keys` table.
 * Clients pass the raw key via `X-Api-Key` header or `?api_key=` query param.
 *
 * Includes per-key sliding-window rate limiting (in-memory, resets each minute).
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const sb = () =>
  createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

/** In-memory rate limiter per API key hash. */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = (req.headers['x-api-key'] as string) || (req.query.api_key as string);

  if (!key) {
    res.status(401).json({
      ok: false,
      error: 'api_key_required',
      message: 'Include your API key as X-Api-Key header or ?api_key= query param.',
      docs: 'https://www.majorka.io/docs',
    });
    return;
  }

  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  try {
    const { data, error } = await sb()
      .from('api_keys')
      .select('id, user_id, plan, rate_limit, is_active')
      .eq('key_hash', keyHash)
      .single();

    if (error || !data || !data.is_active) {
      res.status(403).json({
        ok: false,
        error: 'invalid_api_key',
        message: 'This API key is invalid or has been revoked.',
      });
      return;
    }

    // Rate limiting — sliding 60-second window
    const limit = data.rate_limit || 100;
    const now = Date.now();
    const bucket = rateBuckets.get(keyHash) || { count: 0, resetAt: now + 60_000 };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + 60_000;
    }

    bucket.count++;
    rateBuckets.set(keyHash, bucket);

    if (bucket.count > limit) {
      res.status(429).json({
        ok: false,
        error: 'rate_limit_exceeded',
        message: `Rate limit: ${limit} requests per minute.`,
        retry_after: Math.ceil((bucket.resetAt - now) / 1000),
      });
      return;
    }

    // Attach key metadata to request for downstream handlers
    (req as any).apiKey = data;

    // Update last_used_at (fire and forget — never block the request)
    sb()
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)
      .then(() => {});

    // Rate limit response headers
    res.set('X-RateLimit-Limit', String(limit));
    res.set('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
    res.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    next();
  } catch {
    res.status(500).json({
      ok: false,
      error: 'auth_error',
      message: 'API authentication failed.',
    });
  }
}
