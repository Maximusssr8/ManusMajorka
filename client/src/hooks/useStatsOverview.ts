import { useEffect, useState } from 'react';

/**
 * Dashboard overview stats — served from /api/products/stats-overview.
 * Replaces any hardcoded trend numbers on Home.tsx. Every value here
 * is computed server-side from the live `winning_products` table.
 */
export interface StatsOverview {
  total: number;
  hotProducts: number;
  avgScore: number;
  topScore: number;
  categoryCount: number;
  newThisWeek: number;
  newLastWeek: number;
  totalDelta: number;       // newThisWeek - newLastWeek (absolute count)
  hotDelta: number | null;  // percentage, null if insufficient prior data
  updatedAt: string | null;
}

export interface UseStatsOverviewResult {
  stats: StatsOverview | null;
  loading: boolean;
  error: string | null;
}

const CACHE_KEY = 'stats-overview-v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let moduleCache: { data: StatsOverview; ts: number } | null = null;

export function useStatsOverview(): UseStatsOverviewResult {
  const [stats, setStats] = useState<StatsOverview | null>(() => {
    if (moduleCache && Date.now() - moduleCache.ts < CACHE_TTL) {
      return moduleCache.data;
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => !moduleCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Serve cached result immediately if still fresh.
    if (moduleCache && Date.now() - moduleCache.ts < CACHE_TTL) {
      setStats(moduleCache.data);
      setLoading(false);
      return;
    }

    async function load(): Promise<void> {
      try {
        const res = await fetch('/api/products/stats-overview', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as StatsOverview;
        moduleCache = { data, ts: Date.now() };
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(moduleCache)); } catch { /* ignore */ }
        if (!cancelled) { setStats(data); setLoading(false); }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load stats');
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}
