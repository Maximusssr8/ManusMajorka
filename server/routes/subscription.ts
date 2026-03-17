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
      res.json({ plan: 'free', status: 'inactive' });
      return;
    }

    // Admin bypass
    const email = (req as any).user?.email || '';
    if (email === 'maximusmajorka@gmail.com') {
      res.json({ plan: 'pro', status: 'active' });
      return;
    }

    const { data, error } = await getSupabase()
      .from('user_subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      res.json({ plan: 'free', status: 'inactive' });
      return;
    }

    // Check expiry
    if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
      res.json({ plan: 'free', status: 'expired' });
      return;
    }

    res.json({ plan: data.plan || 'free', status: data.status || 'inactive' });
  } catch (err) {
    console.error('[subscription/me]', err);
    res.json({ plan: 'free', status: 'inactive' });
  }
});

export default router;
