import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

// GET /api/subscription/me — returns { plan, status } for current user
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.sub;
    if (!userId) {
      res.json({ plan: '', status: 'inactive', subscribed: false });
      return;
    }

    // Admin bypass
    const email = (req as any).user?.email || '';
    if (email === 'maximusmajorka@gmail.com') {
      res.json({ plan: 'scale', status: 'active', subscribed: true });
      return;
    }

    const { data, error } = await getSupabase()
      .from('user_subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      res.json({ plan: '', status: 'inactive', subscribed: false });
      return;
    }

    // Check expiry
    if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
      res.json({ plan: '', status: 'expired', subscribed: false });
      return;
    }

    const plan = data.plan?.toLowerCase() || '';
    const status = data.status?.toLowerCase() || 'inactive';
    const isValid = ['trial', 'builder', 'scale'].includes(plan) && status === 'active';

    if (!isValid) {
      res.json({ plan: '', status: 'inactive', subscribed: false });
      return;
    }

    const currentPeriodEnd = data.current_period_end || null;
    res.json({ plan, status, subscribed: true, currentPeriodEnd });
  } catch (err) {
    console.error('[subscription/me]', err);
    res.json({ plan: '', status: 'inactive', subscribed: false });
  }
});

export default router;
