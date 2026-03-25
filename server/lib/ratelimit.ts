import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash sliding-window rate limiter: 10 AI requests per user per 60 seconds
// Requires: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in env
// Get these from: upstash.com → Create Database → REST API → Copy URL + Token

let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (_ratelimit) return _ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn('[ratelimit] UPSTASH_REDIS_REST_URL / TOKEN not set — rate limiting disabled');
    return null;
  }
  _ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: false,
    prefix: 'majorka:ai:rl',
  });
  return _ratelimit;
}

/**
 * Check rate limit for a user ID.
 * Returns { allowed: true } or { allowed: false, retryAfter: number (seconds) }
 */
export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const rl = getRatelimit();
  if (!rl) return { allowed: true }; // graceful degradation if env vars not set

  try {
    const result = await rl.limit(userId);
    if (result.success) return { allowed: true };
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  } catch (err) {
    console.error('[ratelimit] Upstash error — allowing request:', err);
    return { allowed: true }; // fail open, don't block users on Redis errors
  }
}
