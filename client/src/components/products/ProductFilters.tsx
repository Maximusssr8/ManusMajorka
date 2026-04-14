/**
 * ProductFilters — popover-driven filter bar for the Products page.
 *
 * Replaces the inline pill wall with four compact trigger buttons
 * (Category / Score / Orders / Sort) plus the Market pill row. Each
 * trigger opens a floating popover panel with the matching control.
 *
 * Contract:
 *   - `initial`      — seed state (usually loaded from v3 storage by parent).
 *   - `onChange`     — debounced 300ms emit on every state change.
 *   - `categories`   — optional override list (defaults to BACKFILL_CATEGORIES).
 *
 * Persistence: writes to `majorka_product_filters_v3` on every change so
 * the state survives reloads independent of any parent-driven persistence.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';

export type Market = 'AU' | 'US' | 'UK' | 'all';
export type SortKey = 'orders_desc' | 'velocity_desc' | 'score_desc' | 'newest';

export interface ProductFilterState {
  market: Market;
  category: string;
  minScore: number;      // 0 means "no threshold"
  minOrders: number;     // 0 means "no threshold"
  sort: SortKey;
}

export const DEFAULT_FILTERS: ProductFilterState = {
  market: 'AU',
  category: '',
  minScore: 0,
  minOrders: 0,
  sort: 'orders_desc',
};

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

type PopoverKey = 'category' | 'score' | 'orders' | 'sort' | null;

export function ProductFilters({ onChange, categories, initial }: ProductFiltersProps) {
  const [state, setState] = useState<ProductFilterState>(() => {
    const loaded = loadPersistedFilters();
    return { ...loaded, ...(initial ?? {}) };
  });
  const [open, setOpen] = useState<PopoverKey>(null);
  const timerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  // Close popovers on outside click or Escape
  useEffect(() => {
    if (open === null) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null);
    }
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const categoryOptions = useMemo<ReadonlyArray<string>>(() => {
    const base = (categories && categories.length > 0 ? categories : BACKFILL_CATEGORIES).slice();
    return ['', ...base];
  }, [categories]);

  const setPartial = useCallback((patch: Partial<ProductFilterState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const toggle = useCallback((key: Exclude<PopoverKey, null>) => {
    setOpen((cur) => (cur === key ? null : key));
  }, []);

  const pill = (active: boolean): string =>
    `px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
      active
        ? 'bg-white/[0.10] border-white/25 text-white'
        : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06]'
    }`;

  const categoryLabel =
    state.category === '' ? 'All' : state.category.replace(/\b\w/g, (ch) => ch.toUpperCase());
  const scoreLabel =
    SCORE_THRESHOLDS.find((t) => t.value === state.minScore)?.label ?? 'Any';
  const ordersLabel =
    ORDER_THRESHOLDS.find((t) => t.value === state.minOrders)?.label ?? 'Any';
  const sortLabel =
    SORT_OPTIONS.find((o) => o.key === state.sort)?.label ?? 'Sort';

  return (
    <div
      ref={rootRef}
      className="flex flex-wrap gap-2 items-center px-4 md:px-8 py-3 bg-white/[0.02] border-b border-white/[0.06]"
    >
      {/* Market — kept as inline pills (small, always-visible) */}
      <div className="flex items-center gap-1.5 mr-1">
        <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">Market</span>
        {MARKETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setPartial({ market: m })}
            className={pill(state.market === m)}
          >
            {m === 'all' ? 'All' : m}
          </button>
        ))}
      </div>

      {/* Category popover */}
      <PopoverTrigger
        label="Category"
        value={categoryLabel}
        isOpen={open === 'category'}
        onToggle={() => toggle('category')}
      >
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto min-w-[180px]">
          {categoryOptions.map((c) => {
            const active = state.category === c;
            return (
              <button
                key={c || '__all__'}
                type="button"
                onClick={() => { setPartial({ category: c }); setOpen(null); }}
                className={`text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                  active
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {c ? c.replace(/\b\w/g, (ch) => ch.toUpperCase()) : 'All categories'}
              </button>
            );
          })}
        </div>
      </PopoverTrigger>

      {/* Score popover */}
      <PopoverTrigger
        label="Score"
        value={scoreLabel}
        isOpen={open === 'score'}
        onToggle={() => toggle('score')}
      >
        <div className="flex flex-wrap gap-1.5 min-w-[160px]">
          {SCORE_THRESHOLDS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setPartial({ minScore: t.value }); setOpen(null); }}
              className={pill(state.minScore === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </PopoverTrigger>

      {/* Orders popover */}
      <PopoverTrigger
        label="Orders"
        value={ordersLabel}
        isOpen={open === 'orders'}
        onToggle={() => toggle('orders')}
      >
        <div className="flex flex-wrap gap-1.5 min-w-[160px]">
          {ORDER_THRESHOLDS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setPartial({ minOrders: t.value }); setOpen(null); }}
              className={pill(state.minOrders === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </PopoverTrigger>

      <div className="flex-1 min-w-[8px]" />

      {/* Sort popover */}
      <PopoverTrigger
        label="Sort"
        value={sortLabel}
        isOpen={open === 'sort'}
        onToggle={() => toggle('sort')}
        align="right"
      >
        <div className="flex flex-col gap-1 min-w-[200px]">
          {SORT_OPTIONS.map((o) => {
            const active = state.sort === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => { setPartial({ sort: o.key }); setOpen(null); }}
                className={`text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                  active
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </PopoverTrigger>

      {/* Reset */}
      <button
        type="button"
        onClick={() => { setState({ ...DEFAULT_FILTERS }); setOpen(null); }}
        className="px-2.5 py-1.5 text-xs text-white/50 hover:text-white border border-transparent hover:border-white/15 rounded-lg transition-colors"
      >
        Reset
      </button>
    </div>
  );
}

interface PopoverTriggerProps {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  align?: 'left' | 'right';
}

function PopoverTrigger({ label, value, isOpen, onToggle, children, align = 'left' }: PopoverTriggerProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
          isOpen
            ? 'bg-white/[0.10] border-white/25 text-white'
            : 'bg-white/[0.03] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <span className="text-white/40 text-[10px] uppercase tracking-wider">{label}</span>
        <span className="text-white">{value}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen ? (
        <div
          role="dialog"
          className={`absolute top-[calc(100%+6px)] z-40 p-2 rounded-xl border border-white/[0.10] bg-[#0f0f0f] shadow-2xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ boxShadow: '0 12px 40px -8px rgba(0,0,0,0.6)' }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default ProductFilters;
