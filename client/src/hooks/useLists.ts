import { useEffect, useState, useCallback } from 'react';
import type { Product } from './useProducts';

/**
 * useLists — named saved product collections, localStorage-backed.
 *
 * Replaces the single-bucket useFavourites pattern with multiple
 * user-named lists ("Work ideas", "Car care", etc). Each list stores
 * both productIds (for fast membership checks) and lightweight
 * product snapshots (for rendering the Saved tab without re-fetching).
 *
 * Storage key: majorka_lists_v1
 */

const STORAGE_KEY = 'majorka_lists_v1';

export interface ListProductSnapshot {
  id: string;
  product_title: string | null;
  price_aud: number | null;
  sold_count: number | null;
  winning_score: number | null;
  category: string | null;
  image_url: string | null;
  product_url: string | null;
  saved_at: string;
}

export interface SavedList {
  id: string;
  name: string;
  productIds: string[];
  products: ListProductSnapshot[];
  createdAt: string;
}

export interface UseListsResult {
  lists: SavedList[];
  createList: (name: string) => SavedList;
  deleteList: (listId: string) => void;
  renameList: (listId: string, name: string) => void;
  addToList: (listId: string, product: Product) => void;
  removeFromList: (listId: string, productId: string) => void;
  isInAnyList: (productId: string | number) => boolean;
  isInList: (listId: string, productId: string | number) => boolean;
  listsForProduct: (productId: string | number) => string[];
  totalSaved: number;
  allSavedIds: string[];
  allSavedProducts: ListProductSnapshot[];
}

function readStore(): SavedList[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Bootstrap default list
      return [{
        id: 'default',
        name: 'My Saved',
        productIds: [],
        products: [],
        createdAt: new Date().toISOString(),
      }];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedList[];
  } catch {
    return [];
  }
}

function writeStore(lists: SavedList[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // quota exceeded or disabled
  }
}

function productToSnapshot(p: Product): ListProductSnapshot {
  return {
    id: String(p.id),
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

export function useLists(): UseListsResult {
  const [lists, setLists] = useState<SavedList[]>(() => readStore());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setLists(readStore());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = useCallback((updated: SavedList[]) => {
    setLists(updated);
    writeStore(updated);
  }, []);

  const createList = useCallback((name: string): SavedList => {
    const trimmed = name.trim() || 'Untitled list';
    const newList: SavedList = {
      id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `list_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed,
      productIds: [],
      products: [],
      createdAt: new Date().toISOString(),
    };
    save([...lists, newList]);
    return newList;
  }, [lists, save]);

  const deleteList = useCallback((listId: string) => {
    // Never allow deleting the last remaining list — keep at least one.
    if (lists.length <= 1) return;
    save(lists.filter((l) => l.id !== listId));
  }, [lists, save]);

  const renameList = useCallback((listId: string, name: string) => {
    save(lists.map((l) => l.id === listId ? { ...l, name: name.trim() || l.name } : l));
  }, [lists, save]);

  const addToList = useCallback((listId: string, product: Product) => {
    save(lists.map((l) => {
      if (l.id !== listId) return l;
      const idStr = String(product.id);
      if (l.productIds.includes(idStr)) return l;
      return {
        ...l,
        productIds: [...l.productIds, idStr],
        products: [productToSnapshot(product), ...l.products],
      };
    }));
  }, [lists, save]);

  const removeFromList = useCallback((listId: string, productId: string | number) => {
    const idStr = String(productId);
    save(lists.map((l) => l.id === listId
      ? {
          ...l,
          productIds: l.productIds.filter((id) => id !== idStr),
          products: l.products.filter((p) => p.id !== idStr),
        }
      : l));
  }, [lists, save]);

  const isInAnyList = useCallback((productId: string | number) => {
    const idStr = String(productId);
    return lists.some((l) => l.productIds.includes(idStr));
  }, [lists]);

  const isInList = useCallback((listId: string, productId: string | number) => {
    const idStr = String(productId);
    return lists.find((l) => l.id === listId)?.productIds.includes(idStr) ?? false;
  }, [lists]);

  const listsForProduct = useCallback((productId: string | number) => {
    const idStr = String(productId);
    return lists.filter((l) => l.productIds.includes(idStr)).map((l) => l.id);
  }, [lists]);

  const totalSaved = new Set(lists.flatMap((l) => l.productIds)).size;
  const allSavedIds = Array.from(new Set(lists.flatMap((l) => l.productIds)));
  const allSavedProducts: ListProductSnapshot[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const p of list.products) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        allSavedProducts.push(p);
      }
    }
  }

  return {
    lists,
    createList,
    deleteList,
    renameList,
    addToList,
    removeFromList,
    isInAnyList,
    isInList,
    listsForProduct,
    totalSaved,
    allSavedIds,
    allSavedProducts,
  };
}
