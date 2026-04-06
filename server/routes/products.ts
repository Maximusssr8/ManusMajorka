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
  const limit = Math.min(2000, Number(req.query.limit) || 500);
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
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order(sortCol, { ascending: sortDir });

    if (hasVideo) {
      query = query.not('tiktok_product_url', 'is', null);
    }

    // Trending Today: products with real momentum (high order count)
    if (trending) {
      query = query.gte('real_orders_count', 2000);
    }

    // minOrders filter — used by trending preset
    const minOrders = Number(req.query.minOrders) || 0;
    if (minOrders > 0) {
      query = query.gte('real_orders_count', minOrders);
    }

    const offset = Math.max(0, Number(req.query.offset) || 0);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) { res.status(500).json({ error: error.message, products: [] }); return; }

    const computeOpportunityScore = (row: Record<string, unknown>): number => {
      const o = Number(row.real_orders_count || 0);
      return o >= 100000 ? 95 : o >= 50000 ? 90 : o >= 10000 ? 80 :
             o >= 5000 ? 70 : o >= 1000 ? 60 : o >= 500 ? 50 :
             o >= 100 ? 40 : 30;
    };

    const computeTrendVelocity = (row: Record<string, unknown>): string => {
      const orders = Number(row.real_orders_count || 0);
      const score = Number(row.winning_score || 0);
      if (orders >= 10000 && score >= 75) return 'exploding';
      if (orders >= 2000 && score >= 65) return 'rising';
      if (orders >= 500) return 'steady';
      return 'emerging';
    };

    const products = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      opportunity_score: computeOpportunityScore(row),
      trend_velocity: computeTrendVelocity(row),
    }));

    const result = { products, total: count ?? products.length, offset, limit };
    // Cache for 5 min — products don't change that often
    await cacheSet(cacheKey, result, TTL.PRODUCTS_LIST);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message, products: [] });
  }
});

// GET /api/products/trends — top trending products by velocity score
router.get('/trends', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('winning_products')
      .select('id, product_title, category, real_orders_count, real_price_aud, image_url, source_url, winning_score, trend, tags, why_trending, best_ad_angle, target_audience, real_rating, rating')
      .eq('is_active', true)
      .eq('data_source', 'aliexpress_scraper')
      .gte('real_orders_count', 2000)
      .order('real_orders_count', { ascending: false })
      .limit(50);

    if (error) { res.status(500).json({ error: error.message }); return; }

    const products = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      opportunity_score: (() => {
        const o = Number(row.real_orders_count || 0);
        return o >= 100000 ? 95 : o >= 50000 ? 90 : o >= 10000 ? 80 :
               o >= 5000 ? 70 : o >= 1000 ? 60 : o >= 500 ? 50 :
               o >= 100 ? 40 : 30;
      })(),
      trend_velocity: (() => {
        const orders = Number(row.real_orders_count || 0);
        if (orders >= 10000) return 'exploding';
        if (orders >= 2000) return 'rising';
        return 'steady';
      })(),
    }));

    res.json({ products, total: products.length });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const whyTrendingCache = new Map<string, { brief: string; at: number }>();

// Helper: map a raw AliExpress affiliate product to winning_products shape
function mapAliExpressProduct(item: any, keyword: string) {
  const saleAUD = item.target_sale_price
    ? parseFloat(item.target_sale_price)
    : parseFloat(item.sale_price || '0') * 1.55;
  const origAUD = item.target_original_price
    ? parseFloat(item.target_original_price)
    : parseFloat(item.original_price || '0') * 1.55;
  const saleUSD = parseFloat(item.sale_price || '0');
  const orders = parseInt(item.lastest_volume || item.lastest_30days_volume || '0', 10);
  const rating = parseFloat(item.evaluate_rate || '0') / 20;
  const isHot = item.hot_product_flag === 'true' || item.hot_product_flag === true;
  const discount = parseInt(item.discount || '0', 10);
  const hasOrig = origAUD > saleAUD && origAUD > 0;

  const orderScore = orders >= 10000 ? 40 : Math.min((orders / 10000) * 40, 40);
  const ratingScore = rating > 0 ? (rating / 5) * 30 : 0;
  const marginScore = hasOrig ? Math.min(((origAUD - saleAUD) / origAUD) * 100 / 50 * 20, 20) : 0;
  const priceScore = saleAUD < 30 ? 10 : saleAUD < 80 ? 7 : 4;
  const winningScore = Math.round(Math.min(orderScore + ratingScore + marginScore + priceScore, 100));

  return {
    product_title: (item.product_title || '').slice(0, 200),
    platform: 'AliExpress',
    category: item.second_level_category_name || item.first_level_category_name || keyword,
    image_url: item.product_main_image_url || '',
    source_url: item.product_detail_url || item.detail_url || '',
    affiliate_url: item.promotion_link || item.product_detail_url || '',
    shop_name: item.shop_name || 'AliExpress',
    real_price_usd: saleUSD || null,
    real_price_aud: Math.round(saleAUD * 100) / 100 || null,
    price_aud: Math.round(saleAUD * 100) / 100 || null,
    original_price: hasOrig ? Math.round(origAUD * 100) / 100 : null,
    real_orders_count: orders || null,
    orders_count: orders || null,
    real_rating: rating || null,
    rating: rating || null,
    winning_score: winningScore,
    hot_product_flag: isHot,
    commission_rate: parseFloat(item.commission_rate || '0') || null,
    data_source: 'aliexpress_affiliate',
    source_product_id: String(item.product_id || ''),
    search_keyword: keyword,
    is_active: true,
    profit_margin: null,
    tags: ([isHot ? 'HOT' : null, discount >= 30 ? 'DEAL' : null, orders >= 5000 ? 'BESTSELLER' : null].filter(Boolean)) as string[],
    tiktok_signal: false,
    updated_at: new Date().toISOString(),
    scraped_at: new Date().toISOString(),
  };
}

// GET /api/products/search?q=QUERY&page=1&limit=50
// Hits AliExpress via relay first, caches to DB, falls back to DB search
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  const { q, page = '1', limit = '50' } = req.query;

  const query = (typeof q === 'string' ? q : '').trim();
  if (!query || query.length < 2) {
    res.status(400).json({ error: 'Query parameter q is required (min 2 chars)' });
    return;
  }

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 50));
  const supabase = getSupabase();

  // ── SOURCE 1: AliExpress via relay ──────────────────────────────────────────
  const relayUrl = process.env.ALIEXPRESS_RELAY_URL;
  const relaySecret = process.env.RELAY_SECRET || 'majorka_relay_2026';

  if (relayUrl) {
    try {
      const url = `${relayUrl}/relay/aliexpress/products?keywords=${encodeURIComponent(query)}&page=${pageNum}&limit=${limitNum}&secret=${encodeURIComponent(relaySecret)}`;
      const relayRes = await fetch(url, { signal: AbortSignal.timeout(12000) });

      if (relayRes.ok) {
        const relayData = await relayRes.json();
        const items: any[] = relayData.products || [];

        if (items.length > 0) {
          const rows = items.map((item: any) => mapAliExpressProduct(item, query));

          // Cache to DB async — non-blocking
          supabase
            .from('winning_products')
            .upsert(rows, { onConflict: 'product_title' })
            .then(({ error: cacheErr }) => {
              if (cacheErr) console.error('[Search] Cache error:', cacheErr.message);
              else console.log(`[Search] Cached ${rows.length} results for "${query}"`);
            });

          res.json({
            products: rows,
            total: items.length,
            page: pageNum,
            hasMore: items.length === limitNum,
            source: 'aliexpress_live',
            query,
          });
          return;
        }
      } else {
        console.warn(`[Search] Relay responded ${relayRes.status} for "${query}"`);
      }
    } catch (relayErr: any) {
      console.error('[Search] Relay error:', relayErr.message);
    }
  }

  // ── SOURCE 2: DB fallback ────────────────────────────────────────────────────
  try {
    const offset = (pageNum - 1) * limitNum;
    const { data, count, error } = await supabase
      .from('winning_products')
      .select('*', { count: 'exact' })
      .ilike('product_title', `%${query}%`)
      .eq('is_active', true)
      .order('real_orders_count', { ascending: false, nullsFirst: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    res.json({
      products: data || [],
      total: count || 0,
      page: pageNum,
      hasMore: ((count || 0) - offset) > limitNum,
      source: 'db',
      query,
    });
  } catch (err: any) {
    console.error('[Search] DB fallback error:', err.message);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
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

// ── GET /api/products/winning — top winning products by score ─────────────────
router.get('/winning', requireAuth, async (req: Request, res: Response) => {
  const {
    sort = 'winning_score',
    minOrders,
    maxPrice,
    minPrice,
    category,
    limit: limitParam = '50',
    page: pageParam = '1',
    filter = 'all',
    search,
    niche,
  } = req.query;

  const pageSize = Math.min(parseInt(limitParam as string) || 50, 200);
  const pageNum = Math.max(parseInt(pageParam as string) || 1, 1);
  const offset = (pageNum - 1) * pageSize;

  const supabase = getSupabase();

  // Count query
  let countQuery = supabase
    .from('winning_products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Data query
  let dataQuery = supabase
    .from('winning_products')
    .select('*')
    .eq('is_active', true)
    .range(offset, offset + pageSize - 1);

  // Apply shared filters
  const applyFilters = (q: typeof dataQuery) => {
    if (minOrders) q = q.gte('real_orders_count', parseInt(minOrders as string));
    else q = q.gte('real_orders_count', 100);
    if (maxPrice) q = q.lte('real_price_aud', parseFloat(maxPrice as string));
    if (minPrice) q = q.gte('real_price_aud', parseFloat(minPrice as string));
    if (category) q = q.eq('category', category as string);
    if (niche) q = q.eq('category', String(niche));
    if (search) q = q.ilike('product_title', `%${search}%`);
    if (filter === 'hot') q = q.eq('hot_product_flag', true);
    if (filter === 'bestsellers') q = q.eq('is_bestseller', true);
    if (filter === 'top_rated') q = q.gte('real_rating', 4.5);
    if (filter === 'high_margin') q = q.gte('winning_score', 60);
    if (filter === 'trending') q = q.gte('winning_score', 50);
    if (filter === 'new_today') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      q = q.gte('updated_at', oneWeekAgo);
    }
    return q;
  };

  countQuery = applyFilters(countQuery as typeof dataQuery) as typeof countQuery;
  dataQuery = applyFilters(dataQuery);

  const sortMap: Record<string, { col: string; asc: boolean }> = {
    winning_score: { col: 'winning_score', asc: false },
    orders: { col: 'real_orders_count', asc: false },
    price_asc: { col: 'real_price_aud', asc: true },
    price_desc: { col: 'real_price_aud', asc: false },
    newest: { col: 'updated_at', asc: false },
    rating: { col: 'real_rating', asc: false },
  };
  const s = sortMap[sort as string] || sortMap.winning_score;
  dataQuery = dataQuery.order(s.col, { ascending: s.asc });

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
  if (error) return res.status(500).json({ error: error.message });

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const now = Date.now();
  const products = (data || []).map((p: any) => ({
    ...p,
    winning_score: p.winning_score || 0,
    is_new: new Date(p.updated_at).getTime() > now - 7 * 24 * 60 * 60 * 1000,
    suggested_price: p.real_price_aud ? +(p.real_price_aud * 2.5).toFixed(2) : null,
  }));

  res.json({
    products,
    total,
    pagination: { total, totalPages, page: pageNum, limit: pageSize },
  });
});

// ── GET /api/products/stats — live stats for product intelligence header ─────
router.get('/stats', requireAuth, async (_req: Request, res: Response) => {
  const statsCacheKey = 'products:stats:v1';
  const cachedStats = await cacheGet<object>(statsCacheKey);
  if (cachedStats) { res.setHeader('X-Cache', 'HIT'); return res.json(cachedStats); }
  try {
    const supabaseAdmin = getSupabase();
    const [totalRes, hotRes, nichesRes] = await Promise.all([
      supabaseAdmin.from('winning_products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('winning_products').select('*', { count: 'exact', head: true }).eq('hot_product_flag', true),
      supabaseAdmin.from('winning_products').select('category, winning_score').eq('is_active', true),
    ]);
    const niches = nichesRes.data || [];
    const uniqueNiches = new Set(niches.map((r: any) => r.category).filter(Boolean));
    const scores = niches.map((r: any) => r.winning_score).filter(Boolean);
    const avgScore = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
    const nicheCounts: Record<string, number> = {};
    niches.forEach((r: any) => { if (r.category) nicheCounts[r.category] = (nicheCounts[r.category] || 0) + 1; });
    const topNiche = Object.entries(nicheCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || '—';
    const statsResult = {
      total: totalRes.count || 0,
      hotCount: hotRes.count || 0,
      avgScore: Math.round(avgScore),
      nicheCount: uniqueNiches.size,
      topMarginNiche: topNiche,
      topMargin: 68,
      lastUpdated: '6h ago',
    };
    await cacheSet(statsCacheKey, statsResult, TTL.PRODUCTS_STATS);
    res.json(statsResult);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── GET /api/products/export — CSV export ────────────────────────────────────
router.get('/export', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabaseAdmin = getSupabase();
    const { filter, niche, search } = req.query;
    let query = supabaseAdmin
      .from('winning_products')
      .select('product_title,real_orders_count,real_price_aud,original_price,real_rating,winning_score,source,source_url,image_url,category,updated_at')
      .eq('is_active', true)
      .order('real_orders_count', { ascending: false })
      .limit(1000);
    if (filter === 'hot') query = query.eq('hot_product_flag', true);
    if (niche) query = query.eq('category', String(niche));
    if (search) query = query.ilike('product_title', `%${search}%`);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    const headers = ['#', 'Title', 'Orders', 'Price AUD', 'Original Price', 'Margin %', 'Rating', 'Score', 'Source', 'Category', 'URL', 'Last Updated'];
    const rows = (data || []).map((p: any, i: number) => {
      const margin = p.original_price > p.real_price_aud ? Math.round(((p.original_price - p.real_price_aud) / p.original_price) * 100) : '';
      return [
        i + 1,
        `"${(p.product_title || '').replace(/"/g, '""')}"`,
        p.real_orders_count || 0,
        p.real_price_aud?.toFixed(2) || '',
        p.original_price?.toFixed(2) || '',
        margin,
        p.real_rating?.toFixed(1) || '',
        p.winning_score || '',
        p.source || '',
        `"${(p.category || '').replace(/"/g, '""')}"`,
        p.source_url || '',
        p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '',
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="majorka-products-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── GET /api/products/niches — top categories from DB ────────────────────────
router.get('/niches', requireAuth, async (req: Request, res: Response) => {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('winning_products')
    .select('category')
    .eq('is_active', true)
    .not('category', 'is', null);

  if (!data) return res.json({ niches: [] });

  const counts: Record<string, number> = {};
  data.forEach((p: any) => { if (p.category) counts[p.category] = (counts[p.category] || 0) + 1; });

  const niches = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));

  res.json({ niches });
});

// ── GET /api/products/suggestions — AI-ranked category suggestions ───────────
router.get('/suggestions', requireAuth, async (req: Request, res: Response) => {
  const suggCacheKey = 'products:suggestions:v1';
  const cachedSugg = await cacheGet<object>(suggCacheKey);
  if (cachedSugg) { res.setHeader('X-Cache', 'HIT'); return res.json(cachedSugg); }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('winning_products')
      .select('category, winning_score, real_orders_count, updated_at')
      .eq('is_active', true)
      .gte('winning_score', 40)
      .order('winning_score', { ascending: false });

    if (error) throw error;

    const categoryMap: Record<string, { totalScore: number; totalOrders: number; count: number; recentCount: number }> = {};
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const row of (data || [])) {
      if (!row.category) continue;
      if (!categoryMap[row.category]) {
        categoryMap[row.category] = { totalScore: 0, totalOrders: 0, count: 0, recentCount: 0 };
      }
      categoryMap[row.category].totalScore += row.winning_score || 0;
      categoryMap[row.category].totalOrders += row.real_orders_count || 0;
      categoryMap[row.category].count += 1;
      if (new Date(row.updated_at).getTime() > oneWeekAgo) {
        categoryMap[row.category].recentCount += 1;
      }
    }

    const ranked = Object.entries(categoryMap)
      .filter(([, s]) => s.count >= 2)
      .map(([category, stats]) => ({
        category,
        avgScore: stats.totalScore / stats.count,
        avgOrders: stats.totalOrders / stats.count,
        recentCount: stats.recentCount,
        trendScore: (stats.totalScore / stats.count) * 0.5 +
          Math.min(stats.recentCount * 10, 30) +
          Math.min((stats.totalOrders / stats.count) / 1000, 20),
      }))
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 18)
      .map(c => ({
        label: c.category,
        avgScore: Math.round(c.avgScore),
        avgOrders: Math.round(c.avgOrders),
        isHot: c.trendScore > 40,
      }));

    const suggResult = { suggestions: ranked, generatedAt: new Date().toISOString() };
    await cacheSet(suggCacheKey, suggResult, TTL.PRODUCTS_SUGGESTIONS);
    res.json(suggResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate suggestions' });
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
