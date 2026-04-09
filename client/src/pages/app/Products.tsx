import { useMemo, useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Search, List, LayoutGrid, ArrowUpRight, Clock, TrendingUp, DollarSign, Award, Calculator, Zap, ExternalLink, Heart, Bookmark } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProducts, type OrderByColumn, type Product } from '@/hooks/useProducts';
import { useFavourites } from '@/hooks/useFavourites';
import { useAESearch, type AELiveProduct } from '@/hooks/useAESearch';
import { useNicheStats } from '@/hooks/useNicheStats';
import { ProductImage } from '@/components/app/ProductImage';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import { ProductSparkline } from '@/components/app/Sparkline';
import { getCategoryStyle, shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { scorePillStyle, fmtScore } from '@/lib/scorePill';
import { t } from '@/lib/designTokens';

type CarouselKey = 'recent' | 'scored' | 'value';
type SmartTabKey = 'all' | 'new' | 'trending' | 'highmargin' | 'top' | 'saved';

const fmtRev = (v: number): string =>
  v >= 1_000_000 ? `~$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `~$${Math.round(v / 1_000)}k`
  : v > 0        ? `~$${v}`
  : '—';

const SMART_TABS: { key: SmartTabKey; label: string; Icon: LucideIcon }[] = [
  { key: 'all',         label: 'All Products',  Icon: LayoutGrid },
  { key: 'new',         label: 'New This Week', Icon: Clock },
  { key: 'trending',    label: 'Trending Now',  Icon: TrendingUp },
  { key: 'highmargin',  label: 'High Margin',   Icon: DollarSign },
  { key: 'top',         label: 'Score 90+',     Icon: Award },
  { key: 'saved',       label: 'Saved',         Icon: Bookmark },
];

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

const SHIMMER = `
@keyframes mj-app-shim {
  0%   { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
.mj-shim {
  background: linear-gradient(90deg, #1c1c1c 0%, #1a1a1f 50%, #1c1c1c 100%);
  background-size: 300px 100%;
  animation: mj-app-shim 1.4s linear infinite;
  border-radius: 4px;
  display: inline-block;
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 6px rgba(16,185,129,0.4); }
  50% { box-shadow: 0 0 14px rgba(16,185,129,0.8), 0 0 24px rgba(16,185,129,0.2); }
}
@keyframes score-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
  50% { box-shadow: 0 0 0 4px rgba(16,185,129,0); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mj-app-pulse-dot {
  display: inline-block;
  width: 7px; height: 7px; border-radius: 50%;
  background: #10b981;
  animation: pulse-glow 2s ease-in-out infinite;
}
.majorka-row-hover { transition: background 100ms ease; cursor: pointer; }
.majorka-row-hover:hover { background: rgba(124,106,255,0.04) !important; }
.majorka-btn { transition: all 150ms ease; }
.majorka-btn:hover { transform: scale(1.05); filter: brightness(1.15); }
.majorka-btn:active { transform: scale(0.97); }
`;

type ScoreFilter = 0 | 65 | 80 | 90;

const inputStyle: React.CSSProperties = {
  background: '#0d0d10',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  padding: '8px 12px',
  color: '#ededed',
  fontFamily: sans,
  fontSize: 13,
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  background: '#0d0d10',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  padding: '8px 12px',
  color: '#a1a1aa',
  fontFamily: mono,
  fontSize: 12,
  cursor: 'pointer',
  outline: 'none',
};

function Thumb({ title, image, size = 32 }: { title: string; image: string | null; size?: number }) {
  return <ProductImage src={image} title={title} size={size} borderRadius={5} />;
}

function ProductHeroImage({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const initial = (title?.trim() || 'P').charAt(0).toUpperCase();
  if (!src || failed) {
    return (
      <span style={{
        fontFamily: display,
        fontSize: 32,
        fontWeight: 700,
        color: 'rgba(124,106,255,0.4)',
      }}>{initial}</span>
    );
  }
  return (
    <img
      src={proxyImage(src) ?? src}
      alt={title}
      loading="lazy"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setFailed(true)}
    />
  );
}

function SourcePill({ source }: { source: string | null }) {
  const isAli = (source ?? '').toLowerCase().includes('aliexpress');
  if (isAli) {
    return <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      background: 'rgba(255,90,0,0.12)',
      border: '1px solid rgba(255,90,0,0.25)',
      color: 'rgba(255,90,0,0.9)',
      borderRadius: 999,
      fontFamily: mono,
      fontSize: 10,
      fontWeight: 700,
    }}>AliExpress</span>;
  }
  return <span style={{
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#71717a',
    borderRadius: 999,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: 700,
  }}>{source ?? '—'}</span>;
}

function readInitialParams(): { tab: SmartTabKey; search: string } {
  if (typeof window === 'undefined') return { tab: 'all', search: '' };
  const params = new URLSearchParams(window.location.search);
  const t = params.get('tab');
  const validTabs: SmartTabKey[] = ['all', 'new', 'trending', 'highmargin', 'top', 'saved'];
  const tab = validTabs.includes(t as SmartTabKey) ? (t as SmartTabKey) : 'all';
  return { tab, search: params.get('search') ?? '' };
}

export default function AppProducts() {
  const initial = readInitialParams();
  const [orderBy, setOrderBy] = useState<OrderByColumn>('sold_count');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [limit, setLimit] = useState(20);
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCarousel, setActiveCarousel] = useState<CarouselKey>('recent');
  const [activeTab, setActiveTab] = useState<SmartTabKey>(initial.tab);
  const [searchMode, setSearchMode] = useState<'db' | 'live'>(initial.search ? 'live' : 'db');
  const [liveQuery, setLiveQuery] = useState(initial.search);
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [minOrders, setMinOrders] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [scoreMin, setScoreMin] = useState<number>(0);
  const [scoreMax, setScoreMax] = useState<number>(100);
  const aeSearch = useAESearch();
  const { niches } = useNicheStats();
  const fav = useFavourites();
  const [favToast, setFavToast] = useState<string | null>(null);

  // Trigger AE live search if a ?search= param is present on first mount
  useEffect(() => {
    if (initial.search && initial.search.trim().length >= 2) {
      aeSearch.search({ q: initial.search.trim(), reset: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { products, loading, total, cached } = useProducts({
    limit,
    orderBy,
    tab: activeTab === 'saved' ? 'all' : activeTab,
    category: activeNiche ?? (categoryFilter || undefined),
    minPrice: priceMin ?? undefined,
    maxPrice: priceMax ?? undefined,
    minOrders: minOrders ?? undefined,
    minScore: scoreMin > 0 ? scoreMin : undefined,
  });

  // Infinite scroll for live AE search mode
  useEffect(() => {
    if (searchMode !== 'live') return;
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (scrollPos > docHeight - 500) aeSearch.loadMore();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [searchMode, aeSearch]);

  // Distinct category list for the category filter dropdown
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim().length > 0) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Server has applied tab + category + price + minScore filters already.
  // Only the saved-tab override (uses local favourites) and the maxScore
  // upper bound need to be applied client-side.
  const filtered = useMemo(() => {
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
      return products.filter((p) => (p.winning_score ?? 0) <= scoreMax);
    }
    return products;
  }, [products, activeTab, scoreMax, fav.favourites]);

  // Counts for smart tabs. Most are approximations since we only have the
  // current page loaded — `total` is reliable because it comes from
  // count: 'exact' for the active tab. Saved comes from useFavourites.
  const tabCounts = useMemo(() => {
    return {
      all:        activeTab === 'all' ? total : products.length,
      new:        activeTab === 'new' ? total : products.filter((p) => {
        if (!p.created_at) return false;
        return new Date(p.created_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000;
      }).length,
      trending:   activeTab === 'trending' ? total : products.filter((p) => (p.sold_count ?? 0) >= 50000).length,
      highmargin: activeTab === 'highmargin' ? total : products.filter((p) => {
        const price = Number(p.price_aud ?? 0);
        return price >= 2 && price <= 15 && (p.sold_count ?? 0) >= 10000;
      }).length,
      top:        activeTab === 'top' ? total : products.filter((p) => (p.winning_score ?? 0) >= 90).length,
      saved:      fav.count,
    };
  }, [products, total, activeTab, fav.count]);

  return (
    <>
      <style>{SHIMMER}</style>

      {/* Page header — no gradient text, no pulsing dot, no mock status pills. */}
      <div style={{ padding: `${t.s8}px ${t.s8}px ${t.s5}px` }}>
        <h1 style={{
          fontFamily: t.fontDisplay,
          fontSize: t.fH1,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          margin: 0,
          color: t.text,
          lineHeight: 1.1,
        }}>Products</h1>
        <p style={{
          fontFamily: t.fontBody,
          fontSize: t.fLead,
          color: t.body,
          margin: `${t.s3}px 0 0`,
          maxWidth: '52ch',
          lineHeight: 1.5,
        }}>
          {searchMode === 'live'
            ? `${aeSearch.total.toLocaleString()} live AliExpress results for "${aeSearch.query}"`
            : `${total > 0 ? total.toLocaleString() : ''} products tracked. Sort, filter, and save winners.`}
        </p>
      </div>

      {/* Search bar — flat, Linear-style. Focus ring is 1px, not 3px glow. */}
      <div style={{ padding: `0 ${t.s8}px ${t.s4}px`, display: 'flex', gap: t.s3, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} strokeWidth={2} color={t.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            placeholder={`Search ${total > 0 ? total.toLocaleString() : '2,302'} products or 829k live from AliExpress`}
            defaultValue={liveQuery}
            style={{
              width: '100%',
              background: t.surface,
              border: `1px solid ${t.line}`,
              borderRadius: t.rSm,
              padding: `${t.s3}px ${t.s5}px ${t.s3}px 40px`,
              color: t.text,
              fontFamily: t.fontBody,
              fontSize: t.fBody,
              outline: 'none',
              boxSizing: 'border-box',
              transition: `border-color ${t.dur} ${t.ease}`,
            }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = t.lineFocus; }}
            onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = t.line; }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.currentTarget as HTMLInputElement).value.trim();
                if (val.length >= 2) {
                  setLiveQuery(val);
                  setSearchMode('live');
                  aeSearch.search({ q: val, reset: true });
                }
              }
            }}
          />
        </div>
        {searchMode === 'live' && (
          <button
            onClick={() => { setSearchMode('db'); aeSearch.reset(); setLiveQuery(''); }}
            style={{
              padding: `${t.s3}px ${t.s4}px`,
              background: 'transparent',
              border: `1px solid ${t.lineStrong}`,
              borderRadius: t.rSm,
              color: t.body,
              fontFamily: t.fontBody,
              fontSize: t.fBody,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: `all ${t.dur} ${t.ease}`,
            }}
          >Back to database</button>
        )}
      </div>

      {/* Filter bar — mixed-weight labels (not uppercase mono), flat inputs,
          emoji stripped from sort values. */}
      {searchMode === 'db' && (
        <div style={{
          margin: `0 ${t.s8}px ${t.s4}px`,
          padding: `${t.s4}px ${t.s5}px`,
          background: t.surface,
          border: `1px solid ${t.line}`,
          borderRadius: t.rMd,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: t.s4,
        }}>
          {[
            { label: 'Min price', value: priceMin, set: setPriceMin, ph: '$0' },
            { label: 'Max price', value: priceMax, set: setPriceMax, ph: '$999' },
            { label: 'Min orders',    value: minOrders, set: setMinOrders, ph: '0' },
          ].map((f) => (
            <div key={f.label}>
              <div style={{ fontFamily: t.fontBody, fontSize: t.fCaption, fontWeight: 500, color: t.muted, marginBottom: t.s2 }}>{f.label}</div>
              <input
                type="number"
                placeholder={f.ph}
                value={f.value ?? ''}
                onChange={(e) => f.set(e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: '100%',
                  background: t.bg,
                  border: `1px solid ${t.line}`,
                  borderRadius: t.rSm,
                  padding: `${t.s2}px ${t.s3}px`,
                  color: t.text,
                  fontFamily: t.fontBody,
                  fontSize: t.fBody,
                  fontVariantNumeric: 'tabular-nums',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
          ))}
          <div>
            <div style={{ fontFamily: t.fontBody, fontSize: t.fCaption, fontWeight: 500, color: t.muted, marginBottom: t.s2 }}>Category</div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                background: t.bg,
                border: `1px solid ${t.line}`,
                borderRadius: t.rSm,
                padding: `${t.s2}px ${t.s3}px`,
                color: t.text,
                fontFamily: t.fontBody,
                fontSize: t.fBody,
                boxSizing: 'border-box',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="">All categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{shortenCategory(c)}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontFamily: t.fontBody, fontSize: t.fCaption, fontWeight: 500, color: t.muted, marginBottom: t.s2 }}>Min score</div>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="0"
              value={scoreMin}
              onChange={(e) => setScoreMin(e.target.value ? Math.max(0, Math.min(100, Number(e.target.value))) : 0)}
              style={{
                width: '100%',
                background: t.bg,
                border: `1px solid ${t.line}`,
                borderRadius: t.rSm,
                padding: `${t.s2}px ${t.s3}px`,
                color: t.text,
                fontFamily: t.fontBody,
                fontSize: t.fBody,
                fontVariantNumeric: 'tabular-nums',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <div style={{ fontFamily: t.fontBody, fontSize: t.fCaption, fontWeight: 500, color: t.muted, marginBottom: t.s2 }}>Max score</div>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="100"
              value={scoreMax}
              onChange={(e) => setScoreMax(e.target.value ? Math.max(0, Math.min(100, Number(e.target.value))) : 100)}
              style={{
                width: '100%',
                background: t.bg,
                border: `1px solid ${t.line}`,
                borderRadius: t.rSm,
                padding: `${t.s2}px ${t.s3}px`,
                color: t.text,
                fontFamily: t.fontBody,
                fontSize: t.fBody,
                fontVariantNumeric: 'tabular-nums',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <div style={{ fontFamily: t.fontBody, fontSize: t.fCaption, fontWeight: 500, color: t.muted, marginBottom: t.s2 }}>Sort by</div>
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value as OrderByColumn)}
              style={{
                width: '100%',
                background: t.bg,
                border: `1px solid ${t.line}`,
                borderRadius: t.rSm,
                padding: `${t.s2}px ${t.s3}px`,
                color: t.text,
                fontFamily: t.fontBody,
                fontSize: t.fBody,
                boxSizing: 'border-box',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="sold_count">Most orders</option>
              <option value="winning_score">Highest score</option>
              <option value="est_daily_revenue_aud">Highest revenue</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">📉 Price: High to Low</option>
              <option value="created_at">🆕 Newest First</option>
              <option value="orders_asc">Orders: low to high</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => { setPriceMin(null); setPriceMax(null); setMinOrders(null); setCategoryFilter(''); setScoreMin(0); setScoreMax(100); setOrderBy('sold_count'); }}
              style={{
                padding: `${t.s2}px ${t.s3}px`,
                background: 'transparent',
                border: `1px solid ${t.line}`,
                borderRadius: t.rSm,
                color: t.muted,
                fontFamily: t.fontBody,
                fontSize: t.fBody,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >Clear filters</button>
          </div>
        </div>
      )}

      {searchMode === 'live' && (
        <LiveSearchView
          aeSearch={aeSearch}
        />
      )}

      {searchMode === 'db' && (<>
      {/* Tabs — quiet, Linear-style. Active tab gets a single underline,
          not a tinted pill. No count badge on the inactive tabs. */}
      <div style={{
        display: 'flex',
        gap: t.s1,
        padding: `0 ${t.s8}px`,
        marginBottom: t.s4,
        borderBottom: `1px solid ${t.line}`,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        alignItems: 'center',
      }}>
        {SMART_TABS.map((tab) => {
          const active = activeTab === tab.key;
          const count = tabCounts[tab.key];
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: t.s2,
                padding: `${t.s3}px ${t.s3}px`,
                marginBottom: -1,
                fontFamily: t.fontBody,
                fontSize: t.fBody,
                fontWeight: active ? 600 : 500,
                color: active ? t.text : t.muted,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
                cursor: 'pointer',
                transition: `color ${t.dur} ${t.ease}`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = t.text; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = t.muted; }}
            >
              <TabIcon size={14} strokeWidth={1.75} />
              <span>{tab.label}</span>
              {active && count > 0 && (
                <span style={{
                  fontFamily: t.fontBody,
                  fontSize: t.fCaption,
                  fontWeight: 500,
                  color: t.muted,
                  fontVariantNumeric: 'tabular-nums',
                  marginLeft: 2,
                }}>{count >= 1000 ? `${Math.round(count / 1000)}k` : count}</span>
              )}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'inline-flex',
          background: t.surface,
          border: `1px solid ${t.line}`,
          borderRadius: t.rSm,
          padding: 2,
          marginBottom: t.s2,
          marginLeft: t.s2,
          flexShrink: 0,
        }}>
          {(['table', 'grid'] as const).map((mode) => {
            const active = view === mode;
            return (
              <button
                key={mode}
                onClick={() => setView(mode)}
                aria-label={mode}
                style={{
                  width: 30,
                  height: 26,
                  border: 'none',
                  background: active ? t.raised : 'transparent',
                  color: active ? t.text : t.muted,
                  cursor: 'pointer',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: `all ${t.dur} ${t.ease}`,
                }}
              >
                {mode === 'table' ? <List size={13} /> : <LayoutGrid size={13} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {view === 'table' ? (
        <TableView
          products={filtered}
          loading={loading && activeTab !== 'saved'}
          onSelect={setSelectedProduct}
          isFavourite={fav.isFavourite}
          onToggleFav={async (p) => {
            try { await fav.toggleFavourite(p); }
            catch (e) {
              if ((e as Error).message === 'NOT_AUTHED') {
                setFavToast('Sign in to save products');
                setTimeout(() => setFavToast(null), 2500);
              }
            }
          }}
        />
      ) : (
        <GridView products={filtered} loading={loading} onSelect={setSelectedProduct} />
      )}

      {/* Load more */}
      {!loading && filtered.length >= limit && limit < total && (
        <div style={{ margin: '0 32px 32px', textAlign: 'center' }}>
          <button
            onClick={() => setLimit((l) => l + 20)}
            style={{
              fontFamily: sans,
              fontSize: 13,
              color: '#71717a',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '10px 24px',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'border-color 150ms, color 150ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6aff'; e.currentTarget.style.color = '#ededed'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#71717a'; }}
          >Load more</button>
        </div>
      )}

      {/* More to explore — supplementary carousels */}
      <div style={{ padding: '20px 32px 8px' }}>
        <h3 style={{
          fontFamily: display,
          fontSize: 15,
          fontWeight: 700,
          color: '#a1a1aa',
          margin: 0,
          letterSpacing: '-0.01em',
        }}>More to explore</h3>
      </div>
      <FeaturedCarousels active={activeCarousel} setActive={setActiveCarousel} onSelect={setSelectedProduct} />
      </>)}

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {favToast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '12px 18px',
          background: '#1c1c1c',
          border: '1px solid rgba(124,106,255,0.35)',
          borderRadius: 10,
          color: '#e8e8f0',
          fontFamily: sans,
          fontSize: 13,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          zIndex: 9999,
        }}>{favToast}</div>
      )}
    </>
  );
}

interface TableViewProps {
  products: Product[];
  loading: boolean;
  onSelect: (p: Product) => void;
  isFavourite: (id: string | number) => boolean;
  onToggleFav: (p: Product) => void | Promise<void>;
}

function TableView({ products, loading, onSelect, isFavourite, onToggleFav }: TableViewProps) {
  return (
    <div style={{ padding: '0 32px 32px' }}>
      <div style={{
        background: '#1c1c1c',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        overflowX: 'auto',
        overflowY: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '28px minmax(260px,3fr) 120px 80px 80px 70px 110px 80px 270px',
          gap: 14,
          padding: '10px 16px',
          fontFamily: mono,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)',
          background: '#222222',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span>#</span>
          <span>Product</span>
          <span>Category</span>
          <span>Score</span>
          <span style={{ textAlign: 'right' }}>Orders</span>
          <span style={{ textAlign: 'right' }}>Price</span>
          <span
            style={{ textAlign: 'right', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}
            title="Approximate monthly revenue generated by top sellers of this product on AliExpress. Estimated from order volume × sell price."
          >
            Est. Market Rev.
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.3)',
              fontSize: 8,
              fontFamily: sans,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'none',
              cursor: 'help',
            }}>i</span>
          </span>
          <span>Trend</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '28px minmax(260px,3fr) 120px 80px 80px 70px 110px 80px 270px',
              gap: 14,
              padding: '12px 16px',
              alignItems: 'center',
              minHeight: 76,
              maxHeight: 76,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span className="mj-shim" style={{ height: 12, width: 20 }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mj-shim" style={{ height: 52, width: 52, borderRadius: 8 }} />
                <span className="mj-shim" style={{ height: 12, width: '70%' }} />
              </span>
              <span className="mj-shim" style={{ height: 16, width: 80, borderRadius: 999 }} />
              <span className="mj-shim" style={{ height: 18, width: 44, borderRadius: 999 }} />
              <span className="mj-shim" style={{ height: 12, width: '70%' }} />
              <span className="mj-shim" style={{ height: 12, width: '70%' }} />
              <span className="mj-shim" style={{ height: 12, width: '80%' }} />
              <span className="mj-shim" style={{ height: 14, width: 80 }} />
              <span className="mj-shim" style={{ height: 24, width: 90, borderRadius: 999 }} />
            </div>
          ))
        ) : products.length === 0 ? (
          <div style={{
            padding: '40px 16px',
            textAlign: 'center',
            fontFamily: sans,
            fontSize: 13,
            color: '#52525b',
          }}>No products match your filters</div>
        ) : (
          products.map((p, i) => {
            const score = p.winning_score ?? 0;
            const orders = p.sold_count ?? 0;
            const estRevenue = (orders && p.price_aud)
              ? Math.round((Number(orders) * 0.04) * (Number(p.price_aud) * 2.2) * 0.32)
              : null;
            const categoryShort = shortenCategory(p.category);
            return (
              <div
                key={p.id}
                className="mj-row mj-row-hover"
                onClick={() => onSelect(p)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px minmax(260px,3fr) 120px 80px 80px 70px 110px 80px 270px',
                  gap: 14,
                  padding: '12px 16px',
                  alignItems: 'center',
                  minHeight: 76,
                  maxHeight: 76,
                  borderBottom: i === products.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 12, color: '#52525b' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <ProductThumb title={p.product_title} image={p.image_url} category={p.category} />
                  <span
                    title={p.product_title}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: sans,
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#e8e8f0',
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word',
                    }}
                  >{p.product_title}</span>
                </span>
                <span
                  title={p.category ?? ''}
                  style={{
                    display: 'inline-block',
                    padding: '3px 9px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 999,
                    fontFamily: sans,
                    fontSize: 11,
                    color: '#a1a1aa',
                    maxWidth: 118,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: 'fit-content',
                  }}
                >{categoryShort}</span>
                <span><ScoreDisplay score={score} /></span>
                <span
                  title={orders > 0 ? orders.toLocaleString() : ''}
                  style={{
                    fontFamily: mono,
                    fontSize: 13,
                    color: orders > 0 ? '#10b981' : '#4b5563',
                    textAlign: 'right',
                  }}
                >{orders > 0 ? fmtK(orders) : '—'}</span>
                <span style={{
                  fontFamily: mono,
                  fontSize: 13,
                  color: '#ededed',
                  textAlign: 'right',
                }}>{p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}</span>
                <span
                  title={estRevenue != null ? `Est. ~$${estRevenue.toLocaleString()}/mo market revenue (orders × price × margin factor)` : ''}
                  style={{
                    fontFamily: mono,
                    fontSize: 12,
                    fontWeight: 600,
                    color: estRevenue != null ? '#10b981' : '#4b5563',
                    textAlign: 'right',
                  }}
                >
                  {estRevenue != null ? `${fmtRev(estRevenue)}/mo` : '—'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <ProductSparkline productId={p.id} score={score} width={86} height={22} points={8} />
                </span>
                <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                  <RowActions
                    product={p}
                    isFav={isFavourite(p.id)}
                    onToggleFav={() => onToggleFav(p)}
                  />
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function GridView({ products, loading, onSelect }: { products: Product[]; loading: boolean; onSelect: (p: Product) => void }) {
  return (
    <div style={{
      padding: '0 32px 32px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 14,
    }}>
      {loading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <div className="mj-shim" style={{ height: 100, borderRadius: 0 }} />
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="mj-shim" style={{ height: 12, width: '85%' }} />
              <span className="mj-shim" style={{ height: 12, width: '60%' }} />
              <span className="mj-shim" style={{ height: 16, width: 50, borderRadius: 999 }} />
            </div>
          </div>
        ))
      ) : products.length === 0 ? (
        <div style={{
          gridColumn: '1 / -1',
          padding: '60px 16px',
          textAlign: 'center',
          fontFamily: sans,
          fontSize: 13,
          color: '#52525b',
          background: '#1c1c1c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
        }}>No products match your filters</div>
      ) : (
        products.map((p) => {
          const score = p.winning_score ?? 0;
          const isAli = (p.platform ?? '').toLowerCase().includes('aliexpress');
          return (
            <div
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                background: '#1c1c1c',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                overflow: 'hidden',
                transition: 'border-color 200ms, transform 200ms',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                height: 100,
                background: '#0d0d10',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <ProductHeroImage src={p.image_url} title={p.product_title} />
              </div>
              <div style={{ padding: 14 }}>
                <div style={{
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#ededed',
                  lineHeight: 1.4,
                  marginBottom: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>{p.product_title}</div>
                <div style={{ marginTop: 10 }}><ScoreDisplay score={score} /></div>
                <div style={{
                  marginTop: 6,
                  fontFamily: mono,
                  fontSize: 12,
                  color: p.sold_count != null ? '#10b981' : '#52525b',
                }}>{p.sold_count != null ? `${p.sold_count.toLocaleString()} orders` : '— orders'}</div>
                <div style={{
                  marginTop: 4,
                  fontFamily: mono,
                  fontSize: 12,
                  color: '#71717a',
                }}>{p.price_aud != null ? `$${p.price_aud.toFixed(2)}` : '—'}</div>
                {isAli && (
                  <div style={{ marginTop: 8 }}>
                    <SourcePill source={p.platform} />
                  </div>
                )}
                {p.product_url && (
                  <a
                    href={p.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: sans,
                      fontSize: 12,
                      color: '#7c6aff',
                      textDecoration: 'none',
                    }}
                  >View details <ArrowUpRight size={11} /></a>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Featured Carousels (tabs) ───────────────────────────────────────
function FeaturedCarousels({ active, setActive, onSelect }: { active: CarouselKey; setActive: (k: CarouselKey) => void; onSelect: (p: Product) => void }) {
  const recentlyAdded = useProducts({ limit: 10, orderBy: 'created_at' });
  const topScored    = useProducts({ limit: 10, orderBy: 'winning_score' });
  const bestValue    = useProducts({ limit: 10, orderBy: 'price_asc' });
  const tabs: { key: CarouselKey; label: string }[] = [
    { key: 'recent', label: 'New Arrivals' },
    { key: 'scored', label: 'Top Scored' },
    { key: 'value',  label: 'Best Value' },
  ];
  const data = active === 'recent' ? recentlyAdded : active === 'scored' ? topScored : bestValue;
  return (
    <div style={{ padding: '0 32px 24px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            style={{
              padding: '10px 18px',
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 500,
              color: active === tab.key ? '#ededed' : '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: active === tab.key ? '2px solid #7c6aff' : '2px solid transparent',
              marginBottom: -1,
            }}
          >{tab.label}</button>
        ))}
      </div>
      <div style={{
        display: 'flex',
        gap: 12,
        paddingBottom: 12,
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none' as const,
        minHeight: 0,
        alignItems: 'stretch',
      }}>
        {data.loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mj-shim" style={{ width: 200, height: 250, borderRadius: 10, flexShrink: 0 }} />
            ))
          : data.products.length === 0
            ? <div style={{ fontFamily: sans, fontSize: 13, color: '#52525b' }}>No products yet</div>
            : data.products.map((p) => <CarouselCard key={p.id} product={p} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

function CarouselCard({ product: p, onSelect }: { product: Product; onSelect: (p: Product) => void }) {
  const score = p.winning_score ?? 0;
  const sp = scorePillStyle(score);
  const cs = getCategoryStyle(p.category);
  return (
    <div
      onClick={() => onSelect(p)}
      style={{
        flexShrink: 0,
        width: 200,
        minHeight: 0,
        background: '#1c1c1c',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 180ms',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.13)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ width: '100%', height: 130, position: 'relative', overflow: 'hidden', background: '#151515' }}>
        {p.image_url ? (
          <img
            src={proxyImage(p.image_url) ?? p.image_url}
            loading="lazy"
            alt={p.product_title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: cs.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            {cs.emoji}
          </div>
        )}
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <span style={{
            background: sp.background,
            color: sp.color,
            fontFamily: mono,
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 999,
            display: 'inline-block',
          }}>{score || '—'}</span>
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: sans, fontSize: 12, color: '#52525b', marginBottom: 4 }}>{p.category || 'General'}</div>
        <div style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 600,
          color: '#ededed',
          lineHeight: 1.3,
          marginBottom: 10,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: 34,
        }}>{p.product_title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#10b981' }}>
            {p.sold_count ? `${p.sold_count.toLocaleString()} orders` : '—'}
          </span>
          <span style={{ fontFamily: mono, fontSize: 12, color: '#a1a1aa' }}>
            {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}
          </span>
        </div>
        <ProductSparkline productId={p.id} score={score} width={170} height={20} points={8} />
      </div>
    </div>
  );
}

function LiveSearchView({ aeSearch }: { aeSearch: ReturnType<typeof useAESearch> }) {
  const { products, loading, loadingMore, error, query, total, hasMore, upstreamError } = aeSearch;
  return (
    <div style={{ padding: '0 32px 40px' }}>
      {/* Live mode banner */}
      <div style={{
        margin: '0 0 16px',
        padding: '10px 16px',
        background: 'rgba(255,90,0,0.06)',
        border: '1px solid rgba(255,90,0,0.2)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>🛒</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(255,130,0,0.9)' }}>Live AliExpress Search</span>
          <span style={{ fontFamily: sans, fontSize: 12, color: '#71717a', marginLeft: 8 }}>
            Real-time results from AliExpress Affiliate API · {total.toLocaleString()} found · No filtering applied
          </span>
        </div>
      </div>

      {upstreamError && (
        <div style={{
          margin: '0 0 16px',
          padding: '10px 16px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          fontFamily: mono,
          fontSize: 11,
          color: '#f87171',
        }}>
          AE upstream: {upstreamError}
        </div>
      )}

      {error && (
        <div style={{
          margin: '0 0 16px',
          padding: '10px 16px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          fontFamily: sans,
          fontSize: 12,
          color: '#f87171',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mj-shim" style={{ height: 280, borderRadius: 10 }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{
          padding: '60px 16px',
          textAlign: 'center',
          fontFamily: sans,
          fontSize: 13,
          color: '#52525b',
          background: '#1c1c1c',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
        }}>
          {query ? `No live results for "${query}". Try different keywords.` : 'Type a query and press Enter.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {products.map((p) => <LiveCard key={p.id} product={p} />)}
        </div>
      )}

      {loadingMore && (
        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: mono, fontSize: 11, color: '#52525b' }}>
          Loading more…
        </div>
      )}
      {!hasMore && products.length > 0 && (
        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: mono, fontSize: 11, color: '#3f3f46' }}>
          End of results
        </div>
      )}
    </div>
  );
}

function LiveCard({ product: p }: { product: AELiveProduct }) {
  return (
    <a
      href={p.product_url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        background: '#1c1c1c',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'all 180ms',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,90,0,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{ width: '100%', height: 160, background: '#151515', overflow: 'hidden' }}>
        {p.image_url ? (
          <img
            src={proxyImage(p.image_url) ?? p.image_url}
            alt={p.product_title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : null}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{
          display: 'inline-block',
          fontFamily: mono,
          fontSize: 9,
          fontWeight: 700,
          color: 'rgba(255,130,0,0.9)',
          background: 'rgba(255,90,0,0.1)',
          border: '1px solid rgba(255,90,0,0.2)',
          padding: '2px 6px',
          borderRadius: 4,
          marginBottom: 8,
          letterSpacing: '0.05em',
        }}>LIVE · UNSCORED</div>
        <div style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 600,
          color: '#ededed',
          lineHeight: 1.3,
          marginBottom: 8,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: 34,
        }}>{p.product_title}</div>
        {p.category && (
          <div style={{ fontFamily: mono, fontSize: 11, color: '#52525b', marginBottom: 8 }}>{p.category}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#10b981' }}>
            {p.sold_count > 0 ? `${p.sold_count.toLocaleString()} sold` : '—'}
          </span>
          <span style={{ fontFamily: mono, fontSize: 13, color: '#a1a1aa' }}>
            {p.price_aud > 0 ? `$${p.price_aud.toFixed(2)}` : '—'}
          </span>
        </div>
      </div>
    </a>
  );
}

function ScoreDisplay({ score }: { score: number }) {
  const sp = scorePillStyle(score);
  const dotColor = score >= 90 ? '#10b981' : score >= 70 ? '#a78bfa' : score >= 50 ? '#f59e0b' : 'rgba(255,255,255,0.3)';
  return (
    <span
      className={score >= 95 ? 'mj-score-hot' : ''}
      title="Score based on: orders volume, price margin, trend direction"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: sp.background,
        color: sp.color,
        border: sp.border,
        fontFamily: mono,
        fontSize: 12,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 999,
        cursor: 'help',
      }}
    >
      <span style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: dotColor,
        flexShrink: 0,
      }} />
      {score ? fmtScore(score) : '—'}
    </span>
  );
}

function ProductThumb({ title, image, category }: { title: string; image: string | null; category: string | null }) {
  const cs = getCategoryStyle(category);
  const [failed, setFailed] = useState(false);
  const initial = (category?.trim()?.[0] || title?.trim()?.[0] || '?').toUpperCase();
  const hasImage = image && !failed;
  return (
    <div style={{
      width: 52,
      height: 52,
      borderRadius: 8,
      background: cs.gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {hasImage ? (
        <img
          src={proxyImage(image) ?? image}
          alt={title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.85)',
          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}>{initial}</span>
      )}
    </div>
  );
}


interface RowActionsProps {
  product: Product;
  isFav: boolean;
  onToggleFav: () => void;
}

function RowActions({ product, isFav, onToggleFav }: RowActionsProps) {
  const pillBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    height: 28,
    padding: '0 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: sans,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 150ms ease',
  };
  return (
    <>
      <button
        title={isFav ? 'Saved — click to remove' : 'Save product'}
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        style={{
          ...pillBase,
          width: 28,
          padding: 0,
          justifyContent: 'center',
          background: isFav ? 'rgba(124,106,255,0.18)' : 'rgba(255,255,255,0.04)',
          color: isFav ? '#a78bfa' : 'rgba(255,255,255,0.5)',
          border: `1px solid ${isFav ? 'rgba(124,106,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isFav ? 'rgba(124,106,255,0.28)' : 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isFav ? 'rgba(124,106,255,0.18)' : 'rgba(255,255,255,0.04)'; }}
      >
        <Heart size={12} fill={isFav ? '#a78bfa' : 'none'} strokeWidth={isFav ? 2 : 1.6} />
      </button>
      <button
        title="Profit Calculator"
        onClick={(e) => { e.stopPropagation(); window.location.href = '/app/profit'; }}
        style={{
          ...pillBase,
          background: 'rgba(124,106,255,0.15)',
          color: '#a78bfa',
          border: '1px solid rgba(124,106,255,0.28)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,106,255,0.22)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,106,255,0.15)'; }}
      ><Calculator size={11} />Profit Calc</button>
      <button
        title="Generate ad creative"
        onClick={(e) => { e.stopPropagation(); window.location.href = `/app/ads-studio?product=${encodeURIComponent(product.product_title || '')}`; }}
        style={{
          ...pillBase,
          background: 'rgba(16,185,129,0.12)',
          color: '#10b981',
          border: '1px solid rgba(16,185,129,0.28)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.2)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.12)'; }}
      ><Zap size={11} />Create Ad</button>
      {product.product_url && (
        <a
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          title="View on AliExpress"
          onClick={(e) => e.stopPropagation()}
          style={{
            ...pillBase,
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)'; }}
        ><ExternalLink size={10} />Source</a>
      )}
    </>
  );
}
