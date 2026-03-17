import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

// Admin middleware
function requireAdmin(req: Request, res: Response, next: Function) {
  const email = (req as any).user?.email || '';
  if (email !== 'maximusmajorka@gmail.com') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// GET /api/admin/users — list all users with subscription info
router.get('/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const users = authData?.users || [];

    const { data: subs } = await supabase
      .from('user_subscriptions')
      .select('user_id, plan, status, current_period_end, stripe_customer_id');

    const subMap = new Map((subs || []).map((s: any) => [s.user_id, s]));

    const result = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at,
      plan: subMap.get(u.id)?.plan || 'free',
      status: subMap.get(u.id)?.status || 'inactive',
      period_end: subMap.get(u.id)?.current_period_end || null,
      stripe_customer_id: subMap.get(u.id)?.stripe_customer_id || null,
    }));

    res.json({ users: result, total: result.length });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/admin/users/:userId/plan — update user plan
router.post('/users/:userId/plan', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { plan, status } = req.body;
  try {
    const supabase = getSupabase();
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan: plan || 'pro',
        status: status || 'active',
        current_period_end: periodEnd.toISOString(),
      }, { onConflict: 'user_id' });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/admin/trend-signals — all rows
router.get('/trend-signals', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { data } = await getSupabase()
      .from('trend_signals')
      .select('*')
      .order('trend_score', { ascending: false });
    res.json({ products: data || [] });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/admin/trend-signals — delete all
router.delete('/trend-signals', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    await getSupabase()
      .from('trend_signals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/admin/trend-signals — add product manually
router.post('/trend-signals', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, niche, estimated_retail_aud, estimated_margin_pct, trend_score, dropship_viability_score, trend_reason } = req.body;
    const { data, error } = await getSupabase()
      .from('trend_signals')
      .insert({
        name, niche,
        estimated_retail_aud: Number(estimated_retail_aud) || 0,
        estimated_margin_pct: Number(estimated_margin_pct) || 0,
        trend_score: Number(trend_score) || 50,
        dropship_viability_score: Number(dropship_viability_score) || 5,
        trend_reason: trend_reason || '',
        refreshed_at: new Date().toISOString(),
        source: 'manual',
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ ok: true, product: data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/admin/subscriptions — all subscription rows
router.get('/subscriptions', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: subs } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authData?.users || []).map((u: any) => [u.id, u.email]));

    const result = (subs || []).map((s: any) => ({
      ...s,
      email: emailMap.get(s.user_id) || 'Unknown',
    }));

    res.json({ subscriptions: result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/admin/subscriptions — manual add
router.post('/subscriptions', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email, plan, status } = req.body;
    const supabase = getSupabase();

    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const user = (authData?.users || []).find((u: any) => u.email === email);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan: plan || 'pro',
        status: status || 'active',
        current_period_end: periodEnd.toISOString(),
      }, { onConflict: 'user_id' });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/admin/system-health — system health
router.get('/system-health', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    let supabaseOk = false;
    try {
      await supabase.from('winning_products').select('id').limit(1);
      supabaseOk = true;
    } catch { /* ignore */ }

    const [wpResult, userResult, storeResult, trendResult] = await Promise.all([
      supabase.from('winning_products').select('*', { count: 'exact', head: true }),
      supabase.auth.admin.listUsers({ perPage: 1 }).then(d => ({ count: d.data?.total || 0 })),
      supabase.from('generated_stores').select('*', { count: 'exact', head: true }),
      supabase.from('trend_signals').select('*', { count: 'exact', head: true }),
    ]);

    const { data: lastTrend } = await supabase
      .from('trend_signals')
      .select('refreshed_at')
      .order('refreshed_at', { ascending: false })
      .limit(1);
    const lastCronRun = lastTrend?.[0]?.refreshed_at || null;

    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    const stripeMode = stripeKey.startsWith('sk_live_') ? 'live' : 'test';

    res.json({
      supabase: supabaseOk,
      stripe: { mode: stripeMode },
      cron: { lastRun: lastCronRun },
      counts: {
        products: wpResult.count,
        users: userResult.count,
        stores: storeResult.count,
        trendSignals: trendResult.count,
      }
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
