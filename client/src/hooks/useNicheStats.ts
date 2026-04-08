import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface NicheStat {
  name: string;
  count: number;
  avgScore: number;
  totalOrders: number;
  avgPrice: number;
}

export interface UseNicheStatsResult {
  niches: NicheStat[];
  loading: boolean;
  error: string | null;
}

export function useNicheStats(limit: number = 12): UseNicheStatsResult {
  const [niches, setNiches] = useState<NicheStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Paginated fetch — Supabase default max_rows=1000
        type Row = { category: string | null; winning_score: number | null; sold_count: number | null; price_aud: number | null };
        const list: Row[] = [];
        const PAGE = 1000;
        let from = 0;
        while (from < 10000) {
          const { data, error: pageErr } = await supabase
            .from('winning_products')
            .select('category, winning_score, sold_count, price_aud')
            .not('category', 'is', null)
            .range(from, from + PAGE - 1);
          if (pageErr) throw pageErr;
          const batch = (data ?? []) as Row[];
          list.push(...batch);
          if (batch.length < PAGE) break;
          from += PAGE;
        }

        const grouped: Record<string, { count: number; totalScore: number; totalOrders: number; totalPrice: number; priceCount: number }> = {};
        for (const row of list) {
          const cat = row.category;
          if (!cat) continue;
          if (!grouped[cat]) grouped[cat] = { count: 0, totalScore: 0, totalOrders: 0, totalPrice: 0, priceCount: 0 };
          grouped[cat].count++;
          grouped[cat].totalScore += row.winning_score ?? 0;
          grouped[cat].totalOrders += row.sold_count ?? 0;
          if (row.price_aud != null) {
            grouped[cat].totalPrice += Number(row.price_aud);
            grouped[cat].priceCount++;
          }
        }

        const result: NicheStat[] = Object.entries(grouped)
          .map(([name, g]) => ({
            name,
            count: g.count,
            avgScore: g.count > 0 ? Math.round(g.totalScore / g.count) : 0,
            totalOrders: g.totalOrders,
            avgPrice: g.priceCount > 0 ? g.totalPrice / g.priceCount : 0,
          }))
          .sort((a, b) => b.totalOrders - a.totalOrders)
          .slice(0, limit);

        if (!cancelled) {
          setNiches(result);
          setLoading(false);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load niches');
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [limit]);

  return { niches, loading, error };
}
