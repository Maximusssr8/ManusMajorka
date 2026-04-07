import { useMemo, useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Search, List, LayoutGrid, ArrowUpRight } from 'lucide-react';
import { useProducts, type OrderByColumn, type Product } from '@/hooks/useProducts';
import { useAESearch, type AELiveProduct } from '@/hooks/useAESearch';
import { useNicheStats } from '@/hooks/useNicheStats';
import { ProductImage } from '@/components/app/ProductImage';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import { ProductSparkline } from '@/components/app/Sparkline';
import { getCategoryStyle } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { scorePillStyle } from '@/lib/scorePill';

type CarouselKey = 'recent' | 'scored' | 'value';
type SmartTabKey = 'all' | 'new' | 'trending' | 'highmargin' | 'top';

const fmtRev = (v: number): string =>
  v >= 1_000_000 ? `~$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `~$${Math.round(v / 1_000)}k`
  : v > 0        ? `~$${v}`
  : '—';

const SMART_TABS: { key: SmartTabKey; label: string; icon: string }[] = [
  { key: 'all',         label: 'All Products',   icon: '' },
  { key: 'new',         label: 'New This Week',  icon: '🆕' },
  { key: 'trending',    label: 'Trending Now',   icon: '🔥' },
  { key: 'highmargin',  label: 'High Margin',    icon: '💰' },
  { key: 'top',         label: 'Score 90+',      icon: '⭐' },
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

export default function AppProducts() {
  const [orderBy, setOrderBy] = useState<OrderByColumn>('sold_count');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [limit, setLimit] = useState(20);
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCarousel, setActiveCarousel] = useState<CarouselKey>('recent');
  const [activeTab, setActiveTab] = useState<SmartTabKey>('all');
  const [searchMode, setSearchMode] = useState<'db' | 'live'>('db');
  const [liveQuery, setLiveQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [minOrders, setMinOrders] = useState<number | null>(null);
  const aeSearch = useAESearch();
  const { niches } = useNicheStats();

  const { products, loading, total } = useProducts({
    limit,
    orderBy,
    category: activeNiche ?? undefined,
    minPrice: priceMin ?? undefined,
    maxPrice: priceMax ?? undefined,
    minOrders: minOrders ?? undefined,
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

  const filtered = useMemo(() => {
    let list = products;
    if (activeTab === 'new') {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((p) => p.created_at && new Date(p.created_at).getTime() >= cutoff);
    } else if (activeTab === 'trending') {
      list = list.filter((p) => (p.sold_count ?? 0) > 1000 || (p.winning_score ?? 0) >= 80);
    } else if (activeTab === 'highmargin') {
      list = list.filter((p) => p.price_aud != null && Number(p.price_aud) > 5);
    } else if (activeTab === 'top') {
      list = list.filter((p) => (p.winning_score ?? 0) >= 90);
    }
    return list;
  }, [products, activeTab]);

  return (
    <>
      <style>{SHIMMER}</style>

      {/* Page header */}
      <div style={{ padding: '32px 36px 20px' }}>
        <h1 style={{
          fontFamily: display,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: '0 0 4px',
          background: 'linear-gradient(135deg, #f1f1f3 0%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>Products</h1>
        <p style={{ fontFamily: sans, fontSize: 13, color: '#5a5a6e', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="mj-app-pulse-dot" />
          {searchMode === 'live'
            ? `Live AliExpress Affiliate API · ${aeSearch.total.toLocaleString()} results for "${aeSearch.query}"`
            : `${total > 0 ? total.toLocaleString() : ''} products tracked · AliExpress Advanced API · refreshed every 6h`}
        </p>
      </div>

      {/* Live AE search bar */}
      <div style={{ padding: '0 32px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }}>⌘</span>
          <input
            placeholder={`Search ${total > 0 ? total.toLocaleString() : '2,302'} products or explore 829k+ live from AliExpress...`}
            defaultValue={liveQuery}
            style={{
              width: '100%',
              background: '#1c1c1c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '14px 18px 14px 44px',
              color: '#f5f5f5',
              fontFamily: sans,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(124,106,255,0.5)';
              (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(124,106,255,0.08)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
            }}
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
        <button
          onClick={() => setShowFilters((s) => !s)}
          style={{
            padding: '10px 14px',
            background: showFilters ? 'rgba(124,106,255,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${showFilters ? 'rgba(124,106,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8,
            color: showFilters ? '#7c6aff' : '#6b7280',
            fontFamily: sans,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >⚙️ Filters</button>
        {searchMode === 'live' && (
          <button
            onClick={() => { setSearchMode('db'); aeSearch.reset(); setLiveQuery(''); }}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#a1a1aa',
              fontFamily: sans,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >← Back to Database</button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showFilters && searchMode === 'db' && (
        <div style={{
          margin: '0 32px 16px',
          padding: '16px 20px',
          background: '#1c1c1c',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
        }}>
          {[
            { label: 'Min Price ($)', value: priceMin, set: setPriceMin, ph: '0' },
            { label: 'Max Price ($)', value: priceMax, set: setPriceMax, ph: '999' },
            { label: 'Min Orders',    value: minOrders, set: setMinOrders, ph: '0' },
          ].map((f) => (
            <div key={f.label}>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{f.label}</div>
              <input
                type="number"
                placeholder={f.ph}
                value={f.value ?? ''}
                onChange={(e) => f.set(e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: '100%',
                  background: '#151515',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: '#ededed',
                  fontFamily: mono,
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => { setPriceMin(null); setPriceMax(null); setMinOrders(null); }}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                color: '#71717a',
                fontFamily: sans,
                fontSize: 12,
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
      {/* Smart tabs + sort + view toggle (consolidated) */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '0 32px',
        marginBottom: 16,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        alignItems: 'center',
      }}>
        {SMART_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                fontFamily: sans,
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? '#f5f5f5' : 'rgba(255,255,255,0.35)',
                background: active ? 'rgba(124,106,255,0.1)' : 'transparent',
                border: `1px solid ${active ? 'rgba(124,106,255,0.2)' : 'transparent'}`,
                borderRadius: 7,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)';
                }
              }}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <select
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value as OrderByColumn)}
          style={{ ...selectStyle, marginBottom: 6, flexShrink: 0 }}
        >
          <option value="sold_count">Orders: High → Low</option>
          <option value="winning_score">Score: High → Low</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="created_at">Newest first</option>
        </select>
        <div style={{
          display: 'inline-flex',
          background: '#0d0d10',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          padding: 2,
          marginBottom: 6,
          marginLeft: 6,
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
                  background: active ? 'rgba(124,106,255,0.12)' : 'transparent',
                  color: active ? '#7c6aff' : '#71717a',
                  cursor: 'pointer',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 150ms',
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
        <TableView products={filtered} loading={loading} onSelect={setSelectedProduct} />
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
    </>
  );
}

function TableView({ products, loading, onSelect }: { products: Product[]; loading: boolean; onSelect: (p: Product) => void }) {
  return (
    <div style={{ padding: '0 32px 32px' }}>
      <div style={{
        background: '#1c1c1c',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 1.3fr 110px 80px 90px 80px 110px 70px 70px',
          gap: 14,
          padding: '10px 16px',
          fontFamily: mono,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#52525b',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span>#</span>
          <span>Product</span>
          <span>Category</span>
          <span>Score</span>
          <span style={{ textAlign: 'right' }}>Orders/mo</span>
          <span style={{ textAlign: 'right' }}>Price</span>
          <span style={{ textAlign: 'right' }}>~Est. Revenue</span>
          <span>Trend</span>
          <span style={{ textAlign: 'right' }}>Action</span>
        </div>

        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '40px 1.3fr 110px 80px 90px 80px 110px 70px 70px',
              gap: 14,
              padding: '14px 16px',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span className="mj-shim" style={{ height: 12, width: 24 }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mj-shim" style={{ height: 32, width: 32, borderRadius: 5 }} />
                <span className="mj-shim" style={{ height: 12, width: '70%' }} />
              </span>
              <span className="mj-shim" style={{ height: 12, width: '70%' }} />
              <span className="mj-shim" style={{ height: 12, width: '70%' }} />
              <span className="mj-shim" style={{ height: 12, width: '70%' }} />
              <span className="mj-shim" style={{ height: 12, width: '70%' }} />
              <span className="mj-shim" style={{ height: 12, width: '80%' }} />
              <span className="mj-shim" style={{ height: 14, width: 50 }} />
              <span className="mj-shim" style={{ height: 24, width: 36, borderRadius: 5 }} />
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
            const estRevenue = (p.sold_count && p.price_aud)
              ? Math.round((Number(p.sold_count) * 0.04) * (Number(p.price_aud) * 2.2) * 0.32)
              : null;
            return (
              <div
                key={p.id}
                className="mj-row mj-row-hover"
                onClick={() => onSelect(p)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1.3fr 110px 80px 90px 80px 110px 70px 70px',
                  gap: 14,
                  padding: '14px 16px',
                  alignItems: 'center',
                  borderBottom: i === products.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 13, color: '#52525b' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Thumb title={p.product_title} image={p.image_url} />
                  <span style={{
                    fontFamily: sans,
                    fontSize: 13,
                    color: '#ededed',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{p.product_title}</span>
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 9px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 999,
                  fontFamily: sans,
                  fontSize: 12,
                  color: '#71717a',
                  width: 'fit-content',
                }}>{p.category ?? '—'}</span>
                <span><ScoreDisplay score={score} /></span>
                <span style={{
                  fontFamily: mono,
                  fontSize: 12,
                  color: p.sold_count != null && p.sold_count > 0 ? '#10b981' : '#4b5563',
                  textAlign: 'right',
                }}>{p.sold_count != null && p.sold_count > 0 ? p.sold_count.toLocaleString() : '—'}</span>
                <span style={{
                  fontFamily: mono,
                  fontSize: 13,
                  color: '#ededed',
                  textAlign: 'right',
                }}>{p.price_aud != null ? `$${p.price_aud.toFixed(2)}` : '—'}</span>
                <span style={{
                  fontFamily: mono,
                  fontSize: 12,
                  fontWeight: 600,
                  color: estRevenue != null ? '#10b981' : '#4b5563',
                  textAlign: 'right',
                }}>
                  {estRevenue != null ? `${fmtRev(estRevenue)}/mo` : '—'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <ProductSparkline productId={p.id} score={score} />
                </span>
                <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                  <RowActions product={p} />
                  {!p.product_url && (
                    <span style={{ fontSize: 11, color: '#52525b' }}>—</span>
                  )}
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
  return (
    <span
      className={score >= 95 ? 'mj-score-hot' : ''}
      style={{
        background: sp.background,
        color: sp.color,
        border: sp.border,
        fontFamily: mono,
        fontSize: 12,
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: 999,
        display: 'inline-block',
      }}
    >{score || '—'}</span>
  );
}


function RowActions({ product }: { product: Product }) {
  return (
    <>
      <button
        title="Profit Calculator"
        onClick={(e) => { e.stopPropagation(); window.location.href = '/app/profit'; }}
        style={{ padding: '4px 8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
        className="majorka-btn"
      >💰</button>
      <button
        title="Generate Ad"
        onClick={(e) => { e.stopPropagation(); window.location.href = `/app/ads-studio?product=${encodeURIComponent(product.product_title || '')}`; }}
        style={{ padding: '4px 8px', background: 'rgba(124,106,255,0.1)', color: '#7c6aff', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
        className="majorka-btn"
      >🎯</button>
      {product.product_url && (
        <button
          title="View on AliExpress"
          onClick={(e) => { e.stopPropagation(); product.product_url && window.open(product.product_url, '_blank', 'noopener,noreferrer'); }}
          style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
        className="majorka-btn"
        >↗</button>
      )}
    </>
  );
}
