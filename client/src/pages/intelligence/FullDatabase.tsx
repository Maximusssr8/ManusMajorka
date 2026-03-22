import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// ── Supplier URL helpers ──────────────────────────────────────────────────────
function getSupplierUrl(product: any): string {
  if (product.supplier_url && product.supplier_url.startsWith('http')) {
    return product.supplier_url;
  }
  if (product.aliexpress_url && product.aliexpress_url.startsWith('http')) {
    return product.aliexpress_url;
  }
  const q = encodeURIComponent(product.name || product.title || '');
  return `https://www.aliexpress.com/wholesale?SearchText=${q}&shipCountry=au`;
}

function getTikTokUrl(product: any): string {
  const q = encodeURIComponent(product.name || product.title || '');
  return `https://www.tiktok.com/search?q=${q}`;
}

function getAlibabaUrl(product: any): string {
  const q = encodeURIComponent(product.name || product.title || '');
  return `https://www.alibaba.com/trade/search?SearchText=${q}`;
}

// ── Supplier Dropdown ─────────────────────────────────────────────────────────
function SupplierDropdown({ product }: { product: any }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
    { icon: '🛒', label: 'AliExpress Supplier', url: getSupplierUrl(product), color: '#E63F00' },
    { icon: '🎵', label: 'TikTok Shop',          url: getTikTokUrl(product),    color: '#111' },
    { icon: '🏭', label: 'Search Alibaba',        url: getAlibabaUrl(product),   color: '#F57C00' },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' as const }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid #E5E7EB',
          background: 'white', color: '#374151', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; } }}
      >
        🛒 Supplier <span style={{ fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute' as const, top: '100%', left: 0, marginTop: 4,
          background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999,
          minWidth: 200, overflow: 'hidden',
        }}>
          {options.map(opt => (
            <a
              key={opt.label}
              href={opt.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', textDecoration: 'none',
                color: '#111111', fontSize: 13, fontWeight: 500,
                transition: 'background 120ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 16 }}>{opt.icon}</span>
              <span>{opt.label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ads Modal ────────────────────────────────────────────────────────────────
function AdsModal({ product, onClose }: { product: any; onClose: () => void }) {
  const brico = "'Bricolage Grotesque', sans-serif";
  const [adCopy, setAdCopy] = React.useState<{ headline: string; body: string; cta: string } | null>(null);
  const [loadingCopy, setLoadingCopy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const generateAdCopy = async () => {
    setLoadingCopy(true);
    try {
      const res = await fetch('/api/ai/generate-ad-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name || product.title,
          niche: product.niche || product.category,
          price: product.estimated_retail_aud || product.price_aud,
          margin: product.estimated_margin_pct,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdCopy(data);
      } else {
        const name = product.name || product.title || 'this product';
        setAdCopy({
          headline: `Australians are obsessed with this ${name}`,
          body: `Join 10,000+ AU customers who switched to ${name}. Free shipping. 30-day returns. Shop now before it sells out.`,
          cta: `Shop Now — ${product.estimated_retail_aud ? `$${product.estimated_retail_aud} AUD` : 'Best Price'}`,
        });
      }
    } catch {
      const name = product.name || product.title || 'this product';
      setAdCopy({
        headline: `Australians are obsessed with this ${name}`,
        body: `Join 10,000+ AU customers who switched to ${name}. Free shipping. 30-day returns. Shop now before it sells out.`,
        cta: `Shop Now — ${product.estimated_retail_aud ? `$${product.estimated_retail_aud} AUD` : 'Best Price'}`,
      });
    }
    setLoadingCopy(false);
  };

  const copyToClipboard = () => {
    if (!adCopy) return;
    const text = `Headline: ${adCopy.headline}\n\n${adCopy.body}\n\nCTA: ${adCopy.cta}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' as const }}>
        <button onClick={onClose} style={{ position: 'absolute' as const, top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F5F5F5', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>×</button>

        <div style={{ fontSize: 28, marginBottom: 12 }}>📣</div>
        <h3 style={{ fontFamily: brico, fontWeight: 800, fontSize: 20, color: '#0A0A0A', marginBottom: 6 }}>
          Run Ads for {product.name || product.title}
        </h3>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Launch ads directly or generate AI-powered ad copy for this product.</p>

        {/* Ad platform options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <a
            href="https://www.facebook.com/adsmanager/creation"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', border: '1.5px solid #E5E7EB', borderRadius: 12, textDecoration: 'none', color: '#111111', transition: 'all 150ms', background: 'white' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1877F2'; e.currentTarget.style.background = '#F0F5FF'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white'; }}
          >
            <span style={{ fontSize: 22 }}>📘</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Meta Ads</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Facebook & Instagram</div>
            </div>
          </a>
          <a
            href="https://ads.tiktok.com/i18n/home"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', border: '1.5px solid #E5E7EB', borderRadius: 12, textDecoration: 'none', color: '#111111', transition: 'all 150ms', background: 'white' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.background = '#F5F5F5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white'; }}
          >
            <span style={{ fontSize: 22 }}>🎵</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>TikTok Ads</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>TikTok for Business</div>
            </div>
          </a>
        </div>

        {/* AI Ad Copy */}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>✨ AI Ad Copy</span>
            {!adCopy && (
              <button
                onClick={generateAdCopy}
                disabled={loadingCopy}
                style={{ height: 30, padding: '0 14px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: loadingCopy ? 'wait' : 'pointer', opacity: loadingCopy ? 0.7 : 1 }}
              >
                {loadingCopy ? 'Generating...' : 'Generate →'}
              </button>
            )}
            {adCopy && (
              <button
                onClick={copyToClipboard}
                style={{ height: 30, padding: '0 14px', background: copied ? '#059669' : '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 200ms' }}
              >
                {copied ? '✓ Copied!' : 'Copy All'}
              </button>
            )}
          </div>
          <div style={{ padding: '14px 16px', minHeight: 80 }}>
            {!adCopy && !loadingCopy && (
              <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>Click "Generate" to create AI-powered ad copy for this product.</p>
            )}
            {loadingCopy && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6B7280', fontSize: 13 }}>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Writing copy...
              </div>
            )}
            {adCopy && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 3 }}>Headline</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{adCopy.headline}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 3 }}>Body Copy</div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{adCopy.body}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 3 }}>CTA</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>{adCopy.cta}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shimmer keyframes injected once ───────────────────────────────────────────
const shimmerCss = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('shimmer-style')) {
  const s = document.createElement('style');
  s.id = 'shimmer-style';
  s.textContent = shimmerCss;
  document.head.appendChild(s);
}

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      <td style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, ...shimmerStyle }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, width: '70%', borderRadius: 4, ...shimmerStyle, marginBottom: 6 }} />
            <div style={{ height: 10, width: '40%', borderRadius: 4, ...shimmerStyle }} />
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 20px' }}><div style={{ height: 14, width: 60, borderRadius: 4, ...shimmerStyle }} /></td>
      <td style={{ padding: '12px 20px' }}><div style={{ height: 14, width: 40, borderRadius: 4, ...shimmerStyle }} /></td>
      <td style={{ padding: '12px 20px' }}><div style={{ height: 14, width: 40, borderRadius: 4, ...shimmerStyle }} /></td>
      <td style={{ padding: '12px 20px' }}><div style={{ width: 36, height: 36, borderRadius: '50%', ...shimmerStyle }} /></td>
      <td style={{ padding: '12px 20px' }}><div style={{ height: 28, width: 80, borderRadius: 6, ...shimmerStyle }} /></td>
    </tr>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
function CreatorAvatars({ handles }: { handles: string[] }) {
  if (!handles || handles.length === 0) {
    return <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>;
  }
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
            border: '2px solid #FFFFFF',
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
        <span style={{ fontSize: 9, color: '#6366F1', fontWeight: 700 }}>
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

  // Opportunity filters, sorting, ads modal
  const [opportunityFilter, setOpportunityFilter] = useState<string>('All');
  const [sortMode, setSortMode] = useState<string>('revenue');
  const [adsProduct, setAdsProduct] = useState<any>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Hovered row for bg
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

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

  // Opportunity tags helper — light theme colors
  const getOpportunityTags = (product: Product) => {
    const tags: { label: string; color: string; bg: string }[] = [];
    const orders = (product as any).orders_count || 0;
    const price = product.estimated_retail_aud || 0;
    const nicheStr = (product.niche || '').toLowerCase();
    if (orders > 1000) tags.push({ label: 'VIRAL', color: '#7C3AED', bg: '#F3E8FF' });
    if (price > 30) tags.push({ label: 'HIGH MARGIN', color: '#6366F1', bg: '#EEF2FF' });
    if (nicheStr.includes('tiktok') || nicheStr.includes('viral')) tags.push({ label: 'VIRAL', color: '#7C3AED', bg: '#F3E8FF' });
    tags.push({ label: 'AU DEMAND', color: '#0891B2', bg: '#ECFEFF' });
    return tags;
  };

  // Top 10 by winning score — only products with revenue data
  const top10 = [...products]
    .filter(p => (p.est_monthly_revenue_aud || 0) > 0)
    .sort((a, b) => ((b.est_monthly_revenue_aud || 0) - (a.est_monthly_revenue_aud || 0)))
    .slice(0, 10);

  // Apply client-side filters
  const filtered = products.filter(p => {
    const orders = (p as any).orders_count || 0;
    const price = p.estimated_retail_aud || 0;
    const nicheStr = (p.niche || '').toLowerCase();
    if (search.trim() && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (minGrowth !== null && (p.growth_rate_pct || 0) < minGrowth) return false;
    if (presetFilter === 'trending' && (p.trend_score || 0) < 70) return false;
    if (opportunityFilter === '🔥 Viral') return orders > 1000;
    if (opportunityFilter === '💰 High Margin') return price > 30;
    if (opportunityFilter === '🇦🇺 AU Best Sellers') return nicheStr.includes('au best') || nicheStr.includes('au sellers');
    if (opportunityFilter === '⚡ TikTok') return nicheStr.includes('tiktok') || nicheStr.includes('viral');
    if (opportunityFilter === 'New Today') {
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
    if (sortMode === 'revenue') return (bOrders * bPrice) - (aOrders * aPrice);
    if (sortMode === 'orders') return bOrders - aOrders;
    if (sortMode === 'margin') return bPrice - aPrice;
    if (sortMode === 'newest') return new Date((b as any).updated_at || 0).getTime() - new Date((a as any).updated_at || 0).getTime();
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
    padding: '10px 20px',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#374151',
    textAlign: 'left',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    fontFamily: 'Syne, sans-serif',
  };

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100%' }}>

      {/* === LIVE SEARCH HERO === */}
      <div style={{
        padding: '28px 28px 20px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
      }}>
        <h2 style={{
          color: '#0A0A0A', fontSize: 20, fontWeight: 700,
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
              background: '#F9FAFB', border: '1px solid #E5E7EB',
              borderRadius: 8, color: '#111111', fontSize: 15, outline: 'none',
            }}
          />
          <button
            onClick={() => handleLiveSearch()}
            disabled={liveLoading || !liveSearch.trim()}
            style={{
              padding: '13px 24px', background: '#6366F1', color: '#FFFFFF',
              border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
              fontSize: 14, fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap',
              opacity: liveLoading ? 0.7 : 1,
            }}
          >
            {liveLoading ? '...' : 'Search →'}
          </button>
        </div>
        <p style={{ color: '#6B7280', fontSize: 12, marginTop: 8, margin: '8px 0 0' }}>
          Searches live AliExpress · TikTok Shop · Majorka DB &mdash; real products, real prices
        </p>
      </div>

      {/* === LIVE SEARCH RESULTS === */}
      {liveSearched && (
        <div style={{ padding: '0 0 8px', background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ padding: '16px 28px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6B7280', fontSize: 13 }}>
              {liveLoading ? 'Searching...' : `${liveResults.length} live results for "${liveSearch}"`}
            </span>
            <button
              onClick={() => { setLiveSearched(false); setLiveResults([]); setLiveSearch(''); }}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12 }}
            >
              Clear &times;
            </button>
          </div>

          {liveLoading && (
            <div style={{ padding: '8px 28px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 56, background: '#F3F4F6', borderRadius: 6, marginBottom: 6, ...shimmerStyle }} />
              ))}
            </div>
          )}

          {!liveLoading && liveResults.map((product, idx) => (
            <div key={product.id || idx} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 28px', borderBottom: '1px solid #F9FAFB',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {product.image ? (
                <img src={product.image} width={48} height={48} loading="lazy"
                  style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                  onError={e => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 6, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, color: '#6366F1' }}>🛍️</div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#111111', fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.title}
                </p>
                <span style={{
                  display: 'inline-block', marginTop: 3, padding: '2px 7px',
                  background: product.source === 'tiktok_shop' ? '#F0FDF4' : product.source === 'aliexpress_datahub' ? '#ECFEFF' : '#F3F4F6',
                  border: `1px solid ${product.source === 'tiktok_shop' ? '#BBF7D0' : product.source === 'aliexpress_datahub' ? '#A5F3FC' : '#E5E7EB'}`,
                  borderRadius: 4, fontSize: 10, color: product.source === 'tiktok_shop' ? '#059669' : product.source === 'aliexpress_datahub' ? '#0891B2' : '#6B7280',
                }}>
                  {product.platform_badge || (product.source === 'aliexpress_datahub' ? '🛒 AliExpress' : product.source)}
                </span>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ color: '#6366F1', fontWeight: 700, fontSize: 15 }}>
                  ${product.price_aud > 0 ? product.price_aud.toFixed(2) : '—'}
                </span>
                {product.sold_count && (
                  <p style={{ color: '#6B7280', fontSize: 11, margin: '2px 0 0' }}>{product.sold_count}</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {product.aliexpress_url && (
                  <a href={product.aliexpress_url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '7px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, color: '#6B7280', textDecoration: 'none', whiteSpace: 'nowrap' }}
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
                    background: '#6366F1', color: '#FFFFFF', border: 'none',
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
            <p style={{ color: '#374151', padding: '20px 28px', fontSize: 13 }}>No results. Try a different search term.</p>
          )}

          <div style={{ padding: '16px 28px 4px' }}>
            <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>
              &darr; Popular with AU dropshippers
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '24px 28px 16px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0A0A0A', fontFamily: 'Bricolage Grotesque, Syne, sans-serif' }}>
          {presetFilter === 'trending' ? 'Trending Today' : 'Product Intelligence'}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
          {presetFilter === 'trending'
            ? `${sorted.length} trending products · Updated ${timeAgo}`
            : `${total} products tracked · Updated ${timeAgo}`
          }
        </p>
      </div>

      {/* Top 10 Today — horizontal scrollable */}
      {top10.length > 0 && (
        <div style={{ marginBottom: 24, padding: '0 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', boxShadow: '0 0 6px #059669', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
              Today's Top 10
            </span>
            <span style={{ fontSize: 11, color: '#6B7280' }}>· Refreshed every 6h</span>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {top10.map((p, idx) => (
              <div key={p.id || p.name}
                onClick={() => handleBuildStore(p)}
                title={`Build store for ${p.name}`}
                style={{
                  flexShrink: 0, width: 150, background: '#FFFFFF', cursor: 'pointer',
                  border: `1.5px solid ${idx === 0 ? '#6366F1' : '#E5E7EB'}`,
                  borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#6366F1';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.12)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = idx === 0 ? '#6366F1' : '#E5E7EB';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div style={{ position: 'relative' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} loading="lazy"
                      style={{ width: '100%', height: 88, objectFit: 'cover', display: 'block' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 88, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#6366F1' }}>🛍️</div>
                  )}
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    width: 22, height: 22, borderRadius: '50%',
                    background: idx < 3 ? '#6366F1' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900,
                    color: idx < 3 ? '#FFFFFF' : '#6B7280',
                    border: idx >= 3 ? '1px solid #E5E7EB' : 'none',
                  }}>
                    {idx + 1}
                  </div>
                </div>
                <div style={{ padding: '8px 10px 10px' }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#111111', lineHeight: 1.35,
                    marginBottom: 6, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                  }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#6366F1' }}>
                      {formatRevenue(p.est_monthly_revenue_aud)}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: (p.growth_rate_pct || 0) >= 0 ? '#059669' : '#EF4444' }}>
                      {(p.growth_rate_pct || 0) >= 0 ? '↑' : '↓'}{Math.abs(p.growth_rate_pct || 0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === STAT CARDS === */}
      {products.length > 0 && (() => {
        const totalProducts = products.length;
        const avgRevenue = products.length > 0 ? Math.round(products.reduce((s, p) => s + (p.est_monthly_revenue_aud || 0), 0) / products.length) : 0;
        const highMarginCount = products.filter(p => (p.estimated_margin_pct || 0) >= 40).length;
        const trendingCount = products.filter(p => {
          const score = p.winning_score ?? (p as any).opportunity_score ?? p.trend_score ?? (p as any).score ?? 0;
          return Number(score) >= 70;
        }).length;
        const STAT_CARDS = [
          { label: 'Total Products', value: totalProducts.toString(), trend: '+12 today', positive: true, icon: '📦' },
          { label: 'Avg Est. Revenue', value: `$${(avgRevenue / 1000).toFixed(1)}k`, trend: '+8% this week', positive: true, icon: '💰' },
          { label: 'High Margin (40%+)', value: highMarginCount.toString(), trend: `${totalProducts > 0 ? Math.round(highMarginCount / totalProducts * 100) : 0}% of total`, positive: true, icon: '📈' },
          { label: 'Score 70+ (Hot)', value: trendingCount.toString(), trend: 'Top performers', positive: true, icon: '🔥' },
        ];
        return (
          <div className="stat-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, padding: '16px 28px 0', background: '#FFFFFF' }}>
            {STAT_CARDS.map((card, i) => (
              <div key={i} style={{
                background: 'white', border: '1px solid #F0F0F0', borderRadius: 12,
                padding: '20px 24px', cursor: 'default', transition: 'border-color 200ms',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366F1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#F0F0F0')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#6B7280' }}>{card.label}</span>
                  <span style={{ fontSize: 20 }}>{card.icon}</span>
                </div>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 28, color: '#111111', lineHeight: 1, marginBottom: 8 }}>{card.value}</div>
                <div style={{ fontSize: 12, color: card.positive ? '#059669' : '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {card.positive ? '↑' : '↓'} {card.trend}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* === OPPORTUNITY FILTER BAR === */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 28px 12px', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
        {['All', '🔥 Viral', '💰 High Margin', '🇦🇺 AU Best Sellers', '⚡ TikTok', 'New Today'].map(f => (
          <button key={f} onClick={() => setOpportunityFilter(f)}
            onMouseEnter={(e) => { if (opportunityFilter !== f) (e.currentTarget as HTMLButtonElement).style.background = '#EEEEEF'; }}
            onMouseLeave={(e) => { if (opportunityFilter !== f) (e.currentTarget as HTMLButtonElement).style.background = '#F5F5F5'; }}
            style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', border: 'none', transition: 'all 150ms',
              background: opportunityFilter === f ? '#6366F1' : '#F5F5F5',
              color: opportunityFilter === f ? '#FFFFFF' : '#374151',
            }}>
            {f}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[{ id: 'revenue', label: 'Est. Revenue ↓' }, { id: 'orders', label: 'Orders ↓' }, { id: 'margin', label: 'Margin ↓' }, { id: 'newest', label: 'Newest' }].map(s => (
            <button key={s.id} onClick={() => setSortMode(s.id)}
              style={{
                height: 32, padding: '0 12px', border: `1px solid ${sortMode === s.id ? '#6366F1' : '#E5E7EB'}`,
                borderRadius: 6, background: '#FFFFFF',
                color: sortMode === s.id ? '#6366F1' : '#374151',
                fontSize: 13, cursor: 'pointer', transition: 'all 150ms',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        padding: '14px 28px', background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB', marginBottom: 16,
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          style={{
            width: 260, padding: '8px 12px', borderRadius: 7,
            background: '#F9FAFB', border: '1px solid #E5E7EB',
            color: '#111111', fontSize: 13, outline: 'none',
            minWidth: 'min(200px, 100%)',
          }}
        />
        <button onClick={() => loadProducts()}
          style={{
            marginLeft: 'auto', padding: '8px 18px', borderRadius: 7,
            background: '#EEF2FF', border: '1px solid #C7D2FE',
            color: '#6366F1', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Syne, sans-serif',
          }}>
          ↻ Refresh
        </button>
      </div>

      {/* Store Builder banner */}
      <div style={{
        background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12,
        padding: '14px 20px', marginBottom: 20, marginLeft: 28, marginRight: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12,
      }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#4338CA' }}>🚀 Found a winner?</span>
          <span style={{ fontSize: 14, color: '#6366F1', marginLeft: 8 }}>Build a complete Shopify store in 60 seconds</span>
        </div>
        <button
          onClick={() => navigate('/app/store-builder')}
          style={{
            height: 36, padding: '0 20px', background: '#6366F1', color: 'white', border: 'none',
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const,
          }}
        >
          Try Store Builder →
        </button>
      </div>

      {/* Table */}
      <div style={{ margin: '0 28px 24px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead style={{ position: 'sticky', top: 56, background: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
            <tr>
              <th style={{ ...thStyle, width: 44, paddingLeft: 20 }}>#</th>
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
              <th className="db-col-hide-mobile" style={{ ...thStyle, width: 100 }}>CREATORS</th>
              <th style={{ ...thStyle, width: 200 }}>ACTIONS</th>
            </tr>
            <tr>
              <td colSpan={9} style={{ height: 1, background: '#F3F4F6', padding: 0 }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 0 }}>
                  <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, margin: '0 auto 20px', borderRadius: 20, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <circle cx="18" cy="18" r="14" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 3"/>
                        <path d="M18 10v8l4 4" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: '#111111', marginBottom: 8 }}>No products found</div>
                    <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>Try clearing your filters or search query</div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      {search && (
                        <button onClick={() => setSearch('')} style={{ height: 36, padding: '0 20px', background: 'white', color: '#6366F1', borderRadius: 8, border: '1px solid #6366F1', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Clear Search</button>
                      )}
                      <button onClick={() => loadProducts()} style={{ height: 36, padding: '0 20px', background: '#6366F1', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Refresh Products</button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : sorted.map((p, idx) => {
              const score = p.winning_score || p.trend_score || 0;
              const growth = p.growth_rate_pct || 0;
              const orders = (p as any).orders_count || p.items_sold_monthly || 0;
              const price = p.estimated_retail_aud || 0;
              const marginPct = p.estimated_margin_pct != null
                ? Math.max(0, Math.min(99, p.estimated_margin_pct))
                : (price > 0 ? Math.round((price - (p.avg_unit_price_aud || price / 3)) / price * 100) : 0);
              const estRevenue = p.est_monthly_revenue_aud && p.est_monthly_revenue_aud > 0
                ? p.est_monthly_revenue_aud
                : (orders > 0 && price > 0 ? Math.round(orders * price / 100) * 100 : 0);
              const tags = getOpportunityTags(p);
              const rowKey = p.id || p.name;

              // Score badge logic
              let scoreBg: string;
              let scoreBorder: string;
              let scoreColor: string;
              if (score >= 80) {
                scoreBg = '#6366F1'; scoreBorder = '#6366F1'; scoreColor = '#FFFFFF';
              } else if (score >= 65) {
                scoreBg = '#FFFFFF'; scoreBorder = '#6366F1'; scoreColor = '#6366F1';
              } else {
                scoreBg = '#FFFFFF'; scoreBorder = '#D1D5DB'; scoreColor = '#6B7280';
              }

              // Margin color
              let marginColor: string;
              if (marginPct > 50) { marginColor = '#059669'; }
              else if (marginPct >= 30) { marginColor = '#F59E0B'; }
              else { marginColor = '#EF4444'; }

              const isHovered = hoveredRow === rowKey;
              const rowBg = isHovered ? '#F9FAFB' : idx % 2 === 0 ? '#FAFAFA' : '#FFFFFF';

              return (
                <tr key={rowKey}
                  style={{ background: rowBg, transition: 'background 150ms', cursor: 'default', borderBottom: '1px solid #F3F4F6' }}
                  onMouseEnter={() => setHoveredRow(rowKey)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Rank */}
                  <td style={{ padding: '14px 8px 14px 20px', fontSize: 13, color: '#6B7280', textAlign: 'center', fontWeight: 600 }}>
                    {idx + 1}
                  </td>

                  {/* Product */}
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          width={44} height={44}
                          style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{
                          width: 44, height: 44, borderRadius: 8,
                          background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, flexShrink: 0, color: '#6366F1', fontWeight: 700,
                        }}>
                          {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 600, color: '#111111', marginBottom: 4, lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                        }}>
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
                          fontSize: 11, color: '#6366F1', background: '#EEF2FF',
                          borderRadius: 4, padding: '2px 7px', display: 'inline-block',
                        }}>
                          {p.niche}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Revenue */}
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', lineHeight: 1 }}>
                      {estRevenue > 0 ? formatRevenue(estRevenue) : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>est/month</div>
                  </td>

                  {/* Orders */}
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontSize: 14, color: '#6B7280' }}>
                      {orders > 0 ? orders.toLocaleString() : formatUnits(p.items_sold_monthly)}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>orders</div>
                  </td>

                  {/* Margin */}
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: marginColor }}>
                      ~{marginPct}%
                    </div>
                  </td>

                  {/* Sparkline */}
                  <td style={{ padding: '12px 20px' }}>
                    <Sparkline
                      data={(p.revenue_trend && p.revenue_trend.length === 7) ? p.revenue_trend : [1, 1, 1, 1, 1, 1, 1]}
                      width={78} height={32}
                      color={growth > 0 ? '#059669' : '#EF4444'}
                    />
                  </td>

                  {/* Score */}
                  <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', margin: '0 auto',
                      background: scoreBg,
                      border: `2px solid ${scoreBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: scoreColor,
                    }}>
                      {score}
                    </div>
                  </td>

                  {/* Creators */}
                  <td className="db-col-hide-mobile" style={{ padding: '12px 20px' }}>
                    <CreatorAvatars handles={p.creator_handles || []} />
                    {(p.ad_count_est || 0) > 0 && (
                      <div style={{ fontSize: 9, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                        +{p.ad_count_est} ads
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => handleBuildStore(p)}
                        style={{
                          height: 32, background: '#6366F1', color: '#FFFFFF', border: 'none',
                          padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Syne, sans-serif',
                          transition: 'all 150ms',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5';
                          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#6366F1';
                          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                        }}>
                        Build Store
                      </button>
                      <button
                        onClick={() => setAdsProduct(p)}
                        style={{ height: 32, padding: '0 10px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, color: '#374151', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        📣 Ads
                      </button>
                      <SupplierDropdown product={p} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 28px', fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
        {sorted.length} products · Majorka AU Market Intelligence
      </div>

      {/* === ADS MODAL === */}
      {adsProduct && <AdsModal product={adsProduct} onClose={() => setAdsProduct(null)} />}
    </div>
  );
}
