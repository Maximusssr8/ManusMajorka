import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getSupabaseAdmin } from '../_core/supabase';

const router = Router();

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ievekuazsjbdrltsdksn.supabase.co',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
});

interface DeltasResponse {
  new_in_categories: number;
  most_viewed_jump: { product_id: string; title: string | null; pct: number } | null;
  trending_count: number;
  since: string | null;
}

// GET /api/user/preferences
router.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.json({ region_code: 'US', currency_code: 'USD' });

    const { url, key } = getSupabaseConfig();

    const r = await fetch(`${url}/rest/v1/user_preferences?user_id=eq.${userId}&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
    });
    const prefs = await r.json();
    if (Array.isArray(prefs) && prefs[0]) {
      res.json(prefs[0]);
    } else {
      res.json({ region_code: 'US', currency_code: 'USD' });
    }
  } catch {
    res.json({ region_code: 'US', currency_code: 'USD' });
  }
});

// PATCH /api/user/preferences
router.patch('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { region_code, currency_code } = req.body;
    const { url, key } = getSupabaseConfig();

    // Upsert
    await fetch(`${url}/rest/v1/user_preferences`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        region_code,
        currency_code,
        updated_at: new Date().toISOString(),
      }),
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/ping — stamp last_login_at, called on app shell mount.
// Returns the PREVIOUS last_login_at so the client can show deltas for
// the session that just started.
router.post('/ping', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const supabase = getSupabaseAdmin();
    // Read the current value FIRST so we can return the "previous" timestamp.
    const { data: prev } = await supabase
      .from('user_preferences')
      .select('last_login_at')
      .eq('user_id', userId)
      .maybeSingle();

    const previous = prev?.last_login_at ?? null;

    await supabase.from('user_preferences').upsert(
      {
        user_id: userId,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    res.json({ success: true, previous_last_login_at: previous });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/user/view  { product_id } — log a product view for deltas.
router.post('/view', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const productId = typeof req.body?.product_id === 'string' ? req.body.product_id.trim() : '';
    // UUID sanity check — avoid polluting the table with junk.
    if (!/^[0-9a-f-]{32,36}$/i.test(productId)) {
      res.status(400).json({ error: 'Invalid product_id' });
      return;
    }
    const supabase = getSupabaseAdmin();
    await supabase.from('product_views').insert({
      user_id: userId,
      product_id: productId,
      viewed_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/user/deltas — "Since you last logged in" counters for Home.
router.get('/deltas', requireAuth, async (req: Request, res: Response) => {
  const empty: DeltasResponse = {
    new_in_categories: 0,
    most_viewed_jump: null,
    trending_count: 0,
    since: null,
  };
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.json(empty);
      return;
    }
    const supabase = getSupabaseAdmin();

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('last_login_at, tracked_categories')
      .eq('user_id', userId)
      .maybeSingle();

    // Default window: 24h ago (first-time users still see something).
    const since = prefs?.last_login_at ?? new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const tracked: string[] = Array.isArray(prefs?.tracked_categories) ? prefs.tracked_categories : [];

    // 1) new products in tracked categories
    let newInCategories = 0;
    if (tracked.length > 0) {
      const { count } = await supabase
        .from('winning_products')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', since)
        .in('category', tracked);
      newInCategories = count ?? 0;
    } else {
      const { count } = await supabase
        .from('winning_products')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', since);
      newInCategories = count ?? 0;
    }

    // 2) most-viewed product + its 7-day sold_count jump
    const { data: views } = await supabase
      .from('product_views')
      .select('product_id')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(100);

    let mostViewed: DeltasResponse['most_viewed_jump'] = null;
    if (Array.isArray(views) && views.length > 0) {
      const counts = new Map<string, number>();
      for (const v of views) {
        if (!v?.product_id) continue;
        counts.set(v.product_id, (counts.get(v.product_id) ?? 0) + 1);
      }
      const topId = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      if (topId) {
        const { data: prod } = await supabase
          .from('winning_products')
          .select('id, product_title, velocity_7d, sold_count')
          .eq('id', topId)
          .maybeSingle();
        if (prod) {
          const pct = typeof prod.velocity_7d === 'number' ? Math.min(999, Math.round(prod.velocity_7d)) : 0;
          if (pct > 0) {
            mostViewed = {
              product_id: String(prod.id),
              title: (prod.product_title as string | null) ?? null,
              pct,
            };
          }
        }
      }
    }

    // 3) trending count — products created since `since` with score >= 85.
    const { count: trendingCount } = await supabase
      .from('winning_products')
      .select('id', { count: 'exact', head: true })
      .gt('created_at', since)
      .gte('winning_score', 85);

    const out: DeltasResponse = {
      new_in_categories: newInCategories,
      most_viewed_jump: mostViewed,
      trending_count: trendingCount ?? 0,
      since,
    };
    res.json(out);
  } catch (err: unknown) {
    // Deltas are a nice-to-have — never fail the Home page.
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(200).json({ ...empty, error: message });
  }
});

export default router;
