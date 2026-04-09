import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Module-level query cache. Shared across every `useProducts` /
// `useProductStats` consumer in the session so navigating between pages
// doesn't refetch. 5-minute TTL strikes the right balance between fresh
// data and Supabase quota. Capped at 20 entries — when full, the oldest
// entry (lowest timestamp) is evicted before insertion.
const QUERY_CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 20;

function cacheGet<T>(key: string): T | null {
  const entry = QUERY_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    QUERY_CACHE.delete(key);
    return null;
  }
  return entry.data as T;
}
function cacheSet(key: string, data: unknown): void {
  if (QUERY_CACHE.size >= MAX_CACHE_ENTRIES && !QUERY_CACHE.has(key)) {
    let oldestKey: string | null = null;
    let oldestTs = Infinity;
    for (const [k, v] of QUERY_CACHE) {
      if (v.timestamp < oldestTs) { oldestTs = v.timestamp; oldestKey = k; }
    }
    if (oldestKey) QUERY_CACHE.delete(oldestKey);
  }
  QUERY_CACHE.set(key, { data, timestamp: Date.now() });
}
export function invalidateProductsCache(): void {
  QUERY_CACHE.clear();
}

// ── Real schema (verified against server/lib/migrate-winning-products.ts) ──
// The DB does NOT have an `is_active` column. Active = all rows in the table.
export interface Product {
  id: number | string;
  product_title: string;
  category: string | null;
  platform: string | null;
  price_aud: number | null;
  sold_count: number | null;
  winning_score: number | null;
  trend: string | null;
  est_daily_revenue_aud: number | null;
  image_url: string | null;
  product_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export type OrderByColumn =
  | 'sold_count'
  | 'winning_score'
  | 'created_at'
  | 'est_daily_revenue_aud'
  | 'price_asc'
  | 'price_desc'
  | 'orders_asc'
  | 'velocity';

export type SmartTabKey = 'all' | 'new' | 'trending' | 'highmargin' | 'top' | 'hot-now' | 'high-volume' | 'under-10';

export interface UseProductsOptions {
  limit?: number;
  orderBy?: OrderByColumn;
  minScore?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minOrders?: number;
  maxOrders?: number;
  tab?: SmartTabKey;
  /** Case-insensitive keyword search on product_title. */
  searchQuery?: string;
}

export interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  total: number;
  cached: boolean;
}

// Loose typing — Supabase's PostgrestFilterBuilder generics are project-internal
// and not stable enough to round-trip through a helper. Trust that callers
// always pass a builder that supports `.order()`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyOrder(query: any, orderBy: OrderByColumn): any {
  switch (orderBy) {
    case 'price_asc':
      return query.order('price_aud', { ascending: true, nullsFirst: false });
    case 'price_desc':
      return query.order('price_aud', { ascending: false, nullsFirst: false });
    case 'orders_asc':
      return query.order('sold_count', { ascending: true, nullsFirst: false });
    case 'created_at':
      return query.order('created_at', { ascending: false, nullsFirst: false });
    case 'winning_score':
      return query.order('winning_score', { ascending: false, nullsFirst: false })
                  .order('sold_count', { ascending: false, nullsFirst: false });
    default:
      return query.order('sold_count', { ascending: false, nullsFirst: false });
  }
}

export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const { limit = 20, orderBy = 'sold_count', minScore, category, minPrice, maxPrice, minOrders, maxOrders, tab = 'all', searchQuery } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cacheKey = `products:${tab}:${orderBy}:${limit}:${minScore ?? ''}:${category ?? ''}:${minPrice ?? ''}:${maxPrice ?? ''}:${minOrders ?? ''}:${maxOrders ?? ''}:${searchQuery ?? ''}`;
      const hit = cacheGet<{ products: Product[]; total: number }>(cacheKey);
      if (hit) {
        setProducts(hit.products);
        setTotal(hit.total);
        setCached(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setCached(false);
      setError(null);
      try {
        const baseSelect = () =>
          supabase.from('winning_products').select('*', { count: 'exact' });

        // Build the query with tab-specific server-side filters applied first.
        let query = baseSelect();

        // ── Tab filters (server-side) ────────────────────────────────────
        // Each curated tab has its own hardcoded criteria. Products.tsx
        // strips user filter state when not on the All Products tab so
        // these queries are stable and never bleed into one another.
        if (tab === 'new') {
          // New: added in the last 14 days (per spec). 7d was too tight
          // for the current refresh cadence.
          const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('created_at', cutoff);
          query = query.order('created_at', { ascending: false, nullsFirst: false });
        } else if (tab === 'trending') {
          // Trending: added in the last 30 days AND already gaining
          // traction (score >= 75). Recently-added winners.
          const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('created_at', cutoff).gte('winning_score', 75);
          query = query.order('sold_count', { ascending: false, nullsFirst: false });
        } else if (tab === 'highmargin') {
          // High Profit: $1-$12 cost, score >= 80, >= 5k orders.
          // Sorted by winning_score (proxy for margin × score quality).
          query = query.gte('price_aud', 1).lte('price_aud', 12).gte('winning_score', 80).gte('sold_count', 5000);
          query = query.order('winning_score', { ascending: false, nullsFirst: false });
        } else if (tab === 'top') {
          // Score 90+: only the AI-top-rated products
          query = query.gte('winning_score', 90);
          query = query
            .order('winning_score', { ascending: false, nullsFirst: false })
            .order('sold_count', { ascending: false, nullsFirst: false });
        } else if (tab === 'hot-now') {
          // Hot Now: highest AI scores AND proven volume. No date gate —
          // a 6-month-old product still selling 200k/month is "hot now".
          query = query.gte('winning_score', 90).gte('sold_count', 80000);
          query = query.order('sold_count', { ascending: false, nullsFirst: false });
        } else if (tab === 'high-volume') {
          // High Volume: the highest-order products in the entire DB
          query = query.gte('sold_count', 150000);
          query = query.order('sold_count', { ascending: false, nullsFirst: false });
        } else if (tab === 'under-10') {
          // Under $10: budget mass-market with proven demand
          query = query.lt('price_aud', 10).gte('winning_score', 70).gte('sold_count', 5000);
          query = query.order('sold_count', { ascending: false, nullsFirst: false });
        } else {
          query = applyOrder(query, orderBy);
        }

        // ── Generic filters ──────────────────────────────────────────────
        if (typeof minScore === 'number') query = query.gte('winning_score', minScore);
        // Case-insensitive match so chip click + dropdown casing both work
        if (category) query = query.ilike('category', category);
        if (typeof minPrice === 'number') query = query.gte('price_aud', minPrice);
        if (typeof maxPrice === 'number') query = query.lte('price_aud', maxPrice);
        if (typeof minOrders === 'number') query = query.gte('sold_count', minOrders);
        if (typeof maxOrders === 'number') query = query.lte('sold_count', maxOrders);
        if (searchQuery && searchQuery.trim().length > 0) {
          query = query.ilike('product_title', `%${searchQuery.trim()}%`);
        }

        query = query.limit(limit);

        let { data, error: err, count } = await query;

        // Helper: re-apply the stackable filters (category, price, orders,
        // score, searchQuery) to a fallback query so tab fallbacks don't
        // silently drop the user's other filters.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function applyStackable(q: any): any {
          if (typeof minScore === 'number') q = q.gte('winning_score', minScore);
          if (category) q = q.ilike('category', category);
          if (typeof minPrice === 'number') q = q.gte('price_aud', minPrice);
          if (typeof maxPrice === 'number') q = q.lte('price_aud', maxPrice);
          if (typeof minOrders === 'number') q = q.gte('sold_count', minOrders);
          if (typeof maxOrders === 'number') q = q.lte('sold_count', maxOrders);
          if (searchQuery && searchQuery.trim().length > 0) {
            q = q.ilike('product_title', `%${searchQuery.trim()}%`);
          }
          return q;
        }

        // Fallback for Trending: if 50k + score≥80 yields <10, relax score gate first
        if (!err && tab === 'trending' && (data ?? []).length < 10) {
          let fb = baseSelect().gt('sold_count', 50000);
          fb = applyStackable(fb);
          fb = applyOrder(fb, 'sold_count').limit(limit);
          const r = await fb;
          if (!r.error) { data = r.data; count = r.count; }
        }

        // Fallback for New: if <5 results, fetch the 20 most recent products
        if (!err && tab === 'new' && (data ?? []).length < 5) {
          let fb = baseSelect()
            .order('created_at', { ascending: false, nullsFirst: false });
          fb = applyStackable(fb).limit(20);
          const r = await fb;
          if (!r.error) { data = r.data; count = r.count; }
        }

        // Fallback for Hot Now: if strict 90+/100k+/30d yields too few,
        // relax to score >= 85 + sold_count > 50k (no date gate)
        if (!err && tab === 'hot-now' && (data ?? []).length < 5) {
          let fb = baseSelect().gte('winning_score', 85).gt('sold_count', 50000);
          fb = applyStackable(fb).order('sold_count', { ascending: false, nullsFirst: false }).limit(limit);
          const r = await fb;
          if (!r.error) { data = r.data; count = r.count; }
        }

        // Fallback for High Volume: if <5 results with 100k threshold, drop to 20k
        if (!err && tab === 'high-volume' && (data ?? []).length < 5) {
          let fb = baseSelect().gt('sold_count', 20000);
          fb = applyStackable(fb).order('sold_count', { ascending: false, nullsFirst: false }).limit(limit);
          const r = await fb;
          if (!r.error) { data = r.data; count = r.count; }
        }

        if (cancelled) return;
        if (err) throw err;
        const productsOut = (data ?? []) as Product[];
        const totalOut = count ?? 0;
        setProducts(productsOut);
        setTotal(totalOut);
        cacheSet(cacheKey, { products: productsOut, total: totalOut });
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load products');
        setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [limit, orderBy, minScore, category, minPrice, maxPrice, minOrders, maxOrders, tab, searchQuery]);

  return { products, loading, error, total, cached };
}

export interface ProductStats {
  total: number;
  maxOrders: number;
  avgScore: number;
  hotCount: number;
  topScore: number;
  highScoreCount: number;
  eliteCount: number;
  categoryCount: number;
  bySource: Record<string, number>;
  loading: boolean;
  error: string | null;
}

export function useProductStats(): ProductStats {
  const [stats, setStats] = useState<ProductStats>({
    total: 0, maxOrders: 0, avgScore: 0, hotCount: 0, topScore: 0,
    highScoreCount: 0, eliteCount: 0, categoryCount: 0,
    bySource: {}, loading: true, error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cached = cacheGet<ProductStats>('stats:all');
      if (cached) {
        setStats({ ...cached, loading: false });
        return;
      }
      try {
        // Supabase REST default max_rows=1000, so .limit(3000) silently caps
        // at 1000. Paginate via .range() to fetch the full table for accurate
        // hotCount / eliteCount / categoryCount aggregations.
        type StatsRow = { sold_count: number | null; winning_score: number | null; platform: string | null; category: string | null };
        const list: StatsRow[] = [];
        const PAGE = 1000;
        let from = 0;
        while (from < 10000) {
          const { data, error: pageErr } = await supabase
            .from('winning_products')
            .select('sold_count,winning_score,platform,category')
            .range(from, from + PAGE - 1);
          if (pageErr) throw pageErr;
          const batch = (data ?? []) as StatsRow[];
          list.push(...batch);
          if (batch.length < PAGE) break;
          from += PAGE;
        }
        const total = list.length;
        const categoryCount = new Set(list.map((r) => r.category).filter((c): c is string => typeof c === 'string' && c.trim().length > 0)).size;
        const maxOrders = list.reduce((m, r) => Math.max(m, r.sold_count ?? 0), 0);
        const scoreList = list.map((r) => r.winning_score ?? 0).filter((n) => n > 0);
        const avgScore = scoreList.length ? Math.round(scoreList.reduce((a, b) => a + b, 0) / scoreList.length) : 0;
        const topScore = scoreList.length ? Math.max(...scoreList) : 0;
        const hotCount = list.filter((r) => (r.winning_score ?? 0) >= 65).length;
        const highScoreCount = list.filter((r) => (r.winning_score ?? 0) >= 80).length;
        const eliteCount = list.filter((r) => (r.winning_score ?? 0) >= 90).length;
        const bySource: Record<string, number> = {};
        for (const r of list) {
          const k = (r.platform ?? 'unknown').toLowerCase();
          bySource[k] = (bySource[k] ?? 0) + 1;
        }
        const statsOut: ProductStats = {
          total, maxOrders, avgScore, hotCount, topScore,
          highScoreCount, eliteCount, categoryCount, bySource,
          loading: false, error: null,
        };
        cacheSet('stats:all', statsOut);
        if (!cancelled) setStats(statsOut);
      } catch (e: unknown) {
        // Fallback: HEAD count query so at least `total` is populated
        try {
          const { count } = await supabase
            .from('winning_products')
            .select('*', { count: 'exact', head: true });
          if (!cancelled) {
            setStats((s) => ({
              ...s,
              total: count ?? 0,
              loading: false,
              error: e instanceof Error ? e.message : 'Failed to load stats',
            }));
          }
        } catch (fallbackErr) {
          if (!cancelled) {
            setStats((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Failed to load stats' }));
          }
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return stats;
}
