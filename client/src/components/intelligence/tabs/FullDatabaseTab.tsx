import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
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

export function FullDatabaseTab() {
  const { filters, setFilters, resetFilters } = useProductFilters();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const { data, isLoading, isFetching } = useQuery<ProductsResponse>({
    queryKey: ['products-db', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        sort: filters.sort,
        filter: filters.filter,
        ...(filters.search && { search: filters.search }),
        ...(filters.niche && { niche: filters.niche }),
      });
      const res = await fetch(`/api/products/winning?${params}`);
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  const products: ProductItem[] = data?.products || [];
  const pagination: PaginationInfo = data?.pagination || { total: data?.total || 0, totalPages: 1 };

  return (
    <div className="flex flex-col" style={{ background: '#080808' }}>
      <FilterBar filters={filters} onFiltersChange={setFilters} totalCount={pagination.total} />

      {/* TOOLBAR */}
      <div id="db-table-top" className="flex items-center justify-between px-6 py-3" style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {isLoading ? 'Loading...' : (
              <>Showing <span className="text-white font-medium">{((filters.page-1)*filters.limit)+1}–{Math.min(filters.page*filters.limit, pagination.total || 0)}</span> of <span className="text-white font-medium">{pagination.total?.toLocaleString()}</span> products</>
            )}
          </span>
          {isFetching && !isLoading && (
            <span className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Updating...
            </span>
          )}
          <select value={filters.limit} onChange={e => setFilters({ limit: Number(e.target.value), page: 1 })} className="rounded-lg px-2.5 py-1.5 text-[12px] text-slate-400 outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
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

      {/* TABLE */}
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
          <tbody style={{ opacity: isFetching && !isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            {isLoading
              ? [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
              : products.map((product, idx) => (
                  <ProductRow
                    key={product.id || idx}
                    product={product}
                    rank={(filters.page - 1) * filters.limit + idx + 1}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))
            }
          </tbody>
        </table>
      </div>

      {/* EMPTY STATE */}
      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>🔍</div>
          <div className="text-center">
            <h3 className="text-[15px] font-semibold text-slate-100 mb-1">No products found</h3>
            <p className="text-[13px] max-w-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {filters.search ? `No results for "${filters.search}". Try a different keyword.` : 'No products match your current filters.'}
            </p>
          </div>
          <button onClick={resetFilters} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-[13px] font-medium transition-colors">Clear all filters</button>
        </div>
      )}

      {/* PAGINATION */}
      {!isLoading && pagination.totalPages > 1 && (
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

      {/* PRODUCT DETAIL MODAL (inline fallback) */}
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
