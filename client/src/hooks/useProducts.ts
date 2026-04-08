import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Module-level query cache. Shared across every `useProducts` /
// `useProductStats` consumer in the session so navigating between pages
// doesn't refetch. 5-minute TTL strikes the right balance between fresh
// data and Supabase quota.
const QUERY_CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

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

export type OrderByColumn = 'sold_count' | 'winning_score' | 'created_at' | 'est_daily_revenue_aud' | 'price_asc';

export interface UseProductsOptions {
  limit?: number;
  orderBy?: OrderByColumn;
  minScore?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minOrders?: number;
}

export interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  total: number;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const { limit = 20, orderBy = 'sold_count', minScore, category, minPrice, maxPrice, minOrders } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cacheKey = `products:${orderBy}:${limit}:${minScore ?? ''}:${category ?? ''}:${minPrice ?? ''}:${maxPrice ?? ''}:${minOrders ?? ''}`;
      const cached = cacheGet<{ products: Product[]; total: number }>(cacheKey);
      if (cached) {
        setProducts(cached.products);
        setTotal(cached.total);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('winning_products')
          .select('*', { count: 'exact' });

        if (orderBy === 'price_asc') {
          query = query.order('price_aud', { ascending: true, nullsFirst: false });
        } else {
          query = query.order(orderBy, { ascending: false, nullsFirst: false });
        }
        query = query.limit(limit);

        if (typeof minScore === 'number') query = query.gte('winning_score', minScore);
        if (category) query = query.eq('category', category);
        if (typeof minPrice === 'number') query = query.gte('price_aud', minPrice);
        if (typeof maxPrice === 'number') query = query.lte('price_aud', maxPrice);
        if (typeof minOrders === 'number') query = query.gte('sold_count', minOrders);

        const { data, error: err, count } = await query;
        if (cancelled) return;
        if (err) throw err;
        const productsOut = (data ?? []) as Product[];
        const totalOut = count ?? 0;
        setProducts(productsOut);
        setTotal(totalOut);
        cacheSet(`products:${orderBy}:${limit}:${minScore ?? ''}:${category ?? ''}:${minPrice ?? ''}:${maxPrice ?? ''}:${minOrders ?? ''}`, { products: productsOut, total: totalOut });
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
  }, [limit, orderBy, minScore, category, minPrice, maxPrice, minOrders]);

  return { products, loading, error, total };
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
        console.warn('[useProductStats] paginated fetch failed, falling back to HEAD count:', e);
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
          console.warn('[useProductStats] fallback also failed:', fallbackErr);
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
