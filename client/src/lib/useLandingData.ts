// Shared live data for the landing page.
// Single fetch shared across Hero, LiveDemo, SocialProofBar, and micro-demos.
// 15-minute TTL in-memory cache; public endpoints only.

import { useEffect, useState } from 'react';

export interface LandingProduct {
  id: string;
  title: string;
  image: string;
  orders: number;
  score: number;
  price: number;
  category: string;
  aliexpress_url: string | null;
}

export interface LandingCategory {
  category: string;
  total_orders: number;
  product_count: number;
}

export interface LandingStats {
  total: number;
  hotProducts: number;
  avgScore: number;
  topScore: number;
  categoryCount: number;
  newThisWeek: number;
  updatedAt: string;
}

export interface LandingData {
  products: LandingProduct[];
  stats: LandingStats | null;
  categories: LandingCategory[];
  loading: boolean;
  error: string | null;
}

const TTL_MS = 15 * 60 * 1000;

type CacheBucket = {
  data: Omit<LandingData, 'loading' | 'error'>;
  fetchedAt: number;
};

let cache: CacheBucket | null = null;
let inflight: Promise<CacheBucket['data']> | null = null;

// Extract an AliExpress image URL tolerantly
function asStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asNum(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function fetchLanding(): Promise<CacheBucket['data']> {
  const safe = async <T,>(url: string, fallback: T): Promise<T> => {
    try {
      const r = await fetch(url, { credentials: 'omit' });
      if (!r.ok) return fallback;
      return (await r.json()) as T;
    } catch {
      return fallback;
    }
  };

  const [picks, stats, cats] = await Promise.all([
    safe<{ picks?: unknown[] }>('/api/products/todays-picks?limit=12', {}),
    safe<Partial<LandingStats>>('/api/products/stats-overview', {}),
    safe<{ categories?: unknown[] }>('/api/products/stats-categories?limit=6', {}),
  ]);

  const rawPicks = Array.isArray(picks.picks) ? picks.picks : [];
  const products: LandingProduct[] = rawPicks.map((p) => {
    const o = p as Record<string, unknown>;
    return {
      id: asStr(o.id) || Math.random().toString(36).slice(2),
      title: asStr(o.product_title),
      image: asStr(o.image_url),
      orders: asNum(o.sold_count),
      score: asNum(o.winning_score),
      price: asNum(o.price_aud),
      category: asStr(o.category),
      aliexpress_url: asStr(o.aliexpress_url) || null,
    };
  }).filter((p) => p.title && p.orders > 0);

  const categories: LandingCategory[] = Array.isArray(cats.categories)
    ? cats.categories.map((c) => {
        const o = c as Record<string, unknown>;
        return {
          category: asStr(o.category),
          total_orders: asNum(o.total_orders),
          product_count: asNum(o.product_count),
        };
      }).filter((c) => c.category)
    : [];

  const s = stats as Partial<LandingStats>;
  const statsFull: LandingStats | null = typeof s.total === 'number'
    ? {
        total: s.total,
        hotProducts: asNum(s.hotProducts),
        avgScore: asNum(s.avgScore),
        topScore: asNum(s.topScore),
        categoryCount: asNum(s.categoryCount),
        newThisWeek: asNum(s.newThisWeek),
        updatedAt: asStr(s.updatedAt),
      }
    : null;

  return { products, stats: statsFull, categories };
}

export function proxiedImage(url: string): string {
  if (!url) return '';
  if (url.startsWith('/api/image-proxy')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export function useLandingData(): LandingData {
  const [state, setState] = useState<LandingData>(() => ({
    products: cache?.data.products ?? [],
    stats: cache?.data.stats ?? null,
    categories: cache?.data.categories ?? [],
    loading: !cache,
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    if (cache && now - cache.fetchedAt < TTL_MS) {
      return;
    }
    if (!inflight) {
      inflight = fetchLanding().finally(() => { /* reset handled below */ });
    }
    inflight.then((data) => {
      cache = { data, fetchedAt: Date.now() };
      inflight = null;
      if (cancelled) return;
      setState({ ...data, loading: false, error: null });
    }).catch((err: unknown) => {
      inflight = null;
      if (cancelled) return;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load landing data',
      }));
    });
    return () => { cancelled = true; };
  }, []);

  return state;
}
