import { useState, useCallback, useRef } from 'react';

export interface AELiveProduct {
  id: string;
  product_title: string;
  image_url: string | null;
  price_aud: number;
  original_price: number | null;
  sold_count: number;
  category: string | null;
  product_url: string | null;
  commission_rate: string | null;
  evaluate_rate: string | null;
  platform: 'aliexpress';
  source: 'aliexpress_live';
  winning_score: null;
}

interface SearchParams {
  q?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  /** When true (default), resets the result list and starts at page 1. */
  reset?: boolean;
}

interface SearchState {
  products: AELiveProduct[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
  query: string;
  upstreamError: string | null;
}

const INITIAL: SearchState = {
  products: [],
  loading: false,
  loadingMore: false,
  error: null,
  total: 0,
  page: 1,
  hasMore: false,
  query: '',
  upstreamError: null,
};

export function useAESearch() {
  const [state, setState] = useState<SearchState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const lastParamsRef = useRef<SearchParams>({});

  const search = useCallback(async (params: SearchParams) => {
    const isReset = params.reset !== false;
    if (isReset) lastParamsRef.current = params;
    const merged = isReset ? params : { ...lastParamsRef.current, ...params };
    const newPage = isReset ? 1 : state.page + 1;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setState((s) => ({
      ...s,
      loading: isReset,
      loadingMore: !isReset,
      error: null,
      products: isReset ? [] : s.products,
      query: merged.q ?? s.query,
    }));

    try {
      const urlParams = new URLSearchParams({
        page: String(newPage),
        pageSize: '20',
        sort: merged.sort || 'LAST_VOLUME_DESC',
      });
      if (merged.q) urlParams.set('q', merged.q);
      if (merged.minPrice != null) urlParams.set('minPrice', String(merged.minPrice));
      if (merged.maxPrice != null) urlParams.set('maxPrice', String(merged.maxPrice));
      if (merged.categoryId) urlParams.set('categoryId', merged.categoryId);

      const res = await fetch(`/api/products/ae-live-search?${urlParams.toString()}`, {
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok && !Array.isArray(data?.products)) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setState((s) => ({
        ...s,
        loading: false,
        loadingMore: false,
        products: isReset ? (data.products || []) : [...s.products, ...(data.products || [])],
        total: data.total_count || 0,
        page: newPage,
        hasMore: !!data.has_more,
        upstreamError: data.upstream_error || null,
      }));
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') return;
      setState((s) => ({
        ...s,
        loading: false,
        loadingMore: false,
        error: e instanceof Error ? e.message : 'Search failed',
      }));
    }
  }, [state.page]);

  const loadMore = useCallback(() => {
    setState((s) => {
      if (!s.loadingMore && !s.loading && s.hasMore) {
        // Trigger paginated search via lastParams
        search({ ...lastParamsRef.current, reset: false });
      }
      return s;
    });
  }, [search]);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setState(INITIAL);
    lastParamsRef.current = {};
  }, []);

  return { ...state, search, loadMore, reset };
}
