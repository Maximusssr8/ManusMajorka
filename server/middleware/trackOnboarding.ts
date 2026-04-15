/**
 * trackOnboarding — fire-and-forget middleware that flips onboarding booleans
 * based on the URL + method of the current request. Never blocks the main
 * request path (errors are swallowed). Mount AFTER requireAuth so req.user
 * is populated.
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
  const path = req.path;

  if (method === 'POST' && /\/products\/search\b/i.test(path)) return 'first_search';
  if (method === 'POST' && /\/products\/save\b/i.test(path)) return 'first_save';
  if (method === 'POST' && /\/lists\/[^/]+\/items\b/i.test(path)) return 'first_save';
  if (method === 'GET' && /\/products\/[^/]+\/brief\b/i.test(path)) return 'first_brief';
  if (method === 'POST' && /\/daily-brief\b/i.test(path)) return 'first_brief';
  if (method === 'POST' && /\/store-builder\b/i.test(path)) return 'store_connected';

  return null;
}

async function markAsync(userId: string, flag: OnboardingFlag): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    // Upsert: create row if missing, then flip flag on.
    await sb
      .from('user_onboarding')
      .upsert({ user_id: userId, [flag]: true }, { onConflict: 'user_id' });
  } catch {
    // Silent — onboarding tracking must never break a real request.
  }
}

export function trackOnboarding(req: Request, _res: Response, next: NextFunction): void {
  const user = req.user;
  if (!user || user.userId === 'service_role') {
    next();
    return;
  }

  const flag = detectFlag(req);
  if (flag) {
    // Fire-and-forget — do NOT await.
    void markAsync(user.userId, flag);
  }
  next();
}
