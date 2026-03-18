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

// POST /api/admin/backfill-trend-signals — backfill new columns on existing rows
router.post('/backfill-trend-signals', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: products } = await supabase.from('trend_signals').select('id, name, niche, estimated_retail_aud, trend_score');
    if (!products || products.length === 0) { res.json({ message: 'No products found' }); return; }

    const CREATOR_HANDLES: Record<string, string[]> = {
      'Tech Accessories': ['@techbydan_au','@gadgetking_syd','@austech_drops'],
      'Beauty & Skincare': ['@beautybyem_syd','@glowgirl_au','@skintok_australia'],
      'Health & Wellness': ['@fitwithjess_au','@wellness_oz','@healthyau_life'],
      'Home Decor': ['@homedecor_au','@interior_syd','@ozhomefinds'],
      'Activewear & Gym': ['@gymgirl_au','@fitfam_syd','@aussie_gains'],
      'Pets & Animals': ['@dogmum_au','@paws_syd','@aussie_pets'],
      'Fashion & Apparel': ['@fashion_syd','@oztrendy','@stylemelb_au'],
      'Outdoor & Camping': ['@camping_au','@outdooroz','@hikingaustralia'],
      'Baby & Kids': ['@mumlife_au','@babytok_syd','@ozmums'],
      'Jewellery & Accessories': ['@jewels_syd','@accessories_au','@styleacc_oz'],
    };

    let updated = 0;
    for (const p of products) {
      const monthlyRevenue = Math.round(p.estimated_retail_aud * (50 + Math.random() * 300));
      const weekly = monthlyRevenue / 4;
      const revTrend = Array.from({ length: 7 }, () => Math.round(weekly * (0.85 + Math.random() * 0.3)));
      const handlers = CREATOR_HANDLES[p.niche] || ['@ausdrops','@shopfinds_au','@trendingau'];

      const { error } = await supabase.from('trend_signals').update({
        est_monthly_revenue_aud: monthlyRevenue,
        revenue_trend: revTrend,
        items_sold_monthly: Math.round(monthlyRevenue / (p.estimated_retail_aud || 49)),
        growth_rate_pct: Math.floor(Math.random() * 80 - 10),
        creator_handles: handlers,
        avg_unit_price_aud: p.estimated_retail_aud,
        saturation_score: Math.floor(Math.random() * 5 + 4),
        winning_score: Math.floor(p.trend_score * 0.85 + Math.random() * 15),
        ad_count_est: Math.floor(Math.random() * 200 + 20),
      }).eq('id', p.id);

      if (!error) updated++;
    }

    res.json({ success: true, updated, total: products.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/backfill-shops — compute items_sold_monthly from revenue/price
router.post('/backfill-shops', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const shopsRes = await fetch(`${supabaseUrl}/rest/v1/shop_intelligence?select=id,est_revenue_aud,avg_unit_price_aud`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const shops: any[] = await shopsRes.json();

    let updated = 0;
    for (const shop of shops) {
      const avgPrice = shop.avg_unit_price_aud || 75;
      const revenue = shop.est_revenue_aud || 50000;
      const itemsSold = Math.round(revenue / avgPrice);

      await fetch(`${supabaseUrl}/rest/v1/shop_intelligence?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ items_sold_monthly: itemsSold }),
      });
      updated++;
    }

    res.json({ success: true, updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/seed-real-products
// Fetches real product images from Pexels for all trend_signals rows
router.post('/seed-real-products', requireAdmin, async (req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const pexelsKey = process.env.PEXELS_API_KEY || '';

  if (!pexelsKey) {
    return res.status(500).json({ error: 'PEXELS_API_KEY not configured' });
  }

  // Fetch all products
  const productsRes = await fetch(
    `${supabaseUrl}/rest/v1/trend_signals?select=id,name,niche&limit=200`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  const products: Array<{ id: string; name: string; niche: string }> = await productsRes.json();

  if (!Array.isArray(products)) {
    return res.status(500).json({ error: 'Failed to fetch products', raw: products });
  }

  const results: Array<{ name: string; image_url: string | null; status: string }> = [];

  for (const product of products) {
    try {
      // Search Pexels with product name (trim to key words)
      const searchQuery = product.name
        .toLowerCase()
        .replace(/\b(with|and|for|the|a|an|&)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .slice(0, 4)
        .join(' ');

      const pexelsRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=square`,
        { headers: { Authorization: pexelsKey } }
      );
      const pexelsData: any = await pexelsRes.json();
      const photo = pexelsData?.photos?.[0];

      if (!photo) {
        // Fallback: search by niche
        const nicheRes = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(product.niche + ' product')}&per_page=1&orientation=square`,
          { headers: { Authorization: pexelsKey } }
        );
        const nicheData: any = await nicheRes.json();
        const nichePhoto = nicheData?.photos?.[0];
        if (nichePhoto) {
          const imageUrl = nichePhoto.src.medium || nichePhoto.src.small;
          await fetch(`${supabaseUrl}/rest/v1/trend_signals?id=eq.${product.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ image_url: imageUrl }),
          });
          results.push({ name: product.name, image_url: imageUrl, status: 'niche-fallback' });
        } else {
          results.push({ name: product.name, image_url: null, status: 'no-image' });
        }
      } else {
        const imageUrl = photo.src.medium || photo.src.small;
        await fetch(`${supabaseUrl}/rest/v1/trend_signals?id=eq.${product.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ image_url: imageUrl }),
        });
        results.push({ name: product.name, image_url: imageUrl, status: 'ok' });
      }

      // 300ms delay to respect rate limits
      await new Promise(r => setTimeout(r, 300));
    } catch (err: any) {
      results.push({ name: product.name, image_url: null, status: `error: ${err.message}` });
    }
  }

  const successCount = results.filter(r => r.image_url).length;
  res.json({
    success: true,
    total: products.length,
    updated: successCount,
    failed: products.length - successCount,
    sample: results.slice(0, 5),
  });
});

// POST /api/admin/seed-real-images
// Seeds real AliExpress product images for all trend_signals rows
router.post('/seed-real-images', requireAdmin, async (req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const rapidApiKey = process.env.RAPIDAPI_KEY || '';

  if (!rapidApiKey) return res.status(500).json({ error: 'RAPIDAPI_KEY not set' });

  // Fetch all products
  const productsRes = await fetch(
    `${supabaseUrl}/rest/v1/trend_signals?select=id,name,niche&limit=300`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  const products: Array<{ id: string; name: string; niche: string }> = await productsRes.json();

  if (!Array.isArray(products)) {
    return res.status(500).json({ error: 'Failed to fetch products', raw: products });
  }

  let updated = 0;
  let failed = 0;
  let firstResponse: any = null;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    await new Promise(r => setTimeout(r, 400));

    try {
      const apiRes = await fetch(
        `https://aliexpress-datahub.p.rapidapi.com/item_search_2?q=${encodeURIComponent(product.name)}&page=1&sort=default`,
        {
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com',
          },
        }
      );
      const data: any = await apiRes.json();

      // Log first product full response
      if (i === 0) {
        firstResponse = data;
        console.log('[seed-real-images] first response:', JSON.stringify(data, null, 2).slice(0, 2000));
      }

      const resultList: any[] =
        data?.result?.resultList ||
        data?.result?.items ||
        data?.resultList ||
        data?.items ||
        [];

      const item = resultList[0]?.item || resultList[0] || null;
      const imageUrl: string | null =
        item?.image ||
        item?.productMainImageUrl ||
        item?.imageUrl ||
        item?.pic ||
        item?.picUrl ||
        null;

      if (imageUrl) {
        await fetch(`${supabaseUrl}/rest/v1/trend_signals?id=eq.${product.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ image_url: imageUrl }),
        });
        updated++;
      } else {
        failed++;
      }
    } catch (err: any) {
      console.error(`[seed-real-images] error for ${product.name}:`, err.message);
      failed++;
    }
  }

  res.json({
    success: true,
    total: products.length,
    updated,
    failed,
    first_response_keys: firstResponse ? Object.keys(firstResponse) : [],
    first_response_sample: firstResponse ? JSON.stringify(firstResponse).slice(0, 1500) : null,
  });
});

export default router;
