/**
 * Products — Wave 3 rebuild.
 *
 * The single most important page in Majorka. A dropshipper lives here.
 * The goal: in under 5s, surface (1) what's exploding in orders right now,
 * (2) new 48h discoveries, (3) evergreen all-time winners — each tab
 * backed by genuinely distinct SQL so no two tabs ever show the same row.
 *
 * Architecture:
 *   - 3 tabs (Trending / Hot / High Volume) → 3 server endpoints.
 *   - Search + filter bar persisted to localStorage 'majorka_product_filters_v3'.
 *   - Live AliExpress search kicks in once query length ≥ 3.
 *   - Clicking a card opens a lazy-loaded slide-in drawer (no page reload).
 *   - Stale-while-revalidate cache in useProductsTab — 60s TTL.
 *
 * Design tokens: new gold palette (see designTokens.ts + index.css).
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sparkles, RefreshCw, X, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import {
  useProductsTab,
  type Product,
  type ProductsTab,
  type ProductsTabFilters,
} from '@/hooks/useProducts';
import {
  ProductFilters,
  type ProductFilterState,
  DEFAULT_FILTERS,
} from '@/components/products/ProductFilters';
import { ProductCard } from '@/components/products/ProductCard';
import { TabHeader, type ProductsTabKey } from '@/components/products/TabHeader';
import { EmptyState } from '@/components/EmptyState';
import { useAESearch, type AELiveProduct } from '@/hooks/useAESearch';

const ProductDetailDrawer = lazy(() => import('@/components/products/ProductDetailDrawer'));

// ── Local storage keys ──────────────────────────────────────────────────────
const V3_FILTER_KEY = 'majorka_product_filters_v3';
const V3_ACTIVE_TAB_KEY = 'majorka_products_active_tab_v3';

// ── Filter persistence (separate from v2 ProductFilters internal key) ──────
function loadV3Filters(): ProductFilterState {
  if (typeof window === 'undefined') return { ...DEFAULT_FILTERS };
  try {
    const raw = window.localStorage.getItem(V3_FILTER_KEY);
    if (!raw) return { ...DEFAULT_FILTERS };
    const parsed = JSON.parse(raw) as Partial<ProductFilterState>;
    return { ...DEFAULT_FILTERS, ...parsed };
  } catch {
    return { ...DEFAULT_FILTERS };
  }
}

function saveV3Filters(state: ProductFilterState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(V3_FILTER_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function loadActiveTab(): ProductsTabKey {
  if (typeof window === 'undefined') return 'trending';
  try {
    const v = window.localStorage.getItem(V3_ACTIVE_TAB_KEY);
    if (v === 'trending' || v === 'hot' || v === 'high-volume') return v;
  } catch {
    /* ignore */
  }
  return 'trending';
}

function saveActiveTab(tab: ProductsTabKey): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(V3_ACTIVE_TAB_KEY, tab);
  } catch {
    /* ignore */
  }
}

// ── Client-side filter (runs on the loaded rows of the active tab) ─────────
function applyClientSearch(rows: ReadonlyArray<Product>, query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [...rows];
  return rows.filter((p) => {
    const t = (p.product_title ?? '').toLowerCase();
    const c = (p.category ?? '').toLowerCase();
    return t.includes(q) || c.includes(q);
  });
}

// ── useDebounce ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ── Tab filters helper ──────────────────────────────────────────────────────
function toTabFilters(state: ProductFilterState): ProductsTabFilters {
  return {
    market: state.market,
    category: state.category,
    minOrders: state.minOrders,
    minScore: state.minScore,
  };
}

// ── Live AE result → Product shape so we can reuse ProductCard ─────────────
function liveToProduct(r: AELiveProduct): Product {
  return {
    id: r.id,
    product_title: r.product_title,
    category: r.category ?? null,
    platform: r.platform ?? 'aliexpress',
    price_aud: r.price_aud ?? null,
    sold_count: r.sold_count ?? null,
    winning_score: r.winning_score ?? null,
    trend: null,
    est_daily_revenue_aud: null,
    image_url: r.image_url ?? null,
    product_url: r.product_url ?? null,
    created_at: new Date().toISOString(),
    updated_at: null,
    velocity_7d: null,
    sold_count_7d_ago: null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════
export default function Products() {
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = 'Products — Majorka';
  }, []);

  // Active tab
  const [activeTab, setActiveTab] = useState<ProductsTabKey>(() => loadActiveTab());
  useEffect(() => { saveActiveTab(activeTab); }, [activeTab]);

  // Filter state (persisted under majorka_product_filters_v3)
  const [filters, setFilters] = useState<ProductFilterState>(() => loadV3Filters());
  useEffect(() => { saveV3Filters(filters); }, [filters]);

  // Search input + debounce
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const liveQuery = debouncedSearch.trim().length >= 3 ? debouncedSearch.trim() : '';

  // Tab filter object stable per filter state
  const tabFilters = useMemo<ProductsTabFilters>(() => toTabFilters(filters), [filters]);

  // Each tab fetches independently — stale-while-revalidate cache keeps
  // things snappy when the user toggles between them.
  const trending = useProductsTab('trending', tabFilters);
  const hot = useProductsTab('hot', tabFilters);
  const highVolume = useProductsTab('high-volume', tabFilters);

  const active = activeTab === 'trending' ? trending : activeTab === 'hot' ? hot : highVolume;

  // Live AE search — runs only when query length ≥ 3
  const aeLive = useAESearch();
  useEffect(() => {
    if (liveQuery.length >= 3) {
      aeLive.search({ q: liveQuery, reset: true });
    } else {
      aeLive.reset();
    }
    // Intentionally omit aeLive fn refs — they are stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveQuery]);

  const counts = useMemo<Record<ProductsTabKey, number>>(
    () => ({
      trending: trending.products.length,
      hot: hot.products.length,
      'high-volume': highVolume.products.length,
    }),
    [trending.products.length, hot.products.length, highVolume.products.length],
  );
  const loadingMap = useMemo<Partial<Record<ProductsTabKey, boolean>>>(
    () => ({ trending: trending.loading, hot: hot.loading, 'high-volume': highVolume.loading }),
    [trending.loading, hot.loading, highVolume.loading],
  );

  // Filtered rows displayed in the grid — combines DB tab + live AE rows
  // when a search is active. Live rows are appended below the DB matches.
  const displayRows = useMemo<Product[]>(() => {
    const base = applyClientSearch(active.products, searchInput);
    if (liveQuery.length > 0 && Array.isArray(aeLive.products) && aeLive.products.length > 0) {
      const seen = new Set(base.map((p) => String(p.id)));
      const live = aeLive.products
        .filter((r: AELiveProduct) => !seen.has(String(r.id)))
        .map(liveToProduct);
      return [...base, ...live];
    }
    return base;
  }, [active.products, searchInput, liveQuery, aeLive.products]);

  // Selected product for drawer
  const [selected, setSelected] = useState<Product | null>(null);
  const handleOpen = useCallback((p: Product) => setSelected(p), []);
  const handleClose = useCallback(() => setSelected(null), []);

  const handleResetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setSearchInput('');
  }, []);

  // ── Empty-state copy per tab ──────────────────────────────────────────────
  const emptyCopy = useMemo(() => {
    if (activeTab === 'trending') {
      if (active.insufficientData) {
        return {
          title: 'More data collecting',
          description:
            'Trending needs 7-day velocity snapshots. Once enough products have baseline + current counts, this view will light up with real-time breakouts.',
        };
      }
      return {
        title: 'No trending products match',
        description: 'Try widening your filters — lower the score or orders threshold, or switch market.',
      };
    }
    if (activeTab === 'hot') {
      return {
        title: 'Nothing new in the last 48 hours',
        description: 'Check back soon — the pipeline discovers fresh winners every few hours.',
      };
    }
    return {
      title: 'No high-volume matches',
      description: 'Your filters are too tight for our evergreen catalogue. Reset and try again.',
    };
  }, [activeTab, active.insufficientData]);

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e5e5e5' }}>
      {/* Header */}
      <header
        className="px-3 py-3 sm:px-5 sm:py-4"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(8,8,8,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1a1a1a',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              className="text-[22px] sm:text-[28px]"
              style={{
                fontFamily: "'Syne', system-ui, sans-serif",
                fontWeight: 700,
                margin: 0,
                color: '#f5f5f5',
                letterSpacing: '-0.02em',
              }}
            >
              Products
            </h1>
            <p className="text-[13px] sm:text-[13px]" style={{ fontSize: 13, color: '#737373', margin: '4px 0 0' }}>
              Winners ranked by real order velocity, all-time volume and 48h freshness.
            </p>
          </div>

          {/* Search */}
          <div className="w-full" style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: 420 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#737373',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search 50k+ products and live AliExpress…"
              aria-label="Search products"
              style={{
                width: '100%',
                height: 44,
                padding: '0 40px 0 38px',
                background: '#111111',
                border: '1px solid #1a1a1a',
                borderRadius: 10,
                color: '#f5f5f5',
                fontSize: 14,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                outline: 'none',
                transition: 'border 160ms ease, box-shadow 160ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#1a1a1a';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {searchInput ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchInput('')}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: '#737373',
                  cursor: 'pointer',
                  borderRadius: 6,
                }}
              >
                <X size={14} />
              </button>
            ) : liveQuery && aeLive.loading ? (
              <Loader2
                size={14}
                className="animate-spin"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#d4af37',
                }}
              />
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1400, margin: '12px auto 0' }}>
          <TabHeader
            active={activeTab}
            counts={counts}
            loading={loadingMap}
            onChange={setActiveTab}
          />
        </div>
      </header>

      {/* Filters (v2 component handles persistence under its own key) */}
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <ProductFilters
          initial={filters}
          onChange={setFilters}
        />
      </div>

      {/* Body */}
      <main className="px-3 py-4 sm:px-5 sm:py-5" style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="mj-num"
              style={{ fontSize: 12, color: '#a3a3a3' }}
              aria-live="polite"
            >
              {active.loading && active.products.length === 0
                ? 'Loading…'
                : `${displayRows.length} shown`}
            </span>
            {active.cached ? (
              <span style={{ fontSize: 10, color: '#737373', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                cached
              </span>
            ) : null}
            {liveQuery ? (
              <span
                style={{
                  fontSize: 11,
                  color: '#d4af37',
                  padding: '3px 8px',
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  borderRadius: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sparkles size={11} />
                Live AliExpress
              </span>
            ) : null}
          </div>
          {(filters.category || filters.minScore > 0 || filters.minOrders > 0 || searchInput) ? (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                minHeight: 32,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 12px',
                background: 'transparent',
                border: '1px solid #1a1a1a',
                borderRadius: 8,
                color: '#a3a3a3',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              <RefreshCw size={12} />
              Clear all
            </button>
          ) : null}
        </div>

        {/* Error */}
        {active.error ? (
          <div
            style={{
              padding: 14,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10,
              color: '#fca5a5',
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            Could not load this tab: {active.error}
          </div>
        ) : null}

        {/* Grid / empty / skeleton */}
        {active.loading && active.products.length === 0 ? (
          <SkeletonGrid />
        ) : displayRows.length === 0 ? (
          <div
            style={{
              padding: '48px 16px',
              background: '#111111',
              border: '1px solid #1a1a1a',
              borderRadius: 16,
            }}
          >
            <EmptyState
              icon={Search}
              title={emptyCopy.title}
              description={emptyCopy.description}
              action={{
                label: 'Reset filters',
                onClick: handleResetFilters,
              }}
            />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
              gap: 14,
            }}
          >
            {displayRows.map((p) => (
              <ProductCard key={String(p.id)} product={p} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </main>

      {/* Drawer (lazy) */}
      <Suspense fallback={null}>
        {selected ? (
          <ProductDetailDrawer product={selected} onClose={handleClose} />
        ) : null}
      </Suspense>

      {/* Unused navigate reference kept so lint is happy on future nav additions */}
      <span hidden>{typeof navigate === 'function' ? '' : ''}</span>
    </div>
  );
}

// ── Skeleton grid (matches card dimensions to avoid layout shift) ──────────
function SkeletonGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: 14,
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            minHeight: 280,
            background: '#111111',
            border: '1px solid #1a1a1a',
            borderRadius: 14,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              background: 'linear-gradient(90deg, #0e0e0e 0%, #161616 50%, #0e0e0e 100%)',
              backgroundSize: '200% 100%',
              animation: 'mj-skeleton 1400ms ease-in-out infinite',
            }}
          />
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 14, borderRadius: 4, background: '#161616' }} />
            <div style={{ height: 14, width: '70%', borderRadius: 4, background: '#161616' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ height: 16, width: 60, borderRadius: 4, background: '#161616' }} />
              <div style={{ height: 16, width: 50, borderRadius: 4, background: '#161616' }} />
            </div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes mj-skeleton {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
