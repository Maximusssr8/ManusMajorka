import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import { useProductFilters } from '../hooks/useProductFilters';
import { FilterBar } from '../components/FilterBar';
import { ProductRow } from '../components/ProductRow';
import { SkeletonRow } from '../components/SkeletonRow';
import { Pagination } from '../components/Pagination';

interface ProductItem {
  id: string;
  title?: string;
  product_title?: string;
  image_url?: string;
  orders?: number;
  real_orders_count?: number;
  price?: number;
  real_price_aud?: number;
  original_price?: number;
  rating?: number;
  real_rating?: number;
  review_count?: number;
  real_review_count?: number;
  winning_score?: number;
  hot_product_flag?: boolean;
  is_bestseller?: boolean;
  category?: string;
  source?: string;
  product_url?: string;
  source_url?: string;
  trend_direction?: string;
  updated_at?: string;
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  page?: number;
  limit?: number;
}

interface ProductsResponse {
  products?: ProductItem[];
  total?: number;
  pagination?: PaginationInfo;
}

interface SearchResponse {
  products?: ProductItem[];
  total?: number;
  page?: number;
  hasMore?: boolean;
  source?: 'aliexpress_live' | 'db';
  query?: string;
}

export function FullDatabaseTab() {
  const { filters, setFilters, resetFilters } = useProductFilters();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // ── Search state ─────────────────────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [searchSource, setSearchSource] = useState<'aliexpress_live' | 'db' | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, page: number = 1) => {
    if (!q.trim()) {
      setSearchResults([]);
      setSearchSource(null);
      setSearchTotal(0);
      setSearchHasMore(false);
      return;
    }
    setSearchLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await apiFetch(`/api/products/search?q=${encodeURIComponent(q)}&page=${page}&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data: SearchResponse = await res.json();
      setSearchResults(data.products || []);
      setSearchSource(data.source || null);
      setSearchTotal(data.total || 0);
      setSearchHasMore(data.hasMore || false);
      setSearchPage(page);
    } catch (err) {
      console.error('[Search]', err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce on filters.search change (400ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!filters.search.trim()) {
      setSearchResults([]);
      setSearchSource(null);
      setSearchTotal(0);
      setSearchHasMore(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      doSearch(filters.search, 1);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters.search, doSearch]);

  const isSearchMode = filters.search.trim().length > 0;

  // ── Winning products query (used when not searching) ─────────────────────────
  const { data, isLoading, isFetching } = useQuery<ProductsResponse>({
    queryKey: ['products-db', filters],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        sort: filters.sort,
        filter: filters.filter,
        ...(filters.niche && { niche: filters.niche }),
      });
      const res = await apiFetch(`/api/products/winning?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    enabled: !isSearchMode,
  });

  const products: ProductItem[] = data?.products || [];
  const pagination: PaginationInfo = data?.pagination || { total: data?.total || 0, totalPages: 1 };

  // What to display
  const displayProducts = isSearchMode ? searchResults : products;
  const showSkeleton = isSearchMode ? searchLoading : isLoading;

  return (
    <div className="flex flex-col" style={{ background: '#080808' }}>
      <FilterBar filters={filters} onFiltersChange={setFilters} totalCount={isSearchMode ? searchTotal : pagination.total} />

      {/* SOURCE BADGE + RESULT COUNT (search mode only) */}
      {isSearchMode && !searchLoading && (
        <div className="flex items-center gap-3 px-6 py-2.5" style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {searchTotal > 0
              ? <><span className="text-white font-medium">{searchTotal}</span> results for "<span className="text-slate-300">{filters.search}</span>"</>
              : <>No results for "<span className="text-slate-300">{filters.search}</span>"</>
            }
          </span>
          {searchSource === 'aliexpress_live' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ display: 'inline-block' }} />
              Live from AliExpress
            </span>
          )}
          {searchSource === 'db' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
              From database
            </span>
          )}
        </div>
      )}

      {/* TOOLBAR */}
      <div id="db-table-top" className="flex items-center justify-between px-6 py-3" style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {showSkeleton ? 'Loading...' : isSearchMode ? (
              searchTotal > 0
                ? <>Showing <span className="text-white font-medium">{displayProducts.length}</span> of <span className="text-white font-medium">{searchTotal}</span> products</>
                : 'No products found'
            ) : (
              <>Showing <span className="text-white font-medium">{((filters.page-1)*filters.limit)+1}–{Math.min(filters.page*filters.limit, pagination.total || 0)}</span> of <span className="text-white font-medium">{pagination.total?.toLocaleString()}</span> products</>
            )}
          </span>
          {isFetching && !isLoading && !isSearchMode && (
            <span className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Updating...
            </span>
          )}
          {!isSearchMode && (
            <select value={filters.limit} onChange={e => setFilters({ limit: Number(e.target.value), page: 1 })} className="rounded-lg px-2.5 py-1.5 text-[12px] text-slate-400 outline-none cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', paddingRight: 28 }}>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/api/products/export?format=csv&page=${filters.page}&limit=${filters.limit}&sort=${filters.sort}&filter=${filters.filter}&search=${filters.search}&niche=${filters.niche}`, '_blank')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300 px-3 py-1.5 rounded-lg text-[12px] transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* SKELETON LOADING (search mode) */}
      {isSearchMode && searchLoading && (
        <div className="px-6 py-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      )}

      {/* TABLE */}
      {!searchLoading && (
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' as const, minWidth: '900px' }}>
            <colgroup>
              <col style={{ width: '44px' }} /><col style={{ width: '36%' }} /><col style={{ width: '8%' }} /><col style={{ width: '8%' }} /><col style={{ width: '7%' }} /><col style={{ width: '7%' }} /><col style={{ width: '7%' }} /><col style={{ width: '6%' }} /><col style={{ width: '5%' }} /><col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['#', 'Product', 'Orders', 'Price', 'Margin', 'Rating', 'Trend', 'Score', 'Src', 'Actions'].map((label, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.07em] select-none" style={{ color: 'rgba(255,255,255,0.3)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ opacity: isFetching && !isLoading && !isSearchMode ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              {showSkeleton && !isSearchMode
                ? [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
                : displayProducts.map((product, idx) => (
                    <ProductRow
                      key={product.id || idx}
                      product={product}
                      rank={(isSearchMode ? (searchPage - 1) * 50 : (filters.page - 1) * filters.limit) + idx + 1}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* EMPTY STATE */}
      {!showSkeleton && displayProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-[15px] font-semibold text-slate-100 mb-1">No products found</h3>
            <p className="text-[13px] max-w-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isSearchMode
                ? `No results for "${filters.search}". Try a different keyword.`
                : 'No products match your current filters.'}
            </p>
          </div>
          <button
            onClick={() => {
              resetFilters();
              setSearchResults([]);
              setSearchSource(null);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-[13px] font-medium transition-colors"
          >
            {isSearchMode ? 'Clear search' : 'Clear all filters'}
          </button>
        </div>
      )}

      {/* PAGINATION — normal mode */}
      {!isSearchMode && !isLoading && pagination.totalPages > 1 && (
        <Pagination
          currentPage={filters.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={filters.limit}
          onPageChange={p => {
            setFilters({ page: p });
            document.getElementById('db-table-top')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* PAGINATION — search mode */}
      {isSearchMode && !searchLoading && (searchPage > 1 || searchHasMore) && (
        <div className="flex items-center justify-center gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            disabled={searchPage <= 1}
            onClick={() => {
              doSearch(filters.search, searchPage - 1);
              document.getElementById('db-table-top')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
          >
            ← Prev
          </button>
          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Page {searchPage}</span>
          <button
            disabled={!searchHasMore}
            onClick={() => {
              doSearch(filters.search, searchPage + 1);
              document.getElementById('db-table-top')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
          >
            Next →
          </button>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="rounded-xl p-6 max-w-sm w-full mx-4"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-slate-100">Product Details</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-white/40 hover:text-white/70 text-[18px]">✕</button>
            </div>
            <p className="text-[13px] text-slate-400">{selectedProduct.title || selectedProduct.product_title}</p>
            {(selectedProduct.product_url || selectedProduct.source_url) && (
              <a
                href={selectedProduct.product_url || selectedProduct.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium py-2.5 px-4 rounded-lg text-center transition-colors"
              >
                View on AliExpress ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
