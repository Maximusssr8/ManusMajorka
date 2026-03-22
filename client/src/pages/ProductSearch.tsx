import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Search, Loader2, ExternalLink, Store } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

const C = {
  bg: '#080a0e', card: '#0d1117', border: '#1a2030',
  gold: '#6366F1', text: '#e8eaf0', muted: '#6b7280', red: '#ef4444',
};

export default function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [source, setSource] = useState('');
  const [, navigate] = useLocation();
  const { session } = useAuth();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
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
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
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
          display: 'flex', gap: 10, marginBottom: 28,
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
              color: C.text, fontSize: 15, padding: '8px 0',
            }}
            autoFocus
          />
          <button
            onClick={() => search(query)}
            disabled={loading || !query.trim()}
            style={{
              background: C.gold, color: '#080a0e', border: 'none',
              padding: '10px 20px', borderRadius: 7, fontSize: 13, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
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
            <p style={{ color: C.muted, marginTop: 12, fontSize: 14 }}>Searching TikTok Shop...</p>
          </div>
        )}

        {/* No results */}
        {!loading && searched && results.length === 0 && (
          <p style={{ color: C.muted, textAlign: 'center', padding: 40 }}>No results found. Try a different search term.</p>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
              {results.length} results · {source === 'cache' ? 'Cached' : 'Live from TikTok Shop'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {results.map(product => (
                <div
                  key={product.id}
                  style={{
                    background: C.card, borderRadius: 10, border: `1px solid ${C.border}`,
                    overflow: 'hidden', transition: 'border-color 0.2s',
                  }}
                >
                  {/* Product image */}
                  <div style={{ position: 'relative', paddingTop: '75%', background: '#111' }}>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
                    )}
                    <span style={{
                      position: 'absolute', top: 8, left: 8,
                      background: 'rgba(0,0,0,0.7)', color: C.text,
                      fontSize: 11, padding: '3px 8px', borderRadius: 4,
                    }}>
                      {product.platform_badge}
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ color: C.gold, fontWeight: 700, fontSize: 16 }}>
                        ${product.price_aud > 0 ? product.price_aud.toFixed(2) : '—'}
                        <span style={{ color: C.muted, fontSize: 11, fontWeight: 400 }}> AUD</span>
                      </span>
                      {product.sold_count && (
                        <span style={{ color: C.muted, fontSize: 11 }}>{product.sold_count}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => buildStore(product)}
                        style={{
                          flex: 1, background: C.gold, color: '#080a0e', border: 'none',
                          padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                      >
                        <Store size={12} />
                        Build Store
                      </button>
                      {product.product_url && (
                        <a
                          href={product.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: C.border, color: C.muted, border: 'none',
                            padding: '8px 10px', borderRadius: 6, fontSize: 12,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
