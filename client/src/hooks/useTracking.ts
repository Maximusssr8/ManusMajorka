import { useEffect, useState, useCallback } from 'react';
import type { Product } from './useProducts';

/**
 * useTracking — product tracking / alerts subscription, localStorage-backed.
 *
 * Distinct from useFavourites (which is "save for later") — tracked products
 * are ones the user wants alert notifications for when their order velocity
 * spikes or score crosses a threshold.
 *
 * Tier limits: Builder = 20, Scale = unlimited.
 *
 * Storage key: majorka_tracked_v1
 */

const STORAGE_KEY = 'majorka_tracked_v1';
export const TRACK_LIMIT_BUILDER = 20;

export interface TrackedProduct {
  productId: string;
  productTitle: string | null;
  productImage: string | null;
  priceAud: number | null;
  soldCount: number | null;
  aiScore: number | null;
  addedAt: string;
  lastAlertAt: string | null;
}

export interface UseTrackingResult {
  tracked: TrackedProduct[];
  trackedCount: number;
  isTracked: (productId: string | number) => boolean;
  track: (product: Product) => { ok: true } | { ok: false; reason: 'already' | 'limit' };
  untrack: (productId: string | number) => void;
}

function readStore(): TrackedProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrackedProduct[]) : [];
  } catch {
    return [];
  }
}

function writeStore(list: TrackedProduct[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // Cross-tab sync — fire a storage event manually since same-tab writes don't fire it
    window.dispatchEvent(new Event('majorka-tracked-change'));
  } catch {
    // quota exceeded or disabled
  }
}

function toTracked(p: Product): TrackedProduct {
  return {
    productId: String(p.id),
    productTitle: p.product_title ?? null,
    productImage: p.image_url ?? null,
    priceAud: p.price_aud != null ? Number(p.price_aud) : null,
    soldCount: p.sold_count ?? null,
    aiScore: p.winning_score != null ? Number(p.winning_score) : null,
    addedAt: new Date().toISOString(),
    lastAlertAt: null,
  };
}

export function useTracking(tierLimit: number = TRACK_LIMIT_BUILDER): UseTrackingResult {
  const [tracked, setTracked] = useState<TrackedProduct[]>(() => readStore());

  useEffect(() => {
    function onChange() { setTracked(readStore()); }
    window.addEventListener('storage', onChange);
    window.addEventListener('majorka-tracked-change', onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('majorka-tracked-change', onChange);
    };
  }, []);

  const isTracked = useCallback((productId: string | number) => {
    const idStr = String(productId);
    return tracked.some((t) => t.productId === idStr);
  }, [tracked]);

  const track = useCallback((product: Product): { ok: true } | { ok: false; reason: 'already' | 'limit' } => {
    const idStr = String(product.id);
    if (tracked.some((t) => t.productId === idStr)) {
      return { ok: false, reason: 'already' };
    }
    if (tracked.length >= tierLimit) {
      return { ok: false, reason: 'limit' };
    }
    const next = [toTracked(product), ...tracked];
    setTracked(next);
    writeStore(next);
    return { ok: true };
  }, [tracked, tierLimit]);

  const untrack = useCallback((productId: string | number) => {
    const idStr = String(productId);
    const next = tracked.filter((t) => t.productId !== idStr);
    setTracked(next);
    writeStore(next);
  }, [tracked]);

  return {
    tracked,
    trackedCount: tracked.length,
    isTracked,
    track,
    untrack,
  };
}
