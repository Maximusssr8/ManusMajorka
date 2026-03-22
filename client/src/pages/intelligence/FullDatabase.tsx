import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import Sparkline from '@/components/Sparkline';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id?: string;
  name: string;
  niche: string;
  estimated_retail_aud: number;
  estimated_margin_pct: number;
  trend_score: number;
  dropship_viability_score: number;
  trend_reason?: string;
  image_url?: string;
  est_monthly_revenue_aud?: number;
  revenue_trend?: number[];
  items_sold_monthly?: number;
  growth_rate_pct?: number;
  creator_handles?: string[];
  avg_unit_price_aud?: number;
  saturation_score?: number;
  winning_score?: number;
  ad_count_est?: number;
  refreshed_at?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatRevenue(n: number | undefined | null): string {
  if (!n) return '$0';
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}m`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

function formatUnits(n: number | undefined | null): string {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const AVATAR_COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fd79a8'];

// ── Subcomponents ─────────────────────────────────────────────────────────────
function CreatorAvatars({ handles }: { handles: string[] }) {
  if (!handles || handles.length === 0) {
    return <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.2)' }}>—</span>;
  }
  // Last element is the "+N creators" count string
  const countTag = handles.find(h => h.startsWith('+'));
  const realHandles = handles.filter(h => h.startsWith('@'));
  const count = countTag ? parseInt(countTag.replace(/\D/g, '')) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {realHandles.slice(0, 3).map((h, i) => (
          <div key={i} title={h} style={{
            width: 24, height: 24, borderRadius: '50%',
            background: AVATAR_COLORS[i % AVATAR_COLORS.length],
            border: '2px solid #0d0d14',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, color: '#fff', fontWeight: 800,
            marginLeft: i > 0 ? -7 : 0,
            position: 'relative', zIndex: 3 - i,
          }}>
            {h.replace('@', '').slice(0, 2).toUpperCase()}
          </div>
        ))}
      </div>
      {count > 0 && (
        <span style={{ fontSize: 9, color: '#d4af37', fontWeight: 700 }}>
          {count >= 1000 ? `${(count/1000).toFixed(1)}k` : count} creators
        </span>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface FullDatabaseProps {
  presetFilter?: 'trending' | 'all';
}

export default function FullDatabase({ presetFilter = 'all' }: FullDatabaseProps) {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [niche, setNiche] = useState('All Niches');
  const [sortBy, setSortBy] = useState<string>('winning_score');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [total, setTotal] = useState(0);
  const [refreshedAt, setRefreshedAt] = useState<string>('');
  const [minGrowth, setMinGrowth] = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Live search state
  const [liveSearch, setLiveSearch] = useState('');
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveSearched, setLiveSearched] = useState(false);

  // New state for opportunity filters, sorting, ads modal
  const [opportunityFilter, setOpportunityFilter] = useState<string>("All");
  const [sortMode, setSortMode] = useState<string>("revenue");
  const [adsModal, setAdsModal] = useState<{ product: any; creatives: any; adCopy: any; loading: boolean; copyLoading: boolean } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const handleLiveSearch = async (queryOverride?: string) => {
    const query = queryOverride ?? liveSearch;
    if (!query.trim()) return;
    setLiveLoading(true);
    setLiveSearched(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const [datahubRes, searchRes] = await Promise.allSettled([
        fetch(`/api/products/datahub/search?q=${encodeURIComponent(query)}&limit=20`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).then(r => r.json()),
        fetch(`/api/products/search?q=${encodeURIComponent(query)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).then(r => r.json()),
      ]);

      const datahubProducts: any[] = datahubRes.status === 'fulfilled' ? (datahubRes.value.products ?? []) : [];
      const searchResults: any[] = searchRes.status === 'fulfilled' ? (searchRes.value.results ?? []) : [];

      const normalised = [
        ...datahubProducts.map((p: any) => ({
          id: p.id,
          title: p.name,
          image: p.image_url,
          price_aud: p.price_aud,
          sold_count: p.orders_count ? `${(p.orders_count).toLocaleString()} sold` : '',
          rating: p.rating,
          source: 'aliexpress_datahub',
          product_url: p.aliexpress_url,
          platform_badge: '🛒 AliExpress',
          aliexpress_url: p.aliexpress_url,
          supplier_name: p.supplier_name,
        })),
        ...searchResults
          .filter((r: any) => !datahubProducts.some((d: any) => d.name?.toLowerCase() === r.title?.toLowerCase()))
          .slice(0, 5),
      ];

      setLiveResults(normalised);
    } catch (err) {
      console.error('[live-search]', err);
      setLiveResults([]);
    } finally {
      setLiveLoading(false);
    }
  };

  // Apply preset filters on mount
  useEffect(() => {
    if (presetFilter === 'trending') {
      setSortBy('growth_rate_pct');
      setSortDir('desc');
      setMinGrowth(0);
    }
  }, [presetFilter]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const params = new URLSearchParams({ limit: '100' });
    if (niche !== 'All Niches') params.set('niche', niche);
    if (search.trim()) params.set('search', search.trim());
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);

    try {
      const res = await fetch(`/api/trend-signals?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const rows: Product[] = Array.isArray(data) ? data : (data.products || data.data || []);
      setProducts(rows);
      setTotal(rows.length);
      if (rows[0]?.refreshed_at) {
        setRefreshedAt(rows[0].refreshed_at);
        setLastRefreshed(rows[0].refreshed_at);
      }
    } catch (err) {
      console.error('[FullDatabase] load error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [niche, search, sortBy, sortDir]);

  useEffect(() => { loadProducts(); }, [niche, sortBy, sortDir, loadProducts]);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadProducts(), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search, loadProducts]);

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  function handleBuildStore(p: Product) {
    const params = new URLSearchParams({
      productName: p.name || '',
      niche: p.niche || '',
      price: String(p.estimated_retail_aud || 49),
      description: p.trend_reason || '',
      imageUrl: p.image_url || '',
      fromDatabase: 'true',
      supplierUrl: (p as any).aliexpress_url || (p as any).source_url || '',
      supplierName: (p as any).supplier_name || 'AliExpress',
    });
    navigate(`/app/store-builder?${params}`);
  }

  function handleFindSupplier(p: Product) {
    window.location.href = `/app/profit?niche=${encodeURIComponent(p.niche)}&product=${encodeURIComponent(p.name)}`;
  }

  // Opportunity tags helper
  const getOpportunityTags = (product: Product) => {
    const tags: { label: string; color: string; bg: string }[] = [];
    const orders = (product as any).orders_count || 0;
    const price = product.estimated_retail_aud || 0;
    const nicheStr = (product.niche || "").toLowerCase();
    if (orders > 1000) tags.push({ label: "🔥 TRENDING", color: "#ff6b35", bg: "rgba(255,107,53,0.1)" });
    if (price > 30) tags.push({ label: "💰 HIGH MARGIN", color: "#d4af37", bg: "rgba(212,175,55,0.1)" });
    if (nicheStr.includes("tiktok") || nicheStr.includes("viral")) tags.push({ label: "⚡ VIRAL", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" });
    tags.push({ label: "🇦🇺 AU DEMAND", color: "#34d399", bg: "rgba(52,211,153,0.1)" });
    return tags;
  };

  // Top 10 by winning score — only products with revenue data
  const top10 = [...products]
    .filter(p => (p.est_monthly_revenue_aud || 0) > 0)
    .sort((a, b) => ((b.est_monthly_revenue_aud || 0) - (a.est_monthly_revenue_aud || 0)))
    .slice(0, 10);

  // Apply client-side filters with opportunity filter
  const filtered = products.filter(p => {
    const orders = (p as any).orders_count || 0;
    const price = p.estimated_retail_aud || 0;
    const nicheStr = (p.niche || "").toLowerCase();
    if (search.trim() && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (minGrowth !== null && (p.growth_rate_pct || 0) < minGrowth) return false;
    if (presetFilter === 'trending' && (p.trend_score || 0) < 70) return false;
    if (opportunityFilter === "🔥 Viral") return orders > 1000;
    if (opportunityFilter === "💰 High Margin") return price > 30;
    if (opportunityFilter === "🇦🇺 AU Best Sellers") return nicheStr.includes("au best") || nicheStr.includes("au sellers");
    if (opportunityFilter === "⚡ TikTok") return nicheStr.includes("tiktok") || nicheStr.includes("viral");
    if (opportunityFilter === "New Today") {
      const d = new Date((p as any).updated_at || 0);
      return Date.now() - d.getTime() < 86400000;
    }
    return true;
  });

  // Apply sort mode
  const sorted = [...filtered].sort((a, b) => {
    const aOrders = (a as any).orders_count || 0;
    const bOrders = (b as any).orders_count || 0;
    const aPrice = a.estimated_retail_aud || 0;
    const bPrice = b.estimated_retail_aud || 0;
    if (sortMode === "revenue") return (bOrders * bPrice) - (aOrders * aPrice);
    if (sortMode === "orders") return bOrders - aOrders;
    if (sortMode === "margin") return bPrice - aPrice;
    if (sortMode === "newest") return new Date((b as any).updated_at || 0).getTime() - new Date((a as any).updated_at || 0).getTime();
    return (b.winning_score || 0) - (a.winning_score || 0);
  });

  const timeAgo = refreshedAt
    ? (() => {
        const diff = Date.now() - new Date(refreshedAt).getTime();
        const h = Math.floor(diff / 3600000);
        return h < 1 ? 'just now' : `${h}h ago`;
      })()
    : '—';

  const SortIcon = ({ col }: { col: string }) => (
    <span style={{ marginLeft: 4, opacity: sortBy === col ? 1 : 0.3, fontSize: 10 }}>
      {sortBy === col ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1px', color: 'rgba(240,237,232,0.4)', textAlign: 'left',
    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
    fontFamily: 'Syne, sans-serif',
  };

  return (
    <div style={{ background: '#080a0e', minHeight: '100%' }}>

      {/* === LIVE SEARCH HERO === */}
      <div style={{
        padding: '28px 28px 20px',
        background: 'linear-gradient(180deg, #0d1117 0%, #080a0e 100%)',
        borderBottom: '1px solid #1a2030',
      }}>
        <h2 style={{
          color: '#e8eaf0', fontSize: 20, fontWeight: 700,
          fontFamily: 'Syne, sans-serif', margin: '0 0 14px',
        }}>
          Search any product
        </h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={liveSearch}
            onChange={e => setLiveSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLiveSearch()}
            placeholder="e.g. creatine gummies, posture corrector, gua sha..."
            style={{
              flex: 1, padding: '13px 18px',
              background: '#1a2030', border: '1px solid #2a3040',
              borderRadius: 8, color: '#e8eaf0', fontSize: 15, outline: 'none',
            }}
          />
          <button
            onClick={() => handleLiveSearch()}
            disabled={liveLoading || !liveSearch.trim()}
            style={{
              padding: '13px 24px', background: '#d4af37', color: '#080a0e',
              border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
              fontSize: 14, fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap',
              opacity: liveLoading ? 0.7 : 1,
            }}
          >
            {liveLoading ? '...' : 'Search →'}
          </button>
        </div>
        <p style={{ color: '#4b5563', fontSize: 12, marginTop: 8, margin: '8px 0 0' }}>
          Searches live AliExpress · TikTok Shop · Majorka DB &mdash; real products, real prices
        </p>
      </div>

      {/* === LIVE SEARCH RESULTS === */}
      {liveSearched && (
        <div style={{ padding: '0 0 8px' }}>
          <div style={{ padding: '16px 28px 12px', borderBottom: '1px solid #1a2030', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b7280', fontSize: 13 }}>
              {liveLoading ? 'Searching...' : `${liveResults.length} live results for "${liveSearch}"`}
            </span>
            <button
              onClick={() => { setLiveSearched(false); setLiveResults([]); setLiveSearch(''); }}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12 }}
            >
              Clear &times;
            </button>
          </div>

          {liveLoading && (
            <div style={{ padding: '8px 28px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 56, background: '#0d1117', borderRadius: 6, marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          )}

          {!liveLoading && liveResults.map((product, idx) => (
            <div key={product.id || idx} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 28px', borderBottom: '1px solid #111820',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0d1117'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {product.image ? (
                <img src={product.image} width={48} height={48}
                  style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                  onError={e => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 6, background: '#1a2030', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🛍️</div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#e8eaf0', fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.title}
                </p>
                <span style={{
                  display: 'inline-block', marginTop: 3, padding: '2px 7px',
                  background: product.source === 'tiktok_shop' ? '#1a1a2e' : product.source === 'aliexpress_datahub' ? '#1a200a' : '#1a1a1a',
                  border: `1px solid ${product.source === 'tiktok_shop' ? '#333366' : product.source === 'aliexpress_datahub' ? '#2a4010' : '#333'}`,
                  borderRadius: 4, fontSize: 10, color: product.source === 'tiktok_shop' ? '#8888cc' : product.source === 'aliexpress_datahub' ? '#7ab040' : '#666',
                }}>
                  {product.platform_badge || (product.source === 'aliexpress_datahub' ? '🛒 AliExpress' : product.source)}
                </span>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ color: '#d4af37', fontWeight: 700, fontSize: 15 }}>
                  ${product.price_aud > 0 ? product.price_aud.toFixed(2) : '—'}
                </span>
                {product.sold_count && (
                  <p style={{ color: '#4b5563', fontSize: 11, margin: '2px 0 0' }}>{product.sold_count}</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {product.aliexpress_url && (
                  <a href={product.aliexpress_url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '7px 10px', background: '#1a2030', border: '1px solid #2a3040', borderRadius: 6, fontSize: 11, color: '#6b7280', textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >View ↗</a>
                )}
                <button
                  onClick={() => {
                    const params = new URLSearchParams({
                      productName: encodeURIComponent(product.title || ''),
                      imageUrl: encodeURIComponent(product.image || ''),
                      price: String(product.price_aud || 49),
                      supplierUrl: encodeURIComponent(product.aliexpress_url || product.product_url || ''),
                      supplierName: encodeURIComponent(product.supplier_name || 'AliExpress'),
                      fromDatabase: 'false',
                    });
                    navigate(`/app/website-generator?${params}`);
                  }}
                  style={{
                    background: '#d4af37', color: '#080a0e', border: 'none',
                    padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Build Store →
                </button>
              </div>
            </div>
          ))}

          {!liveLoading && liveSearched && liveResults.length === 0 && (
            <p style={{ color: '#4b5563', padding: '20px 28px', fontSize: 13 }}>No results. Try a different search term.</p>
          )}

          <div style={{ padding: '16px 28px 4px' }}>
            <p style={{ color: '#4b5563', fontSize: 12, margin: 0 }}>
              &darr; Popular with AU dropshippers
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '24px 0 16px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#f0ede8', fontFamily: 'Syne, sans-serif' }}>
          {presetFilter === 'trending' ? 'Trending Today' : 'Product Intelligence'}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(240,237,232,0.45)' }}>
          {presetFilter === 'trending'
            ? `${sorted.length} trending products · Updated ${timeAgo}`
            : `${total} products tracked · Updated ${timeAgo}`
          }
        </p>
      </div>

      {/* Top 10 Today — horizontal scrollable */}
      {top10.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2dca72', boxShadow: '0 0 6px #2dca72', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#2dca72', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
              Today's Top 10
            </span>
            <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)' }}>· Refreshed every 6h</span>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {top10.map((p, idx) => (
              <div key={p.id || p.name}
                onClick={() => handleBuildStore(p)}
                title={`Build store for ${p.name}`}
                style={{
                  flexShrink: 0, width: 150, background: '#0d0d14', cursor: 'pointer',
                  border: `1.5px solid ${idx === 0 ? '#d4af37' : '#1a1a2e'}`,
                  borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#d4af37';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = idx === 0 ? '#d4af37' : '#1a1a2e';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ position: 'relative' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name}
                      style={{ width: '100%', height: 88, objectFit: 'cover', display: 'block' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 88, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🛍️</div>
                  )}
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    width: 22, height: 22, borderRadius: '50%',
                    background: idx < 3 ? '#d4af37' : '#1a1a2e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900,
                    color: idx < 3 ? '#080a0e' : 'rgba(240,237,232,0.6)',
                    border: idx >= 3 ? '1px solid #2a2a3e' : 'none',
                  }}>
                    {idx + 1}
                  </div>
                </div>
                <div style={{ padding: '8px 10px 10px' }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#f0ede8', lineHeight: 1.35,
                    marginBottom: 6, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                  }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#d4af37' }}>
                      {formatRevenue(p.est_monthly_revenue_aud)}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: (p.growth_rate_pct || 0) >= 0 ? '#2dca72' : '#ef4444' }}>
                      {(p.growth_rate_pct || 0) >= 0 ? '↑' : '↓'}{Math.abs(p.growth_rate_pct || 0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === OPPORTUNITY FILTER BAR === */}
      <div style={{ display: "flex", gap: 8, padding: "16px 28px 12px", flexWrap: "wrap", borderBottom: "1px solid #1a2030" }}>
        {["All", "🔥 Viral", "💰 High Margin", "🇦🇺 AU Best Sellers", "⚡ TikTok", "New Today"].map(f => (
          <button key={f} onClick={() => setOpportunityFilter(f)}
            style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: opportunityFilter === f ? "none" : "1px solid #2a3040",
              background: opportunityFilter === f ? "#d4af37" : "#1a2030", color: opportunityFilter === f ? "#080a0e" : "#6b7280" }}>
            {f}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {[{ id: "revenue", label: "Est. Revenue ↓" }, { id: "orders", label: "Orders ↓" }, { id: "margin", label: "Margin ↓" }, { id: "newest", label: "Newest" }].map(s => (
            <button key={s.id} onClick={() => setSortMode(s.id)}
              style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                border: sortMode === s.id ? "none" : "1px solid #2a3040",
                background: sortMode === s.id ? "#1a2030" : "transparent", color: sortMode === s.id ? "#d4af37" : "#4b5563" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        padding: '14px 16px', background: '#0d0d14',
        borderRadius: 10, marginBottom: 16, marginTop: 16,
        border: '1px solid #1a1a2e',
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          style={{
            width: 260, padding: '8px 12px', borderRadius: 7,
            background: '#0a0a12', border: '1px solid #1a1a2e',
            color: '#f0ede8', fontSize: 13, outline: 'none',
          }}
        />
        <button onClick={() => loadProducts()}
          style={{
            marginLeft: 'auto', padding: '8px 18px', borderRadius: 7,
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
            color: '#d4af37', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Syne, sans-serif',
          }}>
          ↻ Refresh
        </button>
      </div>

      {/* Majorka moat — found a winner? */}
      <div style={{
        marginBottom: 14,
        padding: '11px 18px',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.07), rgba(212,175,55,0.03))',
        border: '1px solid rgba(212,175,55,0.22)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <span style={{ color: '#d4af37', fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>
          ⚡ Found a winner? Build a complete Shopify store in 60 seconds — only on Majorka
        </span>
        <button
          onClick={() => navigate('/app/store-builder')}
          style={{
            background: '#d4af37', color: '#080a0e', border: 'none',
            padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Syne, sans-serif', flexShrink: 0,
          }}
        >
          Try Store Builder →
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#0d0d14', border: '1px solid #1a1a2e', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead style={{ background: '#0a0a12', position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ ...thStyle, width: 44, paddingLeft: 16 }}>#</th>
              <th style={{ ...thStyle, width: 300 }} onClick={() => toggleSort('name')}>
                PRODUCT <SortIcon col="name" />
              </th>
              <th style={{ ...thStyle, width: 120 }} onClick={() => toggleSort('est_monthly_revenue_aud')}>
                EST. REVENUE <SortIcon col="est_monthly_revenue_aud" />
              </th>
              <th style={{ ...thStyle, width: 80 }}>ORDERS</th>
              <th style={{ ...thStyle, width: 70 }}>MARGIN</th>
              <th style={{ ...thStyle, width: 90 }}>TREND</th>
              <th style={{ ...thStyle, width: 80, textAlign: 'center' }} onClick={() => toggleSort('winning_score')}>
                SCORE <SortIcon col="winning_score" />
              </th>
              <th style={{ ...thStyle, width: 100 }}>CREATORS</th>
              <th style={{ ...thStyle, width: 200 }}>ACTIONS</th>
            </tr>
            <tr>
              <td colSpan={9} style={{ height: 1, background: '#1a1a2e', padding: 0 }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: 'rgba(240,237,232,0.4)' }}>
                  Loading products...
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: 'rgba(240,237,232,0.4)' }}>
                  No products found.
                </td>
              </tr>
            ) : sorted.map((p, idx) => {
              const score = p.winning_score || p.trend_score || 0;
              const scoreColor = score >= 80 ? '#27ae60' : score >= 65 ? '#f39c12' : '#e74c3c';
              const growth = p.growth_rate_pct || 0;
              const orders = (p as any).orders_count || p.items_sold_monthly || 0;
              const price = p.estimated_retail_aud || 0;
              // Use stored margin from DB; fall back to a simple estimate only if truly missing
              const marginPct = p.estimated_margin_pct != null
                ? Math.max(0, Math.min(99, p.estimated_margin_pct))
                : (price > 0 ? Math.round((price - (p.avg_unit_price_aud || price / 3)) / price * 100) : 0);
              // Use stored revenue; fall back to orders × retail as last resort
              const estRevenue = p.est_monthly_revenue_aud && p.est_monthly_revenue_aud > 0
                ? p.est_monthly_revenue_aud
                : (orders > 0 && price > 0 ? Math.round(orders * price / 100) * 100 : 0);
              const tags = getOpportunityTags(p);

              return (
                <tr key={p.id || p.name}
                  style={{ background: idx % 2 === 0 ? '#0d0d14' : '#111118', transition: 'all 0.15s', cursor: 'default' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLTableRowElement).style.background = '#141420';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? '#0d0d14' : '#111118';
                  }}
                >
                  {/* Rank */}
                  <td style={{ padding: '14px 8px 14px 16px', fontSize: 13, color: 'rgba(240,237,232,0.3)', textAlign: 'center', fontWeight: 600 }}>
                    {idx + 1}
                  </td>

                  {/* Product */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          width={56} height={56}
                          style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#1a1a1a' }}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{
                          width: 56, height: 56, borderRadius: '8px',
                          background: '#1a1a1a', border: '1px solid #333',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '20px', flexShrink: 0,
                        }}>
                          🛍️
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', marginBottom: 4, lineHeight: 1.3 }}>
                          {p.name}
                        </div>
                        {/* Opportunity tags */}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 3 }}>
                          {tags.slice(0, 3).map(tag => (
                            <span key={tag.label} style={{
                              fontSize: 9, padding: '2px 6px', borderRadius: 4,
                              background: tag.bg, color: tag.color, fontWeight: 700,
                            }}>{tag.label}</span>
                          ))}
                        </div>
                        <div style={{
                          fontSize: 11, color: '#d4af37', background: 'rgba(212,175,55,0.08)',
                          borderRadius: 4, padding: '2px 7px', display: 'inline-block',
                        }}>
                          {p.niche}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Revenue */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#d4af37', fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
                      {estRevenue > 0 ? formatRevenue(estRevenue) : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)', marginTop: 3 }}>est/month</div>
                  </td>

                  {/* Orders */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8' }}>
                      {orders > 0 ? orders.toLocaleString() : formatUnits(p.items_sold_monthly)}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.35)', marginTop: 2 }}>orders</div>
                  </td>

                  {/* Margin */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: marginPct >= 55 ? '#27ae60' : marginPct >= 35 ? '#f39c12' : '#e74c3c' }}>
                      ~{marginPct}%
                    </div>
                  </td>

                  {/* Sparkline */}
                  <td style={{ padding: '12px 16px' }}>
                    <Sparkline
                      data={(p.revenue_trend && p.revenue_trend.length === 7) ? p.revenue_trend : [1, 1, 1, 1, 1, 1, 1]}
                      width={78} height={32}
                      color={growth > 0 ? '#27ae60' : '#e74c3c'}
                    />
                  </td>

                  {/* Score */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', margin: '0 auto',
                      background: `${scoreColor}18`,
                      border: `2px solid ${scoreColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800, color: scoreColor,
                    }}>
                      {score}
                    </div>
                  </td>

                  {/* Creators */}
                  <td style={{ padding: '12px 16px' }}>
                    <CreatorAvatars handles={p.creator_handles || []} />
                    {(p.ad_count_est || 0) > 0 && (
                      <div style={{ fontSize: 9, color: 'rgba(240,237,232,0.3)', marginTop: 4, textAlign: 'center' }}>
                        +{p.ad_count_est} ads
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => handleBuildStore(p)}
                        style={{
                          background: '#d4af37', color: '#080a0e', border: 'none',
                          padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                          cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Syne, sans-serif',
                        }}>
                        Build Store
                      </button>
                      <button
                        onClick={async () => {
                          setAdsModal({ product: p, creatives: null, adCopy: null, loading: true, copyLoading: false });
                          try {
                            const res = await fetch(`/api/products/ad-creatives?product=${encodeURIComponent(p.name)}&price=${p.estimated_retail_aud || 49}`);
                            const data = await res.json();
                            setAdsModal(prev => prev ? { ...prev, creatives: data, loading: false } : null);
                          } catch {
                            setAdsModal(prev => prev ? { ...prev, loading: false } : null);
                          }
                        }}
                        style={{ padding: "6px 12px", background: "#1a2030", border: "1px solid #2a3040", borderRadius: 6, color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        🎬 Ads
                      </button>
                      <button onClick={() => handleFindSupplier(p)}
                        style={{
                          background: 'transparent', color: '#d4af37',
                          border: '1px solid rgba(212,175,55,0.3)',
                          padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}>
                        Supplier
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 0', fontSize: 12, color: 'rgba(240,237,232,0.3)', textAlign: 'center' }}>
        {sorted.length} products · Majorka AU Market Intelligence
      </div>

      {/* === ADS MODAL === */}
      {adsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setAdsModal(null); }}>
          <div style={{ background: "#0d1117", border: "1px solid #1a2030", borderRadius: 12, width: "100%", maxWidth: 600, maxHeight: "80vh", overflow: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: "#e8eaf0", margin: 0, fontFamily: "Syne, sans-serif", fontSize: 18 }}>🎬 Ad Creatives for {adsModal.product?.name?.slice(0, 50)}</h3>
              <button onClick={() => setAdsModal(null)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 20 }}>×</button>
            </div>

            {adsModal.loading && <p style={{ color: "#6b7280" }}>Searching for ad examples...</p>}

            {!adsModal.loading && adsModal.creatives && (
              <>
                {adsModal.creatives.tiktokVideos?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ color: "#d4af37", fontSize: 13, margin: "0 0 10px" }}>📱 TikTok Videos</h4>
                    {adsModal.creatives.tiktokVideos.map((v: any, i: number) => (
                      <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: "block", padding: "10px 12px", background: "#1a2030", borderRadius: 8, marginBottom: 8, color: "#e8eaf0", textDecoration: "none", fontSize: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{v.title}</div>
                        <div style={{ color: "#6b7280" }}>{v.snippet}</div>
                      </a>
                    ))}
                  </div>
                )}

                {adsModal.creatives.adInsights?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ color: "#d4af37", fontSize: 13, margin: "0 0 10px" }}>💡 Winning Ad Hooks</h4>
                    {adsModal.creatives.adInsights.map((a: any, i: number) => (
                      <div key={i} style={{ padding: "10px 12px", background: "#1a2030", borderRadius: 8, marginBottom: 8, fontSize: 12 }}>
                        <div style={{ color: "#e8eaf0", fontWeight: 600, marginBottom: 4 }}>{a.hook}</div>
                        <div style={{ color: "#6b7280" }}>{a.copy}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {adsModal.adCopy && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ color: "#d4af37", fontSize: 13, margin: "0 0 12px" }}>✍️ AI-Generated Ad Copy</h4>
                {[
                  { label: "TikTok Hook (3s)", value: adsModal.adCopy.tiktokHook, emoji: "📱" },
                  { label: "Facebook Ad", value: adsModal.adCopy.facebookAd, emoji: "📘" },
                  { label: "Instagram Caption", value: adsModal.adCopy.instagramCaption, emoji: "📸" },
                  { label: "Email Subject", value: adsModal.adCopy.emailSubject, emoji: "📧" },
                ].map(({ label, value, emoji }) => value ? (
                  <div key={label} style={{ marginBottom: 12, background: "#1a2030", borderRadius: 8, padding: 12 }}>
                    <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 6 }}>{emoji} {label}</div>
                    <div style={{ color: "#e8eaf0", fontSize: 13, lineHeight: 1.5 }}>{value}</div>
                    <button onClick={() => navigator.clipboard?.writeText(value)}
                      style={{ marginTop: 8, padding: "4px 10px", background: "transparent", border: "1px solid #2a3040", borderRadius: 4, color: "#6b7280", fontSize: 11, cursor: "pointer" }}>
                      Copy
                    </button>
                  </div>
                ) : null)}
              </div>
            )}

            <button
              onClick={async () => {
                if (!adsModal) return;
                setAdsModal(prev => prev ? { ...prev, copyLoading: true } : null);
                try {
                  const { data: sessionData } = await supabase.auth.getSession();
                  const token = sessionData?.session?.access_token;
                  const res = await fetch("/api/products/generate-ad-copy", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ product: adsModal.product?.name, price: adsModal.product?.estimated_retail_aud }),
                  });
                  const data = await res.json();
                  setAdsModal(prev => prev ? { ...prev, adCopy: data, copyLoading: false } : null);
                } catch (err) {
                  setAdsModal(prev => prev ? { ...prev, copyLoading: false } : null);
                }
              }}
              disabled={adsModal.copyLoading}
              style={{ width: "100%", padding: "12px", background: "#d4af37", color: "#080a0e", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14, marginTop: 8 }}>
              {adsModal.copyLoading ? "Generating..." : "✨ Generate AI Ad Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
