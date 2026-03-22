import { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Search, Loader2, ExternalLink, Store } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

const C = {
  bg: '#FAFAFA', card: '#FFFFFF', border: '#F0F0F0',
  gold: '#6366F1', text: '#0A0A0A', muted: '#6B7280', red: '#ef4444',
};

function getSupplierUrl(product: any): string {
  if (product.product_url && product.product_url.startsWith('http')) return product.product_url;
  if (product.aliexpress_url && product.aliexpress_url.startsWith('http')) return product.aliexpress_url;
  const q = encodeURIComponent(product.title || '');
  return `https://www.aliexpress.com/wholesale?SearchText=${q}&shipCountry=au`;
}

export default function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [source, setSource] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'margin'>('relevance');
  const [, navigate] = useLocation();
  const { session } = useAuth();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}&limit=24`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setSource(data.source ?? '');
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const sorted = useMemo(() => {
    if (sortBy === 'relevance') return results;
    const copy = [...results];
    if (sortBy === 'price_asc') return copy.sort((a, b) => (a.price_aud || 0) - (b.price_aud || 0));
    if (sortBy === 'price_desc') return copy.sort((a, b) => (b.price_aud || 0) - (a.price_aud || 0));
    if (sortBy === 'margin') return copy.sort((a, b) => ((b.price_aud || 0) * 0.45) - ((a.price_aud || 0) * 0.45));
    return copy;
  }, [results, sortBy]);

  const buildStore = (product: any) => {
    const params = new URLSearchParams({
      productName: product.title,
      imageUrl: product.image,
      price: String(product.price_aud),
      fromDatabase: 'true',
    });
    navigate(`/app/website-generator?${params}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, fontFamily: 'Syne, sans-serif', margin: 0 }}>
            Product Search
          </h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>
            Search TikTok Shop & AliExpress — find winners, build stores instantly
          </p>
        </div>

        {/* Search bar */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 0,
          background: C.card, borderRadius: 10, padding: '6px 6px 6px 16px',
          border: `1px solid ${C.border}`,
        }}>
          <Search size={18} style={{ color: C.muted, flexShrink: 0, alignSelf: 'center' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(query)}
            placeholder="Search products... e.g. creatine gummies, posture corrector, gua sha"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: C.text, fontSize: 15, padding: '8px 0', minHeight: 44,
            }}
            autoFocus
          />
          <button
            onClick={() => search(query)}
            disabled={loading || !query.trim()}
            style={{
              background: C.gold, color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: 7, fontSize: 13, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap', minHeight: 44,
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Source tag */}
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, marginBottom: 24 }}>
          Searching AliExpress DataHub · Majorka product database
        </div>

        {/* Quick searches */}
        {!searched && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {['creatine gummies', 'posture corrector', 'gua sha tool', 'led strip lights', 'silk pillowcase', 'resistance bands', 'acne patches', 'ring light'].map(q => (
              <button
                key={q}
                onClick={() => { setQuery(q); search(q); }}
                style={{
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.muted, padding: '6px 14px', borderRadius: 20,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={32} style={{ color: C.gold, animation: 'spin 1s linear infinite' }} />
            <p style={{ color: C.muted, marginTop: 12, fontSize: 14 }}>Searching TikTok Shop & AliExpress...</p>
          </div>
        )}

        {/* No results */}
        {!loading && searched && results.length === 0 && (
          <p style={{ color: C.muted, textAlign: 'center', padding: 40 }}>No results found. Try a different search term.</p>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            {/* Results header + sort */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                {results.length} results · {source === 'cache' ? 'Cached' : 'Live from TikTok Shop'}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {([
                  { id: 'relevance' as const, label: 'Relevant' },
                  { id: 'price_asc' as const, label: 'Price ↑' },
                  { id: 'price_desc' as const, label: 'Price ↓' },
                  { id: 'margin' as const, label: 'Margin ↓' },
                ]).map(s => (
                  <button key={s.id} onClick={() => setSortBy(s.id)}
                    style={{
                      height: 30, padding: '0 12px', border: `1px solid ${sortBy === s.id ? C.gold : C.border}`,
                      borderRadius: 6, background: C.card,
                      color: sortBy === s.id ? C.gold : '#374151',
                      fontSize: 12, cursor: 'pointer', transition: 'all 150ms', fontWeight: sortBy === s.id ? 600 : 400,
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {sorted.map(product => {
                const price = product.price_aud || 0;
                const margin = price > 0 ? (price * 0.45).toFixed(0) : null;
                const sourceBadge = product.platform_badge || (product.source === 'aliexpress_datahub' ? 'AliExpress' : product.source === 'tiktok_shop' ? 'TikTok Shop' : 'Majorka DB');
                return (
                  <div
                    key={product.id}
                    style={{
                      background: C.card, borderRadius: 10, border: `1px solid ${C.border}`,
                      overflow: 'hidden', transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#C7D2FE')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                  >
                    {/* Product image */}
                    <div style={{ position: 'relative', height: 220, background: '#F3F4F6' }}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
                      )}
                      <span style={{
                        position: 'absolute', top: 8, left: 8,
                        background: product.source === 'aliexpress_datahub' ? '#ECFEFF' : product.source === 'tiktok_shop' ? '#F0FDF4' : '#F3F4F6',
                        color: product.source === 'aliexpress_datahub' ? '#0891B2' : product.source === 'tiktok_shop' ? '#059669' : '#6B7280',
                        border: `1px solid ${product.source === 'aliexpress_datahub' ? '#A5F3FC' : product.source === 'tiktok_shop' ? '#BBF7D0' : '#E5E7EB'}`,
                        fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 600,
                      }}>
                        {sourceBadge}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{
                        color: C.text, fontSize: 13, fontWeight: 500, margin: '0 0 6px',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden', lineHeight: 1.4,
                      }}>
                        {product.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#059669', fontWeight: 700, fontSize: 16 }}>
                          ${price > 0 ? price.toFixed(2) : '—'}
                          <span style={{ color: C.muted, fontSize: 11, fontWeight: 400 }}> AUD</span>
                        </span>
                        {product.sold_count && (
                          <span style={{ color: C.muted, fontSize: 11 }}>{product.sold_count}</span>
                        )}
                      </div>
                      {margin && (
                        <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600, marginBottom: 10 }}>
                          Est. margin: ~${margin}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a
                          href={getSupplierUrl(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1, background: '#F9FAFB', color: '#374151', border: `1px solid ${C.border}`,
                            padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={12} />
                          View Supplier
                        </a>
                        <button
                          onClick={() => buildStore(product)}
                          style={{
                            flex: 1, background: C.gold, color: 'white', border: 'none',
                            padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          }}
                        >
                          <Store size={12} />
                          Add to Store
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
