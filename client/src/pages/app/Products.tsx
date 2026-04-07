import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Search, List, LayoutGrid, ArrowUpRight } from 'lucide-react';
import { useProducts, type OrderByColumn, type Product } from '@/hooks/useProducts';
import { useNicheStats } from '@/hooks/useNicheStats';
import { ProductImage } from '@/components/app/ProductImage';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import { ProductSparkline } from '@/components/app/Sparkline';
import { getCategoryStyle } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { scorePillStyle } from '@/lib/scorePill';

type CarouselKey = 'recent' | 'scored' | 'value';
type SmartTabKey = 'all' | 'new' | 'trending' | 'highmargin' | 'top';

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
  background: linear-gradient(90deg, #141417 0%, #1a1a1f 50%, #141417 100%);
  background-size: 300px 100%;
  animation: mj-app-shim 1.4s linear infinite;
  border-radius: 4px;
  display: inline-block;
}
@keyframes mj-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
.mj-app-pulse-dot {
  display: inline-block;
  width: 7px; height: 7px; border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34,197,94,0.6);
  animation: mj-pulse 1.6s infinite;
}
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
        color: 'rgba(99,102,241,0.4)',
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
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState<OrderByColumn>('sold_count');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>(0);
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [limit, setLimit] = useState(20);
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCarousel, setActiveCarousel] = useState<CarouselKey>('recent');
  const [activeTab, setActiveTab] = useState<SmartTabKey>('all');
  const { niches } = useNicheStats();

  const { products, loading, total } = useProducts({
    limit,
    orderBy,
    minScore: scoreFilter === 0 ? undefined : scoreFilter,
    category: activeNiche ?? undefined,
  });

  const filtered = useMemo(() => {
    let list = products;
    // Smart tab filter (client-side)
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
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.product_title?.toLowerCase().includes(q));
    }
    return list;
  }, [products, search, activeTab]);

  return (
    <>
      <style>{SHIMMER}</style>

      {/* Page header */}
      <div style={{ padding: '28px 32px 16px' }}>
        <h1 style={{
          fontFamily: display,
          fontWeight: 600,
          fontSize: 22,
          color: '#ededed',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>Products</h1>
        <p style={{ fontFamily: sans, fontSize: 13, color: '#71717a', margin: '4px 0 0' }}>
          Real products from AliExpress with genuine order data{loading ? '' : ` · ${total.toLocaleString()} tracked`}
        </p>
      </div>

      {/* Smart tab presets */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '0 32px',
        marginBottom: 16,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
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
                padding: '9px 16px',
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 500,
                color: active ? '#ededed' : '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: active ? '2px solid #6366F1' : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 150ms',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div style={{ padding: '0 32px 12px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 30, width: '100%' }}
          />
        </div>
        <select
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value as OrderByColumn)}
          style={selectStyle}
        >
          <option value="sold_count">Orders: High to Low</option>
          <option value="winning_score">Score: High to Low</option>
        </select>
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(Number(e.target.value) as ScoreFilter)}
          style={selectStyle}
        >
          <option value={0}>All scores</option>
          <option value={65}>65+ Score</option>
          <option value={80}>80+ Score</option>
          <option value={90}>90+ Score</option>
        </select>
        <select
          value={activeNiche ?? ''}
          onChange={(e) => setActiveNiche(e.target.value || null)}
          style={{ ...selectStyle, background: '#141417', borderColor: 'rgba(255,255,255,0.07)', borderRadius: 7 }}
        >
          <option value="">All Niches</option>
          {niches.map((n) => (
            <option key={n.name} value={n.name}>{n.name} ({n.count})</option>
          ))}
        </select>
        <div style={{
          display: 'inline-flex',
          background: '#0d0d10',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          padding: 2,
          marginLeft: 'auto',
        }}>
          {(['table', 'grid'] as const).map((mode) => {
            const active = view === mode;
            return (
              <button
                key={mode}
                onClick={() => setView(mode)}
                aria-label={mode}
                style={{
                  width: 32,
                  height: 30,
                  border: 'none',
                  background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: active ? '#6366F1' : '#71717a',
                  cursor: 'pointer',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 150ms',
                }}
              >
                {mode === 'table' ? <List size={14} /> : <LayoutGrid size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* AE source banner */}
      <div style={{ padding: '0 32px 8px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 6,
          padding: '6px 12px',
        }}>
          <span className="mj-app-pulse-dot" />
          <span style={{ fontFamily: mono, fontSize: 11, color: '#6b7280' }}>
            Sourced from AliExpress Affiliate API · Real order counts · Updated every 4 hours
          </span>
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
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#ededed'; }}
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

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}

function TableView({ products, loading, onSelect }: { products: Product[]; loading: boolean; onSelect: (p: Product) => void }) {
  return (
    <div style={{ padding: '0 32px 32px' }}>
      <div style={{
        background: '#141417',
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
            const estRevenue = p.sold_count && p.price_aud
              ? Math.round(Number(p.sold_count) * Number(p.price_aud) * 0.45)
              : null;
            return (
              <div
                key={p.id}
                onClick={() => onSelect(p)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1.3fr 110px 80px 90px 80px 110px 70px 70px',
                  gap: 14,
                  padding: '14px 16px',
                  alignItems: 'center',
                  borderBottom: i === products.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 120ms',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
                  color: p.sold_count != null && p.sold_count > 0 ? '#22c55e' : '#4b5563',
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
                  color: estRevenue != null ? '#22c55e' : '#4b5563',
                  textAlign: 'right',
                }}>
                  {estRevenue != null
                    ? `~$${estRevenue >= 1000 ? (estRevenue / 1000).toFixed(1) + 'k' : estRevenue}/mo`
                    : '—'}
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
            background: '#141417',
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
          background: '#141417',
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
                background: '#141417',
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
                  color: p.sold_count != null ? '#22c55e' : '#52525b',
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
                      color: '#6366F1',
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
              borderBottom: active === tab.key ? '2px solid #6366F1' : '2px solid transparent',
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
        background: '#141417',
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
      <div style={{ width: '100%', height: 130, position: 'relative', overflow: 'hidden', background: '#0c0c0e' }}>
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
          <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#22c55e' }}>
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

function ScoreDisplay({ score }: { score: number }) {
  const sp = scorePillStyle(score);
  return (
    <span style={{
      background: sp.background,
      color: sp.color,
      fontFamily: mono,
      fontSize: 12,
      fontWeight: 700,
      padding: '3px 9px',
      borderRadius: 999,
      display: 'inline-block',
    }}>{score || '—'}</span>
  );
}


function RowActions({ product }: { product: Product }) {
  return (
    <>
      <button
        title="Profit Calculator"
        onClick={(e) => { e.stopPropagation(); window.location.href = '/app/profit'; }}
        style={{ padding: '4px 8px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
      >💰</button>
      <button
        title="Generate Ad"
        onClick={(e) => { e.stopPropagation(); window.location.href = `/app/ads-studio?product=${encodeURIComponent(product.product_title || '')}`; }}
        style={{ padding: '4px 8px', background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
      >🎯</button>
      {product.product_url && (
        <button
          title="View on AliExpress"
          onClick={(e) => { e.stopPropagation(); product.product_url && window.open(product.product_url, '_blank', 'noopener,noreferrer'); }}
          style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
        >↗</button>
      )}
    </>
  );
}
