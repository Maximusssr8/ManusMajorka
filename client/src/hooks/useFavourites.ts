import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/_core/hooks/useAuth';
import type { Product } from './useProducts';

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

// Module-level cache: keyed by user id, 10-minute TTL.
interface CacheEntry {
  data: FavouriteProduct[];
  ts: number;
}
const FAV_CACHE = new Map<string, CacheEntry>();
const FAV_TTL_MS = 10 * 60 * 1000;

function readCache(userId: string): FavouriteProduct[] | null {
  const entry = FAV_CACHE.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.ts > FAV_TTL_MS) {
    FAV_CACHE.delete(userId);
    return null;
  }
  return entry.data;
}

function writeCache(userId: string, data: FavouriteProduct[]): void {
  FAV_CACHE.set(userId, { data, ts: Date.now() });
}

function clearCache(userId: string): void {
  FAV_CACHE.delete(userId);
}

export interface UseFavouritesResult {
  favourites: FavouriteProduct[];
  favouriteIds: Set<string>;
  isFavourite: (productId: string | number) => boolean;
  addFavourite: (product: Product) => Promise<void>;
  removeFavourite: (productId: string | number) => Promise<void>;
  toggleFavourite: (product: Product) => Promise<void>;
  loading: boolean;
  count: number;
  isAuthed: boolean;
}

export function useFavourites(): UseFavouritesResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [favourites, setFavourites] = useState<FavouriteProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Load on mount / userId change
  useEffect(() => {
    if (!userId) {
      setFavourites([]);
      return;
    }
    const cached = readCache(userId);
    if (cached) {
      setFavourites(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('user_favourites')
          .select('*')
          .eq('user_id', userId)
          .order('saved_at', { ascending: false });
        if (cancelled) return;
        if (error) {
          setFavourites([]);
          return;
        }
        const list = (data ?? []) as FavouriteProduct[];
        writeCache(userId, list);
        setFavourites(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const favouriteIds = new Set(favourites.map((f) => f.product_id));

  const isFavourite = useCallback(
    (productId: string | number) => favouriteIds.has(String(productId)),
    [favourites] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const addFavourite = useCallback(async (product: Product) => {
    if (!userId) return;
    const productIdStr = String(product.id);
    if (favouriteIds.has(productIdStr)) return;

    const optimistic: FavouriteProduct = {
      id: `optimistic-${productIdStr}`,
      product_id: productIdStr,
      product_title: product.product_title,
      price_aud: product.price_aud,
      sold_count: product.sold_count,
      winning_score: product.winning_score,
      category: product.category,
      image_url: product.image_url,
      product_url: product.product_url,
      saved_at: new Date().toISOString(),
    };
    setFavourites((prev) => [optimistic, ...prev]);

    const { data, error } = await supabase
      .from('user_favourites')
      .insert({
        user_id: userId,
        product_id: productIdStr,
        product_title: product.product_title,
        price_aud: product.price_aud,
        sold_count: product.sold_count,
        winning_score: product.winning_score,
        category: product.category,
        image_url: product.image_url,
        product_url: product.product_url,
      })
      .select()
      .single();

    if (error) {
      // Roll back the optimistic update
      setFavourites((prev) => prev.filter((f) => f.product_id !== productIdStr));
      return;
    }

    // Replace optimistic row with real DB row
    setFavourites((prev) => {
      const next = prev.filter((f) => f.id !== optimistic.id);
      next.unshift(data as FavouriteProduct);
      writeCache(userId, next);
      return next;
    });
    clearCache(userId);
  }, [userId, favouriteIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeFavourite = useCallback(async (productId: string | number) => {
    if (!userId) return;
    const productIdStr = String(productId);
    const previous = favourites;
    setFavourites((prev) => prev.filter((f) => f.product_id !== productIdStr));
    const { error } = await supabase
      .from('user_favourites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productIdStr);
    if (error) {
      setFavourites(previous);
      return;
    }
    clearCache(userId);
  }, [userId, favourites]);

  const toggleFavourite = useCallback(async (product: Product) => {
    if (!userId) {
      // Surface a toast at the call site by throwing — UI handles it
      throw new Error('NOT_AUTHED');
    }
    if (favouriteIds.has(String(product.id))) {
      await removeFavourite(product.id);
    } else {
      await addFavourite(product);
    }
  }, [userId, favouriteIds, addFavourite, removeFavourite]);

  return {
    favourites,
    favouriteIds,
    isFavourite,
    addFavourite,
    removeFavourite,
    toggleFavourite,
    loading,
    count: favourites.length,
    isAuthed: !!userId,
  };
}
