/**
 * trackOnboarding — fire-and-forget middleware that flips onboarding booleans
 * based on the URL + method of the current request.
 *
 * Mounted as a GLOBAL middleware early in the chain. We hook res.on('finish')
 * so by the time we read req.user it has been populated by route-level
 * requireAuth (Express decorates the SAME req object). Errors are swallowed —
 * tracking never breaks a real request.
 */
import type { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../_core/supabase';

type OnboardingFlag =
  | 'profile_complete'
  | 'first_search'
  | 'first_save'
  | 'first_brief'
  | 'store_connected';

function detectFlag(req: Request): OnboardingFlag | null {
  const method = req.method.toUpperCase();
  // originalUrl preserves /api prefix (req.path inside app.use is the
  // sub-path); we strip the query string before matching.
  const fullPath = (req.originalUrl || req.url || '').split('?')[0];

  // ── Search ────────────────────────────────────────────────────────────────
  if (method === 'POST' && /\/api\/products\/search\b/i.test(fullPath)) return 'first_search';
  if (method === 'GET' && /\/api\/products(\/list)?\b/i.test(fullPath) && typeof req.query?.search === 'string' && req.query.search.length > 0) {
    return 'first_search';
  }

  // ── Save / list items ─────────────────────────────────────────────────────
  if (method === 'POST' && /\/api\/products\/save\b/i.test(fullPath)) return 'first_save';
  if (method === 'POST' && /\/api\/lists\/[^/]+\/items\b/i.test(fullPath)) return 'first_save';
  if (method === 'POST' && /\/api\/lists\b\/?$/i.test(fullPath)) return 'first_save';
  if (method === 'POST' && /\/api\/user\/favourites\b/i.test(fullPath)) return 'first_save';

  // ── Brief / why-trending ──────────────────────────────────────────────────
  if (method === 'GET' && /\/api\/products\/[^/]+\/brief\b/i.test(fullPath)) return 'first_brief';
  if (method === 'POST' && /\/api\/products\/[^/]+\/why-trending\b/i.test(fullPath)) return 'first_brief';
  if (method === 'POST' && /\/api\/daily-brief\b/i.test(fullPath)) return 'first_brief';

  // ── Profile / settings ────────────────────────────────────────────────────
  if (
    (method === 'POST' || method === 'PATCH' || method === 'PUT') &&
    /\/api\/user\/(profile|settings)\b/i.test(fullPath) &&
    req.body &&
    typeof req.body === 'object' &&
    typeof (req.body as Record<string, unknown>).niche === 'string'
  ) {
    return 'profile_complete';
  }

  // ── Shopify / store connect ──────────────────────────────────────────────
  if (method === 'POST' && /\/api\/shopify\/(connect|callback|install)\b/i.test(fullPath)) return 'store_connected';
  if (method === 'GET' && /\/api\/shopify\/callback\b/i.test(fullPath)) return 'store_connected';
  if (method === 'POST' && /\/api\/store-builder\/(deploy|publish|push)\b/i.test(fullPath)) return 'store_connected';

  return null;
}

async function markAsync(userId: string, flag: OnboardingFlag): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    await sb
      .from('user_onboarding')
      .upsert({ user_id: userId, [flag]: true }, { onConflict: 'user_id' });
  } catch {
    // Silent — onboarding tracking must never break a real request.
  }
}

export function trackOnboarding(req: Request, res: Response, next: NextFunction): void {
  const flag = detectFlag(req);
  if (!flag) {
    next();
    return;
  }

  // Hook on response finish — by then route handlers have run requireAuth and
  // populated req.user. Only flip on success (2xx).
  res.on('finish', () => {
    try {
      const user = req.user;
      if (!user || user.userId === 'service_role') return;
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      void markAsync(user.userId, flag);
    } catch {
      /* swallow */
    }
  });

  next();
}
