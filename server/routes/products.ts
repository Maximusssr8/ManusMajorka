import { Router, Request, Response } from 'express';
import { callClaude } from '../lib/claudeWrap';
import { requireAuth } from '../middleware/requireAuth';
import { createClient } from '@supabase/supabase-js';
import { searchAffiliateProducts } from '../lib/aliexpress-affiliate';
import { aeSearchLimiter } from '../lib/ratelimit';
import { cacheGet, cacheSet, cacheInvalidatePrefix, TTL } from '../lib/redisCache';
import { cacheMiddleware } from '../lib/cache';
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

// Anthropic access flows through callClaude() (server/lib/claudeWrap.ts).

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

// ── GET /api/products/top20 — service-role bypass for client pickers ──
// Uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS. Safe: read-only, no
// user data, returns the 20 products with the highest sold_count. Used by
// the Ads Studio "Pick from your product database" dropdown so the client
// never has to touch winning_products directly (avoids RLS policy drift).
router.get('/top20', cacheMiddleware(() => 'products:top20', 300), async (_req: Request, res: Response) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('winning_products')
      .select('id, product_title, price_aud, sold_count, category, image_url, aliexpress_url, winning_score')
      .not('product_title', 'is', null)
      .not('sold_count', 'is', null)
      .order('sold_count', { ascending: false })
      .limit(20);
    if (error) {
      console.error('[products/top20] supabase error:', error.message);
      return res.status(500).json({ error: error.message, products: [] });
    }
    return res.json({ products: data ?? [], count: data?.length ?? 0 });
  } catch (err: unknown) {
    console.error('[products/top20]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
      products: [],
    });
  }
});

// ── GET /api/products/stats-overview ─────────────────────────────────────
// One-shot aggregate: total, hotCount, avgScore, topScore, plus real weekly
// deltas computed from created_at. Replaces the hardcoded trend strings on
// the Home page so every number on the dashboard is live.
router.get('/stats-overview', cacheMiddleware(() => 'stats:overview', 3600), async (_req: Request, res: Response) => {
  try {
    const sb = getSupabase();
    // Paginate through the whole table — Supabase REST caps at 1000/page.
    type Row = { sold_count: number | null; winning_score: number | null; category: string | null; created_at: string | null };
    const list: Row[] = [];
    const PAGE = 1000;
    let from = 0;
    while (from < 20000) {
      const { data, error } = await sb
        .from('winning_products')
        .select('sold_count,winning_score,category,created_at')
        .range(from, from + PAGE - 1);
      if (error) {
        console.error('[stats-overview] supabase error:', error.message);
        return res.status(500).json({ error: error.message });
      }
      const batch = (data ?? []) as Row[];
      list.push(...batch);
      if (batch.length < PAGE) break;
      from += PAGE;
    }

    const total = list.length;
    const scores = list.map((r) => r.winning_score ?? 0).filter((n) => n > 0);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const topScore = scores.length ? Math.max(...scores) : 0;
    const hotProducts = list.filter((r) => (r.winning_score ?? 0) >= 65).length;
    const categoryCount = new Set(list.map((r) => r.category).filter((c): c is string => !!c && c.trim().length > 0)).size;

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * DAY;
    const twoWeeksAgo = now - 14 * DAY;

    const createdAtMs = (r: Row): number => {
      if (!r.created_at) return 0;
      const ts = Date.parse(r.created_at);
      return Number.isFinite(ts) ? ts : 0;
    };

    const newThisWeek = list.filter((r) => {
      const ts = createdAtMs(r);
      return ts >= weekAgo && ts <= now;
    }).length;

    const newLastWeek = list.filter((r) => {
      const ts = createdAtMs(r);
      return ts >= twoWeeksAgo && ts < weekAgo;
    }).length;

    const hotNewThisWeek = list.filter((r) => {
      if ((r.winning_score ?? 0) < 65) return false;
      const ts = createdAtMs(r);
      return ts >= weekAgo && ts <= now;
    }).length;

    const hotNewLastWeek = list.filter((r) => {
      if ((r.winning_score ?? 0) < 65) return false;
      const ts = createdAtMs(r);
      return ts >= twoWeeksAgo && ts < weekAgo;
    }).length;

    // Clamp trend percentage: require baseline >= 20 for a meaningful delta,
    // and return null (not a capped value) for any result above 999% so the
    // client can HIDE the pill entirely. Showing "+999% vs last week" reads
    // as a bug; absence reads as honesty.
    const hotDelta = (() => {
      if (!hotNewLastWeek || hotNewLastWeek < 20) return null;
      const raw = Math.round(((hotNewThisWeek - hotNewLastWeek) / hotNewLastWeek) * 100);
      if (raw > 999 || raw < -999) return null;
      return raw;
    })();

    return res.json({
      total,
      hotProducts,
      avgScore,
      topScore,
      categoryCount,
      newThisWeek,
      newLastWeek,
      totalDelta: newThisWeek - newLastWeek,
      hotDelta, // percentage or null
      updatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[stats-overview]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// ── GET /api/products/stats-categories ────────────────────────────────────
// Top-N categories by total orders. Pure aggregate query, no auth needed.
router.get('/stats-categories', cacheMiddleware((req) => `stats:categories:${String(req.query.market || 'AU')}`, 3600), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '8'), 10) || 8));
    const sb = getSupabase();
    type Row = { category: string | null; sold_count: number | null };
    const list: Row[] = [];
    let from = 0;
    const PAGE = 1000;
    while (from < 20000) {
      const { data, error } = await sb
        .from('winning_products')
        .select('category,sold_count')
        .not('category', 'is', null)
        .not('sold_count', 'is', null)
        .gt('sold_count', 0)
        .range(from, from + PAGE - 1);
      if (error) return res.status(500).json({ error: error.message });
      const batch = (data ?? []) as Row[];
      list.push(...batch);
      if (batch.length < PAGE) break;
      from += PAGE;
    }
    const agg = new Map<string, { total_orders: number; product_count: number }>();
    for (const r of list) {
      const k = (r.category ?? '').trim();
      if (!k) continue;
      const entry = agg.get(k) ?? { total_orders: 0, product_count: 0 };
      entry.total_orders += r.sold_count ?? 0;
      entry.product_count += 1;
      agg.set(k, entry);
    }
    const rows = Array.from(agg.entries())
      .map(([category, v]) => ({ category, total_orders: v.total_orders, product_count: v.product_count }))
      .sort((a, b) => b.total_orders - a.total_orders)
      .slice(0, limit);
    return res.json({ categories: rows });
  } catch (err: unknown) {
    console.error('[stats-categories]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── GET /api/products/todays-picks ────────────────────────────────────────
// The "Today's 5" home-page hook. Must rotate daily so operators see fresh
// products every morning — the old version just returned the all-time top-5
// by sold_count which never changed.
//
// Algorithm:
//   1. Fetch a broad pool of quality products (score >= 75, orders >= 5k,
//      has image), up to 100.
//   2. Compute a per-product "pick score" that blends:
//      - winning_score (40%)
//      - recency bonus (30%) — products added in the last 14d get a boost
//      - daily rotation seed (30%) — deterministic shuffle using
//        (dayOfYear XOR product_id_hash) so the ranking changes each day
//        but stays stable for any given day (no flicker on page refresh).
//   3. Return the top N by pick score.
//
// This means every day the "Today's 5" are different, newer products
// surface faster, and the list still skews toward genuine quality.
router.get('/todays-picks', cacheMiddleware((req) => `dashboard:todays-picks:${String(req.query.limit || '')}`, 600), async (req: Request, res: Response) => {
  try {
    const market = String(req.query.market ?? 'AU');
    const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? '5'), 10) || 5));
    const sb = getSupabase();

    // Broad pool — relaxed thresholds vs the old 88/80k gate
    const { data: pool } = await sb
      .from('winning_products')
      .select('id,product_title,price_aud,sold_count,winning_score,image_url,aliexpress_url,category,created_at,est_daily_revenue_aud')
      .gte('winning_score', 75)
      .gte('sold_count', 5000)
      .not('image_url', 'is', null)
      .order('winning_score', { ascending: false, nullsFirst: false })
      .limit(100);

    const candidates = pool ?? [];
    if (candidates.length === 0) {
      // Ultra-fallback: just return whatever exists
      const { data: fb } = await sb
        .from('winning_products')
        .select('id,product_title,price_aud,sold_count,winning_score,image_url,aliexpress_url,category,created_at,est_daily_revenue_aud')
        .not('image_url', 'is', null)
        .order('sold_count', { ascending: false, nullsFirst: false })
        .limit(limit);
      return res.json({ picks: fb ?? [], market, generatedAt: new Date().toISOString(), fallback: true });
    }

    // Day-of-year seed — changes daily, stable within a day
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);

    // Simple hash for rotation diversity
    function hashStr(s: string): number {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
      }
      return Math.abs(h);
    }

    const scored = candidates.map((p) => {
      const ws = Number(p.winning_score ?? 0);
      // Recency: products added in last 14 days get full 30pts, decaying to 0 at 90 days
      const createdTs = p.created_at ? new Date(p.created_at).getTime() : 0;
      const daysOld = createdTs > 0 ? Math.max(0, (now.getTime() - createdTs) / 86400000) : 999;
      const recencyBonus = daysOld <= 14 ? 30 : daysOld <= 30 ? 20 : daysOld <= 60 ? 10 : daysOld <= 90 ? 5 : 0;
      // Daily rotation: deterministic pseudo-random offset seeded by dayOfYear + product id
      const rotationNoise = (hashStr(String(p.id)) ^ (dayOfYear * 2654435761)) % 100;
      const rotationBonus = (rotationNoise / 100) * 30;

      const pickScore = (ws / 100) * 40 + recencyBonus + rotationBonus;
      return { ...p, _pickScore: pickScore };
    });

    scored.sort((a, b) => b._pickScore - a._pickScore);
    const picks = scored.slice(0, limit).map(({ _pickScore, ...rest }) => rest);

    return res.json({ picks, market, generatedAt: now.toISOString() });
  } catch (err: unknown) {
    console.error('[todays-picks]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── POST /api/products/blueprint ─────────────────────────────────────────
// First Sale Blueprint — uses Claude Haiku to generate a 7-day action plan
// for the given product. Returns { steps: [{ day, title, action, budget }] }.
router.post('/blueprint', async (req: Request, res: Response) => {
  try {
    const { productId, market = 'AU' } = (req.body ?? {}) as { productId?: string; market?: string };
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const sb = getSupabase();
    const { data: product, error } = await sb
      .from('winning_products')
      .select('product_title,category,price_aud,sold_count,winning_score')
      .eq('id', productId)
      .single();
    if (error || !product) return res.status(404).json({ error: 'Product not found' });

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_KEY) {
      // Deterministic fallback when Claude isn't configured.
      return res.json({
        steps: [
          { day: 1, title: 'Pick your supplier', action: `Order a sample of ${product.product_title} from AliExpress to verify quality and shipping time.`, budget: `A$${Number(product.price_aud).toFixed(2)}` },
          { day: 2, title: 'Build the store',    action: 'Use Majorka Store Builder to spin up a Shopify store from this product. Edit the title and copy.', budget: 'A$0' },
          { day: 3, title: 'Generate ad creative', action: 'Open Ads Studio from this product and generate 3 hook variations. Pick the strongest.', budget: 'A$0' },
          { day: 4, title: 'Set up Meta campaign', action: 'Create a single ad set with broad targeting in your market. Goal: link clicks. Daily budget A$20.', budget: 'A$20' },
          { day: 5, title: 'Run the test',        action: 'Let the ad run 24h without changes. Watch CPC and CTR. Aim for CPC under A$1.50 and CTR above 1%.', budget: 'A$20' },
          { day: 6, title: 'Read the data',       action: 'Check link clicks vs sales. If you have any sales, scale the winning ad set. If zero, swap creative.', budget: 'A$20' },
          { day: 7, title: 'Scale or pivot',      action: 'If profitable, double daily budget. If not, kill the campaign and test the next product on your saved list.', budget: 'A$40' },
        ],
        fallback: true,
      });
    }

    const prompt = `You are a senior dropshipping operator. Create a specific 7-day "first sale" action plan for this product:

Product: ${product.product_title}
Category: ${product.category ?? 'general'}
Cost (COGS): A$${product.price_aud}
Orders to date: ${product.sold_count}
AI score: ${product.winning_score}/100
Target market: ${market}

Return JSON only with exactly 7 days of specific, actionable steps. Be concrete — exact ad budgets, exact platforms, exact audiences. No fluff.

{"steps":[{"day":1,"title":"short title (max 6 words)","action":"specific action (1-2 sentences)","budget":"A$XX or null"}]}`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await r.json() as { content?: Array<{ text?: string }> };
    const text = (data.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim();
    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      return res.status(500).json({ error: 'Failed to parse Claude response' });
    }
  } catch (err: unknown) {
    console.error('[blueprint]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── POST /api/products/trigger-refresh ────────────────────────────────────
// Manual trigger for the AliExpress bestseller scrape. Protected by a
// shared secret in production; open in development. Fires the existing
// launchAEBestsellerScrapes() pipeline which harvest-apify-runs cron
// will pick up and import.
router.post('/trigger-refresh', async (req: Request, res: Response) => {
  try {
    const secret = req.headers['x-refresh-secret'];
    const expected = process.env.REFRESH_SECRET;
    if (process.env.NODE_ENV === 'production') {
      if (!expected) return res.status(503).json({ error: 'REFRESH_SECRET not configured' });
      if (secret !== expected) return res.status(401).json({ error: 'Unauthorized' });
    }
    const { launchAEBestsellerScrapes } = await import('../scrapers/ae-bestseller-urls');
    const runIds = await launchAEBestsellerScrapes();
    console.log(`[trigger-refresh] launched ${runIds.length} Apify runs`);
    return res.json({
      ok: true,
      runs_launched: runIds.length,
      run_ids: runIds,
      note: 'Runs are fire-and-forget. The harvest-apify-runs cron (*/15) will pick up results and import them.',
    });
  } catch (err: unknown) {
    console.error('[trigger-refresh]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── GET /api/products/categories ──────────────────────────────────────────
// Returns all unique, non-null category names sorted alphabetically.
// Drives the Products page category dropdown.
router.get('/categories', cacheMiddleware(() => 'categories:all', 86400), async (_req: Request, res: Response) => {
  try {
    const sb = getSupabase();
    type Row = { category: string | null };
    const list: Row[] = [];
    let from = 0;
    const PAGE = 1000;
    while (from < 20000) {
      const { data, error } = await sb
        .from('winning_products')
        .select('category')
        .not('category', 'is', null)
        .range(from, from + PAGE - 1);
      if (error) return res.status(500).json({ error: error.message });
      const batch = (data ?? []) as Row[];
      list.push(...batch);
      if (batch.length < PAGE) break;
      from += PAGE;
    }
    const unique = Array.from(new Set(
      list.map((r) => (r.category ?? '').trim()).filter((c) => c.length > 0)
    )).sort((a, b) => a.localeCompare(b));
    return res.json({ categories: unique });
  } catch (err: unknown) {
    console.error('[categories]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── GET /api/products/niches-overview ─────────────────────────────────────
// Rich per-category aggregates for the Niches Intelligence page.
// Returns product_count, avg_score, hot_count, total_orders, avg_price, and
// a single top_product preview (by sold_count) per category.
router.get('/niches-overview', cacheMiddleware(() => 'dashboard:niches-overview', 600), async (_req: Request, res: Response) => {
  try {
    const sb = getSupabase();
    type Row = {
      category: string | null;
      sold_count: number | null;
      winning_score: number | null;
      price_aud: number | null;
      product_title: string | null;
      image_url: string | null;
    };
    const list: Row[] = [];
    let from = 0;
    const PAGE = 1000;
    while (from < 20000) {
      const { data, error } = await sb
        .from('winning_products')
        .select('category,sold_count,winning_score,price_aud,product_title,image_url')
        .not('category', 'is', null)
        .range(from, from + PAGE - 1);
      if (error) return res.status(500).json({ error: error.message });
      const batch = (data ?? []) as Row[];
      list.push(...batch);
      if (batch.length < PAGE) break;
      from += PAGE;
    }
    const agg = new Map<string, {
      count: number;
      score_sum: number;
      score_n: number;
      price_sum: number;
      price_n: number;
      hot_count: number;
      total_orders: number;
      top_product_title: string | null;
      top_product_image: string | null;
      top_product_orders: number;
    }>();
    for (const r of list) {
      const k = (r.category ?? '').trim();
      if (!k) continue;
      const entry = agg.get(k) ?? {
        count: 0,
        score_sum: 0,
        score_n: 0,
        price_sum: 0,
        price_n: 0,
        hot_count: 0,
        total_orders: 0,
        top_product_title: null,
        top_product_image: null,
        top_product_orders: 0,
      };
      entry.count += 1;
      if (r.winning_score != null) {
        entry.score_sum += Number(r.winning_score);
        entry.score_n += 1;
        if (Number(r.winning_score) >= 65) entry.hot_count += 1;
      }
      if (r.price_aud != null) {
        entry.price_sum += Number(r.price_aud);
        entry.price_n += 1;
      }
      const orders = r.sold_count ?? 0;
      entry.total_orders += orders;
      if (orders > entry.top_product_orders) {
        entry.top_product_orders = orders;
        entry.top_product_title = r.product_title;
        entry.top_product_image = r.image_url;
      }
      agg.set(k, entry);
    }
    const niches = Array.from(agg.entries())
      .map(([name, v]) => ({
        name,
        product_count: v.count,
        avg_score: v.score_n > 0 ? Math.round(v.score_sum / v.score_n) : null,
        hot_count: v.hot_count,
        total_orders: v.total_orders,
        avg_price: v.price_n > 0 ? Number((v.price_sum / v.price_n).toFixed(2)) : null,
        top_product: v.top_product_title
          ? { title: v.top_product_title, image: v.top_product_image, orders: v.top_product_orders }
          : null,
      }))
      .filter((n) => n.product_count >= 2)
      .sort((a, b) => b.product_count - a.product_count);
    return res.json({ niches, updatedAt: new Date().toISOString() });
  } catch (err: unknown) {
    console.error('[niches-overview]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── POST /api/products/snapshot ───────────────────────────────────────────
// Writes a daily snapshot of the top 500 products by sold_count to
// product_daily_snapshots. Gracefully no-ops if the table doesn't exist.
//
// SQL to create the table (run in Supabase SQL editor):
//   CREATE TABLE product_daily_snapshots (
//     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//     product_id text NOT NULL,
//     sold_count bigint,
//     winning_score numeric,
//     captured_at timestamptz DEFAULT now()
//   );
//   CREATE INDEX ON product_daily_snapshots(product_id, captured_at);
router.post('/snapshot', async (_req: Request, res: Response) => {
  try {
    const sb = getSupabase();
    const { data: top, error: fetchErr } = await sb
      .from('winning_products')
      .select('id,sold_count,winning_score')
      .order('sold_count', { ascending: false, nullsFirst: false })
      .limit(500);
    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    const rows = (top ?? []).map((r) => ({
      product_id: String((r as { id: unknown }).id),
      sold_count: (r as { sold_count: number | null }).sold_count,
      winning_score: (r as { winning_score: number | null }).winning_score,
    }));
    const { error: insertErr } = await sb.from('product_daily_snapshots').insert(rows);
    if (insertErr) {
      if (/does not exist|relation .* does not exist/i.test(insertErr.message)) {
        console.warn('[snapshot] product_daily_snapshots table missing — skipped');
        return res.json({ skipped: true, reason: 'table_missing', count: 0 });
      }
      return res.status(500).json({ error: insertErr.message });
    }
    return res.json({ ok: true, count: rows.length });
  } catch (err: unknown) {
    console.error('[snapshot]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── GET /api/products/:id/history?range=7|30|90 ──────────────────────────
// Returns the daily snapshot series for the Products detail drawer
// sparkline. Reads from product_history, populated by the
// /api/cron/snapshot-history cron. Empty array (not error) when no rows
// exist yet so the client can fall back to its interpolated series.
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const rawRange = String(req.query.range ?? '30');
    const range: 7 | 30 | 90 =
      rawRange === '7' ? 7 : rawRange === '90' ? 90 : 30;
    const sb = getSupabase();
    const cutoff = new Date(Date.now() - range * 86400000).toISOString();
    const { data, error } = await sb
      .from('product_history')
      .select('snapshot_at,sold_count,winning_score,velocity_7d')
      .eq('product_id', id)
      .gte('snapshot_at', cutoff)
      .order('snapshot_at', { ascending: true });
    if (error) {
      if (/does not exist|relation .* does not exist/i.test(error.message)) {
        return res.json({ series: [], range, tableReady: false });
      }
      return res.status(500).json({ error: error.message });
    }
    const series = (data ?? []).map((r) => {
      const row = r as {
        snapshot_at: string;
        sold_count: number | null;
        winning_score: number | null;
        velocity_7d: number | null;
      };
      return {
        ts: row.snapshot_at,
        sold_count: row.sold_count ?? 0,
        score: row.winning_score ?? 0,
        velocity_7d: row.velocity_7d ?? 0,
      };
    });
    return res.json({ series, range, tableReady: true });
  } catch (err: unknown) {
    console.error('[product-history]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── GET /api/products/opportunities ───────────────────────────────────────
// Three picks: highest sold_count, lowest price with score > 80 and sold > 1000,
// and newest by created_at. All from winning_products, no hardcoding.
router.get('/opportunities', cacheMiddleware(() => 'dashboard:opportunities', 600), async (_req: Request, res: Response) => {
  try {
    const sb = getSupabase();
    const [topRes, marginRes, newRes] = await Promise.all([
      sb.from('winning_products')
        .select('id, product_title, category, price_aud, sold_count, winning_score, image_url, aliexpress_url, created_at')
        .not('sold_count', 'is', null)
        .order('sold_count', { ascending: false })
        .limit(1),
      // Best Margin: highest-scored product in the $3–$12 range with
      // real demand. Sorted by score DESC (not price ASC) so the card
      // shows the best OPPORTUNITY, not the cheapest junk item.
      sb.from('winning_products')
        .select('id, product_title, category, price_aud, sold_count, winning_score, image_url, aliexpress_url, created_at')
        .gte('winning_score', 85)
        .gte('sold_count', 10000)
        .gte('price_aud', 3.00)
        .lte('price_aud', 12.00)
        .not('category', 'ilike', '%wig%')
        .not('category', 'ilike', '%hair%')
        .order('winning_score', { ascending: false, nullsFirst: false })
        .limit(1),
      sb.from('winning_products')
        .select('id, product_title, category, price_aud, sold_count, winning_score, image_url, aliexpress_url, created_at')
        .not('created_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);
    if (topRes.error)    return res.status(500).json({ error: topRes.error.message });
    if (marginRes.error) return res.status(500).json({ error: marginRes.error.message });
    if (newRes.error)    return res.status(500).json({ error: newRes.error.message });
    return res.json({
      top_trending: topRes.data?.[0] ?? null,
      best_margin:  marginRes.data?.[0] ?? null,
      newest:       newRes.data?.[0] ?? null,
    });
  } catch (err: unknown) {
    console.error('[opportunities]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── GET /api/products/radar ──────────────────────────────────────────────
// Success Radar — top 100 products ranked by sold_count, each row annotated
// with current rank, previous rank (from product_rank_snapshots), delta,
// and isNew flag. Writes a new snapshot asynchronously on every call so
// the "previous" view is always the last time someone loaded the page.
//
// REQUIRED TABLE (run once in Supabase SQL editor):
//   CREATE TABLE IF NOT EXISTS product_rank_snapshots (
//     product_id text PRIMARY KEY,
//     rank integer NOT NULL,
//     captured_at timestamptz NOT NULL DEFAULT now()
//   );
// If the table doesn't exist yet the endpoint degrades gracefully —
// every row is flagged isNew=true until the table is created.
router.get('/radar', cacheMiddleware(() => 'dashboard:radar', 600), async (_req: Request, res: Response) => {
  // Bulletproof: every sub-call gets its own try/catch so the endpoint
  // always returns 200 with a valid JSON body as long as Supabase is up.
  let current: Array<{
    id: string | number;
    product_title: string;
    category: string | null;
    price_aud: number | null;
    sold_count: number | null;
    winning_score: number | null;
    image_url: string | null;
    product_url: string | null;
    created_at: string;
    est_daily_revenue_aud: number | null;
  }> = [];

  try {
    const sb = getSupabase();
    // Use * select — named column list was returning empty on the deployed
    // Supabase JS version. Explicit column projection loses the rows for
    // reasons that aren't worth debugging when * costs nothing here.
    const result = await sb
      .from('winning_products')
      .select('*')
      .order('sold_count', { ascending: false, nullsFirst: false })
      .limit(100);
    if (result.error) {
      console.error('[radar] winning_products select error:', result.error.message);
    } else if (Array.isArray(result.data)) {
      current = result.data as typeof current;
    }
  } catch (e) {
    console.error('[radar] winning_products fetch failed:', e instanceof Error ? e.message : e);
  }

  // Try to read snapshots. Any failure → empty map, all products = NEW.
  const snapshotMap = new Map<string, number>();
  try {
    const sb = getSupabase();
    const snapRes = await sb
      .from('product_rank_snapshots')
      .select('product_id, rank');
    if (!snapRes.error && Array.isArray(snapRes.data)) {
      for (const row of snapRes.data as Array<{ product_id: string; rank: number }>) {
        snapshotMap.set(String(row.product_id), row.rank);
      }
    }
  } catch {
    // table doesn't exist — intentional noop
  }

  const ranked = current.map((p, i) => {
    const currentRank = i + 1;
    const prev = snapshotMap.get(String(p.id));
    return {
      ...p,
      currentRank,
      previousRank: prev ?? null,
      delta: prev != null ? prev - currentRank : null,
      isNew: prev == null,
    };
  });

  // Fire-and-forget snapshot write. Wrapped in its own try and a
  // .catch() on the promise so rejection can never propagate.
  if (ranked.length > 0) {
    try {
      const sb = getSupabase();
      const rows = ranked.map((r) => ({
        product_id: String(r.id),
        rank: r.currentRank,
        captured_at: new Date().toISOString(),
      }));
      void Promise.resolve(
        sb.from('product_rank_snapshots').upsert(rows, { onConflict: 'product_id' })
      ).catch(() => {});
    } catch {
      // ignore
    }
  }

  return res.status(200).json({ ranked, updatedAt: new Date().toISOString() });
});

// ── GET /api/products/tab-counts ──────────────────────────────────────────
// Returns exact server-side COUNT(*) totals for each Products-page tab so
// the badge numbers on the UI match the real table size instead of
// whatever slice the paginated useProducts() call happens to have loaded.
router.get('/tab-counts', cacheMiddleware(() => 'dashboard:tab-counts', 600), async (_req: Request, res: Response) => {
  try {
    const sb = getSupabase();
    // Tab criteria — must match the client-side useProducts tab branch
    // exactly so badge counts equal the actual rendered result count.
    const fourteen = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      allRes, newRes, trendingRes, highMarginRes, topRes,
      hotNowRes, highVolumeRes, under10Res,
    ] = await Promise.all([
      sb.from('winning_products').select('*', { count: 'exact', head: true }),
      // New: added in the last 14 days
      sb.from('winning_products').select('*', { count: 'exact', head: true }).gte('created_at', fourteen),
      // Trending: added in the last 30 days AND score >= 75
      sb.from('winning_products').select('*', { count: 'exact', head: true }).gte('created_at', thirty).gte('winning_score', 75),
      // High Profit: $1-$12 cost, score >= 80, >= 5K orders
      sb.from('winning_products').select('*', { count: 'exact', head: true }).gte('price_aud', 1).lte('price_aud', 12).gte('winning_score', 80).gte('sold_count', 5000),
      // Score 90+
      sb.from('winning_products').select('*', { count: 'exact', head: true }).gte('winning_score', 90),
      // Hot Now: score >= 90 AND >= 80K orders (no date gate)
      sb.from('winning_products').select('*', { count: 'exact', head: true }).gte('winning_score', 90).gte('sold_count', 80000),
      // High Volume: >= 150K orders
      sb.from('winning_products').select('*', { count: 'exact', head: true }).gte('sold_count', 150000),
      // Under $10: < $10, score >= 70, >= 5K orders
      sb.from('winning_products').select('*', { count: 'exact', head: true }).lt('price_aud', 10).gte('winning_score', 70).gte('sold_count', 5000),
    ]);

    return res.json({
      all:            allRes.count ?? 0,
      recentlyAdded:  newRes.count ?? 0,
      trending:       trendingRes.count ?? 0,
      highMargin:     highMarginRes.count ?? 0,
      score90:        topRes.count ?? 0,
      hotNow:         hotNowRes.count ?? 0,
      highVolume:     highVolumeRes.count ?? 0,
      under10:        under10Res.count ?? 0,
    });
  } catch (err: unknown) {
    console.error('[tab-counts]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── GET /api/products/list ────────────────────────────────────────────────
// Upgraded list endpoint with market/category/score/min-orders filters +
// flagship bucket. Flagship rule: products with 100k+ orders ALWAYS appear
// first, regardless of the user's sort choice. Returns { flagship, list }
// with `is_flagship` boolean on each row so the client can render the
// flagship strip above the main grid.
//
// Query params:
//   market:    'AU' | 'US' | 'UK' | 'all'   — default 'all' (filter by
//              ships_to_* column only applied when present; 'all' no-op)
//   category:  free-text (ilike match), optional
//   minScore:  0-100, optional
//   minOrders: >= N, optional
//   sort:      'orders_desc' | 'velocity_desc' | 'score_desc' | 'newest'
//              default 'orders_desc'
//   limit:     default 100, max 500
//   offset:    default 0
router.get('/list', async (req: Request, res: Response) => {
  try {
    const market = String(req.query.market || 'all').toUpperCase();
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const minScore = Number(req.query.minScore) || 0;
    const minOrders = Number(req.query.minOrders) || 0;
    const sort = String(req.query.sort || 'orders_desc');
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const FLAGSHIP_THRESHOLD = 100_000;
    const sb = getSupabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFilters = (q: any): any => {
      let out = q.not('image_url', 'is', null).gt('price_aud', 0);
      if (minScore > 0) out = out.gte('winning_score', minScore);
      if (minOrders > 0) out = out.gte('sold_count', minOrders);
      if (category) out = out.ilike('category', `%${category}%`);
      // Market filter — 'all' is a no-op. AU/US/UK would require a
      // `ships_to_*` column per market; we only filter when the DB
      // exposes those columns, which is not guaranteed everywhere. Left
      // as a soft no-op for now so the endpoint never returns 0 rows
      // due to a missing column.
      void market;
      return out;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applySort = (q: any): any => {
      switch (sort) {
        case 'score_desc':
          return q.order('winning_score', { ascending: false, nullsFirst: false })
                  .order('sold_count', { ascending: false, nullsFirst: false });
        case 'newest':
          return q.order('created_at', { ascending: false, nullsFirst: false });
        case 'velocity_desc':
          return q.order('est_daily_revenue_aud', { ascending: false, nullsFirst: false })
                  .order('sold_count', { ascending: false, nullsFirst: false });
        case 'orders_desc':
        default:
          return q.order('sold_count', { ascending: false, nullsFirst: false });
      }
    };

    // Bucket 1 — flagship (always ordered by sold_count DESC, ignores sort)
    const flagshipQ = applyFilters(
      sb.from('winning_products').select('*').gte('sold_count', FLAGSHIP_THRESHOLD),
    ).order('sold_count', { ascending: false, nullsFirst: false }).limit(50);

    // Bucket 2 — remainder (user sort applied)
    const remainderQ = applySort(
      applyFilters(
        sb.from('winning_products').select('*', { count: 'exact' }).lt('sold_count', FLAGSHIP_THRESHOLD),
      ),
    ).range(offset, offset + limit - 1);

    const [flagshipRes, remainderRes] = await Promise.all([flagshipQ, remainderQ]);

    if (flagshipRes.error) return res.status(500).json({ error: flagshipRes.error.message });
    if (remainderRes.error) return res.status(500).json({ error: remainderRes.error.message });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flagship = (flagshipRes.data || []).map((r: any) => ({ ...r, is_flagship: true }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = (remainderRes.data || []).map((r: any) => ({ ...r, is_flagship: false }));

    return res.json({
      flagship,
      list,
      total: (remainderRes.count ?? 0) + flagship.length,
      limit,
      offset,
      market,
      category: category || null,
      minScore,
      minOrders,
      sort,
    });
  } catch (err: unknown) {
    console.error('[products/list]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── GET /api/products/ae-live-search — direct AliExpress Affiliate API search ──
// Layer 2 of the hybrid pipeline: unfiltered live results from AE Affiliate API.
// Public endpoint (no auth) — read-only, no DB writes, no scoring.
router.get('/ae-live-search', aeSearchLimiter, async (req: Request, res: Response) => {
  const {
    q = '',
    page = '1',
    pageSize = '20',
    sort = 'LAST_VOLUME_DESC',
    minPrice,
    maxPrice,
    categoryId,
  } = req.query as Record<string, string>;

  const keywords = (q || '').trim();
  if (!keywords || keywords.length < 2) {
    res.status(400).json({ error: 'Query parameter q is required (min 2 chars)', products: [], total_count: 0 });
    return;
  }

  const pageNo = Math.max(1, parseInt(page) || 1);
  const psize = Math.min(50, Math.max(1, parseInt(pageSize) || 20));

  try {
    const data = await searchAffiliateProducts({
      keywords,
      pageNo,
      pageSize: psize,
      sortBy: sort,
      categoryId: categoryId || undefined,
    });

    const result = data?.aliexpress_affiliate_product_query_response?.resp_result;
    if (!result || result.resp_code !== 200) {
      console.warn('[ae-live-search] upstream error:', result?.resp_msg);
      res.json({
        success: false,
        products: [],
        total_count: 0,
        current_page: pageNo,
        page_size: psize,
        has_more: false,
        upstream_error: result?.resp_msg || 'AE API returned no result',
      });
      return;
    }

    const rawProducts = result.result?.products?.product || [];
    const minP = minPrice ? parseFloat(minPrice) : null;
    const maxP = maxPrice ? parseFloat(maxPrice) : null;

    const products = rawProducts.map((p: Record<string, unknown>) => {
      const priceStr = String(p.target_sale_price ?? p.sale_price ?? '0');
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      return {
        id: String(p.product_id ?? ''),
        product_title: String(p.product_title ?? ''),
        image_url: (p.product_main_image_url as string) || null,
        price_aud: price,
        original_price: parseFloat(String(p.target_original_price ?? p.original_price ?? '0').replace(/[^0-9.]/g, '')) || null,
        sold_count: parseInt(String(p.lastest_volume ?? '0')) || 0,
        category: (p.second_level_category_name as string) || (p.first_level_category_name as string) || null,
        product_url: (p.product_detail_url as string) || (p.promotion_link as string) || null,
        commission_rate: (p.commission_rate as string) || null,
        evaluate_rate: (p.evaluate_rate as string) || null,
        platform: 'aliexpress',
        source: 'aliexpress_live' as const,
        winning_score: null,
      };
    }).filter((p: { price_aud: number }) =>
      (minP == null || p.price_aud >= minP) &&
      (maxP == null || p.price_aud <= maxP)
    );

    // Orders-first ordering: rows with a real sold_count come first (DESC),
    // rows with 0/missing orders are pushed to the bottom instead of being
    // mixed in by the upstream's default ranking.
    products.sort((a: { sold_count: number }, b: { sold_count: number }) => {
      const av = a.sold_count > 0 ? 1 : 0;
      const bv = b.sold_count > 0 ? 1 : 0;
      if (av !== bv) return bv - av;
      return (b.sold_count || 0) - (a.sold_count || 0);
    });

    const totalCount = result.result?.total_record_count || products.length;

    res.json({
      success: true,
      products,
      total_count: totalCount,
      current_page: pageNo,
      page_size: psize,
      has_more: totalCount > pageNo * psize && rawProducts.length === psize,
    });
  } catch (err: unknown) {
    console.error('[ae-live-search] error:', err);
    res.status(500).json({
      error: 'Search failed',
      message: err instanceof Error ? err.message : String(err),
      products: [],
      total_count: 0,
    });
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
    const msg = await callClaude({
      feature: 'why_trending_brief',
      userId: (req as any).user?.userId,
      maxTokens: 200,
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

// ── Analytics endpoints ──────────────────────────────────────────────────
router.get('/analytics-overview', async (_req: Request, res: Response) => {
  try {
    const sb = getSupabase();
    const [total, score90, week] = await Promise.all([
      sb.from('winning_products').select('*', { count: 'exact', head: true }),
      sb.from('winning_products').select('*', { count: 'exact', head: true }).gte('winning_score', 90),
      sb.from('winning_products').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);
    return res.json({ total: total.count ?? 0, score90: score90.count ?? 0, newThisWeek: week.count ?? 0 });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.get('/analytics-categories', async (_req: Request, res: Response) => {
  try {
    const sb = getSupabase();
    type Row = { category: string | null };
    const list: Row[] = [];
    let from = 0;
    const PAGE = 1000;
    while (from < 20000) {
      const { data, error } = await sb.from('winning_products').select('category').not('category', 'is', null).range(from, from + PAGE - 1);
      if (error) return res.status(500).json({ error: error.message });
      list.push(...((data ?? []) as Row[]));
      if ((data ?? []).length < PAGE) break;
      from += PAGE;
    }
    const counts: Record<string, number> = {};
    for (const r of list) { const c = (r.category ?? '').trim(); if (c) counts[c] = (counts[c] ?? 0) + 1; }
    const categories = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([category, count]) => ({ category, count }));
    return res.json({ categories });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Wave 3 — Products page 3-tab split (Trending / Hot / High Volume)
// Each endpoint uses distinct SQL and supports filters: market, category,
// minOrders, minScore. Results capped at 50. Trending ids are returned with
// Hot/High-Volume responses so the client can dedup.
// ═══════════════════════════════════════════════════════════════════════════

interface ProductsTabFilters {
  market: string;        // 'AU' | 'US' | 'UK' | 'all'
  category: string;      // empty = no filter
  minOrders: number;     // 0 = no filter
  minScore: number;      // 0 = no filter
}

function parseTabFilters(req: Request): ProductsTabFilters {
  return {
    market: String(req.query.market || 'all').toUpperCase(),
    category: typeof req.query.category === 'string' ? req.query.category.trim() : '',
    minOrders: Number(req.query.minOrders) || 0,
    minScore: Number(req.query.minScore) || 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTabFilters(q: any, f: ProductsTabFilters): any {
  let out = q.not('image_url', 'is', null).gt('price_aud', 0);
  if (f.minOrders > 0) out = out.gte('sold_count', f.minOrders);
  if (f.minScore > 0) out = out.gte('winning_score', f.minScore);
  if (f.category) out = out.ilike('category', `%${f.category}%`);
  // Market filter is a soft no-op unless ships_to_* columns exist. Left
  // here as a sentinel so we can wire it up once the columns are live.
  void f.market;
  return out;
}

const TAB_LIMIT = 50;
const TAB_CACHE_TTL_SEC = 120; // 2min SWR cache

// ── GET /api/products/trending — 24h/7d velocity leaders ────────────────────
// Ordered by velocity_7d DESC. Falls back to empty with meta.insufficientData
// when the velocity_7d column has no rows above 0 across the filtered set.
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const filters = parseTabFilters(req);
    const sb = getSupabase();

    const base = applyTabFilters(
      sb.from('winning_products').select('*').gt('velocity_7d', 0),
      filters,
    )
      .order('velocity_7d', { ascending: false, nullsFirst: false })
      .order('sold_count', { ascending: false, nullsFirst: false })
      .limit(TAB_LIMIT);

    const { data, error } = await base;
    if (error) return res.status(500).json({ error: error.message });

    const products = data ?? [];
    res.set('Cache-Control', `public, s-maxage=${TAB_CACHE_TTL_SEC}, stale-while-revalidate=600`);
    return res.json({
      products,
      count: products.length,
      tab: 'trending',
      insufficientData: products.length === 0,
    });
  } catch (err: unknown) {
    console.error('[products/trending]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// ── GET /api/products/hot — new 48h discoveries ─────────────────────────────
// WHERE created_at >= NOW() - 48h ORDER BY sold_count DESC. We also exclude
// any id in the current Trending slice so the tabs never overlap.
router.get('/hot', async (req: Request, res: Response) => {
  try {
    const filters = parseTabFilters(req);
    const sb = getSupabase();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Compute trending ids with the same filter envelope to dedup.
    const trendingQ = applyTabFilters(
      sb.from('winning_products').select('id').gt('velocity_7d', 0),
      filters,
    )
      .order('velocity_7d', { ascending: false, nullsFirst: false })
      .limit(TAB_LIMIT);

    const { data: trendingRows } = await trendingQ;
    const trendingIds = (trendingRows ?? []).map((r: { id: number | string }) => r.id);

    let hotQ = applyTabFilters(
      sb.from('winning_products').select('*').gte('created_at', cutoff),
      filters,
    );
    if (trendingIds.length > 0) {
      hotQ = hotQ.not('id', 'in', `(${trendingIds.map(String).join(',')})`);
    }
    hotQ = hotQ
      .order('sold_count', { ascending: false, nullsFirst: false })
      .limit(TAB_LIMIT);

    const { data, error } = await hotQ;
    if (error) return res.status(500).json({ error: error.message });

    const products = data ?? [];
    res.set('Cache-Control', `public, s-maxage=${TAB_CACHE_TTL_SEC}, stale-while-revalidate=600`);
    return res.json({
      products,
      count: products.length,
      tab: 'hot',
      excludedIds: trendingIds,
      windowHours: 48,
    });
  } catch (err: unknown) {
    console.error('[products/hot]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// ── GET /api/products/high-volume — evergreen all-time ──────────────────────
// Ordered by sold_count DESC, EXCLUDING ids already in Trending.
router.get('/high-volume', async (req: Request, res: Response) => {
  try {
    const filters = parseTabFilters(req);
    const sb = getSupabase();

    const trendingQ = applyTabFilters(
      sb.from('winning_products').select('id').gt('velocity_7d', 0),
      filters,
    )
      .order('velocity_7d', { ascending: false, nullsFirst: false })
      .limit(TAB_LIMIT);

    const { data: trendingRows } = await trendingQ;
    const trendingIds = (trendingRows ?? []).map((r: { id: number | string }) => r.id);

    let hvQ = applyTabFilters(
      sb.from('winning_products').select('*').gt('sold_count', 0),
      filters,
    );
    if (trendingIds.length > 0) {
      hvQ = hvQ.not('id', 'in', `(${trendingIds.map(String).join(',')})`);
    }
    hvQ = hvQ
      .order('sold_count', { ascending: false, nullsFirst: false })
      .limit(TAB_LIMIT);

    const { data, error } = await hvQ;
    if (error) return res.status(500).json({ error: error.message });

    const products = data ?? [];
    res.set('Cache-Control', `public, s-maxage=${TAB_CACHE_TTL_SEC}, stale-while-revalidate=600`);
    return res.json({
      products,
      count: products.length,
      tab: 'high-volume',
      excludedIds: trendingIds,
    });
  } catch (err: unknown) {
    console.error('[products/high-volume]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default router;

// Legacy /api/products/cj endpoint — CJ pipeline purged. Returns empty list
// so existing clients don't crash during rollout.
router.get('/cj', async (_req: Request, res: Response) => {
  res.set('Cache-Control', 'public, s-maxage=3600');
  res.json({ products: [], count: 0, source: 'removed' });
});
