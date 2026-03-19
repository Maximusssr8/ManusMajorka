/**
 * useStoreBuilderParams — reads URL params ONCE on mount (before URL is cleaned).
 * Uses window.location.search directly since the project uses wouter, not react-router.
 * Memoised so it never re-parses after initial render.
 */
import { useMemo } from 'react';

export interface StoreBuilderParams {
  productName: string;
  price: number;
  niche: string;
  imageUrl: string;
  description: string;
  fromDatabase: boolean;
  supplierUrl: string;
  supplierName: string;
}

function sd(raw: string | null): string {
  if (!raw || raw.trim() === '') return '';
  try { return decodeURIComponent(raw); } catch { return raw; }
}

// Parse once at module eval time — before any effect can wipe the URL
const _initialSearch = typeof window !== 'undefined' ? window.location.search : '';

export function useStoreBuilderParams(): StoreBuilderParams {
  return useMemo(() => {
    const params = new URLSearchParams(_initialSearch);
    const fromDatabase =
      params.get('fromDatabase') === 'true' || params.get('fromTrend') === 'true';
    return {
      productName: sd(params.get('productName') || params.get('product')),
      price: Number(params.get('price')) || 49,
      niche: sd(params.get('niche')),
      imageUrl: sd(params.get('imageUrl')),
      description: sd(params.get('description')),
      fromDatabase,
      supplierUrl: sd(params.get('supplierUrl')),
      supplierName: sd(params.get('supplierName')) || 'AliExpress',
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
