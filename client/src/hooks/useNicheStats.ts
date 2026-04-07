import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface NicheStat {
  name: string;
  count: number;
  avgScore: number;
}

export interface UseNicheStatsResult {
  niches: NicheStat[];
  loading: boolean;
  error: string | null;
}

export function useNicheStats(): UseNicheStatsResult {
  const [niches, setNiches] = useState<NicheStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('winning_products')
          .select('category, winning_score')
          .not('category', 'is', null)
          .limit(2500);
        if (err) throw err;

        type Row = { category: string | null; winning_score: number | null };
        const grouped: Record<string, { count: number; totalScore: number }> = {};
        for (const row of (data ?? []) as Row[]) {
          const cat = row.category;
          if (!cat) continue;
          if (!grouped[cat]) grouped[cat] = { count: 0, totalScore: 0 };
          grouped[cat].count++;
          grouped[cat].totalScore += row.winning_score ?? 0;
        }

        const result: NicheStat[] = Object.entries(grouped)
          .map(([name, { count, totalScore }]) => ({
            name,
            count,
            avgScore: count > 0 ? Math.round(totalScore / count) : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);

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
  }, []);

  return { niches, loading, error };
}
