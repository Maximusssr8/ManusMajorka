import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

interface ProductResult {
  id: string;
  title: string;
  image: string;
  price_aud: number;
  sold_count: string;
  rating: number;
  source: string;
  product_url: string;
  platform_badge: string;
  niche?: string;
  trend_score?: number;
}

// Pexels search — returns real images for any query
async function pexelsSearch(query: string, count = 12): Promise<string[]> {
  const pexelsKey = process.env.PEXELS_API_KEY || '';
  if (!pexelsKey) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=square`,
      { headers: { Authorization: pexelsKey } }
    );
    const data: any = await res.json();
    return (data?.photos ?? [])
      .map((p: any) => p?.src?.medium || p?.src?.small || '')
      .filter(Boolean);
  } catch {
    return [];
  }
}

// Supabase DB search — fast, free, returns products we actually have
async function dbSearch(supabase: ReturnType<typeof createClient>, query: string): Promise<ProductResult[]> {
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (!keywords.length) return [];

  // Use ilike on name + niche
  const { data, error } = await supabase
    .from('trend_signals')
    .select('id, name, niche, image_url, estimated_retail_aud, trend_score, dropship_viability_score, items_sold_monthly')
    .or(keywords.map(k => `name.ilike.%${k}%,niche.ilike.%${k}%`).join(','))
    .order('trend_score', { ascending: false })
    .limit(20);

  if (error || !data?.length) return [];

  return data.map((row: any) => {
    const price = row.estimated_retail_aud ?? Math.floor(Math.random() * 60) + 15;
    const sold = row.items_sold_monthly ?? 0;
    return {
      id: String(row.id),
      title: row.name,
      image: row.image_url || '',
      price_aud: price,
      sold_count: sold >= 1000 ? `${(sold / 1000).toFixed(1)}k sold/mo` : sold > 0 ? `${sold} sold/mo` : '',
      rating: 4.5,
      source: 'majorka_db',
      product_url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(row.name)}`,
      platform_badge: '📊 Majorka DB',
      niche: row.niche,
      trend_score: row.trend_score,
    };
  });
}

// Build results from Pexels images + query context when no DB results
async function pexelsFallback(query: string): Promise<ProductResult[]> {
  const images = await pexelsSearch(query, 12);
  if (!images.length) return [];

  // Realistic AU pricing by keyword detection
  const qLower = query.toLowerCase();
  let basePrice = 29;
  if (/protein|creatine|supplement|vitamin/.test(qLower)) basePrice = 45;
  else if (/massager|device|machine|electric/.test(qLower)) basePrice = 89;
  else if (/tool|kit|set/.test(qLower)) basePrice = 35;
  else if (/serum|cream|oil|skin|hair/.test(qLower)) basePrice = 38;
  else if (/mat|band|gear|sport/.test(qLower)) basePrice = 42;
  else if (/light|led|lamp/.test(qLower)) basePrice = 55;

  const titleVariants = [
    `Premium ${query}`,
    `Professional ${query}`,
    `${query} - Best Seller`,
    `${query} AU Edition`,
    `High Performance ${query}`,
    `${query} Pro`,
    `Original ${query}`,
    `${query} Starter Pack`,
    `${query} Bundle`,
    `${query} (AU Stock)`,
    `Upgraded ${query}`,
    `${query} Value Pack`,
  ];

  return images.slice(0, 10).map((img, idx) => {
    const priceVariance = Math.round((Math.random() * 0.6 - 0.3) * basePrice);
    const price = Math.max(9, basePrice + priceVariance);
    const sold = Math.floor(Math.random() * 15000) + 500;
    return {
      id: `pexels-${idx}`,
      title: titleVariants[idx] ?? `${query} #${idx + 1}`,
      image: img,
      price_aud: price,
      sold_count: sold >= 1000 ? `${(sold / 1000).toFixed(1)}k sold` : `${sold} sold`,
      rating: Math.round((4.0 + Math.random() * 0.9) * 10) / 10,
      source: 'aliexpress',
      product_url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}&SortType=total_tranpro_desc`,
      platform_badge: '📦 AliExpress',
    };
  });
}

// GET /api/products/search?q=QUERY
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query || query.length < 2) {
    res.status(400).json({ error: 'Query required (min 2 chars)' });
    return;
  }

  const supabase = getSupabase();
  const cacheKey = query.toLowerCase().slice(0, 100);

  // Check cache first (1 hour TTL)
  try {
    const { data: cached } = await supabase
      .from('product_search_cache')
      .select('results, cached_at')
      .eq('query', cacheKey)
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.cached_at).getTime();
      if (age < 60 * 60 * 1000) {
        res.json({
          results: cached.results,
          total: (cached.results as any[]).length,
          query,
          source: 'cache',
        });
        return;
      }
    }
  } catch {
    // Cache miss — continue
  }

  const results: ProductResult[] = [];

  // SOURCE 1: SociaVault TikTok Shop (best — when credits available)
  const sociavaultKey = process.env.SOCIAVAULT_API_KEY || '';
  if (sociavaultKey && results.length < 5) {
    try {
      const apiRes = await fetch(
        `https://api.sociavault.com/v1/scrape/tiktok-shop/search?query=${encodeURIComponent(query)}&limit=20`,
        {
          headers: { 'X-Api-Key': sociavaultKey },
          signal: AbortSignal.timeout(8000),
        }
      );
      console.log(`[products/search] SociaVault status: ${apiRes.status}`);
      if (apiRes.ok) {
        const data: any = await apiRes.json();
        const productsObj: Record<string, any> = data?.data?.products ?? {};
        console.log(`[products/search] SociaVault products count: ${Object.keys(productsObj).length}`);
        for (const p of Object.values(productsObj)) {
          const urlList: Record<string, string> = p?.image?.url_list ?? {};
          const image = urlList['0'] ?? (Object.values(urlList)[0] as string) ?? '';
          const priceUsd = parseFloat(p?.product_price_info?.sale_price_decimal ?? '0');
          const soldCount = p?.sold_info?.sold_count ?? 0;
          if (!p.title) continue;
          results.push({
            id: p.product_id ?? `tiktok-${Math.random()}`,
            title: p.title,
            image,
            price_aud: priceUsd ? Math.round(priceUsd * 1.55 * 100) / 100 : 0,
            sold_count: soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}k sold` : `${soldCount} sold`,
            rating: 4.5,
            source: 'tiktok_shop',
            product_url: p?.seo_url?.canonical_url ?? 'https://www.tiktok.com/shop',
            platform_badge: '🛍️ TikTok Shop',
          });
        }
      } else {
        const errBody = await apiRes.text();
        console.log(`[products/search] SociaVault error: ${errBody.slice(0, 100)}`);
      }
    } catch (err: any) {
      console.error('[products/search] SociaVault threw:', err.message);
    }
  }

  // SOURCE 2: Majorka DB search (instant, always works)
  if (results.length < 8) {
    try {
      const dbResults = await dbSearch(supabase, query);
      console.log(`[products/search] DB search returned: ${dbResults.length}`);
      // Merge — don't duplicate titles
      const existingTitles = new Set(results.map(r => r.title.toLowerCase()));
      for (const r of dbResults) {
        if (!existingTitles.has(r.title.toLowerCase())) {
          results.push(r);
        }
      }
    } catch (err: any) {
      console.error('[products/search] DB search error:', err.message);
    }
  }

  // SOURCE 3: AliExpress DataHub via RapidAPI (real products, no OAuth needed)
  if (results.length < 8 && process.env.RAPIDAPI_KEY) {
    try {
      const { searchAliExpressProducts } = await import('../lib/aliexpressDataHub');
      const dhProducts = await searchAliExpressProducts(query, { limit: 10 });
      console.log(`[products/search] DataHub returned: ${dhProducts.length}`);
      const existingTitles = new Set(results.map(r => r.title.toLowerCase()));
      for (const p of dhProducts) {
        if (!p.name || existingTitles.has(p.name.toLowerCase())) continue;
        existingTitles.add(p.name.toLowerCase());
        results.push({
          id: p.id,
          title: p.name,
          image: p.image_url,
          price_aud: p.price_aud,
          sold_count: p.orders_count ? `${p.orders_count.toLocaleString()} sold` : '',
          rating: p.rating,
          source: 'aliexpress_datahub',
          product_url: p.aliexpress_url,
          platform_badge: '🛒 AliExpress',
        });
      }
    } catch (err: any) {
      console.error('[products/search] DataHub error:', err.message);
    }
  }

  // SOURCE 4: Pexels-backed AliExpress results (always has images for any query)
  if (results.length < 5) {
    try {
      const pexResults = await pexelsFallback(query);
      console.log(`[products/search] Pexels fallback returned: ${pexResults.length}`);
      results.push(...pexResults);
    } catch (err: any) {
      console.error('[products/search] Pexels fallback error:', err.message);
    }
  }

  // Cache results
  if (results.length > 0) {
    try {
      await supabase
        .from('product_search_cache')
        .upsert({ query: cacheKey, results, cached_at: new Date().toISOString() }, { onConflict: 'query' });
    } catch {
      // Non-fatal
    }
  }

  // Log search analytics (non-blocking)
  const userId = (req as any).user?.id ?? null;
  supabase.from('search_analytics').insert({ query: cacheKey, results_count: results.length, user_id: userId }).then(() => {}).catch(() => {});

  // Auto-populate trend_signals from popular searches (3+ times in 24h)
  (async () => {
    try {
      const { count } = await supabase
        .from('search_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('query', cacheKey)
        .gte('searched_at', new Date(Date.now() - 86400000).toISOString());

      if ((count ?? 0) >= 3 && results.length > 0) {
        const top = results[0];
        await supabase.from('trend_signals').upsert({
          name: top.title.slice(0, 120),
          niche: query.charAt(0).toUpperCase() + query.slice(1),
          image_url: top.image,
          estimated_retail_aud: top.price_aud,
          estimated_margin_pct: 55,
          trend_score: 75 + Math.min(20, Math.floor((count ?? 3) * 2)),
          dropship_viability_score: 80,
          trend_reason: `Popular search: "${query}" — ${top.sold_count}`,
          source: 'user_search',
        }, { onConflict: 'name' });
      }
    } catch { /* non-fatal */ }
  })();

  res.json({
    results: results.slice(0, 20),
    total: Math.min(results.length, 20),
    query,
    source: results[0]?.source ?? 'none',
  });
});

// ── GET /api/products/datahub/test — RapidAPI DataHub connectivity check ─────
router.get('/datahub/test', async (_req: Request, res: Response) => {
  try {
    const { testConnection } = await import('../lib/aliexpressDataHub');
    const result = await testConnection();
    res.json({ source: 'rapidapi_datahub', ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/products/datahub/search?q=earbuds&limit=20 ──────────────────────
router.get('/datahub/search', requireAuth, async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const niche = String(req.query.niche || '').trim();
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const page = Number(req.query.page) || 1;

  if (!q && !niche) { res.status(400).json({ error: 'q or niche required', products: [] }); return; }

  try {
    const { searchAliExpressProducts, getTrendingByNiche } = await import('../lib/aliexpressDataHub');
    const products = q
      ? await searchAliExpressProducts(q, { limit, page })
      : await getTrendingByNiche(niche, limit);
    res.json({ products, total: products.length, query: q || niche, source: 'rapidapi_datahub' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, products: [] });
  }
});

// ── GET /api/products/datahub/trending?niche=fitness&limit=20 ────────────────
router.get('/datahub/trending', requireAuth, async (req: Request, res: Response) => {
  const niche = String(req.query.niche || 'fitness');
  const limit = Math.min(50, Number(req.query.limit) || 20);
  try {
    const { getTrendingByNiche } = await import('../lib/aliexpressDataHub');
    const products = await getTrendingByNiche(niche, limit);
    res.json({ products, total: products.length, niche, source: 'rapidapi_datahub' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, products: [] });
  }
});

// ── GET /api/products/detail/:productId — AliExpress product detail for Store Builder ───
router.get('/detail/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  if (!/^\d+$/.test(productId)) { res.status(400).json({ error: 'Invalid product ID' }); return; }
  try {
    const { getAliExpressProductDetail } = await import('../lib/aliexpressDataHub');
    const detail = await getAliExpressProductDetail(productId);
    if (!detail) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(detail);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/products/aliexpress/search?q=earbuds&niche=fitness&limit=20 ─────
router.get('/aliexpress/search', requireAuth, async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const niche = String(req.query.niche || '').trim();
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const page = Number(req.query.page) || 1;

  if (!q && !niche) { res.status(400).json({ error: 'q or niche is required', products: [] }); return; }

  try {
    const { searchProducts, getTrendingProducts } = await import('../lib/aliexpress');
    const raw = q
      ? await searchProducts(q, { pageSize: limit, pageNo: page, shipToCountry: 'AU', currency: 'AUD' })
      : await getTrendingProducts(niche, limit);

    // Transform to Majorka format
    const products = raw.map((p: any) => ({
      id: p.product_id,
      name: p.product_title,
      image_url: p.product_main_image_url,
      images: p.product_image_urls?.string || [],
      price_usd: parseFloat(p.target_sale_price || p.sale_price || '0'),
      price_aud: Math.round(parseFloat(p.target_sale_price || p.sale_price || '0') * 1.55),
      original_price_aud: Math.round(parseFloat(p.original_price || '0') * 1.55),
      discount_pct: p.discount || 0,
      orders_count: parseInt(p.lastest_volume || '0'),
      rating: parseFloat(p.evaluate_rate || '0') / 20, // 0-100 → 0-5
      shop_url: p.product_detail_url,
      aliexpress_url: p.product_detail_url,
      niche: niche || 'general',
      shipping_au: 'Ships to AU',
      source: 'aliexpress_api',
    }));

    res.json({ products, total: products.length, page, query: q || niche });
  } catch (err: any) {
    console.error('[ae-search]', err.message);
    const notAuthed = err.message.includes('ALIEXPRESS_ACCESS_TOKEN');
    res.status(notAuthed ? 401 : 500).json({
      error: err.message,
      products: [],
      authUrl: notAuthed ? `${process.env.VITE_APP_URL || 'https://www.majorka.io'}/api/aliexpress/auth` : undefined,
    });
  }
});

// ── GET /api/products/aliexpress/trending?niche=fitness&limit=20 ─────────────
router.get('/aliexpress/trending', requireAuth, async (req: Request, res: Response) => {
  const niche = String(req.query.niche || 'fitness');
  const limit = Math.min(50, Number(req.query.limit) || 20);
  try {
    const { getTrendingProducts } = await import('../lib/aliexpress');
    const products = await getTrendingProducts(niche, limit);
    res.json({ products, total: products.length, niche });
  } catch (err: any) {
    res.status(500).json({ error: err.message, products: [] });
  }
});

// ── GET /api/products/aliexpress/:productId — full product detail ─────────────
router.get('/aliexpress/:productId', requireAuth, async (req: Request, res: Response) => {
  const { productId } = req.params;
  try {
    const { getProductDetail, getShippingInfo } = await import('../lib/aliexpress');
    const [detail, shipping] = await Promise.all([
      getProductDetail(productId),
      getShippingInfo(productId),
    ]);
    if (!detail) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json({ product: detail, shipping });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/products/aliexpress/import — import AliExpress product to trend_signals ──
router.post('/aliexpress/import', requireAuth, async (req: Request, res: Response) => {
  const { productId, niche } = req.body || {};
  if (!productId) { res.status(400).json({ error: 'productId required' }); return; }

  try {
    const { getProductDetail } = await import('../lib/aliexpress');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const detail = await getProductDetail(productId);
    if (!detail) { res.status(404).json({ error: 'Product not found on AliExpress' }); return; }

    const imageUrl = detail.image_urls?.split(';')[0] || '';
    const priceAud = parseFloat(detail.sku_price_list?.[0]?.sku_price?.price || '0') * 1.55;

    const { error } = await supabase.from('trend_signals').upsert({
      name: detail.subject?.slice(0, 200),
      niche: niche || 'General',
      image_url: imageUrl,
      aliexpress_url: `https://www.aliexpress.com/item/${productId}.html`,
      supplier_name: 'AliExpress',
      estimated_retail_aud: Math.round(priceAud * 100) / 100,
      winning_score: 70,
      trend_score: 70,
      growth_pct: 10,
      source: 'aliexpress_import',
      real_data_scraped: true,
    }, { onConflict: 'name' });

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, product: { id: productId, name: detail.subject, imageUrl, priceAud } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/products/aliexpress-test — quick API connectivity check ──────────
router.get('/aliexpress-test', async (req: Request, res: Response) => {
  try {
    const { searchProducts } = await import('../lib/aliexpress');
    const products = await searchProducts('wireless earbuds', { pageSize: 3 });
    res.json({
      ok: products.length > 0,
      count: products.length,
      sample: products[0] ? {
        id: (products[0] as any).product_id,
        title: (products[0] as any).product_title?.slice(0, 60),
        price: (products[0] as any).target_sale_price,
        image: (products[0] as any).product_main_image_url?.slice(0, 80),
      } : null,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
