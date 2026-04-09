import { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Search, List, LayoutGrid, ChevronDown, Heart, X,
  ExternalLink, Zap, Flame,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Clock, TrendingUp, DollarSign, Award, Bookmark } from 'lucide-react';
import { useProducts, type OrderByColumn, type Product } from '@/hooks/useProducts';
import { useFavourites } from '@/hooks/useFavourites';
import { useAESearch, type AELiveProduct } from '@/hooks/useAESearch';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { C } from '@/lib/designTokens';

/* ══════════════════════════════════════════════════════════════
   Type definitions
   ══════════════════════════════════════════════════════════════ */

type SmartTabKey = 'all' | 'new' | 'trending' | 'highmargin' | 'top' | 'saved';

const SMART_TABS: { key: SmartTabKey; label: string; Icon: LucideIcon }[] = [
  { key: 'all',         label: 'All products',  Icon: LayoutGrid },
  { key: 'new',         label: 'New this week', Icon: Clock },
  { key: 'trending',    label: 'Trending',      Icon: TrendingUp },
  { key: 'highmargin',  label: 'High margin',   Icon: DollarSign },
  { key: 'top',         label: 'Score 90+',     Icon: Award },
  { key: 'saved',       label: 'Saved',         Icon: Bookmark },
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
   Shared styles
   ══════════════════════════════════════════════════════════════ */

const STYLES = `
@keyframes mj-shim {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.mj-shim {
  background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 100%);
  background-size: 400px 100%;
  animation: mj-shim 1.4s linear infinite;
  border-radius: 4px;
  display: inline-block;
}
.mj-row {
  transition: background ${C.dur} ${C.ease};
  cursor: pointer;
}
.mj-row:hover {
  background: rgba(99,102,241,0.04);
}
.mj-row:hover .mj-row-chevron {
  color: ${C.accent};
}
.mj-grid-card {
  transition: border-color ${C.dur} ${C.ease}, transform ${C.dur} ${C.ease}, box-shadow ${C.dur} ${C.ease};
  cursor: pointer;
}
.mj-grid-card:hover {
  border-color: rgba(99,102,241,0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.mj-pill {
  transition: background ${C.dur} ${C.ease}, border-color ${C.dur} ${C.ease}, color ${C.dur} ${C.ease};
}
.mj-pill:hover {
  border-color: rgba(99,102,241,0.25);
  color: ${C.text};
}
@keyframes mj-slide {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
.mj-panel {
  animation: mj-slide 240ms ${C.ease};
}
@keyframes mj-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.mj-backdrop {
  animation: mj-fade 180ms ${C.ease};
}
`;

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

function timeAgoShort(iso: string | null): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const days = Math.round((Date.now() - ts) / (24 * 60 * 60 * 1000));
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  return `${Math.round(days / 30)} months ago`;
}

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return 9999;
  return (Date.now() - ts) / (24 * 60 * 60 * 1000);
}

function readInitialParams(): { tab: SmartTabKey; search: string } {
  if (typeof window === 'undefined') return { tab: 'all', search: '' };
  const params = new URLSearchParams(window.location.search);
  const t = params.get('tab');
  const validTabs: SmartTabKey[] = ['all', 'new', 'trending', 'highmargin', 'top', 'saved'];
  const tab = validTabs.includes(t as SmartTabKey) ? (t as SmartTabKey) : 'all';
  return { tab, search: params.get('search') ?? '' };
}

function scoreTier(score: number): { bg: string; fg: string } {
  if (score >= 90) return { bg: C.greenSubtle, fg: C.green };
  if (score >= 70) return { bg: C.amberSubtle, fg: C.amber };
  return { bg: C.orangeSubtle, fg: C.orange };
}

/* ══════════════════════════════════════════════════════════════
   Thumbnail
   ══════════════════════════════════════════════════════════════ */

function Thumb({ image, title, size, radius }: { image: string | null; title: string; size: number; radius: number }) {
  const [failed, setFailed] = useState(false);
  const initial = (title?.trim()?.[0] || '?').toUpperCase();
  const hasImage = image && !failed;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: C.raised,
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {hasImage ? (
        <img
          src={proxyImage(image) ?? image}
          alt={title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          style={{
            fontFamily: C.fontDisplay,
            fontSize: size * 0.38,
            fontWeight: 700,
            color: C.muted,
          }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Filter pill with popover dropdown
   ══════════════════════════════════════════════════════════════ */

interface FilterPillProps {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

function FilterPill({ label, active, open, onToggle, onClose, children }: FilterPillProps) {
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
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="mj-pill"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: active ? C.accentSubtle : C.raised,
          border: `1px solid ${active ? C.borderFocus : C.border}`,
          borderRadius: C.rSm,
          padding: '7px 14px',
          color: active ? C.text : C.body,
          fontSize: C.fBody,
          fontFamily: C.fontBody,
          fontWeight: 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{label}</span>
        <ChevronDown size={12} color={C.muted} strokeWidth={2} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 50,
            background: C.raised,
            border: `1px solid ${C.borderStrong}`,
            borderRadius: C.rMd,
            padding: 16,
            minWidth: 220,
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Input + option list primitives used inside dropdowns
   ══════════════════════════════════════════════════════════════ */

const numberInputStyle: React.CSSProperties = {
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: C.rXs,
  padding: '8px 10px',
  color: C.text,
  width: 90,
  outline: 'none',
  fontSize: C.fBody,
  fontFamily: C.fontBody,
  fontVariantNumeric: 'tabular-nums',
  boxSizing: 'border-box',
};

function OptionList<T extends string | number>({
  options,
  value,
  onSelect,
  keyExtractor,
  renderLabel,
}: {
  options: T[];
  value: T | null;
  onSelect: (v: T) => void;
  keyExtractor: (v: T) => string;
  renderLabel: (v: T) => string;
}) {
  return (
    <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {options.map((opt) => {
        const k = keyExtractor(opt);
        const sel = value !== null && keyExtractor(value) === k;
        return (
          <div
            key={k}
            onClick={() => onSelect(opt)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: 6,
              fontSize: C.fBody,
              fontFamily: C.fontBody,
              color: sel ? C.text : C.body,
              background: sel ? C.accentSubtle : 'transparent',
              transition: `background ${C.dur} ${C.ease}`,
            }}
            onMouseEnter={(e) => {
              if (!sel) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              if (!sel) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
          >
            {renderLabel(opt)}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Product detail side panel — spec version
   ══════════════════════════════════════════════════════════════ */

function ProductSidePanel({ product, onClose }: { product: Product | null; onClose: () => void }) {
  if (!product) return null;
  const score = Math.round(product.winning_score ?? 0);
  const orders = product.sold_count ?? 0;
  const price = product.price_aud != null ? Number(product.price_aud) : null;
  const estDaily = product.est_daily_revenue_aud ?? null;
  const estMonthly = estDaily != null ? estDaily * 30 : null;
  const aliHref = (product as Product & { aliexpress_url?: string }).aliexpress_url ?? product.product_url ?? null;
  const tier = scoreTier(score);

  return (
    <>
      <div
        className="mj-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 99,
        }}
      />
      <aside
        className="mj-panel"
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: 420,
          maxWidth: '100vw',
          height: '100vh',
          background: C.surface,
          borderLeft: `1px solid ${C.border}`,
          zIndex: 100,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: C.fontBody,
          color: C.text,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            padding: '20px 20px 0',
          }}
        >
          <div
            style={{
              fontFamily: C.fontDisplay,
              fontSize: C.fH4,
              fontWeight: 600,
              color: C.text,
              maxWidth: 320,
              lineHeight: 1.3,
            }}
          >
            {product.product_title}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: C.muted,
              cursor: 'pointer',
              padding: 4,
              transition: `color ${C.dur} ${C.ease}`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.text; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.muted; }}
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Image */}
        <div style={{ margin: 16 }}>
          <div
            style={{
              width: '100%',
              height: 220,
              borderRadius: C.rMd,
              overflow: 'hidden',
              background: C.raised,
              border: `1px solid ${C.border}`,
            }}
          >
            {product.image_url && (
              <img
                src={proxyImage(product.image_url) ?? product.image_url}
                alt={product.product_title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div
          style={{
            padding: '0 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          {[
            { label: 'Score', value: score ? String(score) : '—', color: score ? tier.fg : C.muted },
            { label: 'Orders', value: orders ? orders.toLocaleString() : '—', color: C.text },
            { label: 'Price', value: price != null ? `$${price.toFixed(2)}` : '—', color: C.text },
            { label: 'Est. Revenue', value: estMonthly != null ? `$${Math.round(estMonthly).toLocaleString()}/mo` : '—', color: C.green },
          ].map((cell) => (
            <div
              key={cell.label}
              style={{
                background: C.raised,
                borderRadius: C.rMd,
                padding: 14,
                border: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  fontSize: C.fXxs,
                  fontFamily: C.fontBody,
                  fontWeight: 500,
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}
              >
                {cell.label}
              </div>
              <div
                style={{
                  fontFamily: C.fontDisplay,
                  fontSize: 22,
                  fontWeight: 600,
                  color: cell.color,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}
              >
                {cell.value}
              </div>
            </div>
          ))}
        </div>

        {/* Metadata */}
        <div style={{ padding: '16px 16px 20px' }}>
          {product.category && (
            <div
              style={{
                fontSize: C.fSm,
                fontFamily: C.fontBody,
                color: C.body,
                marginBottom: 8,
              }}
            >
              <span style={{ color: C.muted }}>Category: </span>
              {product.category}
            </div>
          )}
          {product.created_at && (
            <div
              style={{
                fontSize: C.fSm,
                fontFamily: C.fontBody,
                color: C.body,
              }}
            >
              <span style={{ color: C.muted }}>Added: </span>
              {timeAgoShort(product.created_at)}
            </div>
          )}
        </div>

        {/* AliExpress link */}
        {aliHref && (
          <a
            href={aliHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              margin: '0 16px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${C.border}`,
              borderRadius: C.rMd,
              padding: 12,
              fontSize: C.fBody,
              fontFamily: C.fontBody,
              color: C.text,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textDecoration: 'none',
              transition: `background ${C.dur} ${C.ease}`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'; }}
          >
            View on AliExpress
            <ExternalLink size={14} strokeWidth={1.75} />
          </a>
        )}

        <div style={{ flex: 1 }} />

        {/* Sticky bottom bar */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: C.surface,
            borderTop: `1px solid ${C.border}`,
            padding: 16,
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            style={{
              flex: 1,
              background: C.accent,
              color: C.white,
              border: 'none',
              borderRadius: C.rMd,
              padding: 12,
              fontSize: C.fBody,
              fontFamily: C.fontBody,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: `background ${C.dur} ${C.ease}`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.accentHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.accent; }}
          >
            <Zap size={14} strokeWidth={2} />
            Create Ad
          </button>
          <button
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: C.rMd,
              padding: 12,
              fontSize: C.fBody,
              fontFamily: C.fontBody,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: `background ${C.dur} ${C.ease}`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
          >
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

  /* Fetch. We pull `perPage * page` rows so we can slice client-side for
     pagination, which keeps the existing useProducts hook signature
     intact while giving us a real Showing X–Y of Z display. */
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

  /* Apply saved-tab override + maxScore ceiling client-side */
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

  /* Tab counts — computed from live data */
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

  /* Category options for dropdown */
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

  /* ══════════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════════ */

  return (
    <>
      <style>{STYLES}</style>

      <div
        style={{
          background: C.bg,
          minHeight: '100vh',
          fontFamily: C.fontBody,
          color: C.text,
        }}
      >
        {/* ── SEARCH BAR ── */}
        <div style={{ padding: '24px 32px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={16}
              color={C.muted}
              strokeWidth={1.75}
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
              placeholder={`Search ${total != null && total > 0 ? total.toLocaleString() : '…'} products or explore live from AliExpress`}
              style={{
                width: '100%',
                height: 52,
                background: C.raised,
                border: `1.5px solid ${C.border}`,
                borderRadius: C.rMd,
                padding: '0 16px 0 46px',
                color: C.text,
                fontFamily: C.fontBody,
                fontSize: C.fBody,
                outline: 'none',
                boxSizing: 'border-box',
                transition: `border-color ${C.dur} ${C.ease}`,
              }}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = C.borderFocus; }}
              onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.borderColor = C.border; }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: C.raised,
              border: `1px solid ${C.border}`,
              borderRadius: C.rSm,
              padding: 4,
            }}
          >
            {(['db', 'live'] as const).map((mode) => {
              const active = searchMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => { if (mode === 'db') backToDb(); else runSearch(); }}
                  style={{
                    background: active ? C.accentSubtle : 'transparent',
                    color: active ? C.accentHover : C.muted,
                    border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: C.fSm,
                    fontFamily: C.fontBody,
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: `all ${C.dur} ${C.ease}`,
                  }}
                >
                  {mode === 'db' ? 'Database' : 'Live AliExpress'}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── LIVE SEARCH NOTICE ── */}
        {searchMode === 'live' && (
          <div
            style={{
              padding: '0 32px 12px',
              fontSize: C.fSm,
              color: C.muted,
              fontFamily: C.fontBody,
            }}
          >
            Showing {aeSearch.total.toLocaleString()} live results for <span style={{ color: C.text }}>"{liveQuery}"</span>
          </div>
        )}

        {/* ── FILTER BAR (db mode only) ── */}
        {searchMode === 'db' && (
          <div
            style={{
              padding: '0 32px 16px',
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {/* Price */}
            <FilterPill
              label={priceMin !== null || priceMax !== null
                ? `Price: $${priceMin ?? 0}–$${priceMax ?? '∞'}`
                : 'Price'}
              active={priceMin !== null || priceMax !== null}
              open={openPill === 'price'}
              onToggle={() => setOpenPill(openPill === 'price' ? null : 'price')}
              onClose={closePill}
            >
              <div
                style={{
                  fontSize: C.fXs,
                  fontFamily: C.fontBody,
                  color: C.muted,
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Price range
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin ?? ''}
                  onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : null)}
                  style={numberInputStyle}
                />
                <span style={{ color: C.muted, fontSize: C.fSm }}>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax ?? ''}
                  onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : null)}
                  style={numberInputStyle}
                />
              </div>
            </FilterPill>

            {/* Min Orders */}
            <FilterPill
              label={minOrders !== null ? `Min orders: ${minOrders.toLocaleString()}` : 'Min Orders'}
              active={minOrders !== null}
              open={openPill === 'minOrders'}
              onToggle={() => setOpenPill(openPill === 'minOrders' ? null : 'minOrders')}
              onClose={closePill}
            >
              <div
                style={{
                  fontSize: C.fXs,
                  fontFamily: C.fontBody,
                  color: C.muted,
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Minimum orders
              </div>
              <input
                type="number"
                placeholder="e.g. 1000"
                value={minOrders ?? ''}
                onChange={(e) => setMinOrders(e.target.value ? Number(e.target.value) : null)}
                style={{ ...numberInputStyle, width: 180 }}
              />
            </FilterPill>

            {/* Category */}
            <FilterPill
              label={categoryFilter ? `Category: ${shortenCategory(categoryFilter)}` : 'Category'}
              active={categoryFilter !== ''}
              open={openPill === 'category'}
              onToggle={() => setOpenPill(openPill === 'category' ? null : 'category')}
              onClose={closePill}
            >
              <div
                style={{
                  fontSize: C.fXs,
                  fontFamily: C.fontBody,
                  color: C.muted,
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Category
              </div>
              {availableCategories.length > 0 ? (
                <OptionList
                  options={['', ...availableCategories]}
                  value={categoryFilter}
                  onSelect={(v) => { setCategoryFilter(v); closePill(); }}
                  keyExtractor={(v) => v || '__all__'}
                  renderLabel={(v) => v ? shortenCategory(v) : 'All categories'}
                />
              ) : (
                <div style={{ color: C.muted, fontSize: C.fSm }}>No categories loaded yet.</div>
              )}
            </FilterPill>

            {/* Score */}
            <FilterPill
              label={scoreMin > 0 || scoreMax < 100 ? `Score: ${scoreMin}–${scoreMax}` : 'Score'}
              active={scoreMin > 0 || scoreMax < 100}
              open={openPill === 'score'}
              onToggle={() => setOpenPill(openPill === 'score' ? null : 'score')}
              onClose={closePill}
            >
              <div
                style={{
                  fontSize: C.fXs,
                  fontFamily: C.fontBody,
                  color: C.muted,
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Score range
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Min"
                  value={scoreMin || ''}
                  onChange={(e) => setScoreMin(e.target.value ? Math.max(0, Math.min(100, Number(e.target.value))) : 0)}
                  style={numberInputStyle}
                />
                <span style={{ color: C.muted, fontSize: C.fSm }}>to</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Max"
                  value={scoreMax !== 100 ? scoreMax : ''}
                  onChange={(e) => setScoreMax(e.target.value ? Math.max(0, Math.min(100, Number(e.target.value))) : 100)}
                  style={numberInputStyle}
                />
              </div>
            </FilterPill>

            <div style={{ flex: 1 }} />

            {/* Sort */}
            <FilterPill
              label={`Sort: ${activeSortLabel}`}
              active={false}
              open={openPill === 'sort'}
              onToggle={() => setOpenPill(openPill === 'sort' ? null : 'sort')}
              onClose={closePill}
            >
              <div
                style={{
                  fontSize: C.fXs,
                  fontFamily: C.fontBody,
                  color: C.muted,
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Sort by
              </div>
              <OptionList
                options={SORT_OPTIONS.map((o) => o.key)}
                value={orderBy}
                onSelect={(v) => { setOrderBy(v); closePill(); }}
                keyExtractor={(v) => String(v)}
                renderLabel={(v) => SORT_OPTIONS.find((o) => o.key === v)?.label ?? String(v)}
              />
            </FilterPill>

            {anyFilterActive && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: C.accent,
                  fontSize: C.fBody,
                  fontFamily: C.fontBody,
                  cursor: 'pointer',
                  padding: '7px 8px',
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── TAB BAR ── */}
        {searchMode === 'db' && (
          <div
            style={{
              padding: '0 32px',
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${C.border}`,
              overflowX: 'auto',
            }}
          >
            {SMART_TABS.map((tab) => {
              const active = activeTab === tab.key;
              const count = tabCounts[tab.key];
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setPage(1); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 16px',
                    marginBottom: -1,
                    border: 'none',
                    background: 'transparent',
                    fontSize: C.fBody,
                    fontFamily: C.fontBody,
                    fontWeight: active ? 600 : 500,
                    color: active ? C.text : C.body,
                    borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: `color ${C.dur} ${C.ease}`,
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = C.text; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = C.body; }}
                >
                  <Icon size={14} strokeWidth={1.75} />
                  <span>{tab.label}</span>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontSize: C.fXs,
                      fontFamily: C.fontBody,
                      color: C.muted,
                      fontVariantNumeric: 'tabular-nums',
                      marginLeft: 2,
                    }}
                  >
                    {count >= 1000 ? `${Math.round(count / 1000)}k` : count}
                  </span>
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexShrink: 0 }}>
              {(['table', 'grid'] as const).map((mode) => {
                const active = view === mode;
                const Icon = mode === 'table' ? List : LayoutGrid;
                return (
                  <button
                    key={mode}
                    onClick={() => setView(mode)}
                    aria-label={mode}
                    style={{
                      background: active ? C.raised : 'transparent',
                      color: active ? C.text : C.muted,
                      border: 'none',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: `color ${C.dur} ${C.ease}`,
                    }}
                  >
                    <Icon size={14} strokeWidth={1.75} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RESULTS HEADER ── */}
        {searchMode === 'db' && (
          <div
            style={{
              padding: '12px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: C.fBody, color: C.muted, fontFamily: C.fontBody }}>
              {loading
                ? 'Loading products…'
                : `${filteredTotal.toLocaleString()} products`}
            </div>
          </div>
        )}

        {/* ── BODY ── */}
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

        {/* ── PAGINATION ── */}
        {searchMode === 'db' && filteredTotal > 0 && (
          <div
            style={{
              margin: '16px 32px 48px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: C.fBody, color: C.muted, fontFamily: C.fontBody, fontVariantNumeric: 'tabular-nums' }}>
              Showing {(offset + 1).toLocaleString()}–{Math.min(offset + perPage, filteredTotal).toLocaleString()} of {filteredTotal.toLocaleString()}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                style={{
                  background: C.raised,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: C.fBody,
                  fontFamily: C.fontBody,
                  color: C.body,
                  outline: 'none',
                  marginLeft: 8,
                }}
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <ProductSidePanel product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   Pagination button
   ══════════════════════════════════════════════════════════════ */

function PageBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        background: active ? C.accent : C.raised,
        border: `1px solid ${active ? C.accent : C.border}`,
        borderRadius: 6,
        width: 32,
        height: 32,
        fontSize: C.fBody,
        fontFamily: C.fontBody,
        color: active ? C.white : disabled ? C.muted : C.body,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `background ${C.dur} ${C.ease}`,
      }}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   List view (table)
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
      <div
        style={{
          margin: '0 32px',
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: C.rXl,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 80,
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              borderBottom: i === 7 ? 'none' : `1px solid ${C.border}`,
            }}
          >
            <span className="mj-shim" style={{ width: 20, height: 12 }} />
            <span className="mj-shim" style={{ width: 60, height: 60, borderRadius: 10 }} />
            <span className="mj-shim" style={{ flex: 1, height: 14 }} />
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return <EmptyState />;
  }
  return (
    <div
      style={{
        margin: '0 32px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: C.rXl,
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: 60 }} />
          <col />
          <col style={{ width: 80 }} />
          <col style={{ width: 100 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 50 }} />
        </colgroup>
        <thead>
          <tr style={{ background: C.raised }}>
            {['#', 'Product', 'Score', 'Orders', 'Price', 'Est. Revenue', ''].map((h, i) => (
              <th
                key={h + i}
                style={{
                  padding: '14px 24px',
                  textAlign: i === 0 || i === 1 ? 'left' : i === 6 ? 'center' : 'right',
                  fontSize: C.fXxs,
                  fontFamily: C.fontBody,
                  fontWeight: 500,
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
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
            const tier = scoreTier(score);
            const estMonthly = p.est_daily_revenue_aud != null ? p.est_daily_revenue_aud * 30 : null;
            const isNew = daysSince(p.created_at) <= 7;
            const fav = isFavourite(p.id);
            return (
              <tr
                key={p.id}
                className="mj-row"
                onClick={() => onSelect(p)}
                style={{ borderBottom: i === products.length - 1 ? 'none' : `1px solid ${C.border}` }}
              >
                <td
                  style={{
                    padding: '20px 24px',
                    fontSize: C.fSm,
                    color: C.muted,
                    fontFamily: C.fontBody,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <Thumb image={p.image_url} title={p.product_title} size={60} radius={10} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        title={p.product_title}
                        style={{
                          fontSize: C.fBody,
                          fontFamily: C.fontBody,
                          fontWeight: 500,
                          color: C.text,
                          maxWidth: 380,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: 4,
                        }}
                      >
                        {p.product_title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.category && (
                          <span
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              borderRadius: 4,
                              padding: '2px 8px',
                              fontSize: C.fXs,
                              fontFamily: C.fontBody,
                              color: C.body,
                              maxWidth: 160,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {shortenCategory(p.category)}
                          </span>
                        )}
                        {isNew && (
                          <span
                            style={{
                              background: C.greenSubtle,
                              color: C.green,
                              borderRadius: 4,
                              padding: '1px 6px',
                              fontSize: C.fXxs,
                              fontFamily: C.fontBody,
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                            }}
                          >
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                  {score ? (
                    <span
                      style={{
                        display: 'inline-block',
                        background: tier.bg,
                        border: `1px solid ${tier.bg}`,
                        color: tier.fg,
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: C.fBody,
                        fontFamily: C.fontBody,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {score}
                    </span>
                  ) : (
                    <span style={{ color: C.muted, fontSize: C.fSm }}>—</span>
                  )}
                </td>
                <td
                  style={{
                    padding: '20px 24px',
                    textAlign: 'right',
                    fontSize: C.fH4,
                    fontFamily: C.fontBody,
                    color: orders > 0 ? C.text : C.muted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {orders > 150000 && <Flame size={12} color={C.amber} style={{ display: 'inline', marginRight: 4 }} />}
                  {orders > 0 ? fmtK(orders) : '—'}
                </td>
                <td
                  style={{
                    padding: '20px 24px',
                    textAlign: 'right',
                    fontSize: C.fH4,
                    fontFamily: C.fontBody,
                    color: C.text,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}
                </td>
                <td
                  style={{
                    padding: '20px 24px',
                    textAlign: 'right',
                    fontSize: C.fBody,
                    fontFamily: C.fontBody,
                    color: estMonthly != null ? C.green : C.muted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {estMonthly != null ? `$${Math.round(estMonthly).toLocaleString()}/mo` : '—'}
                </td>
                <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); void onToggleFav(p); }}
                    aria-label="Save"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: fav ? C.accent : C.muted,
                      cursor: 'pointer',
                      padding: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: `color ${C.dur} ${C.ease}`,
                    }}
                  >
                    <Heart size={16} strokeWidth={1.75} fill={fav ? C.accent : 'none'} />
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
   Grid view (4-column cards)
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
      <div
        style={{
          padding: '0 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: C.rXl,
              overflow: 'hidden',
            }}
          >
            <div className="mj-shim" style={{ width: '100%', height: 180, display: 'block', borderRadius: 0 }} />
            <div style={{ padding: 14 }}>
              <span className="mj-shim" style={{ width: '90%', height: 14, marginBottom: 8 }} />
              <span className="mj-shim" style={{ width: '60%', height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return <EmptyState />;
  }
  return (
    <div
      style={{
        padding: '0 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
      }}
    >
      {products.map((p) => {
        const score = Math.round(p.winning_score ?? 0);
        const orders = p.sold_count ?? 0;
        const tier = scoreTier(score);
        const estMonthly = p.est_daily_revenue_aud != null ? p.est_daily_revenue_aud * 30 : null;
        const isNew = daysSince(p.created_at) <= 7;
        return (
          <div
            key={p.id}
            className="mj-grid-card"
            onClick={() => onSelect(p)}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: C.rXl,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Image with score badge */}
            <div style={{ position: 'relative', width: '100%', height: 180, background: C.raised }}>
              {p.image_url ? (
                <img
                  src={proxyImage(p.image_url) ?? p.image_url}
                  alt={p.product_title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: C.fontDisplay,
                    fontSize: 48,
                    fontWeight: 700,
                    color: C.muted,
                  }}
                >
                  {(p.product_title?.[0] ?? '?').toUpperCase()}
                </div>
              )}
              {score > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: tier.bg,
                    color: tier.fg,
                    border: `1px solid ${tier.bg}`,
                    borderRadius: 6,
                    padding: '3px 9px',
                    fontSize: C.fBody,
                    fontFamily: C.fontBody,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {score}
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div
                title={p.product_title}
                style={{
                  fontSize: C.fBody,
                  fontFamily: C.fontBody,
                  fontWeight: 500,
                  color: C.text,
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: 8,
                  minHeight: 36,
                }}
              >
                {p.product_title}
              </div>

              {/* Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {p.category && (
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: C.fXs,
                      color: C.body,
                      maxWidth: 140,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shortenCategory(p.category)}
                  </span>
                )}
                {isNew && (
                  <span
                    style={{
                      background: C.greenSubtle,
                      color: C.green,
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontSize: C.fXxs,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    New
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  marginBottom: 12,
                  marginTop: 'auto',
                }}
              >
                {[
                  { label: 'Orders', value: orders > 0 ? fmtK(orders) : '—', color: C.text },
                  { label: 'Price', value: p.price_aud != null ? `$${Number(p.price_aud).toFixed(0)}` : '—', color: C.text },
                  { label: 'Est Rev', value: estMonthly != null ? `$${Math.round(estMonthly / 1000)}k` : '—', color: C.green },
                ].map((cell) => (
                  <div key={cell.label}>
                    <div
                      style={{
                        fontSize: C.fXxs,
                        fontFamily: C.fontBody,
                        color: C.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: 2,
                      }}
                    >
                      {cell.label}
                    </div>
                    <div
                      style={{
                        fontSize: C.fH4,
                        fontFamily: C.fontBody,
                        color: cell.color,
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 500,
                      }}
                    >
                      {cell.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${C.border}`,
                    borderRadius: C.rSm,
                    padding: '6px 14px',
                    fontSize: C.fSm,
                    fontFamily: C.fontBody,
                    color: C.body,
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                  style={{
                    flex: 1,
                    background: C.accent,
                    border: 'none',
                    borderRadius: C.rSm,
                    padding: '6px 14px',
                    fontSize: C.fSm,
                    fontFamily: C.fontBody,
                    color: C.white,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
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
    <div
      style={{
        margin: '40px 32px',
        padding: '64px 32px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: C.rXl,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: C.raised,
          marginBottom: 16,
        }}
      >
        <Search size={24} color={C.muted} strokeWidth={1.75} />
      </div>
      <div
        style={{
          fontFamily: C.fontDisplay,
          fontSize: C.fH3,
          fontWeight: 600,
          color: C.text,
          marginBottom: 8,
        }}
      >
        No products match
      </div>
      <div
        style={{
          fontSize: C.fBody,
          fontFamily: C.fontBody,
          color: C.body,
          maxWidth: 380,
          margin: '0 auto',
          lineHeight: 1.5,
        }}
      >
        Try clearing your filters or switching to Live AliExpress search to pull fresh results from the marketplace.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Live AliExpress search view
   ══════════════════════════════════════════════════════════════ */

function LiveSearchView({ aeSearch, onSelect }: { aeSearch: ReturnType<typeof useAESearch>; onSelect: (p: Product) => void }) {
  if (aeSearch.loading && aeSearch.products.length === 0) {
    return (
      <div style={{ padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: C.rXl,
              height: 320,
            }}
          />
        ))}
      </div>
    );
  }
  if (aeSearch.products.length === 0) {
    return <EmptyState />;
  }
  return (
    <div
      style={{
        padding: '0 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
      }}
    >
      {aeSearch.products.map((p: AELiveProduct, i) => (
        <div
          key={`${p.id}-${i}`}
          className="mj-grid-card"
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
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: C.rXl,
            overflow: 'hidden',
          }}
        >
          <div style={{ height: 180, background: C.raised }}>
            {p.image_url && (
              <img
                src={proxyImage(p.image_url) ?? p.image_url}
                alt={p.product_title}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
          <div style={{ padding: 14 }}>
            <div
              style={{
                fontSize: C.fBody,
                fontFamily: C.fontBody,
                color: C.text,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              {p.product_title}
            </div>
            <div
              style={{
                fontSize: C.fSm,
                color: C.body,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : ''}{p.sold_count ? ` · ${fmtK(p.sold_count)} orders` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
