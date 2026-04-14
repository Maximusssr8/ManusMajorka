/**
 * React-Query hooks for the Home dashboard.
 *
 * One hook per endpoint — each mirrors the caching window its server route
 * advertises. The exclusion chain is built in Home.tsx:
 *   1. fetch topProducts first → derive topIds
 *   2. fetch velocityLeaders (no exclusion — server slice is disjoint) and
 *      hotToday(excludeIds = topIds)
 *   3. fetch opportunities(excludeIds = topIds ∪ velocityIds ∪ hotIds)
 *
 * Each hook is disabled until its exclusion chain is ready so we never
 * issue duplicate requests with partial IDs.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Product } from '@/hooks/useProducts';

export interface DashboardSection {
  products: Product[];
  cached_at: string;
}

async function fetchJson(url: string): Promise<DashboardSection> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Dashboard request failed: ${res.status}`);
  }
  const data = (await res.json()) as DashboardSection;
  return {
    products: Array.isArray(data.products) ? data.products : [],
    cached_at: typeof data.cached_at === 'string' ? data.cached_at : new Date().toISOString(),
  };
}

function buildExcludeQuery(excludeIds: ReadonlyArray<number | string> | undefined): string {
  if (!excludeIds || excludeIds.length === 0) return '';
  const list = excludeIds.map((v) => String(v)).filter((v) => v.length > 0);
  if (list.length === 0) return '';
  const params = new URLSearchParams({ excludeIds: list.join(',') });
  return `?${params.toString()}`;
}

// Keep local staleness aligned with the Cache-Control headers set server-side.
const FIFTEEN_MIN = 15 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

// ─── Top Products — all-time highest order count ──────────────────────────

export function useTopProducts(): UseQueryResult<DashboardSection, Error> {
  return useQuery<DashboardSection, Error>({
    queryKey: ['dashboard', 'top-products'],
    queryFn: () => fetchJson('/api/dashboard/top-products'),
    staleTime: ONE_HOUR,
    gcTime: ONE_HOUR,
  });
}

// ─── Velocity Leaders — fastest growing in last 48h ───────────────────────

export function useVelocityLeaders(enabled: boolean = true): UseQueryResult<DashboardSection, Error> {
  return useQuery<DashboardSection, Error>({
    queryKey: ['dashboard', 'velocity-leaders'],
    queryFn: () => fetchJson('/api/dashboard/velocity-leaders'),
    enabled,
    staleTime: THIRTY_MIN,
    gcTime: THIRTY_MIN,
  });
}

// ─── Hot Today — added in last 48h, deduped against exclusion chain ───────

export function useHotToday(
  excludeIds: ReadonlyArray<number | string>,
  enabled: boolean
): UseQueryResult<DashboardSection, Error> {
  const qs = buildExcludeQuery(excludeIds);
  return useQuery<DashboardSection, Error>({
    queryKey: ['dashboard', 'hot-today', qs],
    queryFn: () => fetchJson(`/api/dashboard/hot-today${qs}`),
    enabled,
    staleTime: FIFTEEN_MIN,
    gcTime: FIFTEEN_MIN,
  });
}

// ─── Opportunities — high score, lower competition ────────────────────────

export function useOpportunities(
  excludeIds: ReadonlyArray<number | string>,
  enabled: boolean
): UseQueryResult<DashboardSection, Error> {
  const qs = buildExcludeQuery(excludeIds);
  return useQuery<DashboardSection, Error>({
    queryKey: ['dashboard', 'opportunities', qs],
    queryFn: () => fetchJson(`/api/dashboard/opportunities${qs}`),
    enabled,
    staleTime: THIRTY_MIN,
    gcTime: THIRTY_MIN,
  });
}
