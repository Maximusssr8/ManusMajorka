import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Search, List, LayoutGrid, ArrowUpRight } from 'lucide-react';
import { useProducts, type OrderByColumn, type Product } from '@/hooks/useProducts';
import { useNicheStats } from '@/hooks/useNicheStats';
import { ProductImage } from '@/components/app/ProductImage';
import { getCategoryStyle } from '@/lib/categoryColor';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

const SHIMMER = `
@keyframes mj-app-shim {
  0%   { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
.mj-shim {
  background: linear-gradient(90deg, #111114 0%, #1a1a1f 50%, #111114 100%);
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
      src={src}
      alt={title}
      referrerPolicy="no-referrer-when-downgrade"
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

  const { products, loading, total } = useProducts({
    limit,
    orderBy,
    minScore: scoreFilter === 0 ? undefined : scoreFilter,
    category: activeNiche ?? undefined,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.product_title?.toLowerCase().includes(q));
  }, [products, search]);

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

      <LiveActivityFeed />

      <FeaturedSections />

      <NicheSection activeNiche={activeNiche} setActiveNiche={setActiveNiche} />

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
        <TableView products={filtered} loading={loading} />
      ) : (
        <GridView products={filtered} loading={loading} />
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
    </>
  );
}

function TableView({ products, loading }: { products: Product[]; loading: boolean }) {
  return (
    <div style={{ padding: '0 32px 32px' }}>
      <div style={{
        background: '#111114',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 1.4fr 130px 130px 100px 100px 110px 70px',
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
          <span>Source</span>
          <span style={{ textAlign: 'right' }}>Action</span>
        </div>

        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '40px 1.4fr 130px 130px 100px 100px 110px 70px',
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
              <span className="mj-shim" style={{ height: 16, width: 60, borderRadius: 999 }} />
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
            return (
              <div
                key={p.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1.4fr 130px 130px 100px 100px 110px 70px',
                  gap: 14,
                  padding: '14px 16px',
                  alignItems: 'center',
                  borderBottom: i === products.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 120ms',
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
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <ScoreDisplay score={score} />
                </span>
                <span style={{
                  fontFamily: mono,
                  fontSize: 12,
                  color: p.sold_count != null && p.sold_count > 0 ? '#22c55e' : '#374151',
                  textAlign: 'right',
                }}>{p.sold_count != null && p.sold_count > 0 ? p.sold_count.toLocaleString() : 'syncing'}</span>
                <span style={{
                  fontFamily: mono,
                  fontSize: 13,
                  color: '#ededed',
                  textAlign: 'right',
                }}>{p.price_aud != null ? `$${p.price_aud.toFixed(2)}` : '—'}</span>
                <span><SourcePill source={p.platform} /></span>
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

function GridView({ products, loading }: { products: Product[]; loading: boolean }) {
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
            background: '#111114',
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
          background: '#111114',
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
              style={{
                background: '#111114',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                overflow: 'hidden',
                transition: 'border-color 200ms, transform 200ms',
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
                <div style={{
                  marginTop: 10,
                  display: 'inline-block',
                  padding: '3px 8px',
                  background: 'rgba(99,102,241,0.12)',
                  color: '#6366F1',
                  borderRadius: 999,
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 600,
                }}>{score} / 100</div>
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

// ── Featured Sections (Best Sellers / Highest Scoring / Best Margins) ─────
interface SectionRowProps {
  title: string;
  emoji: string;
  bg: string;
  border: string;
  accentColor: string;
  products: Product[];
  loading: boolean;
}

function SectionRow({ title, emoji, bg, border, accentColor, products, loading }: SectionRowProps) {
  return (
    <div style={{ padding: '0 32px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: '#ededed', margin: 0, letterSpacing: '-0.015em' }}>
          {emoji} {title}
        </h3>
        <Link href="/app/products" style={{ fontFamily: sans, fontSize: 12, color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '4px 0 12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none' as const,
        }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mj-shim" style={{ width: 200, height: 188, borderRadius: 10, flexShrink: 0 }} />
            ))
          : products.length === 0
            ? <div style={{ fontFamily: sans, fontSize: 13, color: '#52525b' }}>No products yet</div>
            : products.map((p) => (
                <FeaturedCard key={p.id} product={p} bg={bg} border={border} accentColor={accentColor} />
              ))}
      </div>
    </div>
  );
}

function FeaturedCard({ product, bg, border, accentColor }: { product: Product; bg: string; border: string; accentColor: string }) {
  const cs = getCategoryStyle(product.category);
  const score = product.winning_score ?? 0;
  const orders = product.sold_count ?? 0;
  return (
    <div style={{
      width: 200,
      flexShrink: 0,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: cs.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_title}
              referrerPolicy="no-referrer-when-downgrade"
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            cs.emoji
          )}
        </div>
        <span style={{
          padding: '3px 9px',
          background: `${accentColor}22`,
          border: `1px solid ${accentColor}55`,
          borderRadius: 999,
          fontFamily: mono,
          fontSize: 11,
          fontWeight: 600,
          color: accentColor,
        }}>{score || '—'}</span>
      </div>
      <div style={{
        fontFamily: sans,
        fontSize: 13,
        color: '#ededed',
        lineHeight: 1.35,
        fontWeight: 600,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        minHeight: 36,
      }}>{product.product_title}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: orders > 0 ? '#22c55e' : '#52525b' }}>
          {orders > 0 ? `${orders.toLocaleString()} orders` : 'N/A'}
        </span>
        <span style={{ fontFamily: mono, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
          {product.price_aud != null ? `$${product.price_aud.toFixed(2)}` : '—'}
        </span>
      </div>
    </div>
  );
}

function FeaturedSections() {
  const recentlyAdded = useProducts({ limit: 10, orderBy: 'created_at' });
  const topScored    = useProducts({ limit: 10, orderBy: 'winning_score' });
  const bestValue    = useProducts({ limit: 10, orderBy: 'price_asc' });
  return (
    <>
      <SectionRow
        title="Recently Added"
        emoji="🆕"
        bg="linear-gradient(135deg, rgba(249,115,22,0.08), rgba(239,68,68,0.04))"
        border="rgba(249,115,22,0.2)"
        accentColor="#f97316"
        products={recentlyAdded.products}
        loading={recentlyAdded.loading}
      />
      <SectionRow
        title="Top Scored"
        emoji="⭐"
        bg="linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.04))"
        border="rgba(99,102,241,0.2)"
        accentColor="#6366F1"
        products={topScored.products}
        loading={topScored.loading}
      />
      <SectionRow
        title="Best Value"
        emoji="💰"
        bg="linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.04))"
        border="rgba(34,197,94,0.2)"
        accentColor="#22c55e"
        products={bestValue.products}
        loading={bestValue.loading}
      />
    </>
  );
}

// ── Live Activity Feed ──────────────────────────────────────────────
interface LiveEvent { flag: string; text: string; time: string }
const LIVE_EVENTS: LiveEvent[] = [
  { flag: '🇦🇺', text: 'AU operator added a new product to their Shopify store',     time: '2m ago' },
  { flag: '🇺🇸', text: 'US operator discovered a winning product in Hardware',        time: '5m ago' },
  { flag: '🇬🇧', text: 'UK operator confirmed 50%+ margin via profit calculator',     time: '8m ago' },
  { flag: '🇨🇦', text: 'CA operator launched a new store from the builder',           time: '12m ago' },
  { flag: '🇩🇪', text: 'DE operator exported a product batch to Shopify',             time: '16m ago' },
  { flag: '🇸🇬', text: 'SG operator generated ad copy for a top-scored product',      time: '20m ago' },
  { flag: '🇳🇿', text: 'NZ operator found a new opportunity in the database',         time: '24m ago' },
];

function LiveActivityFeed() {
  return (
    <>
      <style>{`@keyframes mj-live-scroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      <div style={{
        margin: '0 32px 20px',
        background: 'rgba(34,197,94,0.04)',
        border: '1px solid rgba(34,197,94,0.12)',
        borderRadius: 8,
        padding: '9px 16px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#22c55e',
            display: 'inline-block',
            boxShadow: '0 0 6px rgba(34,197,94,0.6)',
          }} />
          <span style={{
            fontFamily: mono,
            fontSize: 10,
            fontWeight: 700,
            color: '#22c55e',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>Live</span>
        </div>
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{
            display: 'flex',
            gap: 48,
            animation: 'mj-live-scroll 35s linear infinite',
            width: 'max-content',
          }}>
            {[...LIVE_EVENTS, ...LIVE_EVENTS].map((e, i) => (
              <span key={i} style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {e.flag} <span style={{ color: '#ededed' }}>{e.text}</span>
                <span style={{ color: '#4b5563', marginLeft: 8 }}>{e.time}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Niche Section (real DB counts) ──────────────────────────────────
function nicheColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('kitchen'))                          return '#f97316';
  if (n.includes('electron') || n.includes('tech'))   return '#6366F1';
  if (n.includes('health') || n.includes('beauty'))   return '#ec4899';
  if (n.includes('fitness') || n.includes('sport'))   return '#22c55e';
  if (n.includes('kid') || n.includes('toy') || n.includes('baby')) return '#a855f7';
  if (n.includes('auto') || n.includes('car'))        return '#6b7280';
  if (n.includes('fashion') || n.includes('cloth'))   return '#f59e0b';
  if (n.includes('home') || n.includes('storage'))    return '#14b8a6';
  if (n.includes('outdoor'))                          return '#84cc16';
  if (n.includes('pet'))                              return '#fb923c';
  if (n.includes('jewel') || n.includes('accessor')) return '#e879f9';
  return '#6366F1';
}

function NicheSection({ activeNiche, setActiveNiche }: { activeNiche: string | null; setActiveNiche: (v: string | null) => void }) {
  const { niches, loading } = useNicheStats();
  return (
    <div style={{ padding: '0 32px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: '#ededed', margin: 0, letterSpacing: '-0.015em' }}>
          🗂️ Niches <span style={{ fontFamily: sans, fontSize: 12, color: '#6b7280', fontWeight: 400 }}>tracked in the database</span>
        </h3>
        {activeNiche && (
          <button onClick={() => setActiveNiche(null)} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#a1a1aa',
            fontSize: 11,
            fontFamily: mono,
            padding: '4px 10px',
            borderRadius: 5,
            cursor: 'pointer',
          }}>Clear filter ×</button>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 10,
      }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mj-shim" style={{ height: 70, borderRadius: 8 }} />
            ))
          : niches.length === 0
            ? <div style={{ color: '#52525b', fontSize: 13 }}>No niches yet</div>
            : niches.map((n) => {
                const isActive = activeNiche === n.name;
                const c = nicheColor(n.name);
                return (
                  <button
                    key={n.name}
                    onClick={() => setActiveNiche(isActive ? null : n.name)}
                    style={{
                      background: isActive ? `${c}22` : '#0d0d10',
                      border: `1px solid ${isActive ? c : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 8,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 150ms, background 150ms',
                    }}
                  >
                    <div style={{
                      fontFamily: sans,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ededed',
                      marginBottom: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{n.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: mono, fontSize: 11, color: c, fontWeight: 700 }}>
                        {n.count.toLocaleString()} products
                      </span>
                      <span style={{ fontFamily: mono, fontSize: 10, color: '#71717a' }}>
                        avg {n.avgScore}
                      </span>
                    </div>
                  </button>
                );
              })}
      </div>
    </div>
  );
}

// ── Score Display + Row Actions ─────────────────────────────────────
function getScoreLabel(s: number): { label: string; bg: string; color: string } {
  if (s >= 90) return { label: '🔥 HOT',  bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' };
  if (s >= 70) return { label: '📈 GOOD', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
  if (s >= 50) return { label: '📊 OK',   bg: 'rgba(99,102,241,0.12)', color: '#6366F1' };
  return         { label: '❄️ COLD', bg: 'rgba(55,65,81,0.3)',    color: '#6b7280' };
}

function ScoreDisplay({ score }: { score: number }) {
  const sl = getScoreLabel(score);
  return (
    <div>
      <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: sl.color }}>{score || '—'}</span>
      {score > 0 && (
        <div style={{ marginTop: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: sl.color, background: sl.bg, padding: '1px 5px', borderRadius: 3 }}>
            {sl.label}
          </span>
        </div>
      )}
    </div>
  );
}

function RowActions({ product }: { product: Product }) {
  return (
    <>
      <button
        title="Profit Calculator"
        onClick={() => { window.location.href = '/app/profit'; }}
        style={{ padding: '4px 8px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
      >💰</button>
      <button
        title="Generate Ad"
        onClick={() => { window.location.href = `/app/ads-studio?product=${encodeURIComponent(product.product_title || '')}`; }}
        style={{ padding: '4px 8px', background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
      >🎯</button>
      {product.product_url && (
        <button
          title="View on AliExpress"
          onClick={() => product.product_url && window.open(product.product_url, '_blank', 'noopener,noreferrer')}
          style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
        >↗</button>
      )}
    </>
  );
}
