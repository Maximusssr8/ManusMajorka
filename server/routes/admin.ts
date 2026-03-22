import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin as requireAdminMiddleware } from '../middleware/requireAdmin';
import { createClient } from '@supabase/supabase-js';
import { findSupplierLinks, findTrendingBuzz } from '../lib/tavilySupplier';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

// Admin middleware — delegates to shared requireAdmin middleware
const requireAdmin = requireAdminMiddleware;

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
// Seeds real TikTok Shop product images for all trend_signals rows via SociaVault
router.post('/seed-real-images', requireAdmin, async (req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const sociavaultKey = process.env.SOCIAVAULT_API_KEY || '';

  if (!sociavaultKey) return res.status(500).json({ error: 'SOCIAVAULT_API_KEY not set' });

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
      // Build a clean search query from product name
      const stop = new Set(['with','and','for','the','a','an','of','in','to','set','pack','bundle','usb','led']);
      const keywords = product.name.toLowerCase().replace(/[&()\-]/g,' ').split(/\s+/)
        .filter(w => w.length > 2 && !stop.has(w)).slice(0, 4).join(' ');

      const apiRes = await fetch(
        `https://api.sociavault.com/v1/scrape/tiktok-shop/search?query=${encodeURIComponent(keywords)}&limit=1`,
        { headers: { 'X-Api-Key': sociavaultKey } }
      );
      const data: any = await apiRes.json();

      if (i === 0) {
        firstResponse = data;
        console.log('[seed-real-images] first response:', JSON.stringify(data, null, 2).slice(0, 2000));
      }

      const productsObj: Record<string, any> = data?.data?.products ?? {};
      const firstProduct: any = productsObj['0'] ?? Object.values(productsObj)[0] ?? null;
      const urlList: Record<string, string> = firstProduct?.image?.url_list ?? {};
      const imageUrl: string | null = urlList['0'] ?? (Object.values(urlList)[0] as string) ?? null;

      if (imageUrl) {
        await fetch(`${supabaseUrl}/rest/v1/trend_signals?id=eq.${product.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
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

// POST /api/admin/seed-tiktok-products
// Searches 20 TikTok Shop keywords and upserts products into trend_signals
router.post('/seed-tiktok-products', requireAdmin, async (req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const sociavaultKey = process.env.SOCIAVAULT_API_KEY || '';

  if (!sociavaultKey) return res.status(500).json({ error: 'SOCIAVAULT_API_KEY not set' });

  const KEYWORDS = [
    'posture corrector','led strip lights','wireless earbuds','resistance bands',
    'facial serum','gua sha tool','ring light','yoga mat','massage gun',
    'bluetooth speaker','acne patches','silk pillowcase','dog harness',
    'wireless charger','magnetic lashes','teeth whitening','hair growth serum',
    'electric face massager','under eye patches','compression socks',
  ];

  const results: any[] = [];
  let firstResponse: any = null;
  let upserted = 0;

  for (let i = 0; i < KEYWORDS.length; i++) {
    const keyword = KEYWORDS[i];
    await new Promise(r => setTimeout(r, 600));

    try {
      const apiRes = await fetch(
        `https://api.sociavault.com/v1/scrape/tiktok-shop/search?query=${encodeURIComponent(keyword)}&limit=5`,
        { headers: { 'X-Api-Key': sociavaultKey } }
      );
      const data: any = await apiRes.json();
      if (i === 0) {
        firstResponse = data;
        console.log('[seed-tiktok] first response:', JSON.stringify(data, null, 2).slice(0, 2000));
      }

      const productsObj: Record<string, any> = data?.data?.products ?? {};
      for (const p of Object.values(productsObj).slice(0, 3)) {
        const urlList: Record<string, string> = p?.image?.url_list ?? {};
        const imageUrl = urlList['0'] ?? (Object.values(urlList)[0] as string) ?? null;
        const priceUsd = parseFloat(p?.product_price_info?.sale_price_decimal ?? '0');

        if (!p.title || !imageUrl) continue;

        const row = {
          name: p.title.slice(0, 120),
          niche: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          image_url: imageUrl,
          estimated_retail_aud: priceUsd ? Math.round(priceUsd * 1.55) : null,
          estimated_margin_pct: 55,
          trend_score: Math.min(99, 60 + Math.floor(Math.random() * 35)),
          dropship_viability_score: 75,
          trend_reason: `Trending on TikTok Shop with ${(p?.sold_info?.sold_count ?? 0).toLocaleString()} sales`,
          source: 'tiktok_shop',
        };

        await fetch(`${supabaseUrl}/rest/v1/trend_signals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
            apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(row),
        });
        upserted++;
        results.push({ keyword, name: row.name, image_url: imageUrl });
      }
    } catch (err: any) {
      console.error(`[seed-tiktok] error for ${keyword}:`, err.message);
    }
  }

  res.json({
    success: true,
    keywords_searched: KEYWORDS.length,
    products_upserted: upserted,
    first_response_sample: firstResponse ? JSON.stringify(firstResponse).slice(0, 2000) : null,
    sample_results: results.slice(0, 5),
  });
});

// POST /api/admin/enrich-products — Tavily supplier links + buzz scores for trend_signals
router.post('/enrich-products', async (req: Request, res: Response) => {
  // Accept service role key OR admin user JWT
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
  const isServiceKey = serviceKey && token === serviceKey;
  if (!isServiceKey) {
    // Fall back to checking decoded JWT email
    try {
      const parts = token.split('.');
      const b64 = parts[1]?.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil((parts[1]?.length || 0) / 4) * 4, '=');
      const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      const email: string = payload.email || payload.user_metadata?.email || '';
      if (email !== 'maximusmajorka@gmail.com') {
        res.status(403).json({ error: 'Admin only', enriched: 0, total: 0 }); return;
      }
    } catch {
      res.status(401).json({ error: 'unauthorized', enriched: 0, total: 0 }); return;
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { limit = 20 } = req.body || {};

  console.log('[enrich] auth:', isServiceKey ? 'service-key' : 'user-jwt');
  console.log('[enrich] auth header prefix:', req.headers.authorization?.slice(0, 30));

  // Column existence check — if aliexpress_url doesn't exist yet, surface a clear error
  const { data: colCheck, error: colErr } = await supabase
    .from('trend_signals')
    .select('aliexpress_url, supplier_name')
    .limit(1);
  console.log('[enrich] Column check:', colCheck, colErr?.message || 'OK');
  if (colErr) {
    res.status(500).json({
      error: 'aliexpress_url column missing — run 🔧 Run Migration first',
      detail: colErr.message,
      enriched: 0,
      total: 0,
    });
    return;
  }

  const { data: products, error } = await supabase
    .from('trend_signals')
    .select('id, name, niche')
    .is('aliexpress_url', null)
    .limit(Math.min(50, Number(limit) || 20));

  console.log('[enrich] Starting enrichment, found products:', products?.length, '| error:', error?.message || 'none');
  if (error) { res.status(500).json({ error: error.message, enriched: 0, total: 0 }); return; }
  if (!products?.length) { res.json({ enriched: 0, total: 0, message: 'All products already enriched ✅' }); return; }

  let enriched = 0;
  const results: { name: string; url: string | null; buzz: number }[] = [];

  for (const product of products) {
    try {
      const [links, buzz] = await Promise.all([
        findSupplierLinks(product.name),
        findTrendingBuzz(product.name),
      ]);

      const bestLink = links[0]?.url || null;
      const supplierName = bestLink?.includes('banggood') ? 'Banggood' : 'AliExpress';

      // Use 'not_found' sentinel when Tavily has no URL — prevents infinite re-processing
      await supabase
        .from('trend_signals')
        .update({
          aliexpress_url: bestLink || 'not_found',
          supplier_name: supplierName,
          social_buzz_score: parseFloat(buzz.toFixed(4)),
        })
        .eq('id', product.id);

      results.push({ name: product.name, url: bestLink, buzz: parseFloat(buzz.toFixed(4)) });
      enriched++;
      console.log(`[enrich] ${product.name} → url:${bestLink?.slice(0, 60) || 'none'} buzz:${buzz.toFixed(3)}`);
      // Rate-limit Tavily calls
      await new Promise(r => setTimeout(r, 500));
    } catch (err: any) {
      console.error('[enrich]', product.name, err.message);
    }
  }

  res.json({
    enriched,
    total: products.length,
    message: `Enriched ${enriched} of ${products.length} products`,
    results,
  });
});


// POST /api/admin/scrape-aliexpress — scrape real data from 39 products with AliExpress URLs
router.post('/scrape-aliexpress', async (req: Request, res: Response) => {
  // Accept service role key OR admin JWT (same pattern as enrich-products)
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
  const isServiceKey = serviceKey && token === serviceKey;
  if (!isServiceKey) {
    try {
      const parts = token.split('.');
      const b64 = parts[1]?.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil((parts[1]?.length || 0) / 4) * 4, '=');
      const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      const email: string = payload.email || payload.user_metadata?.email || '';
      if (email !== 'maximusmajorka@gmail.com') { res.status(403).json({ error: 'Admin only' }); return; }
    } catch { res.status(401).json({ error: 'unauthorized' }); return; }
  }

  const { scrapeAliExpressWithApify } = await import('../lib/apifyAliExpress');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { limit = 5 } = req.body || {};

  // Get products with real AliExpress URLs (not null, not not_found)
  const { data: products, error } = await supabase
    .from('trend_signals')
    .select('id, name, aliexpress_url, image_url')
    .not('aliexpress_url', 'is', null)
    .neq('aliexpress_url', 'not_found')
    .limit(Math.min(20, Number(limit) || 5));

  if (error) { res.status(500).json({ error: error.message }); return; }
  if (!products?.length) { res.json({ scraped: 0, total: 0, message: 'No products with AliExpress URLs found' }); return; }

  console.log('[scrape-ae] Starting scrape for', products.length, 'products');
  const results: { name: string; success: boolean; title: string | null; priceUsd: number | null; imageCount: number }[] = [];
  let scraped = 0;

  for (const product of products) {
    try {
      const data = await scrapeAliExpressWithApify(product.aliexpress_url);
      if (data) {
        const updates: Record<string, any> = {};
        // Update title if we got a better one
        if (data.title && data.title.length > 5) updates.name = data.title.slice(0, 200);
        // Update image with first real AliExpress image (better quality than Pexels for product accuracy)
        if (data.images[0]) updates.image_url = data.images[0];
        // Store price, rating, orders
        if (data.priceUsd) updates.price_usd = data.priceUsd;
        if (data.rating) updates.rating = data.rating;
        if (data.orders) updates.orders_count = data.orders;

        if (Object.keys(updates).length) {
          await supabase.from('trend_signals').update(updates).eq('id', product.id);
        }
        results.push({ name: product.name, success: true, title: data.title, priceUsd: data.priceUsd, imageCount: data.images.length });
        scraped++;
      } else {
        results.push({ name: product.name, success: false, title: null, priceUsd: null, imageCount: 0 });
      }
      // ZenRows rate limit: ~2 req/s on premium — 2s gap is safe
      await new Promise(r => setTimeout(r, 2000));
    } catch (err: any) {
      console.error('[scrape-ae] Error for', product.name, err.message);
      results.push({ name: product.name, success: false, title: null, priceUsd: null, imageCount: 0 });
    }
  }

  res.json({ scraped, total: products.length, message: `Scraped ${scraped} of ${products.length} products`, results });
});


// POST /api/admin/scrape-real-data — scrape real AliExpress data, track with real_data_scraped column
router.post('/scrape-real-data', async (req: Request, res: Response) => {
  // Inline auth: accept service role key OR admin JWT
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) { res.status(401).json({ error: 'No token' }); return; }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
  const isServiceKey = serviceKey && token === serviceKey;
  if (!isServiceKey) {
    try {
      const parts = token.split('.');
      const b64 = parts[1]?.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil((parts[1]?.length || 0) / 4) * 4, '=');
      const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      const email: string = payload.email || payload.user_metadata?.email || '';
      if (email !== 'maximusmajorka@gmail.com') { res.status(403).json({ error: 'Admin only' }); return; }
    } catch { res.status(401).json({ error: 'Invalid token' }); return; }
  }

  const { scrapeAliExpressWithApify } = await import('../lib/apifyAliExpress');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get unscraped products with real AliExpress URLs
  const { data: products, error } = await supabase
    .from('trend_signals')
    .select('id, name, aliexpress_url')
    .not('aliexpress_url', 'is', null)
    .neq('aliexpress_url', 'not_found')
    .or('real_data_scraped.is.null,real_data_scraped.eq.false')
    .limit(10);

  if (error) {
    // Column might not exist yet — tell Max to run the SQL
    if (error.message.includes('real_data_scraped')) {
      res.status(500).json({
        error: 'real_data_scraped column missing',
        sql: 'ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS real_data_scraped BOOLEAN DEFAULT false; ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS scrape_images TEXT[] DEFAULT \'{}\';',
      });
      return;
    }
    res.status(500).json({ error: error.message }); return;
  }

  if (!products?.length) {
    res.json({ scraped: 0, total: 0, message: 'All products scraped ✅' }); return;
  }

  console.log('[scrape-real] Starting for', products.length, 'products');
  let scraped = 0;

  for (const product of products) {
    try {
      const data = await scrapeAliExpressWithApify(product.aliexpress_url);

      if (data && (data.images.length > 0 || data.title)) {
        const updates: Record<string, any> = {
          real_data_scraped: true,
          scrape_images: data.images,
        };
        if (data.title && data.title.length > 5) updates.name = data.title.slice(0, 200);
        if (data.images[0]) updates.image_url = data.images[0];
        if (data.priceUsd) updates.estimated_retail_aud = Math.round(data.priceUsd * 1.55 * 100) / 100;

        await supabase.from('trend_signals').update(updates).eq('id', product.id);
        scraped++;
        console.log(`[scrape-real] ✅ ${product.name} → ${data.images[0]?.slice(0, 50) || 'no img'} | $${data.priceUsd}`);
      } else {
        // Mark attempted so we don't retry endlessly
        await supabase.from('trend_signals').update({ real_data_scraped: true }).eq('id', product.id);
        console.log(`[scrape-real] ❌ ${product.name} → no data returned`);
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (err: any) {
      console.error('[scrape-real]', product.name, err.message);
    }
  }

  res.json({ scraped, total: products.length, message: `Scraped ${scraped} of ${products.length} products` });
});


// GET /api/admin/setup-supplier-tables — returns SQL for aliexpress_products + trend_signals columns
router.get('/setup-supplier-tables', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const sql = `
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new

-- 1. New columns on trend_signals
ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS social_buzz_score NUMERIC DEFAULT 0;
ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS aliexpress_url TEXT;
ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS supplier_name TEXT DEFAULT 'AliExpress';
ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS au_shipping_days TEXT DEFAULT '7-14 days';

-- 2. aliexpress_products cache table
CREATE TABLE IF NOT EXISTS aliexpress_products (
  id                    BIGSERIAL PRIMARY KEY,
  aliexpress_product_id BIGINT UNIQUE NOT NULL,
  niche                 TEXT NOT NULL,
  title                 TEXT NOT NULL,
  price_usd             NUMERIC(10,2),
  price_aud             NUMERIC(10,2),
  image_url             TEXT,
  product_url           TEXT,
  seller_rating         NUMERIC(3,2),
  orders_count          INT,
  stock_qty             INT,
  au_shipping_days      TEXT,
  fetched_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ae_products_niche ON aliexpress_products(niche);
`.trim();
  res.json({ sql, message: 'Copy this SQL and run it in the Supabase SQL editor' });
});


// POST /api/admin/run-supplier-migration — runs DDL for supplier tables (one-shot, admin only)
router.post('/run-supplier-migration', async (req: Request, res: Response) => {
  // Accept service role key OR admin JWT
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
  if (token !== serviceKey) {
    // Service role key not matched — check user is admin via requireAdmin middleware pattern
    const email: string = (req as any).user?.email || '';
    if (email !== 'maximusmajorka@gmail.com') {
      res.status(403).json({ error: 'Admin only' }); return;
    }
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { res.status(500).json({ error: 'DATABASE_URL not set in Vercel env' }); return; }

  const steps: string[] = [];
  let failed = false;

  try {
    const { default: postgres } = await import('postgres');
    const sql = postgres(dbUrl, { ssl: 'require', connect_timeout: 10, max: 1 });

    const run = async (label: string, query: string) => {
      try {
        await sql.unsafe(query);
        steps.push(`✅ ${label}`);
      } catch (e: any) {
        // IF NOT EXISTS means these are safe to re-run; log but continue
        if (e.message?.includes('already exists')) {
          steps.push(`⏭ ${label} (already exists)`);
        } else {
          steps.push(`❌ ${label}: ${e.message}`);
          failed = true;
        }
      }
    };

    await run('social_buzz_score', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS social_buzz_score NUMERIC DEFAULT 0`);
    await run('aliexpress_url', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS aliexpress_url TEXT`);
    await run('supplier_name', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS supplier_name TEXT DEFAULT 'AliExpress'`);
    await run('au_shipping_days', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS au_shipping_days TEXT DEFAULT '7-14 days'`);
    await run('aliexpress_products table', `CREATE TABLE IF NOT EXISTS aliexpress_products (
      id BIGSERIAL PRIMARY KEY,
      aliexpress_product_id BIGINT UNIQUE NOT NULL,
      niche TEXT NOT NULL,
      title TEXT NOT NULL,
      price_usd NUMERIC(10,2),
      price_aud NUMERIC(10,2),
      image_url TEXT,
      product_url TEXT,
      seller_rating NUMERIC(3,2),
      orders_count INT,
      stock_qty INT,
      au_shipping_days TEXT,
      fetched_at TIMESTAMPTZ DEFAULT now()
    )`);
    await run('idx_ae_products_niche', `CREATE INDEX IF NOT EXISTS idx_ae_products_niche ON aliexpress_products(niche)`);

    await sql.end();
    res.json({ ok: !failed, steps });
  } catch (err: any) {
    res.status(500).json({ error: err.message, steps });
  }
});

// POST /api/admin/run-user-tables-migration — creates user_onboarding + user_watchlist via postgres
router.post('/run-user-tables-migration', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
  const isServiceKey = serviceKey && token === serviceKey;
  if (!isServiceKey) {
    try {
      const parts = token.split('.');
      const b64 = parts[1]?.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil((parts[1]?.length || 0) / 4) * 4, '=');
      const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      const email: string = payload.email || payload.user_metadata?.email || '';
      if (email !== 'maximusmajorka@gmail.com') { res.status(403).json({ error: 'Admin only' }); return; }
    } catch { res.status(401).json({ error: 'unauthorized' }); return; }
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { res.status(500).json({ error: 'DATABASE_URL not set in Vercel env' }); return; }

  const steps: string[] = [];
  let failed = false;
  try {
    const { default: postgres } = await import('postgres');
    const sql = postgres(dbUrl, { ssl: 'require', connect_timeout: 10, max: 1 });
    const run = async (label: string, query: string) => {
      try { await sql.unsafe(query); steps.push(`✅ ${label}`); }
      catch (e: any) { steps.push(`❌ ${label}: ${e.message}`); failed = true; }
    };

    // No FK to auth.users — avoids postgres role permission issue; RLS enforces user isolation
    await run('user_onboarding table', `
      CREATE TABLE IF NOT EXISTS user_onboarding (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL,
        completed_steps TEXT[] DEFAULT '{}',
        current_step TEXT DEFAULT 'welcome',
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )`);
    await run('user_onboarding RLS enable', `ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY`);
    await run('user_onboarding policy', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_onboarding' AND policyname='users_own_onboarding') THEN CREATE POLICY users_own_onboarding ON user_onboarding USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); END IF; END $$`);

    await run('user_watchlist table', `
      CREATE TABLE IF NOT EXISTS user_watchlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT,
        product_image TEXT,
        niche TEXT,
        price_aud NUMERIC(10,2),
        added_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id, product_id)
      )`);
    await run('user_watchlist RLS enable', `ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY`);
    await run('user_watchlist policy', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_watchlist' AND policyname='users_own_watchlist') THEN CREATE POLICY users_own_watchlist ON user_watchlist USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); END IF; END $$`);
    await run('idx_watchlist_user', `CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id)`);
    await run('trend_signals real_data_scraped', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS real_data_scraped BOOLEAN DEFAULT false`);
    await run('trend_signals scrape_images', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS scrape_images TEXT[] DEFAULT '{}'`);

    await sql.end();
    res.json({ ok: !failed, steps });
  } catch (err: any) {
    res.status(500).json({ error: err.message, steps });
  }
});

// ── POST /api/admin/refresh-from-aliexpress — populate trend_signals from live AliExpress API ──
router.post('/refresh-from-aliexpress', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
  if (token !== serviceKey) { res.status(403).json({ error: 'Admin only' }); return; }

  if (!process.env.ALIEXPRESS_ACCESS_TOKEN) {
    res.status(400).json({
      error: 'ALIEXPRESS_ACCESS_TOKEN not set. Authorize at /api/aliexpress/auth first.',
      authUrl: `${process.env.VITE_APP_URL || 'https://www.majorka.io'}/api/aliexpress/auth`,
    });
    return;
  }

  const niches = ['fitness', 'beauty', 'tech', 'home', 'pets', 'fashion', 'outdoor', 'kitchen', 'baby', 'jewellery'];
  const { getTrendingByNiche } = await import('../lib/aliexpressDataHub');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceKey);

  let total = 0;

  for (const niche of niches) {
    try {
      const products = await getTrendingByNiche(niche, 19);

      for (const p of products) {
        await supabase.from('trend_signals').upsert({
          name: p.name.slice(0, 200),
          niche,
          image_url: p.image_url,
          estimated_retail_aud: p.price_aud || 49,
          aliexpress_url: p.aliexpress_url,
          supplier_name: p.supplier_name || 'AliExpress',
          orders_count: p.orders_count,
          winning_score: Math.min(100, Math.round(p.orders_count / 100)),
          trend_score: 70,
          growth_pct: 15,
          real_data_scraped: true,
          source: 'rapidapi_datahub',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'name' });
        total++;
      }

      console.log(`[ae-refresh] ${niche}: ${products.length} products`);
      await new Promise(r => setTimeout(r, 300));
    } catch (err: any) {
      console.error(`[ae-refresh] ${niche} failed:`, err.message);
    }
  }

  res.json({ refreshed: total, niches: niches.length });
});

// ── POST /api/admin/run-aliexpress-migration — add missing trend_signals columns ──
router.post('/run-aliexpress-migration', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
  if (token !== serviceKey) { res.status(403).json({ error: 'Admin only' }); return; }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { res.status(500).json({ error: 'DATABASE_URL not set' }); return; }

  const steps: { name: string; ok: boolean; error?: string }[] = [];
  const failed: string[] = [];

  async function run(name: string, sql: string) {
    try {
      const { default: postgres } = await import('postgres');
      const sqlClient = postgres(dbUrl!, { ssl: 'require', connect_timeout: 10, max: 1 });
      await sqlClient.unsafe(sql);
      await sqlClient.end();
      steps.push({ name, ok: true });
      console.log(`[ae-migration] ✅ ${name}`);
    } catch (err: any) {
      steps.push({ name, ok: false, error: err.message });
      failed.push(name);
      console.error(`[ae-migration] ❌ ${name}:`, err.message);
    }
  }

  await run('source column', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'`);
  await run('orders_count column', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS orders_count INT DEFAULT 0`);
  await run('updated_at column', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()`);
  await run('aliexpress_url column', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS aliexpress_url TEXT`);
  await run('supplier_name column', `ALTER TABLE trend_signals ADD COLUMN IF NOT EXISTS supplier_name TEXT DEFAULT 'AliExpress'`);

  res.json({ ok: failed.length === 0, steps, failed });
});

// ── GET /api/admin/aliexpress-status — check AliExpress integration health ────
router.get('/aliexpress-status', async (_req: Request, res: Response) => {
  const { isAuthorized } = await import('../lib/aliexpress');
  res.json({
    authorized: isAuthorized(),
    appKey: process.env.ALIEXPRESS_APP_KEY ? '✅ set' : '❌ missing',
    appSecret: process.env.ALIEXPRESS_APP_SECRET ? '✅ set' : '❌ missing',
    accessToken: process.env.ALIEXPRESS_ACCESS_TOKEN ? '✅ set' : '❌ missing (visit /api/aliexpress/auth)',
    authUrl: `${process.env.VITE_APP_URL || 'https://www.majorka.io'}/api/aliexpress/auth`,
  });
});

export default router;
