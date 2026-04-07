import { useMemo, useState } from 'react';
import { Search, LayoutGrid, List, ArrowUpRight } from 'lucide-react';
import { useProducts, type OrderByColumn, type Product } from '@/hooks/useProducts';
import { SkeletonRow, SkeletonCard } from '@/components/app/SkeletonRow';
import { EmptyState } from '@/components/app/EmptyState';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

type ScoreFilter = 'all' | '80' | '90';

export default function AppProducts() {
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState<OrderByColumn>('sold_count');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [limit, setLimit] = useState(20);

  const minScore = scoreFilter === '80' ? 80 : scoreFilter === '90' ? 90 : undefined;

  const { products, loading, total } = useProducts({ limit, orderBy, minScore });

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.product_title?.toLowerCase().includes(q));
  }, [products, search]);

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: display, fontWeight: 600, fontSize: 28, color: '#ededed', letterSpacing: '-0.025em', margin: '0 0 6px' }}>Products</h1>
        <p style={{ fontFamily: sans, fontSize: 14, color: '#71717a', margin: 0 }}>
          {loading ? 'Loading…' : `${total.toLocaleString()} products tracked across all markets · live AliExpress data`}
        </p>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        background: '#111114',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: 34,
              padding: '0 12px 0 32px',
              background: '#0d0d10',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              color: '#ededed',
              fontFamily: sans,
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        <select
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value as OrderByColumn)}
          style={{
            height: 34,
            padding: '0 12px',
            background: '#0d0d10',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            color: '#ededed',
            fontFamily: sans,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <option value="sold_count">Orders: high → low</option>
          <option value="winning_score">Score: high → low</option>
          <option value="est_daily_revenue_aud">Revenue: high → low</option>
          <option value="created_at">Newest first</option>
        </select>

        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
          style={{
            height: 34,
            padding: '0 12px',
            background: '#0d0d10',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            color: '#ededed',
            fontFamily: sans,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <option value="all">All scores</option>
          <option value="80">Score 80+</option>
          <option value="90">Score 90+</option>
        </select>

        <div style={{ display: 'flex', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6 }}>
          {(['table', 'grid'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                width: 34,
                height: 34,
                border: 'none',
                background: viewMode === mode ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: viewMode === mode ? '#6366F1' : '#71717a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 5,
              }}
              aria-label={mode}
            >
              {mode === 'table' ? <List size={15} /> : <LayoutGrid size={15} />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <TableView products={filtered} loading={loading} />
      ) : (
        <GridView products={filtered} loading={loading} />
      )}

      {/* Load more */}
      {!loading && filtered.length > 0 && filtered.length >= limit && limit < total && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button
            onClick={() => setLimit((l) => l + 20)}
            style={{
              padding: '10px 22px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 6,
              color: '#ededed',
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'border-color 150ms, background 150ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.background = 'transparent'; }}
          >Load more ({total - limit} remaining)</button>
        </div>
      )}
    </div>
  );
}

function TableView({ products, loading }: { products: Product[]; loading: boolean }) {
  return (
    <div style={{
      background: '#111114',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 130px 100px 100px 110px 90px',
        gap: 14,
        padding: '14px 16px',
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        color: '#52525b',
        textTransform: 'uppercase',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span>#</span>
        <span>Product</span>
        <span>Score</span>
        <span style={{ textAlign: 'right' }}>Orders/mo</span>
        <span style={{ textAlign: 'right' }}>Price</span>
        <span>Source</span>
        <span style={{ textAlign: 'right' }}>Action</span>
      </div>
      {loading ? (
        Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
      ) : products.length === 0 ? (
        <div style={{ padding: 24 }}>
          <EmptyState />
        </div>
      ) : (
        products.map((p, i) => {
          const score = p.winning_score ?? 0;
          const isAli = (p.platform ?? '').toLowerCase().includes('aliexpress');
          return (
            <div key={p.id} style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 130px 100px 100px 110px 90px',
              gap: 14,
              padding: '14px 16px',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              transition: 'background 120ms',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontFamily: mono, fontSize: 12, color: '#52525b' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <ProductThumb product={p} size={36} />
                <span style={{ overflow: 'hidden', minWidth: 0 }}>
                  <div style={{ fontFamily: sans, fontSize: 14, color: '#ededed', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_title}</div>
                  {p.category && <div style={{ fontFamily: mono, fontSize: 10, color: '#52525b', marginTop: 2 }}>{p.category}</div>}
                </span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ height: 4, flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', maxWidth: 70 }}>
                  <span style={{
                    display: 'block',
                    height: '100%',
                    width: `${Math.min(100, score)}%`,
                    background: score >= 80 ? '#22c55e' : '#6366F1',
                  }} />
                </span>
                <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: '#6366F1', minWidth: 24, textAlign: 'right' }}>{score || '—'}</span>
              </span>
              <span style={{ fontFamily: mono, fontSize: 13, color: '#22c55e', textAlign: 'right' }}>{p.sold_count?.toLocaleString() ?? '—'}</span>
              <span style={{ fontFamily: mono, fontSize: 13, color: '#ededed', textAlign: 'right' }}>{p.price_aud != null ? `$${p.price_aud.toFixed(2)}` : '—'}</span>
              <span>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 9px',
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: mono,
                  borderRadius: 4,
                  background: isAli ? 'rgba(255,90,0,0.12)' : 'rgba(255,255,255,0.04)',
                  color: isAli ? '#f97316' : '#a1a1aa',
                  border: isAli ? '1px solid rgba(255,90,0,0.25)' : '1px solid rgba(255,255,255,0.08)',
                  textTransform: 'uppercase',
                }}>{p.platform ?? '—'}</span>
              </span>
              <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {p.product_url ? (
                  <a href={p.product_url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 6,
                    color: '#6366F1',
                    fontSize: 11,
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontFamily: sans,
                  }}>View <ArrowUpRight size={11} /></a>
                ) : (
                  <span style={{ color: '#52525b', fontSize: 11 }}>—</span>
                )}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

function GridView({ products, loading }: { products: Product[]; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  if (products.length === 0) return <EmptyState />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {products.map((p) => {
        const score = p.winning_score ?? 0;
        const isAli = (p.platform ?? '').toLowerCase().includes('aliexpress');
        return (
          <div key={p.id} style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            overflow: 'hidden',
            transition: 'border-color 200ms, transform 200ms',
            cursor: 'default',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ height: 110, background: '#0d0d10', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span style={{
                  fontFamily: display,
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'rgba(99,102,241,0.4)',
                }}>{p.product_title.charAt(0).toUpperCase()}</span>
              )}
              <span style={{
                position: 'absolute',
                top: 8,
                right: 8,
                padding: '3px 8px',
                background: 'rgba(0,0,0,0.7)',
                color: '#6366F1',
                fontFamily: mono,
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 4,
                border: '1px solid rgba(99,102,241,0.3)',
              }}>{score}/100</span>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                color: '#ededed',
                lineHeight: 1.4,
                marginBottom: 8,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>{p.product_title}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: '#22c55e' }}>{p.sold_count?.toLocaleString() ?? '—'} / mo</span>
                <span style={{ fontFamily: mono, fontSize: 13, color: '#ededed', fontWeight: 600 }}>{p.price_aud != null ? `$${p.price_aud.toFixed(2)}` : '—'}</span>
              </div>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: mono,
                borderRadius: 4,
                background: isAli ? 'rgba(255,90,0,0.12)' : 'rgba(255,255,255,0.04)',
                color: isAli ? '#f97316' : '#a1a1aa',
                border: isAli ? '1px solid rgba(255,90,0,0.25)' : '1px solid rgba(255,255,255,0.08)',
                textTransform: 'uppercase',
              }}>{p.platform ?? '—'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProductThumb({ product, size = 36 }: { product: Product; size?: number }) {
  if (product.image_url) {
    return (
      <img src={product.image_url} alt={product.product_title} style={{
        width: size, height: size, borderRadius: 6,
        objectFit: 'cover',
        border: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
        background: '#0d0d10',
      }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 6,
      background: '#0d0d10',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      fontFamily: display,
      fontSize: 14,
      fontWeight: 700,
      color: '#6366F1',
    }}>{product.product_title.charAt(0).toUpperCase()}</div>
  );
}
