import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '../middleware/requireAuth';
import { createClient } from '@supabase/supabase-js';
import { cacheGet, cacheSet, cacheInvalidatePrefix, TTL } from '../lib/redisCache';
import { checkUsageLimit, incrementUsage } from '../lib/usageLimits';
import type { Plan } from '../../shared/plans';

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

// Category keyword aliases — maps common search terms to canonical category names
const CATEGORY_ALIASES: Record<string, string> = {
  'kitchen': 'Kitchen', 'kitchen gadgets': 'Kitchen',
  'pet': 'Pet', 'pet accessories': 'Pet', 'dog': 'Pet', 'cat': 'Pet',
  'fitness': 'Fitness', 'fitness equipment': 'Fitness', 'gym': 'Fitness',
  'home decor': 'Home', 'home': 'Home', 'cleaning': 'Home',
  'tech': 'Electronics', 'electronics': 'Electronics',
  'beauty': 'Beauty', 'skincare': 'Beauty', 'glow': 'Beauty',
  'health': 'Health', 'sleep': 'Health', 'wellness': 'Health',
  'outdoor': 'Outdoor', 'camping': 'Outdoor',
  'office': 'Office', 'desk': 'Office',
  'automotive': 'Automotive', 'car': 'Automotive',
  'kids': 'Kids', 'baby': 'Kids',
  'fashion': 'Fashion', 'clothing': 'Fashion',
};

// Supabase DB search — fast, free, returns products we actually have
async function dbSearch(supabase: ReturnType<typeof createClient>, query: string): Promise<ProductResult[]> {
  const searchLower = query.toLowerCase().trim();
  const aliasCategory = CATEGORY_ALIASES[searchLower];

  // If the query maps to an exact category alias, filter by category
  if (aliasCategory) {
    const { data, error } = await supabase
      .from('winning_products')
      .select('id, product_title, category, search_keyword, image_url, price_aud, winning_score, orders_count, aliexpress_url, rating')
      .eq('is_active', true)
      .eq('category', aliasCategory)
      .order('winning_score', { ascending: false })
      .limit(20);

    if (!error && data?.length) {
      return data.map((row: any) => {
        const price = row.price_aud ?? 0;
        const sold = row.orders_count ?? 0;
        return {
          id: String(row.id),
          title: row.product_title,
          image: row.image_url || '',
          price_aud: price,
          sold_count: sold >= 1000 ? `${(sold / 1000).toFixed(1)}k sold/mo` : sold > 0 ? `${sold} sold/mo` : '',
          rating: row.rating || 4.5,
          source: 'majorka_db',
          product_url: row.aliexpress_url || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(row.product_title)}`,
          platform_badge: '📊 Majorka DB',
          niche: row.category || row.search_keyword,
          trend_score: row.winning_score,
        };
      });
    }
  }

  const keywords = searchLower.split(/\s+/).filter(w => w.length > 2);
  if (!keywords.length) return [];

  // Multi-field search: product_title, category, search_keyword, why_trending, best_ad_angle, target_audience
  const { data, error } = await supabase
    .from('winning_products')
    .select('id, product_title, category, search_keyword, image_url, price_aud, winning_score, orders_count, aliexpress_url, rating')
    .eq('is_active', true)
    .or(keywords.map(k =>
      `product_title.ilike.%${k}%,category.ilike.%${k}%,search_keyword.ilike.%${k}%,why_trending.ilike.%${k}%,best_ad_angle.ilike.%${k}%,target_audience.ilike.%${k}%`
    ).join(','))
    .order('winning_score', { ascending: false })
    .limit(20);

  if (error || !data?.length) return [];

  return data.map((row: any) => {
    const price = row.price_aud ?? 0;
    const sold = row.orders_count ?? 0;
    return {
      id: String(row.id),
      title: row.product_title,
      image: row.image_url || '',
      price_aud: price,
      sold_count: sold >= 1000 ? `${(sold / 1000).toFixed(1)}k sold/mo` : sold > 0 ? `${sold} sold/mo` : '',
      rating: row.rating || 4.5,
      source: 'majorka_db',
      product_url: row.aliexpress_url || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(row.product_title)}`,
      platform_badge: '📊 Majorka DB',
      niche: row.category || row.search_keyword,
      trend_score: row.winning_score,
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
    const priceOffsets = [-8, 5, -3, 12, -5, 7, 0, 10, -6, 3];
    const price = Math.max(9, basePrice + (priceOffsets[idx] || 0));
    return {
      id: `pexels-${idx}`,
      title: titleVariants[idx] ?? `${query} #${idx + 1}`,
      image: img,
      price_aud: price,
      sold_count: '',
      rating: 0,
      source: 'pexels_placeholder',
      product_url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}&SortType=total_tranpro_desc`,
      platform_badge: '🔍 Search Result',
    };
  });
}

// GET /api/products?hasVideo=true&limit=200
// Requires authentication — either a valid Supabase JWT or the service role key
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const limit = Math.min(500, Number(req.query.limit) || 200);
  const hasVideo = req.query.hasVideo === 'true';
  const trending = req.query.trending === 'true';
  const rawSort = String(req.query.sortBy || '');
  const sortDir = req.query.sortDir === 'asc';

  // Redis cache key based on query params — 5 min TTL
  const cacheKey = `products:list:${limit}:${hasVideo}:${trending}:${rawSort}:${sortDir}`;
  const cached = await cacheGet<{ products: unknown[]; total: number }>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    res.json(cached);
    return;
  }

  // Map client sort keys to DB columns
  const SORT_MAP: Record<string, string> = {
    orders_count:             'orders_count',
    winning_score:            'winning_score',
    score:                    'winning_score',
    est_monthly_revenue_aud:  'est_monthly_revenue_aud',
    revenue:                  'est_monthly_revenue_aud',
    price_aud:                'price_aud',
    sold_count:               'sold_count',
    profit_margin:            'profit_margin',
    au_relevance:             'au_relevance',
  };
  const sortCol = SORT_MAP[rawSort] || (trending ? 'orders_count' : 'winning_score');

  const supabase = getSupabase();
  try {
    let query = supabase
      .from('winning_products')
      .select('*')
      .eq('is_active', true)
      .order(sortCol, { ascending: sortDir })
      .limit(limit);

    if (hasVideo) {
      query = query.not('tiktok_product_url', 'is', null);
    }

    // Trending Today: only products with rising trend or tiktok signal
    if (trending) {
      query = query.or('trend.eq.rising,tiktok_signal.eq.true');
    }

    const { data, error } = await query;
    if (error) { res.status(500).json({ error: error.message, products: [] }); return; }
    const result = { products: data || [], total: (data || []).length };
    // Cache for 5 min — products don't change that often
    await cacheSet(cacheKey, result, TTL.PRODUCTS_LIST);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message, products: [] });
  }
});


function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const whyTrendingCache = new Map<string, { brief: string; at: number }>();

// GET /api/products/search?q=QUERY
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  // Usage enforcement
  const userId = (req as any).user?.userId;
  if (userId) {
    const plan = ((req as any).subscription?.plan || 'builder') as Plan;
    const usage = await checkUsageLimit(userId, 'product_searches', plan);
    if (!usage.allowed) {
      res.status(429).json({ error: 'limit_exceeded', used: usage.used, limit: usage.limit, message: `You've used ${usage.used}/${usage.limit} product searches this month. Upgrade to Scale for unlimited.` });
      return;
    }
  }

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
      const dbResults = await dbSearch(supabase as any, query);
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
  const analyticsUserId = (req as any).user?.id ?? null;
  supabase.from('search_analytics').insert({ query: cacheKey, results_count: results.length, user_id: analyticsUserId }).then(() => {}, () => {});

  // Auto-populate winning_products from popular searches (3+ times in 24h)
  (async () => {
    try {
      const { count } = await supabase
        .from('search_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('query', cacheKey)
        .gte('searched_at', new Date(Date.now() - 86400000).toISOString());

      if ((count ?? 0) >= 3 && results.length > 0) {
        const top = results[0];
        await supabase.from('winning_products').upsert({
          product_title: top.title.slice(0, 120),
          category: query.charAt(0).toUpperCase() + query.slice(1),
          search_keyword: query,
          image_url: top.image,
          price_aud: top.price_aud,
          profit_margin: 55,
          winning_score: 75 + Math.min(20, Math.floor((count ?? 3) * 2)),
          tags: ['TRENDING'],
          source: 'user_search',
        }, { onConflict: 'product_title' });
      }
    } catch { /* non-fatal */ }
  })();

  res.json({
    results: results.slice(0, 20),
    total: Math.min(results.length, 20),
    query,
    source: results[0]?.source ?? 'none',
  });
  // Increment usage after successful response
  const uid = (req as any).user?.userId;
  if (uid) incrementUsage(uid, 'product_searches').catch(() => {});
});

// ── POST /api/products/refresh — trigger real data pipeline ────────────────────
const REFRESH_COOLDOWN = 30 * 60 * 1000;
const refreshState: { lastRun?: number; running?: boolean } = {};

router.post('/refresh', async (req: Request, res: Response) => {
  const now = Date.now();

  if (refreshState.running) {
    res.json({ status: 'running', message: 'Refresh already in progress — check back in 60 seconds' });
    return;
  }

  if (refreshState.lastRun && (now - refreshState.lastRun) < REFRESH_COOLDOWN) {
    const minsAgo = Math.round((now - refreshState.lastRun) / 60000);
    const minsLeft = 30 - minsAgo;
    res.json({ throttled: true, minsAgo, minsLeft, message: `Refreshed ${minsAgo} minute${minsAgo !== 1 ? 's' : ''} ago — next refresh available in ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}` });
    return;
  }

  refreshState.running = true;
  res.json({ status: 'started', message: 'Refresh started — new products will appear in about 30 seconds' });

  setImmediate(async () => {
    try {
      const { runProductPipeline } = await import('../lib/productPipeline');
      const result = await runProductPipeline(true);
      refreshState.lastRun = Date.now();
      // Bust the product list cache so fresh data is served immediately
      await cacheInvalidatePrefix('products:list');
      console.log('[Refresh] Complete:', result);
    } catch (err) {
      console.error('[Refresh] Error:', err);
    } finally {
      refreshState.running = false;
    }
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

    const { error } = await supabase.from('winning_products').upsert({
      product_title: detail.subject?.slice(0, 200),
      category: niche || 'General',
      search_keyword: niche || 'General',
      image_url: imageUrl,
      aliexpress_url: `https://www.aliexpress.com/item/${productId}.html`,
      aliexpress_id: productId,
      shop_name: 'AliExpress',
      price_aud: Math.round(priceAud * 100) / 100,
      winning_score: 70,
      tags: ['TRENDING'],
      source: 'aliexpress_import',
    }, { onConflict: 'product_title' });

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

// ── GET /api/products/ad-creatives?product=NAME&price=49 ────────────────────
router.get("/ad-creatives", async (req: Request, res: Response) => {
  const product = String(req.query.product || "").trim();
  const price = Number(req.query.price) || 49;
  if (!product) { res.status(400).json({ error: "product required" }); return; }
  try {
    const { findAdCreatives } = await import("../lib/findAdCreatives");
    const result = await findAdCreatives(product);
    res.json({ product, price, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/products/generate-ad-copy ─────────────────────────────────────
router.post("/generate-ad-copy", requireAuth, async (req: Request, res: Response) => {
  const { product, price } = req.body || {};
  if (!product) { res.status(400).json({ error: "product required" }); return; }
  try {
    const { generateAdCopy } = await import("../lib/findAdCreatives");
    const copy = await generateAdCopy(String(product), Number(price) || 49);
    res.json({ product, ...copy });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/velocity?name=product+name
// Returns trend velocity for a single product
router.get('/velocity', async (req: Request, res: Response) => {
  try {
    const name = String(req.query.name || '').trim();
    if (!name) { res.status(400).json({ error: 'name is required' }); return; }

    const { calculateTrendVelocity } = await import('../lib/trend-velocity');
    const result = await calculateTrendVelocity(name);

    res.json({ name, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/:id/why-trending — AI brief explaining why this product is trending
router.post('/:id/why-trending', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const CACHE_MS = 24 * 60 * 60 * 1000;
  const cached = whyTrendingCache.get(id);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    res.json({ brief: cached.brief, cached: true });
    return;
  }
  const supabase = getSupabase();
  const { data: product, error } = await supabase
    .from('winning_products')
    .select('product_title, category, winning_score, why_winning, trend, tags, score_breakdown, tavily_mentions')
    .eq('id', id)
    .single();
  if (error || !product) { res.status(404).json({ error: 'Product not found' }); return; }
  try {
    const client = getAnthropicClient();
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `You are a TikTok ecommerce analyst. Write a 3-sentence brief explaining exactly why this product is trending right now. Be specific, data-driven, no fluff. Plain text only.\n\nProduct: ${product.product_title}\nCategory: ${product.category || 'General'}\nScore: ${product.winning_score}/100\nWhy Winning: ${product.why_winning || 'Strong market demand'}\nTrend: ${product.trend || 'Rising'}\nTags: ${JSON.stringify(product.tags || [])}`,
      }],
    });
    const brief = ((msg.content[0] as any).text || '').trim() || 'This product is gaining traction through organic TikTok discovery, driven by strong visual appeal and competitive AU pricing.';
    whyTrendingCache.set(id, { brief, at: Date.now() });
    res.json({ brief, cached: false });
  } catch {
    res.json({ brief: 'This product is seeing strong organic momentum on TikTok with consistent sales velocity and growing creator interest in this category.', cached: false });
  }
});

export default router;

// ── GET /api/products/cj — CJ Dropshipping top products (cached 12hr) ────────
router.get('/cj', async (_req: Request, res: Response) => {
  try {
    const { fetchCJProducts } = await import('../lib/cjProducts');
    const { getSupabaseAdmin } = await import('../_core/supabase');
    const sb = getSupabaseAdmin();
    const CACHE_KEY = 'cj_products_au';

    // Check cache first
    try {
      const { data: cached } = await sb
        .from('apify_cache')
        .select('data, expires_at')
        .eq('cache_key', CACHE_KEY)
        .single();
      if (cached && new Date(cached.expires_at) > new Date() && Array.isArray(cached.data) && cached.data.length > 0) {
        res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
        return res.json({ products: cached.data, count: cached.data.length, source: 'cache' });
      }
    } catch {}

    // Fetch live from CJ
    const products = await fetchCJProducts();
    if (products.length > 0) {
      const expiresAt = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
      await sb.from('apify_cache').upsert(
        { cache_key: CACHE_KEY, data: products, fetched_at: new Date().toISOString(), expires_at: expiresAt },
        { onConflict: 'cache_key' }
      ).then(null, () => {});
    }

    res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    res.json({ products, count: products.length, source: 'live' });
  } catch (err: any) {
    console.error('[products/cj]', err.message);
    res.status(500).json({ error: err.message });
  }
});
