import { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  Search, List, LayoutGrid, ChevronDown, Heart,
  ExternalLink, Zap, Flame, ShoppingBag, Store, Calculator, ChevronRight,
  Clock, TrendingUp, DollarSign, Award, Bookmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
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
  { key: 'new',        label: 'Recently Added', Icon: Clock },
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

/**
 * Threshold for the NEW badge + Recently Added tab. Temporarily 90
 * days because the entire seed was imported at once — a 7-day window
 * shows 0 rows. Drop back to 7 once fresh scrapes are flowing in.
 */
const NEW_DAYS_THRESHOLD = 90;

/**
 * Monthly revenue. ONLY uses est_daily_revenue_aud × 30 — no
 * sold_count × price fallback. If the scoring pipeline hasn't
 * populated the column for a row, show —.
 */
function monthlyRevenue(p: Product): number | null {
  const daily = p.est_daily_revenue_aud;
  if (daily != null && daily > 0) return daily * 30;
  return null;
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
        {active && <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />}
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
   Product detail sheet — Radix Dialog-as-right-Sheet
   ══════════════════════════════════════════════════════════════ */

function ProductSheet({
  product,
  open,
  onOpenChange,
  navigate,
  onToggleFav,
  isFav,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  navigate: (path: string) => void;
  onToggleFav: (p: Product) => Promise<void> | void;
  isFav: boolean;
}) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [sellPrice,  setSellPrice]  = useState<number>(0);
  const [landedCost, setLandedCost] = useState<number>(0);
  const [shipping,   setShipping]   = useState<number>(5);
  const [feePct,     setFeePct]     = useState<number>(5);

  // Reset calc inputs whenever a new product opens
  useEffect(() => {
    if (!product) return;
    const base = product.price_aud != null ? Number(product.price_aud) : 0;
    setSellPrice(Math.round(base * 3 * 100) / 100);
    setLandedCost(base);
    setShipping(5);
    setFeePct(5);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) return null;
  const score = Math.round(product.winning_score ?? 0);
  const orders = product.sold_count ?? 0;
  const price = product.price_aud != null ? Number(product.price_aud) : null;
  const estMonthly = monthlyRevenue(product);
  const aliHref = (product as Product & { aliexpress_url?: string }).aliexpress_url ?? product.product_url ?? null;

  const grossProfit = sellPrice - landedCost - shipping;
  const marginPct = sellPrice > 0 ? (grossProfit / sellPrice) * 100 : 0;
  const netAfterFees = grossProfit * (1 - feePct / 100);
  const profitColor = grossProfit >= 0 ? 'text-green' : 'text-red-400';

  function handleCreateAd() {
    sessionStorage.setItem('majorka_ad_product', JSON.stringify({
      id: product.id,
      title: product.product_title,
      image: product.image_url,
      price: product.price_aud,
    }));
    onOpenChange(false);
    navigate('/app/ads-studio');
    toast.success('Product loaded into Ads Studio');
  }

  function handleImportToStore() {
    sessionStorage.setItem('majorka_import_product', JSON.stringify({
      id: product.id,
      title: product.product_title,
      image: product.image_url,
      price: product.price_aud,
      description: product.product_title,
      aliexpress_url: product.product_url,
    }));
    onOpenChange(false);
    navigate('/app/store-builder');
    toast.success('Product imported to Store Builder');
  }

  async function handleToggleSave() {
    const wasFav = isFav;
    await onToggleFav(product);
    if (wasFav) toast('Removed from saved');
    else toast.success('Product saved');
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed right-0 top-0 z-[100] h-screen w-full md:w-[420px] bg-surface border-l border-white/[0.08] overflow-y-auto flex flex-col font-body text-text shadow-[-20px_0_60px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:duration-300 data-[state=closed]:duration-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-5 pb-0">
            <Dialog.Title className="font-display text-base font-semibold text-text line-clamp-2 leading-snug flex-1 min-w-0">
              {product.product_title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="text-muted hover:text-text hover:bg-white/[0.08] transition-colors cursor-pointer p-1.5 rounded-md text-xl leading-none shrink-0"
              >
                ×
              </button>
            </Dialog.Close>
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
              className="mx-4 mb-3 bg-white/[0.06] border border-white/[0.07] rounded-lg py-3 text-sm text-text font-medium flex items-center justify-center gap-2 no-underline hover:bg-white/10 transition-colors"
            >
              View on AliExpress
              <ExternalLink size={14} strokeWidth={1.75} />
            </a>
          )}

          {/* Import to Store */}
          <button
            onClick={handleImportToStore}
            className="mx-4 mb-4 bg-white/[0.06] border border-white/10 rounded-xl py-3 text-sm font-medium text-text flex items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Store size={14} strokeWidth={1.75} />
            Import to Store
          </button>

          {/* Profit calculator — collapsible */}
          <div className="mx-4 mb-4 bg-raised rounded-xl overflow-hidden border border-white/[0.07]">
            <button
              onClick={() => setCalcOpen((o) => !o)}
              className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calculator size={14} strokeWidth={1.75} className="text-accent-hover" />
                <span className="text-sm font-semibold text-text">Calculate profit</span>
              </div>
              <ChevronRight
                size={14}
                strokeWidth={2}
                className={`text-muted transition-transform ${calcOpen ? 'rotate-90' : ''}`}
              />
            </button>
            {calcOpen && (
              <div className="px-4 pb-4 pt-1 space-y-3">
                {[
                  { label: 'Sell price',     value: sellPrice,  set: setSellPrice,  prefix: '$' },
                  { label: 'Landed cost',    value: landedCost, set: setLandedCost, prefix: '$' },
                  { label: 'Shipping',       value: shipping,   set: setShipping,   prefix: '$' },
                  { label: 'Platform fee %', value: feePct,     set: setFeePct,     prefix: '' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <label className="text-xs text-muted flex-1">{row.label}</label>
                    <div className="flex items-center gap-1 w-[110px]">
                      {row.prefix && <span className="text-xs text-muted">{row.prefix}</span>}
                      <input
                        type="number"
                        value={row.value}
                        onChange={(e) => row.set(Number(e.target.value) || 0)}
                        className="flex-1 bg-bg border border-white/[0.08] rounded-md px-2.5 py-1.5 text-sm text-text tabular-nums outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                ))}
                <div className="border-t border-white/[0.08] pt-3 mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Gross profit</span>
                    <span className={`font-bold tabular-nums ${profitColor}`}>
                      ${grossProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Margin</span>
                    <span className={`font-bold tabular-nums ${profitColor}`}>
                      {marginPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-text font-medium">Net after fees</span>
                    <span className={`font-bold tabular-nums ${profitColor}`}>
                      ${netAfterFees.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Sticky bottom — Create Ad + Save wired */}
          <div className="sticky bottom-0 bg-surface border-t border-white/[0.07] p-4 flex gap-2.5">
            <button
              onClick={handleCreateAd}
              className="flex-1 bg-accent hover:bg-accent-hover text-white rounded-md py-3 text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap size={14} strokeWidth={2} />
              Create Ad
            </button>
            <button
              onClick={handleToggleSave}
              className={`flex-1 bg-white/[0.06] hover:bg-white/10 border border-white/[0.07] rounded-md py-3 text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${isFav ? 'text-accent' : 'text-text'}`}
            >
              <Heart size={14} strokeWidth={1.75} fill={isFav ? 'currentColor' : 'none'} />
              {isFav ? 'Saved' : 'Save'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* Small Tooltip wrapper that uses Majorka's dark styling. */
function TT({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={6}
          className="z-[200] max-w-xs bg-raised border border-white/[0.12] text-text text-xs font-body rounded-md px-3 py-2 shadow-hover data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0"
        >
          {content}
          <Tooltip.Arrow className="fill-raised" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
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
      new:        allFetched.filter((p) => daysSince(p.created_at) <= NEW_DAYS_THRESHOLD).length,
      trending:   allFetched.filter((p) => (p.sold_count ?? 0) > 50000 && (p.winning_score ?? 0) >= 80).length,
      highmargin: allFetched.filter((p) => {
        const price = Number(p.price_aud ?? 999);
        return price < 15 && (p.winning_score ?? 0) >= 75 && (p.sold_count ?? 0) > 500;
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
      const toastId = toast.loading(`Searching AliExpress for "${v}"…`);
      aeSearch.search({ q: v, reset: true });
      // Dismiss the loading toast once the hook flips loading off or surfaces data.
      setTimeout(() => toast.dismiss(toastId), 2500);
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
      <div className="px-4 md:px-8 pt-6 pb-2 text-xs text-muted">
        Home <span className="mx-1.5 text-white/20">/</span> Products
      </div>

      {/* Search bar */}
      <div className="px-4 md:px-8 pb-4 flex items-center gap-3">
        <div className="flex-1 relative flex items-center bg-card border border-white/10 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 rounded-xl h-[52px] px-4 gap-3 transition-all shadow-lg">
          <Search size={16} strokeWidth={2} className="text-accent/60 shrink-0" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
            placeholder={`Search ${total != null && total > 0 ? total.toLocaleString() : '…'} products`}
            className="flex-1 bg-transparent text-sm md:text-base text-text placeholder-muted outline-none min-w-0"
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
        <div className="px-4 md:px-8 pb-3 text-sm text-muted">
          Showing {aeSearch.total.toLocaleString()} live results for <span className="text-text">"{liveQuery}"</span>
        </div>
      )}

      {/* Filter bar */}
      {searchMode === 'db' && (
        <div className="px-4 md:px-8 pb-4 flex gap-2 flex-wrap items-center">
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
        <div className="px-4 md:px-8 flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-none bg-surface/50 backdrop-blur-sm border-b border-white/[0.06] py-2">
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
        <div className="px-4 md:px-8 py-3 flex items-center justify-between">
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
          navigate={navigate}
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
        <div className="mx-4 md:mx-8 mt-4 mb-12 flex items-center gap-3 flex-wrap">
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

      <ProductSheet
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={(v) => { if (!v) setSelectedProduct(null); }}
        navigate={navigate}
        onToggleFav={fav.toggleFavourite}
        isFav={selectedProduct ? fav.isFavourite(selectedProduct.id) : false}
      />
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
  navigate: (path: string) => void;
}

/* Hover-quick-action handlers for the last column of each row. */
function createAdForProduct(p: Product, navigate: (path: string) => void) {
  sessionStorage.setItem('majorka_ad_product', JSON.stringify({
    id: p.id,
    title: p.product_title,
    image: p.image_url,
    price: p.price_aud,
  }));
  navigate('/app/ads-studio');
  toast.success('Product loaded into Ads Studio');
}

function importToStore(p: Product, navigate: (path: string) => void) {
  sessionStorage.setItem('majorka_import_product', JSON.stringify({
    id: p.id,
    title: p.product_title,
    image: p.image_url,
    price: p.price_aud,
    description: p.product_title,
    aliexpress_url: p.product_url,
  }));
  navigate('/app/store-builder');
  toast.success('Product imported to Store Builder');
}

function ListTable({ products, loading, onSelect, isFavourite, onToggleFav, navigate }: ListTableProps) {
  if (loading && products.length === 0) {
    return (
      <div className="mx-4 md:mx-8 bg-surface border border-white/[0.07] rounded-2xl overflow-hidden">
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
    <div className="mx-4 md:mx-8 bg-surface border border-white/[0.07] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-[#0f1629] border-b border-white/[0.06]">
              <th className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-left">#</th>
              <th className="text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-left">Product</th>
              <th className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-left">Category</th>
              <th className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-right">Score</th>
              <th className="text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-right">Orders</th>
              <th className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-right">Price</th>
              <th className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-right">Revenue</th>
              <th className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-center">♡</th>
            </tr>
          </thead>
        <tbody>
          {products.map((p, i) => {
            const score = Math.round(p.winning_score ?? 0);
            const orders = p.sold_count ?? 0;
            const estMonthly = monthlyRevenue(p);
            const fav = isFavourite(p.id);
            const isLast = i === products.length - 1;
            return (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3), ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onSelect(p)}
                className={`group h-20 ${isLast ? '' : 'border-b border-white/[0.04]'} hover:bg-white/[0.035] cursor-pointer transition-colors`}
              >
                <td className="hidden md:table-cell px-4 text-xs text-white/20 tabular-nums whitespace-nowrap">
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td className="px-4">
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
                      <TT content={p.product_title}>
                        <p className="text-sm font-semibold text-white/90 truncate max-w-[240px] cursor-default">
                          {p.product_title}
                        </p>
                      </TT>
                      {/* Mobile-only inline metrics + heart under the title */}
                      <div className="md:hidden mt-1 flex items-center gap-2 text-[11px]">
                        {p.category && (
                          <span
                            className="inline-block font-semibold px-2 py-0.5 rounded truncate max-w-[120px]"
                            style={categoryColor(p.category)}
                          >
                            {shortenCategory(p.category)}
                          </span>
                        )}
                        <span className="text-muted tabular-nums">
                          {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const wasFav = fav;
                        await onToggleFav(p);
                        if (wasFav) toast('Removed from saved');
                        else toast.success('Product saved');
                      }}
                      aria-label="Save"
                      className={`md:hidden shrink-0 p-1.5 rounded-md ${fav ? 'text-accent' : 'text-muted'}`}
                    >
                      <Heart size={15} strokeWidth={1.75} fill={fav ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 whitespace-nowrap">
                  {p.category ? (
                    <span
                      className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded truncate max-w-[124px]"
                      style={categoryColor(p.category)}
                    >
                      {shortenCategory(p.category)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>
                <td className="hidden md:table-cell px-4 text-right whitespace-nowrap">
                  {score ? (
                    <TT
                      content={
                        <div className="space-y-0.5">
                          <div className="font-semibold">Score breakdown</div>
                          <div className="text-muted">
                            Demand {Math.min(100, Math.round(score * 0.95))} ·
                            {' '}Trend {Math.min(100, Math.round(score * 0.98))} ·
                            {' '}Margin {Math.min(100, Math.round(score * 0.86))}
                          </div>
                        </div>
                      }
                    >
                      <span className="inline-block"><ScoreBadge score={score} /></span>
                    </TT>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>
                <td className={`px-4 text-right text-base font-bold tabular-nums whitespace-nowrap ${orders > 0 ? 'text-text' : 'text-muted'}`}>
                  {orders > 0 ? (
                    <TT content={`${orders.toLocaleString()} total orders tracked`}>
                      <span className="inline-block cursor-default">
                        {orders > 150000 && <Flame size={12} className="inline text-amber mr-1" />}
                        {fmtK(orders)}
                      </span>
                    </TT>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="hidden md:table-cell px-4 text-right text-base font-bold text-text tabular-nums whitespace-nowrap">
                  {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}
                </td>
                <td className={`hidden md:table-cell px-4 text-right text-base font-bold tabular-nums whitespace-nowrap ${estMonthly != null ? 'text-green' : 'text-muted'}`}>
                  {estMonthly != null ? `$${Math.round(estMonthly).toLocaleString()}/mo` : '—'}
                </td>
                <td className="hidden md:table-cell px-4 text-center whitespace-nowrap">
                  {/* Default: heart icon. Hover: heart + Zap + ShoppingBag trio. */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const wasFav = fav;
                        await onToggleFav(p);
                        if (wasFav) toast('Removed from saved');
                        else toast.success('Product saved');
                      }}
                      aria-label="Save"
                      className={`inline-flex items-center justify-center p-1.5 rounded-md transition-colors cursor-pointer ${
                        fav ? 'text-accent' : 'text-muted hover:text-text hover:bg-white/[0.08]'
                      }`}
                    >
                      <Heart size={15} strokeWidth={1.75} fill={fav ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); createAdForProduct(p, navigate); }}
                      aria-label="Create ad"
                      title="Create ad"
                      className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center p-1.5 rounded-md text-muted hover:text-accent-hover hover:bg-white/[0.08] cursor-pointer"
                    >
                      <Zap size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); importToStore(p, navigate); }}
                      aria-label="Import to store"
                      title="Import to store"
                      className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center p-1.5 rounded-md text-muted hover:text-accent-hover hover:bg-white/[0.08] cursor-pointer"
                    >
                      <ShoppingBag size={15} strokeWidth={1.75} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
        </table>
      </div>
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
      <div className="px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-white/[0.07] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden">
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
    <div className="px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {products.map((p, idx) => {
        const score = Math.round(p.winning_score ?? 0);
        const orders = p.sold_count ?? 0;
        const estMonthly = monthlyRevenue(p);
        const isNew = daysSince(p.created_at) <= NEW_DAYS_THRESHOLD;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onSelect(p)}
            className="group bg-surface border border-white/[0.07] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-hover transition-all duration-150 cursor-pointer flex flex-col"
          >
            <div className="relative h-48 md:h-52 overflow-hidden">
              {p.image_url ? (
                <img
                  src={proxyImage(p.image_url) ?? p.image_url}
                  alt={p.product_title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded text-base font-black tabular-nums"
                    style={scoreTierStyle(score)}
                  >
                    {score}
                  </span>
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
                    className="text-[11px] font-semibold px-2 py-0.5 rounded truncate max-w-[140px]"
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
          </motion.div>
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
    <div className="mx-4 md:mx-8 my-10 p-16 bg-surface border border-white/[0.07] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] text-center">
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
      <div className="px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-white/[0.07] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] h-[360px] animate-pulse" />
        ))}
      </div>
    );
  }
  if (aeSearch.products.length === 0) return <EmptyState />;
  return (
    <div className="px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
          className="bg-surface border border-white/[0.07] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-hover transition-all duration-150 cursor-pointer"
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
