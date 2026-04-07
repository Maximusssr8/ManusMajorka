import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Search, List, LayoutGrid, ArrowUpRight } from 'lucide-react';
import { useProducts, type OrderByColumn, type Product } from '@/hooks/useProducts';
import { ProductImage } from '@/components/app/ProductImage';
import { categoryGradient } from '@/lib/categoryColor';

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

  const { products, loading, total } = useProducts({
    limit,
    orderBy,
    minScore: scoreFilter === 0 ? undefined : scoreFilter,
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

      <FeaturedSections />

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
                  <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#6366F1' }}>{score || '—'}</span>
                  <span style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <span style={{
                      display: 'block',
                      height: '100%',
                      width: `${Math.min(100, score)}%`,
                      background: '#6366F1',
                      borderRadius: 2,
                    }} />
                  </span>
                </span>
                <span style={{
                  fontFamily: mono,
                  fontSize: 13,
                  color: p.sold_count != null ? '#22c55e' : '#71717a',
                  textAlign: 'right',
                }}>{p.sold_count != null ? p.sold_count.toLocaleString() : '—'}</span>
                <span style={{
                  fontFamily: mono,
                  fontSize: 13,
                  color: '#ededed',
                  textAlign: 'right',
                }}>{p.price_aud != null ? `$${p.price_aud.toFixed(2)}` : '—'}</span>
                <span><SourcePill source={p.platform} /></span>
                <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {p.product_url ? (
                    <a
                      href={p.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 5,
                        fontFamily: sans,
                        fontSize: 12,
                        color: '#71717a',
                        textDecoration: 'none',
                        transition: 'border-color 150ms, color 150ms',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#71717a'; }}
                    ><ArrowUpRight size={11} /></a>
                  ) : (
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
  const initial = ((product.product_title ?? 'P').trim() || 'P').charAt(0).toUpperCase();
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
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_title}
            referrerPolicy="no-referrer-when-downgrade"
            loading="lazy"
            style={{
              width: 44, height: 44, borderRadius: 8, objectFit: 'cover',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#0d0d10',
              flexShrink: 0,
            }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = 'none';
              const next = el.nextElementSibling as HTMLElement | null;
              if (next) next.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: categoryGradient(product.category),
          display: product.image_url ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: display,
          fontSize: 16,
          fontWeight: 600,
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}>{initial}</div>
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
  const bestSellers = useProducts({ limit: 6, orderBy: 'sold_count' });
  const highestScoring = useProducts({ limit: 6, orderBy: 'winning_score' });
  const bestMargins = useProducts({ limit: 6, orderBy: 'winning_score', minScore: 80 });
  return (
    <>
      <SectionRow
        title="Best Sellers This Week"
        emoji="🔥"
        bg="linear-gradient(135deg, rgba(249,115,22,0.08), rgba(239,68,68,0.04))"
        border="rgba(249,115,22,0.2)"
        accentColor="#f97316"
        products={bestSellers.products}
        loading={bestSellers.loading}
      />
      <SectionRow
        title="Highest Scoring"
        emoji="⭐"
        bg="linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.04))"
        border="rgba(99,102,241,0.2)"
        accentColor="#6366F1"
        products={highestScoring.products}
        loading={highestScoring.loading}
      />
      <SectionRow
        title="Best Margins"
        emoji="💰"
        bg="linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.04))"
        border="rgba(34,197,94,0.2)"
        accentColor="#22c55e"
        products={bestMargins.products}
        loading={bestMargins.loading}
      />
    </>
  );
}
