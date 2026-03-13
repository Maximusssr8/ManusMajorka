/**
 * In-memory rate limiter — no external dependencies required.
 * Uses a simple sliding-window counter per key.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(store)) {
    if (now >= entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check rate limit for a given key.
 * @returns { allowed, retryAfter } — retryAfter in seconds (0 if allowed)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count < limit) {
    entry.count++;
    return { allowed: true, retryAfter: 0 };
  }

  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
  return { allowed: false, retryAfter };
}
