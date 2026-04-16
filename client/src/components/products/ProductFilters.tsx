/**
 * ProductFilters — standalone filter bar for the Products page.
 *
 * Supports the new filter contract (market / category / score / min-orders
 * / sort) and persists state in localStorage under
 * `majorka_product_filters_v2`. Filter changes are debounced 300ms before
 * being emitted through `onChange` so parent components can re-query
 * without thrashing.
 *
 * Styling is intentionally neutral — uses generic Tailwind utility
 * classes (bg-white/[0.04], border-white/[0.08], etc.) so it renders
 * correctly whether the project is on the old gold accent or the new
 * gold token palette.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

export type Market = 'AU' | 'US' | 'UK' | 'all';
export type SortKey = 'orders_desc' | 'velocity_desc' | 'score_desc' | 'newest';

export interface ProductFilterState {
  market: Market;
  category: string;
  minScore: number;      // 0 means "no threshold"
  minOrders: number;     // 0 means "no threshold"
  sort: SortKey;
  /** AU Moat — show only products held in an Australian warehouse. */
  auWarehouseOnly?: boolean;
}

export const DEFAULT_FILTERS: ProductFilterState = {
  market: 'all',  // Default to all — AU-specific data builds over time; 'AU' filter can empty the DB
  category: '',
  minScore: 0,
  minOrders: 0,
  sort: 'orders_desc',
  auWarehouseOnly: false,
};

// v3 — bumped to invalidate any stale `auWarehouseOnly: true` that would
// filter out 100% of products until the pipeline populates au_warehouse_available.
const STORAGE_KEY = 'majorka_product_filters_v3';

// 20 backfill categories from scripts/backfill-products.ts
export const BACKFILL_CATEGORIES: ReadonlyArray<string> = [
  'beauty', 'pets', 'home', 'fitness', 'tech',
  'fashion', 'kids', 'kitchen', 'auto', 'garden',
  'outdoor', 'office', 'phone accessories', 'lighting', 'bags',
  'shoes', 'jewelry', 'sports', 'tools', 'baby',
];

const SCORE_THRESHOLDS: ReadonlyArray<{ label: string; value: number }> = [
  { label: 'Any', value: 0 },
  { label: '70+', value: 70 },
  { label: '85+', value: 85 },
  { label: '95+', value: 95 },
];

const ORDER_THRESHOLDS: ReadonlyArray<{ label: string; value: number }> = [
  { label: 'Any', value: 0 },
  { label: '1k+', value: 1_000 },
  { label: '10k+', value: 10_000 },
  { label: '100k+', value: 100_000 },
];

const MARKETS: ReadonlyArray<Market> = ['AU', 'US', 'UK', 'all'];

const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: 'orders_desc',   label: 'Orders (high → low)' },
  { key: 'velocity_desc', label: 'Velocity (high → low)' },
  { key: 'score_desc',    label: 'Score (high → low)' },
  { key: 'newest',        label: 'Newest first' },
];

export function loadPersistedFilters(): ProductFilterState {
  if (typeof window === 'undefined') return { ...DEFAULT_FILTERS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FILTERS };
    const parsed = JSON.parse(raw) as Partial<ProductFilterState>;
    return {
      market: MARKETS.includes(parsed.market as Market) ? (parsed.market as Market) : DEFAULT_FILTERS.market,
      category: typeof parsed.category === 'string' ? parsed.category : DEFAULT_FILTERS.category,
      minScore: typeof parsed.minScore === 'number' ? parsed.minScore : DEFAULT_FILTERS.minScore,
      minOrders: typeof parsed.minOrders === 'number' ? parsed.minOrders : DEFAULT_FILTERS.minOrders,
      sort: SORT_OPTIONS.some((o) => o.key === parsed.sort) ? (parsed.sort as SortKey) : DEFAULT_FILTERS.sort,
      auWarehouseOnly: typeof parsed.auWarehouseOnly === 'boolean' ? parsed.auWarehouseOnly : false,
    };
  } catch {
    return { ...DEFAULT_FILTERS };
  }
}

function persistFilters(state: ProductFilterState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

interface ProductFiltersProps {
  onChange: (state: ProductFilterState) => void;
  categories?: ReadonlyArray<string>;
  initial?: Partial<ProductFilterState>;
}

export function ProductFilters({ onChange, categories, initial }: ProductFiltersProps) {
  const [state, setState] = useState<ProductFilterState>(() => {
    const loaded = loadPersistedFilters();
    return { ...loaded, ...(initial ?? {}) };
  });
  const timerRef = useRef<number | null>(null);

  // Debounced emit + persist (300ms)
  useEffect(() => {
    persistFilters(state);
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onChange(state);
    }, 300);
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [state, onChange]);

  const categoryOptions = useMemo(() => {
    const base = (categories && categories.length > 0 ? categories : BACKFILL_CATEGORIES).slice();
    return ['', ...base];
  }, [categories]);

  const pill = (active: boolean): string =>
    `px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
      active
        ? 'bg-white/[0.10] border-white/25 text-white'
        : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06]'
    }`;

  return (
    <div className="flex flex-wrap gap-3 items-center px-4 md:px-8 py-3 bg-white/[0.02] border-b border-white/[0.06]">
      {/* Market */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">Market</span>
        {MARKETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setState((s) => ({ ...s, market: m }))}
            className={pill(state.market === m)}
          >
            {m === 'all' ? 'All' : m}
          </button>
        ))}
      </div>

      {/* Category */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">Category</span>
        <select
          value={state.category}
          onChange={(e) => setState((s) => ({ ...s, category: e.target.value }))}
          className="bg-white/[0.04] border border-white/[0.08] text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-white/25 cursor-pointer"
        >
          {categoryOptions.map((c) => (
            <option key={c || '__all__'} value={c} className="bg-[#13151c]">
              {c ? c.replace(/\b\w/g, (ch) => ch.toUpperCase()) : 'All categories'}
            </option>
          ))}
        </select>
      </div>

      {/* Score threshold */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">Score</span>
        {SCORE_THRESHOLDS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setState((s) => ({ ...s, minScore: t.value }))}
            className={pill(state.minScore === t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Min orders */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">Orders</span>
        {ORDER_THRESHOLDS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setState((s) => ({ ...s, minOrders: t.value }))}
            className={pill(state.minOrders === t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* AU Warehouse toggle — hidden until pipeline populates au_warehouse_available.
          Currently 0/4,155 products have that flag set, so rendering the toggle
          produces a "0 shown" bug the moment a user clicks it.
          TODO: re-enable when au_warehouse data is populated by the pipeline. */}

      <div className="flex-1 min-w-[8px]" />

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">Sort</span>
        <select
          value={state.sort}
          onChange={(e) => setState((s) => ({ ...s, sort: e.target.value as SortKey }))}
          className="bg-white/[0.04] border border-white/[0.08] text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-white/25 cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key} className="bg-[#13151c]">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={() => setState({ ...DEFAULT_FILTERS })}
        className="px-2.5 py-1.5 text-xs text-white/50 hover:text-white border border-transparent hover:border-white/15 rounded-lg transition-colors"
      >
        Reset
      </button>
    </div>
  );
}

export default ProductFilters;
