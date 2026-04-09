import { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Search, List, LayoutGrid, ChevronDown, Heart, X,
  ExternalLink, Zap, Flame,
  Clock, TrendingUp, DollarSign, Award, Bookmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProducts, type OrderByColumn, type Product } from '@/hooks/useProducts';
import { useFavourites } from '@/hooks/useFavourites';
import { useAESearch, type AELiveProduct } from '@/hooks/useAESearch';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';

/* ══════════════════════════════════════════════════════════════
   Types + constants
   ══════════════════════════════════════════════════════════════ */

type SmartTabKey = 'all' | 'new' | 'trending' | 'highmargin' | 'top' | 'saved';

const SMART_TABS: { key: SmartTabKey; label: string; Icon: LucideIcon; iconClass?: string }[] = [
  { key: 'all',        label: 'All products',  Icon: LayoutGrid },
  { key: 'new',        label: 'New this week', Icon: Clock },
  { key: 'trending',   label: 'Trending',      Icon: TrendingUp,  iconClass: 'text-amber' },
  { key: 'highmargin', label: 'High margin',   Icon: DollarSign,  iconClass: 'text-green' },
  { key: 'top',        label: 'Score 90+',     Icon: Award,       iconClass: 'text-[#eab308]' },
  { key: 'saved',      label: 'Saved',         Icon: Bookmark },
];

const SORT_OPTIONS: { key: OrderByColumn; label: string }[] = [
  { key: 'sold_count',            label: 'Most orders' },
  { key: 'winning_score',         label: 'Highest score' },
  { key: 'est_daily_revenue_aud', label: 'Highest revenue' },
  { key: 'price_asc',             label: 'Price: low to high' },
  { key: 'price_desc',            label: 'Price: high to low' },
  { key: 'created_at',            label: 'Newest first' },
  { key: 'orders_asc',            label: 'Orders: low to high' },
];

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return 9999;
  return (Date.now() - ts) / 86400000;
}

function timeAgoShort(iso: string | null): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const days = Math.round((Date.now() - ts) / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  return `${Math.round(days / 30)} months ago`;
}

function readInitialParams(): { tab: SmartTabKey; search: string } {
  if (typeof window === 'undefined') return { tab: 'all', search: '' };
  const params = new URLSearchParams(window.location.search);
  const t = params.get('tab');
  const validTabs: SmartTabKey[] = ['all', 'new', 'trending', 'highmargin', 'top', 'saved'];
  const tab = validTabs.includes(t as SmartTabKey) ? (t as SmartTabKey) : 'all';
  return { tab, search: params.get('search') ?? '' };
}

function scoreTierStyle(score: number): { backgroundColor: string; color: string } {
  if (score >= 90) return { backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' };
  if (score >= 75) return { backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
  if (score >= 50) return { backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316' };
  return               { backgroundColor: 'rgba(239,68,68,0.15)',  color: '#ef4444' };
}

function categoryColor(cat: string | null): { backgroundColor: string; color: string } {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('car') || c.includes('auto'))                                return { backgroundColor: 'rgba(249,115,22,0.12)', color: '#f97316' };
  if (c.includes('phone') || c.includes('mobile'))                            return { backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8' };
  if (c.includes('home') || c.includes('kitchen') || c.includes('household')) return { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' };
  if (c.includes('hair') || c.includes('beauty') || c.includes('wig'))        return { backgroundColor: 'rgba(236,72,153,0.12)', color: '#f472b6' };
  if (c.includes('hardware') || c.includes('tool'))                           return { backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
  return { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' };
}

/* ══════════════════════════════════════════════════════════════
   ScoreBadge — 32x32 square, Math.round, 4-tier colour
   ══════════════════════════════════════════════════════════════ */

function ScoreBadge({ score, size = 32 }: { score: number; size?: number }) {
  const rounded = Math.round(score);
  if (!rounded) return <span className="text-xs text-muted">—</span>;
  return (
    <span
      className="inline-flex items-center justify-center rounded font-bold tabular-nums"
      style={{
        width: size,
        height: size,
        fontSize: size >= 32 ? 13 : 11,
        ...scoreTierStyle(rounded),
      }}
    >
      {rounded}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   FilterPill with dropdown popover
   ══════════════════════════════════════════════════════════════ */

interface FilterPillProps {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onClear?: () => void;
  children?: React.ReactNode;
}

function FilterPill({ label, active, open, onToggle, onClose, onClear, children }: FilterPillProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border whitespace-nowrap ${
          active
            ? 'bg-accent/15 border-accent text-accent-hover'
            : 'bg-card border-white/10 text-body hover:border-white/20'
        }`}
      >
        <span>{label}</span>
        {active && onClear ? (
          <span
            role="button"
            aria-label="Clear filter"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-accent-hover text-xs font-semibold cursor-pointer ml-0.5"
          >
            ×
          </span>
        ) : (
          <ChevronDown size={12} className="text-muted" strokeWidth={2} />
        )}
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 bg-raised border border-white/[0.12] rounded-xl p-4 min-w-[220px] shadow-hover">
          {children}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Product detail side panel — spec compliant
   ══════════════════════════════════════════════════════════════ */

function ProductSidePanel({ product, onClose }: { product: Product | null; onClose: () => void }) {
  if (!product) return null;
  const score = Math.round(product.winning_score ?? 0);
  const orders = product.sold_count ?? 0;
  const price = product.price_aud != null ? Number(product.price_aud) : null;
  const estDaily = product.est_daily_revenue_aud ?? null;
  const estMonthly = estDaily != null ? estDaily * 30 : null;
  const aliHref = (product as Product & { aliexpress_url?: string }).aliexpress_url ?? product.product_url ?? null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/55 z-[99] animate-[fadeIn_180ms_ease]"
      />
      <aside className="fixed right-0 top-0 w-[420px] max-w-full h-screen bg-surface border-l border-white/[0.08] z-[100] overflow-y-auto flex flex-col font-body text-text shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <h3 className="font-display text-base font-semibold text-text line-clamp-2 leading-snug flex-1 min-w-0">
            {product.product_title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-text hover:bg-white/[0.08] transition-colors cursor-pointer p-1.5 rounded-md text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {/* Image */}
        <div className="m-4">
          <div className="w-full h-[220px] rounded-md overflow-hidden bg-card border border-white/[0.08]">
            {product.image_url && (
              <img
                src={proxyImage(product.image_url) ?? product.image_url}
                alt={product.product_title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="px-4 grid grid-cols-2 gap-2.5">
          {[
            { label: 'Sell Price', value: price != null ? `$${price.toFixed(2)}` : '—', className: 'text-text' },
            { label: 'Orders/Mo',  value: orders ? orders.toLocaleString() : '—', className: orders ? 'text-green' : 'text-muted' },
            { label: 'AI Score',   value: score ? `${score}/100` : '—', className: 'text-accent-hover' },
            { label: 'Est Rev',    value: estMonthly != null ? `$${Math.round(estMonthly).toLocaleString()}` : '—', className: 'text-green' },
          ].map((cell) => (
            <div key={cell.label} className="bg-card border border-white/[0.06] rounded-md p-3.5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-white/40 mb-1.5">
                {cell.label}
              </div>
              <div className={`text-base font-bold tabular-nums ${cell.className}`}>
                {cell.value}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4">
          {product.category && (
            <div className="text-xs text-body mb-2">
              <span className="text-muted">Category: </span>
              {product.category}
            </div>
          )}
          {product.created_at && (
            <div className="text-xs text-body">
              <span className="text-muted">Added: </span>
              {timeAgoShort(product.created_at)}
            </div>
          )}
        </div>

        {aliHref && (
          <a
            href={aliHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-4 mb-4 bg-white/[0.06] border border-white/[0.07] rounded-lg py-3 text-sm text-text font-medium flex items-center justify-center gap-2 no-underline hover:bg-white/10 transition-colors"
          >
            View on AliExpress
            <ExternalLink size={14} strokeWidth={1.75} />
          </a>
        )}

        <div className="flex-1" />

        {/* Sticky bottom */}
        <div className="sticky bottom-0 bg-surface border-t border-white/[0.07] p-4 flex gap-2.5">
          <button className="flex-1 bg-accent hover:bg-accent-hover text-white rounded-md py-3 text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
            <Zap size={14} strokeWidth={2} />
            Create Ad
          </button>
          <button className="flex-1 bg-white/[0.06] hover:bg-white/10 border border-white/[0.07] text-text rounded-md py-3 text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
            <Heart size={14} strokeWidth={1.75} />
            Save
          </button>
        </div>
      </aside>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════ */

export default function AppProducts() {
  const initial = readInitialParams();
  const [, navigate] = useLocation();
  const [orderBy, setOrderBy] = useState<OrderByColumn>('sold_count');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [perPage, setPerPage] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<SmartTabKey>(initial.tab);
  const [searchMode, setSearchMode] = useState<'db' | 'live'>(initial.search ? 'live' : 'db');
  const [liveQuery, setLiveQuery] = useState(initial.search);
  const [searchInput, setSearchInput] = useState(initial.search);

  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [minOrders, setMinOrders] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [scoreMin, setScoreMin] = useState<number>(0);
  const [scoreMax, setScoreMax] = useState<number>(100);

  const [openPill, setOpenPill] = useState<string | null>(null);
  const closePill = () => setOpenPill(null);

  const aeSearch = useAESearch();
  const fav = useFavourites();

  useEffect(() => {
    if (initial.search && initial.search.trim().length >= 2) {
      aeSearch.search({ q: initial.search.trim(), reset: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLimit = perPage * page;
  const { products: allFetched, loading, total } = useProducts({
    limit: Math.min(fetchLimit, 200),
    orderBy,
    tab: activeTab === 'saved' ? 'all' : activeTab,
    category: categoryFilter || undefined,
    minPrice: priceMin ?? undefined,
    maxPrice: priceMax ?? undefined,
    minOrders: minOrders ?? undefined,
    minScore: scoreMin > 0 ? scoreMin : undefined,
  });

  const filtered = useMemo<Product[]>(() => {
    if (activeTab === 'saved') {
      return fav.favourites.map((f) => ({
        id: f.product_id,
        product_title: f.product_title ?? '',
        category: f.category,
        platform: 'aliexpress',
        price_aud: f.price_aud,
        sold_count: f.sold_count,
        winning_score: f.winning_score,
        trend: null,
        est_daily_revenue_aud: null,
        image_url: f.image_url,
        product_url: f.product_url,
        created_at: f.saved_at,
        updated_at: null,
      } satisfies Product));
    }
    if (scoreMax < 100) {
      return allFetched.filter((p) => (p.winning_score ?? 0) <= scoreMax);
    }
    return allFetched;
  }, [activeTab, scoreMax, allFetched, fav.favourites]);

  const filteredTotal = activeTab === 'saved' ? fav.count : total;
  const offset = (page - 1) * perPage;
  const pageSlice = filtered.slice(offset, offset + perPage);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / perPage));

  const tabCounts = useMemo(() => {
    return {
      all:        total,
      new:        allFetched.filter((p) => daysSince(p.created_at) <= 7).length,
      trending:   allFetched.filter((p) => (p.sold_count ?? 0) > 50000).length,
      highmargin: allFetched.filter((p) => {
        const price = Number(p.price_aud ?? 999);
        return price < 15 && (p.winning_score ?? 0) > 75;
      }).length,
      top:        allFetched.filter((p) => (p.winning_score ?? 0) >= 90).length,
      saved:      fav.count,
    };
  }, [total, allFetched, fav.count]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allFetched.forEach((p) => {
      if (p.category && p.category.trim().length > 0) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [allFetched]);

  const anyFilterActive =
    priceMin !== null || priceMax !== null || minOrders !== null ||
    categoryFilter !== '' || scoreMin > 0 || scoreMax < 100;

  function clearFilters(): void {
    setPriceMin(null);
    setPriceMax(null);
    setMinOrders(null);
    setCategoryFilter('');
    setScoreMin(0);
    setScoreMax(100);
  }

  function runSearch(): void {
    const v = searchInput.trim();
    if (v.length >= 2) {
      setLiveQuery(v);
      setSearchMode('live');
      aeSearch.search({ q: v, reset: true });
    }
  }

  function backToDb(): void {
    setSearchMode('db');
    aeSearch.reset();
    setLiveQuery('');
    setSearchInput('');
  }

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === orderBy)?.label ?? 'Sort';

  const numberInputClass = 'bg-bg border border-white/[0.07] rounded-md px-2.5 py-2 text-text w-[90px] outline-none text-sm tabular-nums box-border';

  return (
    <div className="min-h-screen bg-bg font-body text-text">
      {/* Breadcrumb */}
      <div className="px-8 pt-6 pb-2 text-xs text-muted">
        Home <span className="mx-1.5 text-white/20">/</span> Products
      </div>

      {/* Search bar */}
      <div className="px-8 pb-4 flex items-center gap-3">
        <div className="flex-1 relative flex items-center bg-card border border-white/10 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 rounded-xl h-[52px] px-4 gap-3 transition-all">
          <Search size={16} strokeWidth={2} className="text-accent/60 shrink-0" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
            placeholder={`Search ${total != null && total > 0 ? total.toLocaleString() : '…'} products or explore live from AliExpress`}
            className="flex-1 bg-transparent text-[15px] text-text placeholder-muted outline-none min-w-0"
          />
        </div>
        <div className="flex items-center gap-1 bg-card border border-white/10 rounded-lg p-1">
          {(['db', 'live'] as const).map((mode) => {
            const active = searchMode === mode;
            return (
              <button
                key={mode}
                onClick={() => { if (mode === 'db') backToDb(); else runSearch(); }}
                className={`text-sm font-medium rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-accent/15 text-accent-hover border border-accent/30'
                    : 'text-muted border border-transparent hover:text-text'
                }`}
              >
                {mode === 'db' ? 'Database' : 'Live AliExpress'}
              </button>
            );
          })}
        </div>
      </div>

      {searchMode === 'live' && (
        <div className="px-8 pb-3 text-sm text-muted">
          Showing {aeSearch.total.toLocaleString()} live results for <span className="text-text">"{liveQuery}"</span>
        </div>
      )}

      {/* Filter bar */}
      {searchMode === 'db' && (
        <div className="px-8 pb-4 flex gap-2 flex-wrap items-center">
          <FilterPill
            label={priceMin !== null || priceMax !== null
              ? `Price: $${priceMin ?? 0}–$${priceMax ?? '∞'}`
              : 'Price'}
            active={priceMin !== null || priceMax !== null}
            open={openPill === 'price'}
            onToggle={() => setOpenPill(openPill === 'price' ? null : 'price')}
            onClose={closePill}
            onClear={() => { setPriceMin(null); setPriceMax(null); }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2.5">
              Price range
            </div>
            <div className="flex gap-2.5 items-center">
              <input type="number" placeholder="Min" value={priceMin ?? ''}
                onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : null)}
                className={numberInputClass} />
              <span className="text-muted text-xs">to</span>
              <input type="number" placeholder="Max" value={priceMax ?? ''}
                onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : null)}
                className={numberInputClass} />
            </div>
          </FilterPill>

          <FilterPill
            label={minOrders !== null ? `Min orders: ${minOrders.toLocaleString()}` : 'Min Orders'}
            active={minOrders !== null}
            open={openPill === 'minOrders'}
            onToggle={() => setOpenPill(openPill === 'minOrders' ? null : 'minOrders')}
            onClose={closePill}
            onClear={() => setMinOrders(null)}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2.5">
              Minimum orders
            </div>
            <input type="number" placeholder="e.g. 1000" value={minOrders ?? ''}
              onChange={(e) => setMinOrders(e.target.value ? Number(e.target.value) : null)}
              className={`${numberInputClass} !w-[180px]`} />
          </FilterPill>

          <FilterPill
            label={categoryFilter ? `Category: ${shortenCategory(categoryFilter)}` : 'Category'}
            active={categoryFilter !== ''}
            open={openPill === 'category'}
            onToggle={() => setOpenPill(openPill === 'category' ? null : 'category')}
            onClose={closePill}
            onClear={() => setCategoryFilter('')}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2.5">
              Category
            </div>
            {availableCategories.length > 0 ? (
              <div className="max-h-[220px] overflow-y-auto flex flex-col gap-0.5">
                {['', ...availableCategories].map((opt) => {
                  const sel = categoryFilter === opt;
                  return (
                    <div
                      key={opt || '__all__'}
                      onClick={() => { setCategoryFilter(opt); closePill(); }}
                      className={`px-3 py-2 cursor-pointer rounded-md text-sm transition-colors ${
                        sel ? 'bg-accent/15 text-text' : 'text-body hover:bg-white/[0.05]'
                      }`}
                    >
                      {opt ? shortenCategory(opt) : 'All categories'}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted text-xs">No categories loaded yet.</div>
            )}
          </FilterPill>

          <FilterPill
            label={scoreMin > 0 || scoreMax < 100 ? `Score: ${scoreMin}–${scoreMax}` : 'Score'}
            active={scoreMin > 0 || scoreMax < 100}
            open={openPill === 'score'}
            onToggle={() => setOpenPill(openPill === 'score' ? null : 'score')}
            onClose={closePill}
            onClear={() => { setScoreMin(0); setScoreMax(100); }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2.5">
              Score range
            </div>
            <div className="flex gap-2.5 items-center">
              <input type="number" min={0} max={100} placeholder="Min" value={scoreMin || ''}
                onChange={(e) => setScoreMin(e.target.value ? Math.max(0, Math.min(100, Number(e.target.value))) : 0)}
                className={numberInputClass} />
              <span className="text-muted text-xs">to</span>
              <input type="number" min={0} max={100} placeholder="Max" value={scoreMax !== 100 ? scoreMax : ''}
                onChange={(e) => setScoreMax(e.target.value ? Math.max(0, Math.min(100, Number(e.target.value))) : 100)}
                className={numberInputClass} />
            </div>
          </FilterPill>

          <div className="flex-1" />

          <FilterPill
            label={`Sort: ${activeSortLabel}`}
            active={false}
            open={openPill === 'sort'}
            onToggle={() => setOpenPill(openPill === 'sort' ? null : 'sort')}
            onClose={closePill}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2.5">
              Sort by
            </div>
            <div className="max-h-[220px] overflow-y-auto flex flex-col gap-0.5">
              {SORT_OPTIONS.map((opt) => {
                const sel = orderBy === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => { setOrderBy(opt.key); closePill(); }}
                    className={`px-3 py-2 cursor-pointer rounded-md text-sm transition-colors ${
                      sel ? 'bg-accent/15 text-text' : 'text-body hover:bg-white/[0.05]'
                    }`}
                  >
                    {opt.label}
                  </div>
                );
              })}
            </div>
          </FilterPill>

          {anyFilterActive && (
            <button
              onClick={clearFilters}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg px-3.5 py-2 cursor-pointer hover:bg-red-500/20 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Tab bar */}
      {searchMode === 'db' && (
        <div className="px-8 flex items-center gap-1.5 mb-2 overflow-x-auto">
          {SMART_TABS.map((tab) => {
            const active = activeTab === tab.key;
            const count = tabCounts[tab.key];
            const Icon = tab.Icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors border ${
                  active
                    ? 'bg-accent/15 border-accent/30 text-accent-hover'
                    : 'bg-transparent border-transparent text-white/45 hover:text-white/75 hover:bg-white/[0.04]'
                }`}
              >
                <Icon
                  size={14}
                  strokeWidth={1.75}
                  className={active ? 'text-accent-hover' : tab.iconClass ?? ''}
                />
                <span>{tab.label}</span>
                <span className="bg-white/[0.08] rounded-full px-1.5 py-0 text-[11px] tabular-nums ml-0.5">
                  {count >= 1000 ? `${Math.round(count / 1000)}k` : count}
                </span>
              </button>
            );
          })}
          <div className="flex-1" />
          <div className="flex gap-1 shrink-0">
            {(['table', 'grid'] as const).map((mode) => {
              const active = view === mode;
              const Icon = mode === 'table' ? List : LayoutGrid;
              return (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  aria-label={mode}
                  className={`w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                    active ? 'bg-raised text-text' : 'text-muted hover:text-body'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results header */}
      {searchMode === 'db' && (
        <div className="px-8 py-3 flex items-center justify-between">
          <div className="text-sm text-muted">
            {loading ? 'Loading products…' : `${filteredTotal.toLocaleString()} products`}
          </div>
        </div>
      )}

      {/* Body */}
      {searchMode === 'live' ? (
        <LiveSearchView aeSearch={aeSearch} onSelect={setSelectedProduct} />
      ) : view === 'table' ? (
        <ListTable
          products={pageSlice}
          loading={loading}
          onSelect={setSelectedProduct}
          isFavourite={fav.isFavourite}
          onToggleFav={fav.toggleFavourite}
        />
      ) : (
        <GridCards
          products={pageSlice}
          loading={loading}
          onSelect={setSelectedProduct}
          navigate={navigate}
        />
      )}

      {/* Pagination */}
      {searchMode === 'db' && filteredTotal > 0 && (
        <div className="mx-8 mt-4 mb-12 flex items-center gap-3 flex-wrap">
          <div className="text-sm text-muted tabular-nums">
            Showing {(offset + 1).toLocaleString()}–{Math.min(offset + perPage, filteredTotal).toLocaleString()} of {filteredTotal.toLocaleString()}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <PageBtn disabled={page === 1} onClick={() => setPage(page - 1)}>‹</PageBtn>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const start = Math.max(1, page - 2);
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <PageBtn key={p} active={p === page} onClick={() => setPage(p)}>
                  {p}
                </PageBtn>
              );
            })}
            <PageBtn disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</PageBtn>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="bg-raised border border-white/[0.07] rounded-md px-2.5 py-1 text-sm text-body outline-none ml-2"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
      )}

      <ProductSidePanel product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Pagination button
   ══════════════════════════════════════════════════════════════ */

function PageBtn({ children, active, disabled, onClick }: {
  children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 rounded-md text-sm flex items-center justify-center transition-colors border ${
        active
          ? 'bg-accent border-accent text-white'
          : disabled
            ? 'bg-raised border-white/[0.07] text-muted opacity-50 cursor-not-allowed'
            : 'bg-raised border-white/[0.07] text-body hover:text-text cursor-pointer'
      }`}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   List view
   ══════════════════════════════════════════════════════════════ */

interface ListTableProps {
  products: Product[];
  loading: boolean;
  onSelect: (p: Product) => void;
  isFavourite: (id: string | number) => boolean;
  onToggleFav: (p: Product) => Promise<void>;
}

function ListTable({ products, loading, onSelect, isFavourite, onToggleFav }: ListTableProps) {
  if (loading && products.length === 0) {
    return (
      <div className="mx-8 bg-surface border border-white/[0.07] rounded-2xl overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`h-[72px] px-6 flex items-center gap-3.5 ${i === 7 ? '' : 'border-b border-white/[0.04]'}`}
          >
            <span className="w-5 h-3 bg-white/[0.04] rounded animate-pulse" />
            <span className="w-14 h-14 bg-white/[0.04] rounded-xl animate-pulse" />
            <span className="flex-1 h-3.5 bg-white/[0.04] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) return <EmptyState />;
  return (
    <div className="mx-8 bg-surface border border-white/[0.07] rounded-2xl overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-12" />
          <col className="w-[280px]" />
          <col className="w-[140px]" />
          <col className="w-[100px]" />
          <col className="w-[100px]" />
          <col className="w-[100px]" />
          <col className="w-[120px]" />
          <col />
        </colgroup>
        <thead>
          <tr className="bg-[#0f1629] border-b border-white/[0.06]">
            {['#', 'Product', 'Category', 'Score', 'Orders', 'Price', 'Revenue', ''].map((h, i) => (
              <th
                key={h + i}
                className={`text-[11px] font-semibold uppercase tracking-widest text-white/45 px-5 py-3.5 ${
                  i === 0 || i === 1 || i === 2 ? 'text-left' : i === 7 ? 'text-center' : 'text-right'
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => {
            const score = Math.round(p.winning_score ?? 0);
            const orders = p.sold_count ?? 0;
            const estMonthly = p.est_daily_revenue_aud != null ? p.est_daily_revenue_aud * 30 : null;
            const isNew = daysSince(p.created_at) <= 7;
            const fav = isFavourite(p.id);
            const isLast = i === products.length - 1;
            return (
              <tr
                key={p.id}
                onClick={() => onSelect(p)}
                className={`h-[72px] ${isLast ? '' : 'border-b border-white/[0.04]'} hover:bg-white/[0.035] cursor-pointer transition-colors`}
              >
                <td className="px-5 text-xs text-white/20 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td className="px-5">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.image_url ? (
                      <img
                        src={proxyImage(p.image_url) ?? p.image_url}
                        alt={p.product_title}
                        loading="lazy"
                        className="w-14 h-14 rounded-lg border border-white/[0.08] bg-card object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg border border-white/[0.08] bg-card flex items-center justify-center text-muted shrink-0">—</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/90 truncate">
                        {p.product_title}
                      </p>
                      {isNew && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-green/15 text-green rounded">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5">
                  {p.category ? (
                    <span
                      className="inline-block text-[11px] font-medium px-2 py-0.5 rounded truncate max-w-[124px]"
                      style={categoryColor(p.category)}
                    >
                      {shortenCategory(p.category)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>
                <td className="px-5 text-right">
                  <ScoreBadge score={score} />
                </td>
                <td className={`px-5 text-right text-base font-bold tabular-nums ${orders > 0 ? 'text-text' : 'text-muted'}`}>
                  {orders > 150000 && <Flame size={12} className="inline text-amber mr-1" />}
                  {orders > 0 ? fmtK(orders) : '—'}
                </td>
                <td className="px-5 text-right text-base font-bold text-text tabular-nums">
                  {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}
                </td>
                <td className={`px-5 text-right text-base font-bold tabular-nums ${estMonthly != null ? 'text-green' : 'text-muted'}`}>
                  {estMonthly != null ? `$${Math.round(estMonthly).toLocaleString()}` : '—'}
                </td>
                <td className="px-5 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); void onToggleFav(p); }}
                    aria-label="Save"
                    className={`inline-flex items-center justify-center p-1 rounded transition-colors cursor-pointer ${
                      fav ? 'text-accent' : 'text-muted hover:text-text'
                    }`}
                  >
                    <Heart size={16} strokeWidth={1.75} fill={fav ? 'currentColor' : 'none'} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Grid view — 3 columns, large product images
   ══════════════════════════════════════════════════════════════ */

interface GridCardsProps {
  products: Product[];
  loading: boolean;
  onSelect: (p: Product) => void;
  navigate: (path: string) => void;
}

function GridCards({ products, loading, onSelect }: GridCardsProps) {
  if (loading && products.length === 0) {
    return (
      <div className="px-8 grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="w-full h-48 bg-white/[0.04] animate-pulse" />
            <div className="p-3.5">
              <span className="inline-block w-[90%] h-4 bg-white/[0.04] rounded mb-2 animate-pulse" />
              <span className="inline-block w-[60%] h-3 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) return <EmptyState />;
  return (
    <div className="px-8 grid grid-cols-3 gap-4">
      {products.map((p) => {
        const score = Math.round(p.winning_score ?? 0);
        const orders = p.sold_count ?? 0;
        const estMonthly = p.est_daily_revenue_aud != null ? p.est_daily_revenue_aud * 30 : null;
        const isNew = daysSince(p.created_at) <= 7;
        return (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            className="bg-card border border-white/[0.07] rounded-xl overflow-hidden hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-hover transition-all duration-150 cursor-pointer flex flex-col"
          >
            <div className="relative h-48 overflow-hidden">
              {p.image_url ? (
                <img
                  src={proxyImage(p.image_url) ?? p.image_url}
                  alt={p.product_title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-display font-bold text-muted bg-raised">
                  {(p.product_title?.[0] ?? '?').toUpperCase()}
                </div>
              )}
              {/* Bottom gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />
              {score > 0 && (
                <div className="absolute top-2 left-2">
                  <ScoreBadge score={score} />
                </div>
              )}
              {isNew && (
                <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 bg-green/20 text-green rounded">
                  NEW
                </span>
              )}
            </div>
            <div className="p-3.5 flex-1 flex flex-col">
              <p className="text-sm font-medium text-text line-clamp-2 mb-2 min-h-[36px]">
                {p.product_title}
              </p>
              <div className="flex items-center gap-1.5 mb-3">
                {p.category && (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded truncate max-w-[140px]"
                    style={categoryColor(p.category)}
                  >
                    {shortenCategory(p.category)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 mt-auto">
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Orders</p>
                  <p className="text-sm font-bold text-text tabular-nums">
                    {orders > 0 ? fmtK(orders) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Price</p>
                  <p className="text-sm font-medium text-body tabular-nums">
                    {p.price_aud != null ? `$${Number(p.price_aud).toFixed(0)}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Rev</p>
                  <p className="text-sm font-medium text-green tabular-nums">
                    {estMonthly != null ? `$${Math.round(estMonthly / 1000)}k` : '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="flex-1 py-1.5 text-xs font-medium text-body bg-white/[0.06] rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ♡ Save
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                  className="flex-1 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  View →
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Empty state
   ══════════════════════════════════════════════════════════════ */

function EmptyState() {
  return (
    <div className="mx-8 my-10 p-16 bg-surface border border-white/[0.07] rounded-2xl text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-raised mb-4">
        <Search size={24} className="text-muted" strokeWidth={1.75} />
      </div>
      <div className="font-display text-xl font-semibold text-text mb-2">
        No products match
      </div>
      <div className="text-sm text-body max-w-sm mx-auto leading-relaxed">
        Try clearing your filters or switching to Live AliExpress search to pull fresh results from the marketplace.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Live AE search grid
   ══════════════════════════════════════════════════════════════ */

function LiveSearchView({ aeSearch, onSelect }: {
  aeSearch: ReturnType<typeof useAESearch>;
  onSelect: (p: Product) => void;
}) {
  if (aeSearch.loading && aeSearch.products.length === 0) {
    return (
      <div className="px-8 grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-white/[0.07] rounded-xl h-[360px] animate-pulse" />
        ))}
      </div>
    );
  }
  if (aeSearch.products.length === 0) return <EmptyState />;
  return (
    <div className="px-8 grid grid-cols-3 gap-4">
      {aeSearch.products.map((p: AELiveProduct, i) => (
        <div
          key={`${p.id}-${i}`}
          onClick={() => {
            const asProduct: Product = {
              id: p.id,
              product_title: p.product_title,
              category: p.category,
              platform: 'aliexpress',
              price_aud: p.price_aud,
              sold_count: p.sold_count,
              winning_score: p.winning_score,
              trend: null,
              est_daily_revenue_aud: null,
              image_url: p.image_url,
              product_url: p.product_url,
              created_at: new Date().toISOString(),
              updated_at: null,
            };
            onSelect(asProduct);
          }}
          className="bg-card border border-white/[0.07] rounded-xl overflow-hidden hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-hover transition-all duration-150 cursor-pointer"
        >
          <div className="h-48 bg-raised">
            {p.image_url && (
              <img
                src={proxyImage(p.image_url) ?? p.image_url}
                alt={p.product_title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="p-3.5">
            <p className="text-sm text-text line-clamp-2 mb-2">{p.product_title}</p>
            <p className="text-xs text-body tabular-nums">
              {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : ''}
              {p.sold_count ? ` · ${fmtK(p.sold_count)} orders` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
