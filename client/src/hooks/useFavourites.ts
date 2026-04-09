import { useEffect, useState, useCallback } from 'react';
import type { Product } from './useProducts';

/**
 * useFavourites — localStorage-backed favourites store.
 *
 * Rewritten from the old Supabase version because the heart button
 * was silently failing for unauthed sessions. localStorage is the
 * correct store for MVP: no auth dependency, no network, no RLS,
 * works offline, persists per-device.
 *
 * Exposes BOTH the new simple spec API (toggle, ids, count) AND
 * the legacy API (toggleFavourite, favourites, favouriteIds,
 * addFavourite, removeFavourite) so every existing call site keeps
 * working without a rewrite.
 *
 * Full product snapshots are stored (not just IDs) so the Saved tab
 * can render rows even when the user navigates between pages.
 */

const STORAGE_KEY = 'majorka_favourites_v2';

export interface FavouriteProduct {
  id: string;
  product_id: string;
  product_title: string | null;
  price_aud: number | null;
  sold_count: number | null;
  winning_score: number | null;
  category: string | null;
  image_url: string | null;
  product_url: string | null;
  saved_at: string;
  notes?: string | null;
}

function readStore(): FavouriteProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as FavouriteProduct[] : [];
  } catch {
    return [];
  }
}

function writeStore(list: FavouriteProduct[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage full or disabled — silently drop
  }
}

function productToFavourite(p: Product): FavouriteProduct {
  return {
    id: String(p.id),
    product_id: String(p.id),
    product_title: p.product_title ?? null,
    price_aud: p.price_aud ?? null,
    sold_count: p.sold_count ?? null,
    winning_score: p.winning_score ?? null,
    category: p.category ?? null,
    image_url: p.image_url ?? null,
    product_url: p.product_url ?? null,
    saved_at: new Date().toISOString(),
  };
}

export interface UseFavouritesResult {
  // New simple spec API
  toggle: (productId: string | number) => void;
  ids: string[];
  count: number;
  isFavourite: (productId: string | number) => boolean;

  // Legacy API (preserved so Home.tsx, Products.tsx, store-builder all keep working)
  favourites: FavouriteProduct[];
  favouriteIds: Set<string>;
  addFavourite: (product: Product) => Promise<void>;
  removeFavourite: (productId: string | number) => Promise<void>;
  toggleFavourite: (product: Product) => Promise<void>;
  loading: boolean;
  isAuthed: boolean;
}

export function useFavourites(): UseFavouritesResult {
  const [favourites, setFavourites] = useState<FavouriteProduct[]>(() => readStore());

  // Sync across tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setFavourites(readStore());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const ids = favourites.map((f) => f.id);
  const favouriteIds = new Set<string>(ids);

  const isFavourite = useCallback(
    (productId: string | number) => favouriteIds.has(String(productId)),
    [favouriteIds],
  );

  const addFavourite = useCallback(async (product: Product) => {
    setFavourites((prev) => {
      if (prev.some((f) => f.id === String(product.id))) return prev;
      const next = [productToFavourite(product), ...prev];
      writeStore(next);
      return next;
    });
  }, []);

  const removeFavourite = useCallback(async (productId: string | number) => {
    setFavourites((prev) => {
      const next = prev.filter((f) => f.id !== String(productId));
      writeStore(next);
      return next;
    });
  }, []);

  const toggleFavourite = useCallback(async (product: Product) => {
    setFavourites((prev) => {
      const exists = prev.some((f) => f.id === String(product.id));
      const next = exists
        ? prev.filter((f) => f.id !== String(product.id))
        : [productToFavourite(product), ...prev];
      writeStore(next);
      return next;
    });
  }, []);

  /**
   * Simple id-only toggle (spec API). Stores a placeholder FavouriteProduct
   * if the id isn't already in the store — call sites that care about rich
   * data should use toggleFavourite(product) instead.
   */
  const toggle = useCallback((productId: string | number) => {
    setFavourites((prev) => {
      const idStr = String(productId);
      const exists = prev.some((f) => f.id === idStr);
      if (exists) {
        const next = prev.filter((f) => f.id !== idStr);
        writeStore(next);
        return next;
      }
      const stub: FavouriteProduct = {
        id: idStr,
        product_id: idStr,
        product_title: null,
        price_aud: null,
        sold_count: null,
        winning_score: null,
        category: null,
        image_url: null,
        product_url: null,
        saved_at: new Date().toISOString(),
      };
      const next = [stub, ...prev];
      writeStore(next);
      return next;
    });
  }, []);

  return {
    toggle,
    ids,
    count: favourites.length,
    isFavourite,
    favourites,
    favouriteIds,
    addFavourite,
    removeFavourite,
    toggleFavourite,
    loading: false,
    isAuthed: true,
  };
}
