import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface SubscriptionInfo {
  status: string;
  plan: string;
  userId: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      subscription?: SubscriptionInfo;
    }
  }
}

// Emails allowed to bypass subscription check (testing/admin)
const BYPASS_EMAILS = ['maximusmajorka@gmail.com'];

// Valid active statuses
const ACTIVE_STATUSES = ['active', 'trialing', 'Active', 'Trialing'];

// Valid paid plans (case-insensitive)
const PAID_PLANS = ['pro', 'builder', 'scale', 'Pro', 'Builder', 'Scale'];

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) {
    console.warn('[requireSubscription] SUPABASE_SERVICE_ROLE_KEY not set — failing open');
    return null;
  }
  return createClient(url, key);
}

function getUserFromToken(authHeader: string | undefined): { userId: string; email?: string } | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return {
      userId: payload.sub || '',
      email: payload.email || '',
    };
  } catch {
    return null;
  }
}

export const requireSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = getUserFromToken(req.headers.authorization);
  if (!user?.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Authentication required' });
    return;
  }

  // Admin/dev bypass
  if (user.email && BYPASS_EMAILS.includes(user.email)) {
    console.info(`[requireSubscription] Bypass for ${user.email}`);
    req.subscription = { status: 'active', plan: 'scale', userId: user.userId, email: user.email };
    next();
    return;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // No service role key — fail open so users aren't blocked on misconfiguration
    req.subscription = { status: 'active', plan: 'pro', userId: user.userId };
    next();
    return;
  }

  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('status, plan')
      .eq('user_id', user.userId)
      .single();

    if (error) {
      const code = (error as any).code;
      // PGRST116 = row not found → no subscription
      if (code === 'PGRST116') {
        res.status(403).json({
          error: 'subscription_required',
          message: 'Upgrade to Builder or Scale to access this feature',
          upgradeUrl: '/pricing',
        });
        return;
      }
      // Any other DB error (table missing, network error) → fail open
      console.error('[requireSubscription] DB error (failing open):', error.message, 'code:', code);
      req.subscription = { status: 'unknown', plan: 'unknown', userId: user.userId };
      next();
      return;
    }

    if (!data) {
      res.status(403).json({
        error: 'subscription_required',
        message: 'Upgrade to Builder or Scale to access this feature',
        upgradeUrl: '/pricing',
      });
      return;
    }

    const statusOk = ACTIVE_STATUSES.includes(data.status) ||
      data.status?.toLowerCase() === 'active' ||
      data.status?.toLowerCase() === 'trialing';

    const planOk = PAID_PLANS.map(p => p.toLowerCase()).includes(data.plan?.toLowerCase());

    if (!statusOk || !planOk) {
      console.info(`[requireSubscription] Blocked: userId=${user.userId} status=${data.status} plan=${data.plan}`);
      res.status(403).json({
        error: 'subscription_required',
        message: 'Upgrade to Builder or Scale to access this feature',
        upgradeUrl: '/pricing',
      });
      return;
    }

    req.subscription = { status: data.status, plan: data.plan, userId: user.userId, email: user.email };
    next();
  } catch (err: any) {
    // Uncaught exception → fail open, log it
    console.error('[requireSubscription] Unexpected error (failing open):', err.message);
    req.subscription = { status: 'unknown', plan: 'unknown', userId: user.userId };
    next();
  }
};
