import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

export type OrderByColumn = 'sold_count' | 'winning_score' | 'created_at' | 'est_daily_revenue_aud';

export interface UseProductsOptions {
  limit?: number;
  orderBy?: OrderByColumn;
  minScore?: number;
  category?: string;
}

export interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  total: number;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const { limit = 20, orderBy = 'sold_count', minScore, category } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('winning_products')
          .select('*', { count: 'exact' })
          .order(orderBy, { ascending: false, nullsFirst: false })
          .limit(limit);

        if (typeof minScore === 'number') query = query.gte('winning_score', minScore);
        if (category) query = query.eq('category', category);

        const { data, error: err, count } = await query;
        if (cancelled) return;
        if (err) throw err;
        setProducts((data ?? []) as Product[]);
        setTotal(count ?? 0);
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
  }, [limit, orderBy, minScore, category]);

  return { products, loading, error, total };
}

export interface ProductStats {
  total: number;
  maxOrders: number;
  avgScore: number;
  hotCount: number;
  bySource: Record<string, number>;
  loading: boolean;
  error: string | null;
}

export function useProductStats(): ProductStats {
  const [stats, setStats] = useState<ProductStats>({
    total: 0, maxOrders: 0, avgScore: 0, hotCount: 0, bySource: {}, loading: true, error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { count: total } = await supabase
          .from('winning_products')
          .select('*', { count: 'exact', head: true });

        const { data: rows, error: rowsErr } = await supabase
          .from('winning_products')
          .select('sold_count,winning_score,platform')
          .limit(2500);
        if (rowsErr) throw rowsErr;

        const list = (rows ?? []) as Array<{ sold_count: number | null; winning_score: number | null; platform: string | null }>;
        const maxOrders = list.reduce((m, r) => Math.max(m, r.sold_count ?? 0), 0);
        const scoreList = list.map((r) => r.winning_score ?? 0).filter((n) => n > 0);
        const avgScore = scoreList.length ? Math.round(scoreList.reduce((a, b) => a + b, 0) / scoreList.length) : 0;
        const hotCount = list.filter((r) => (r.winning_score ?? 0) >= 65).length;
        const bySource: Record<string, number> = {};
        for (const r of list) {
          const k = (r.platform ?? 'unknown').toLowerCase();
          bySource[k] = (bySource[k] ?? 0) + 1;
        }
        if (!cancelled) {
          setStats({
            total: total ?? list.length,
            maxOrders,
            avgScore,
            hotCount,
            bySource,
            loading: false,
            error: null,
          });
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setStats((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Failed to load stats' }));
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return stats;
}
