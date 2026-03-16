import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

/**
 * Express middleware: blocks requests from users without an active subscription.
 * Auth is already checked upstream — this adds the subscription layer.
 *
 * Usage: app.post('/api/premium/route', requireSubscription, handler)
 *
 * Returns 403 with upgradeUrl if not subscribed.
 * Sets req.subscription for downstream handlers.
 */

export interface SubscriptionInfo {
  status: string;
  plan: string;
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      subscription?: SubscriptionInfo;
    }
  }
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

function getUserIdFromToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    // Decode JWT payload (no verification — caller already verified via Supabase)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub || null;
  } catch {
    return null;
  }
}

export const requireSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Authentication required' });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('status, plan')
      .eq('user_id', userId)
      .single();

    if (error || !data || data.status !== 'active') {
      res.status(403).json({
        error: 'subscription_required',
        message: 'Upgrade to Builder or Scale to access this feature',
        upgradeUrl: '/pricing',
      });
      return;
    }

    req.subscription = { status: data.status, plan: data.plan, userId };
    next();
  } catch (err: any) {
    console.error('[requireSubscription] error:', err.message);
    // Fail open in case of DB errors — don't block users on infra issues
    next();
  }
};
