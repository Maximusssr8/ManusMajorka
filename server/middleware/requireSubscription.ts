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

// Valid paid plans (case-insensitive)
const PAID_PLANS = ['builder', 'scale'];

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) {
    console.error('[requireSubscription] SUPABASE_SERVICE_ROLE_KEY not set — failing closed');
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * requireSubscription — verifies JWT via supabase.auth.getUser() (cryptographic verification),
 * then checks subscription status. Never decodes JWT payload without verification.
 */
export const requireSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Authentication required' });
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'unauthorized', message: 'Authentication required' });
    return;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // No service role key — fail closed to prevent unauthorized access
    res.status(503).json({ error: 'service_unavailable', message: 'Subscription verification unavailable' });
    return;
  }

  // Verify JWT signature via Supabase (cryptographic verification — cannot be spoofed)
  let userId: string;
  let email: string | undefined;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
      return;
    }
    userId = data.user.id;
    email = data.user.email || undefined;
  } catch {
    res.status(401).json({ error: 'unauthorized', message: 'Token verification failed' });
    return;
  }

  // Admin/dev bypass
  if (email && BYPASS_EMAILS.includes(email)) {
    req.subscription = { status: 'active', plan: 'scale', userId, email };
    next();
    return;
  }

  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('status, plan, current_period_end')
      .eq('user_id', userId)
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
      // Any other DB error → fail closed
      console.error('[requireSubscription] DB error:', error.message, 'code:', code);
      res.status(503).json({ error: 'service_unavailable', message: 'Subscription verification failed' });
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

    const statusOk = data.status?.toLowerCase() === 'active';
    const planOk = PAID_PLANS.includes(data.plan?.toLowerCase());

    // Check subscription expiry
    if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
      res.status(403).json({
        error: 'subscription_expired',
        message: 'Your subscription has expired. Please renew to continue.',
        upgradeUrl: '/pricing',
      });
      return;
    }

    if (!statusOk || !planOk) {
      res.status(403).json({
        error: 'subscription_required',
        message: 'Upgrade to Builder or Scale to access this feature',
        upgradeUrl: '/pricing',
      });
      return;
    }

    req.subscription = { status: data.status, plan: data.plan, userId, email };
    next();
  } catch (err: any) {
    // Uncaught exception → fail closed
    console.error('[requireSubscription] Unexpected error:', err.message);
    res.status(503).json({ error: 'service_unavailable', message: 'Subscription verification failed' });
  }
};
