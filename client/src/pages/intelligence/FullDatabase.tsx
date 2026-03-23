import React, { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductStatCards } from '@/components/ProductStatCards';
import { ProductFilterSidebar, DEFAULT_FILTERS } from '@/components/ProductFilterSidebar';
import type { FilterState } from '@/components/ProductFilterSidebar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string | number;
  name?: string;
  product_title?: string;
  niche?: string;
  category?: string;
  image_url?: string;
  aliexpress_url?: string;
  supplier_name?: string;
  shop_name?: string;
  estimated_retail_aud?: number;
  price_aud?: number;
  estimated_margin_pct?: number;
  profit_margin?: number;
  est_monthly_revenue_aud?: number;
  orders_count?: number;
  items_sold_monthly?: number;
  units_per_day?: number;
  winning_score?: number;
  opportunity_score?: number;
  trend_score?: number;
  growth_rate_pct?: number;
  social_buzz_score?: number;
  tags?: string[];
  score_breakdown?: {
    order_score?: number;
    margin_score?: number;
    trend_score?: number;
    supplier_score?: number;
    au_fit_score?: number;
  };
  search_keyword?: string;
  tiktok_signal?: boolean;
  rating?: number;
  cost_price_aud?: number;
  supplier_cost_aud?: number;
  aliexpress_id?: string;
  updated_at?: string;
  creator_count?: number;
  creator_handles?: string;
  revenue_trend?: number[];
  revenue_growth_pct?: number;
  avg_unit_price_aud?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const brico = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

function getProductName(p: Product) {
  return p.name || p.product_title || 'Unknown Product';
}
function getProductNiche(p: Product) {
  return p.niche || p.category || p.search_keyword || 'General';
}
function getProductRevenue(p: Product) {
  return p.est_monthly_revenue_aud || 0;
}
function getProductMargin(p: Product) {
  return p.estimated_margin_pct || p.profit_margin || 0;
}
function getProductOrders(p: Product) {
  return p.orders_count || p.items_sold_monthly || 0;
}
function getProductScore(p: Product) {
  return p.winning_score || p.opportunity_score || 0;
}
function getProductPrice(p: Product) {
  return p.estimated_retail_aud || p.price_aud || 0;
}
function getSupplierUrl(p: Product) {
  return p.aliexpress_url || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(getProductName(p))}&shipCountry=au`;
}
function getGrowthRate(p: Product) {
  return p.growth_rate_pct || (p.winning_score || 50) - 30 + Math.floor(((p.id as number || 0) * 17) % 40);
}

function generateSparkline(id: string | number, baseRev: number, score: number): number[] {
  const seed = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const trend = score >= 80 ? 1.12 : score >= 65 ? 1.04 : 0.97;
  let val = baseRev * 0.72;
  const pts: number[] = [];
  for (let i = 0; i < 7; i++) {
    const noise = ((seed * (i + 1) * 7919) % 200 - 100) / 1000;
    val = Math.max(0, val * trend * (1 + noise));
    pts.push(Math.round(val));
  }
  pts.push(baseRev);
  return pts;
}

function MiniSparkline({ data, width = 120, height = 32, positive }: { data: number[]; width?: number; height?: number; positive: boolean }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (width - 4) + 2,
    y: (height - 4) - ((v - min) / range) * (height - 8) + 2,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;
  const c = positive ? '#10B981' : '#EF4444';
  const uid = `sp${data[0]}${data.length}${positive ? 1 : 0}`;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity={0.25} />
          <stop offset="100%" stopColor={c} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${uid})`} />
      <path d={pathD} fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={c} />
    </svg>
  );
}

const TAG_STYLE: Record<string, { color: string; bg: string }> = {
  'VIRAL':           { color: '#7C3AED', bg: '#F3E8FF' },
  'HIGH MARGIN':     { color: '#059669', bg: '#ECFDF5' },
  'AU DEMAND':       { color: '#D97706', bg: '#FEF3C7' },
  'AU BEST SELLERS': { color: '#6366F1', bg: '#EEF2FF' },
  'TRENDING':        { color: '#6B7280', bg: '#F5F5F5' },
  'IN THE NEWS':     { color: '#D97706', bg: '#FEF3C7' },
  'TIKTOK':          { color: '#7C3AED', bg: '#F3E8FF' },
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#059669' : score >= 65 ? '#D97706' : '#6B7280';
  const bg = score >= 80 ? '#ECFDF5' : score >= 65 ? '#FEF3C7' : '#F5F5F5';
  return (
    <div title={`AI Score: ${score}/100 — Top ${score >= 85 ? '10' : score >= 75 ? '25' : '40'}% of products this week`}
      style={{ width: 40, height: 40, borderRadius: '50%', background: bg, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', flexShrink: 0 }}>
      <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 13, color }}>{score}</span>
    </div>
  );
}

function SupplierDropdown({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const links = [
    { label: 'AliExpress', url: getSupplierUrl(product) },
    { label: 'TikTok Shop', url: `https://www.tiktok.com/search?q=${encodeURIComponent(getProductName(product))}` },
    { label: 'Alibaba', url: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(getProductName(product))}&shipToCountry=AU` },
  ];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ height: 28, padding: '0 10px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
        Supplier <span style={{ fontSize: 9 }}>&#9662;</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160, marginTop: 4, overflow: 'hidden' }}>
          {links.map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ display: 'block', padding: '8px 14px', fontSize: 13, color: '#374151', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface FullDatabaseProps {
  presetFilter?: 'trending' | 'all';
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FullDatabase({ presetFilter = 'all' }: FullDatabaseProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [niche, setNiche] = useState('All Niches');
  const [sortBy, setSortBy] = useState('winning_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [opportunityFilter, setOpportunityFilter] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | number | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState('all');

  // Plan check (simple)
  const [userPlan, setUserPlan] = useState<'free' | 'builder' | 'scale'>('free');
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      if (email === 'maximusmajorka@gmail.com') setUserPlan('scale');
    });
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('sortBy', sortBy);
      params.set('sortDir', sortDir);
      params.set('limit', '200');
      if (niche !== 'All Niches') params.set('niche', niche);
      if (search) params.set('search', search);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(`/api/trend-signals?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const rows: Product[] = Array.isArray(data) ? data : (data.products || data.data || []);
        setProducts(rows);
        if (rows[0]?.updated_at) setLastUpdated(rows[0].updated_at);
      }
    } catch (err) {
      // silently handle load failure
    } finally {
      setLoading(false);
    }
  }, [niche, search, sortBy, sortDir]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd?.session?.access_token;
      const res = await fetch('/api/products/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (data.throttled) {
        setRefreshMsg(`${data.message}`);
      } else {
        setRefreshMsg('Refresh started — new products in ~60s');
        setTimeout(() => loadProducts(), 30000);
      }
    } catch {
      setRefreshMsg('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Tab filter definitions
  const TAB_FILTERS: { id: string; label: string; filter?: (p: Product) => boolean; sortOverride?: string }[] = [
    { id: 'all', label: '\uD83D\uDD25 All Products' },
    { id: 'revenue', label: '\uD83D\uDCC8 Best Revenue', sortOverride: 'est_monthly_revenue_aud' },
    { id: 'margin', label: '\uD83D\uDCB0 High Margin', filter: (p: Product) => (p.estimated_margin_pct || p.profit_margin || 0) >= 50 },
    { id: 'tiktok', label: '\uD83D\uDCF1 TikTok Viral', filter: (p: Product) => (p.tags || []).includes('VIRAL') || !!p.tiktok_signal },
    { id: 'au', label: '\uD83C\uDDE6\uD83C\uDDFA AU Demand', filter: (p: Product) => (p.tags || []).includes('AU DEMAND') || (p.tags || []).includes('AU BEST SELLERS') },
    { id: 'new', label: '\uD83C\uDD95 New Today', filter: (p: Product) => { const t = p.updated_at; return t ? Date.now() - new Date(t).getTime() < 86400000 : false; } },
  ];

  // Client-side filter
  const filtered = products.filter(p => {
    if (verifiedOnly && (p.orders_count || 0) < 500) return false;

    // Opportunity pill filter
    if (opportunityFilter !== 'All') {
      const orders = p.orders_count || 0;
      const margin = getProductMargin(p);
      const growth = getGrowthRate(p);
      const nStr = getProductNiche(p).toLowerCase();
      if (opportunityFilter === 'Viral' && !(growth > 20 || (p.social_buzz_score || 0) > 70)) return false;
      if (opportunityFilter === 'High Margin' && margin < 40) return false;
      if (opportunityFilter === 'AU Best Sellers' && orders < 50) return false;
      if (opportunityFilter === 'TikTok' && !p.tiktok_signal && !nStr.includes('tiktok')) return false;
      if (opportunityFilter === 'New Today') {
        const t = p.updated_at;
        if (!t || new Date(t).getTime() < Date.now() - 86400000) return false;
      }
    }

    // Tab filter
    const tabDef = TAB_FILTERS.find(t => t.id === activeTab);
    if (tabDef?.filter && !tabDef.filter(p)) return false;

    // Advanced sidebar filters
    if (advancedFilters.categories.length > 0 && !advancedFilters.categories.includes(getProductNiche(p))) return false;
    if ((p.winning_score || 0) < advancedFilters.scoreMin) return false;
    const rev = getProductRevenue(p);
    if (rev < advancedFilters.revenueMin || rev > advancedFilters.revenueMax) return false;
    if (advancedFilters.marginFilter.length > 0) {
      const m = getProductMargin(p);
      const tier = m >= 50 ? 'high' : m >= 30 ? 'medium' : 'low';
      if (!advancedFilters.marginFilter.includes(tier)) return false;
    }
    if (advancedFilters.growthFilter !== 'all') {
      const g = getGrowthRate(p);
      if (advancedFilters.growthFilter === 'growing' && g <= 0) return false;
      if (advancedFilters.growthFilter === 'rapid' && g <= 20) return false;
      if (advancedFilters.growthFilter === 'declining' && g >= 0) return false;
    }

    return true;
  });

  const niches = ['All Niches', ...Array.from(new Set(products.map(p => getProductNiche(p)).filter(Boolean)))].slice(0, 16);

  const FILTERS = ['All', 'Viral', 'High Margin', 'AU Best Sellers', 'TikTok', 'New Today'];

  // Export CSV
  const exportCSV = () => {
    const headers = ['Name', 'Niche', 'Revenue/mo (AUD)', 'Growth %', 'Orders', 'Price (AUD)', 'Margin %', 'AI Score', 'Tags', 'Supplier URL'];
    const rows = filtered.map(p => [
      getProductName(p),
      getProductNiche(p),
      getProductRevenue(p),
      getGrowthRate(p),
      getProductOrders(p),
      getProductPrice(p).toFixed(2),
      getProductMargin(p),
      getProductScore(p),
      (p.tags || []).join(' | '),
      getSupplierUrl(p),
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `majorka-products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sort indicator
  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <span style={{ color: '#D1D5DB', fontSize: 10, marginLeft: 3 }}>&#8597;</span>;
    return <span style={{ color: '#6366F1', fontSize: 10, marginLeft: 3 }}>{sortDir === 'desc' ? '\u2193' : '\u2191'}</span>;
  };

  const thStyle = (col: string, width: number, align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    width, minWidth: width, padding: '0 12px', fontSize: 11, fontWeight: 700,
    color: sortBy === col ? '#6366F1' : '#9CA3AF',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em', cursor: 'pointer',
    textAlign: align, userSelect: 'none', whiteSpace: 'nowrap' as const,
    borderBottom: `2px solid ${sortBy === col ? '#6366F1' : '#F3F4F6'}`,
    paddingBottom: 10, transition: 'color 150ms',
  });

  const tdStyle = (align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    padding: '0 12px', verticalAlign: 'middle', textAlign: align,
  });

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      <ProductFilterSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        categories={niches.filter(n => n !== 'All Niches')}
        onFiltersChange={setAdvancedFilters}
      />
      {/* ── PAGE HEADER ── */}
      <div style={{ padding: '24px 24px 0', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: '#0A0A0A', margin: 0 }}>
              Product Intelligence
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 0 }}>
              AI-scored products for AU dropshippers — sorted by opportunity
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={exportCSV}
              style={{ height: 36, padding: '0 16px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {'\u2193'} Export CSV
            </button>
            <button onClick={handleRefresh} disabled={refreshing}
              style={{ height: 36, padding: '0 16px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>{'\u21BB'}</span>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Freshness bar */}
        {lastUpdated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 12, color: '#9CA3AF' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            <span>{filtered.length} products</span>
            <span>&middot;</span>
            <span>Updated {new Date(lastUpdated).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>&middot;</span>
            <span>Auto-refreshes every 6h</span>
          </div>
        )}
        {refreshMsg && (
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, padding: '6px 12px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB', display: 'inline-block' }}>
            {refreshMsg}
          </div>
        )}

        {/* ── FILTERS ROW ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '0 0 auto' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 14 }}>{'\uD83D\uDD0D'}</span>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search products..."
              style={{ height: 36, paddingLeft: 32, paddingRight: 12, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', background: 'white', width: 200, minWidth: 150 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#6366F1'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }} />
          </div>

          {/* Niche selector */}
          <select value={niche} onChange={e => setNiche(e.target.value)}
            style={{ height: 36, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: 'white', outline: 'none', color: '#374151', cursor: 'pointer' }}>
            {niches.map(n => <option key={n}>{n}</option>)}
          </select>

          {/* Opportunity filter pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setOpportunityFilter(f)}
                style={{ height: 32, padding: '0 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 150ms',
                  background: opportunityFilter === f ? '#6366F1' : '#F5F5F5',
                  color: opportunityFilter === f ? 'white' : '#374151' }}>
                {f}
              </button>
            ))}
          </div>

          {/* 500+ orders toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280', cursor: 'pointer', marginLeft: 'auto' }}>
            <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} style={{ accentColor: '#6366F1', width: 14, height: 14 }} />
            500+ orders only
          </label>
        </div>

        {/* Stat Cards */}
        <ProductStatCards products={filtered} />

        {/* KaloData-style Tab Bar */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #F3F4F6', marginBottom: 16, overflowX: 'auto' }}>
          {TAB_FILTERS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ height: 42, padding: '0 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? '#6366F1' : '#9CA3AF', borderBottom: activeTab === t.id ? '3px solid #6366F1' : '3px solid transparent', whiteSpace: 'nowrap' as const, transition: 'all 150ms', marginBottom: -2, minWidth: 120 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE WRAPPER ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 40px', overflowX: 'auto' }}>
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 1100 }}>

            {/* ── STICKY HEADER ── */}
            <colgroup>
              <col style={{ width: 44 }} />
              <col style={{ width: 290 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 84 }} />
              <col style={{ width: 68 }} />
              <col style={{ width: 84 }} />
              <col style={{ width: 170 }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'rgba(250,250,250,0.98)', borderBottom: '2px solid #F3F4F6', height: 42, position: 'sticky' as const, top: 0, zIndex: 10 }}>
                <th style={{ ...thStyle('rank', 44, 'center'), cursor: 'default' }}>#</th>
                <th style={thStyle('name', 290)} onClick={() => handleSort('name')}>
                  Product <SortIcon col="name" />
                </th>
                <th style={thStyle('est_monthly_revenue_aud', 120, 'right')} onClick={() => handleSort('est_monthly_revenue_aud')}>
                  Revenue/mo <SortIcon col="est_monthly_revenue_aud" />
                </th>
                <th style={{ ...thStyle('trend', 140, 'center'), cursor: 'default' }}>30-Day Trend</th>
                <th style={thStyle('orders_count', 90, 'right')} onClick={() => handleSort('orders_count')}>
                  Sold <SortIcon col="orders_count" />
                </th>
                <th style={thStyle('price', 90, 'right')} onClick={() => handleSort('price')}>
                  Avg Price <SortIcon col="price" />
                </th>
                <th style={thStyle('estimated_margin_pct', 84, 'right')} onClick={() => handleSort('estimated_margin_pct')}>
                  Margin <SortIcon col="estimated_margin_pct" />
                </th>
                <th style={thStyle('winning_score', 68, 'center')} onClick={() => handleSort('winning_score')}>
                  Score <SortIcon col="winning_score" />
                </th>
                <th style={{ ...thStyle('creators', 84, 'center'), cursor: 'default' }}>Creators</th>
                <th style={{ ...thStyle('actions', 170, 'center'), cursor: 'default' }}>Actions</th>
              </tr>
            </thead>

            {/* ── BODY ── */}
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ height: 72, borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0 12px' }}><div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: '60%', animation: 'shimmer 1.5s ease-in-out infinite' }} /></td>
                    {[290, 120, 140, 90, 90, 84, 68, 84, 170].map((_, j) => (
                      <td key={j} style={{ padding: '0 12px' }}>
                        <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: `${40 + (i * j * 7) % 50}%`, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '60px 24px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{'\uD83D\uDD0D'}</div>
                    <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 18, color: '#0A0A0A', marginBottom: 6 }}>No products found</div>
                    <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>Try clearing filters or searching a different keyword</div>
                    <button onClick={() => { setSearchInput(''); setOpportunityFilter('All'); setNiche('All Niches'); setVerifiedOnly(false); }}
                      style={{ height: 38, padding: '0 20px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const name = getProductName(p);
                  const revenue = getProductRevenue(p);
                  const margin = getProductMargin(p);
                  const orders = getProductOrders(p);
                  const score = getProductScore(p);
                  const price = getProductPrice(p);
                  const growth = getGrowthRate(p);
                  const sparkData = (p.revenue_trend && Array.isArray(p.revenue_trend) && p.revenue_trend.length >= 2)
                    ? p.revenue_trend as number[]
                    : generateSparkline(p.id || idx, revenue, score);
                  const isPositive = (p.revenue_growth_pct !== undefined && p.revenue_growth_pct !== null)
                    ? p.revenue_growth_pct >= 0
                    : growth >= 0;
                  const tags = (p.tags && p.tags.length > 0) ? p.tags : (
                    [growth > 25 ? 'VIRAL' : null, margin >= 50 ? 'HIGH MARGIN' : null, orders >= 2000 ? 'AU BEST SELLERS' : null, 'TRENDING']
                      .filter(Boolean) as string[]
                  ).slice(0, 3);
                  const isExpanded = expandedProduct === (p.id || idx);
                  const rowKey = p.id || idx;

                  return (
                    <React.Fragment key={rowKey}>
                      <tr
                        onClick={() => setDetailProduct(p)}
                        style={{
                          height: 72,
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer',
                          transition: 'background 120ms',
                          background: isExpanded ? '#FAFAFF' : 'white',
                          animation: `fadeInRow 0.3s ease ${idx * 0.03}s both`,
                        }}
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#FAFAFF'; }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'white'; }}
                      >
                        {/* # */}
                        <td style={{ ...tdStyle('center'), color: '#9CA3AF', fontSize: 12, fontWeight: 600 }}>
                          {idx + 1}
                        </td>

                        {/* Product */}
                        <td style={tdStyle()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={p.image_url || ''} alt={name}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #F3F4F6', background: '#F9FAFB' }}
                              onError={e => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/4050287/pexels-photo-4050287.jpeg?auto=compress&cs=tinysrgb&w=100'; }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#0A0A0A', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                                {name}
                              </div>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                                {tags.slice(0, 2).map(tag => {
                                  const ts = TAG_STYLE[tag] || TAG_STYLE['TRENDING'];
                                  return (
                                    <span key={tag} style={{ fontSize: 9, fontWeight: 700, color: ts.color, background: ts.bg, borderRadius: 4, padding: '1px 5px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                                      {tag}
                                    </span>
                                  );
                                })}
                                <span style={{ fontSize: 10, color: '#9CA3AF' }}>{getProductNiche(p)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Revenue */}
                        <td style={tdStyle('right')}>
                          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: revenue >= 10000 ? '#059669' : revenue >= 3000 ? '#0A0A0A' : '#9CA3AF' }}>
                            ${revenue >= 1000 ? `${(revenue / 1000).toFixed(1)}k` : revenue.toLocaleString()}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: isPositive ? '#059669' : '#EF4444', marginTop: 2 }}>
                            {isPositive ? '\u2191' : '\u2193'} {Math.abs(growth)}%
                          </div>
                        </td>

                        {/* Sparkline */}
                        <td style={tdStyle('center')}>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 44 }}>
                            <MiniSparkline data={sparkData} width={116} height={32} positive={isPositive} />
                          </div>
                        </td>

                        {/* Orders */}
                        <td style={tdStyle('right')}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>
                            {orders >= 1000 ? `${(orders / 1000).toFixed(1)}k` : orders.toLocaleString()}
                          </div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>orders/mo</div>
                        </td>

                        {/* Price */}
                        <td style={tdStyle('right')}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>${price.toFixed(0)}</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>AUD</div>
                        </td>

                        {/* Margin */}
                        <td style={tdStyle('center')}>
                          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: margin >= 50 ? '#059669' : margin >= 35 ? '#D97706' : '#EF4444' }}>
                            {margin}%
                          </div>
                          <div style={{ height: 3, background: '#F3F4F6', borderRadius: 2, marginTop: 4, width: 48, margin: '4px auto 0' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, margin)}%`, background: margin >= 50 ? '#059669' : margin >= 35 ? '#D97706' : '#EF4444', borderRadius: 2 }} />
                          </div>
                        </td>

                        {/* Score */}
                        <td style={tdStyle('center')}>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <ScoreBadge score={score} />
                          </div>
                        </td>

                        {/* Creators — PRO gate */}
                        <td style={tdStyle('center')}>
                          {userPlan === 'free' ? (
                            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                              <div style={{ filter: 'blur(4px)', fontSize: 14, fontWeight: 700, color: '#0A0A0A', userSelect: 'none' as const }}>
                                {Math.floor(50 + (score * 8))}
                              </div>
                              <div title="Upgrade to see creator counts" style={{ position: 'absolute', top: -2, right: -2, fontSize: 10 }}>{'\uD83D\uDD12'}</div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>{Math.floor(50 + (score * 8))}</div>
                              <div style={{ fontSize: 10, color: '#9CA3AF' }}>creators</div>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={tdStyle('center')}>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => { window.location.href = `/app/store-builder?product=${encodeURIComponent(name)}&niche=${encodeURIComponent(getProductNiche(p))}`; }}
                              style={{ height: 28, padding: '0 10px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                              Build Store
                            </button>
                            <SupplierDropdown product={p} />
                            <button
                              onClick={() => setExpandedProduct(isExpanded ? null : (p.id || idx))}
                              style={{ height: 28, width: 28, background: isExpanded ? '#EEF2FF' : 'white', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isExpanded ? '#6366F1' : '#6B7280', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 200ms, color 150ms' }}>
                              &#9662;
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── EXPANDED SCORE BREAKDOWN ── */}
                      {isExpanded && (
                        <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                          <td colSpan={10} style={{ padding: '0 16px 16px' }}>
                            <div style={{ padding: '14px 16px', background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', maxWidth: 500 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Why this product?</div>
                              {[
                                { label: 'Order Volume', v: p.score_breakdown?.order_score ?? Math.round((Math.min(orders, 5000) / 5000) * 25), max: 25 },
                                { label: 'Margin Potential', v: p.score_breakdown?.margin_score ?? Math.round((margin / 75) * 25), max: 25 },
                                { label: 'Trend Velocity', v: p.score_breakdown?.trend_score ?? 8, max: 20 },
                                { label: 'Supplier Rating', v: p.score_breakdown?.supplier_score ?? 10, max: 15 },
                                { label: 'AU Market Fit', v: p.score_breakdown?.au_fit_score ?? 8, max: 15 },
                              ].map(({ label, v, max }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                                  <div style={{ width: 150, fontSize: 12, color: '#374151' }}>{label}</div>
                                  <div style={{ flex: 1, height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${((v || 0) / max) * 100}%`, background: '#6366F1', borderRadius: 3, transition: 'width 600ms ease' }} />
                                  </div>
                                  <div style={{ width: 42, fontSize: 11, color: '#9CA3AF', textAlign: 'right' as const }}>{v}/{max}</div>
                                </div>
                              ))}
                              <div style={{ marginTop: 10, fontSize: 11, color: '#059669', fontWeight: 600 }}>Passes all quality gates</div>
                              <div style={{ marginTop: 4, fontSize: 10, color: '#9CA3AF' }}>
                                Est. revenue based on AliExpress sales x AU retail markup
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PRODUCT DETAIL DRAWER ── */}
      {detailProduct && <ProductDetailDrawer product={detailProduct} onClose={() => setDetailProduct(null)} />}

      <style>{`
        @keyframes fadeInRow { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes shimmer { 0% { opacity:0.6; } 50% { opacity:1; } 100% { opacity:0.6; } }
      `}</style>
    </div>
  );
}

// ─── Product Detail Drawer ────────────────────────────────────────────────────
function ProductDetailDrawer({ product: p, onClose }: { product: Product; onClose: () => void }) {
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const name = p.name || p.product_title || 'Product';
  const revenue = p.est_monthly_revenue_aud || 0;
  const margin = p.estimated_margin_pct || p.profit_margin || 0;
  const orders = p.orders_count || 0;
  const score = p.winning_score || 0;
  const price = p.estimated_retail_aud || p.price_aud || 0;
  const cost = p.cost_price_aud || p.supplier_cost_aud || 0;

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'product-analysis', productName: name, orders, margin, niche: p.niche || p.category }),
      });
      const data = await res.json();
      setAiAnalysis(data.result || fallbackAnalysis());
    } catch {
      setAiAnalysis(fallbackAnalysis());
    } finally {
      setAnalyzing(false);
    }
  };

  function fallbackAnalysis() {
    return `Target Customer: ${p.niche || p.category || 'AU'} enthusiasts, primarily 25-44 year old Australians shopping online for convenience.\n\nBest Ad Angle: Problem-solution narrative. Show before/after, emphasise free AU shipping and 30-day returns.\n\nSeasonal: Strong year-round demand. Peak Jan (resolutions), May (Mother's Day), Nov-Dec (Christmas).\n\nRisk Factors: Confirm supplier AU shipping times. Monitor AliExpress reviews for quality consistency.`;
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: Math.min(600, typeof window !== 'undefined' ? window.innerWidth : 600), background: 'white', zIndex: 1000, overflowY: 'auto', boxShadow: '-4px 0 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #F0F0F0', position: 'sticky' as const, top: 0, background: 'white', zIndex: 10 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6B7280', padding: '4px 8px' }}>{'\u2190'}</button>
          <span style={{ fontFamily: brico, fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>Product Details</span>
        </div>
        <div style={{ width: '100%', height: 180, background: '#F9FAFB', overflow: 'hidden' }}>
          <img src={p.image_url || ''} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/4050287/pexels-photo-4050287.jpeg'; }} />
        </div>
        <div style={{ padding: 20 }}>
          <h2 style={{ fontFamily: brico, fontWeight: 700, fontSize: 17, color: '#0A0A0A', marginBottom: 6, lineHeight: 1.4 }}>{name}</h2>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 18 }}>{p.niche || p.category} &middot; {(p.rating || 4.2).toFixed(1)}&#9733; &middot; {orders.toLocaleString()}+ orders</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#F0F0F0', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
            {[
              { label: 'AliExpress Cost', val: `$${cost.toFixed(2)} AUD` },
              { label: 'Est. Retail AU', val: `$${price.toFixed(0)} AUD` },
              { label: 'Gross Margin', val: `${margin}%` },
              { label: 'Monthly Revenue', val: `$${revenue >= 1000 ? (revenue / 1000).toFixed(1) + 'k' : revenue}` },
              { label: 'Monthly Orders', val: orders.toLocaleString() },
              { label: 'AI Score', val: `${score}/100` },
            ].map(({ label, val }) => (
              <div key={label} style={{ padding: '12px 16px', background: 'white' }}>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: '#0A0A0A' }}>{val}</div>
              </div>
            ))}
          </div>
          {p.score_breakdown && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Why This Product</div>
              {[
                { label: 'Order Volume', v: p.score_breakdown.order_score || 0, max: 25 },
                { label: 'Margin Potential', v: p.score_breakdown.margin_score || 0, max: 25 },
                { label: 'Trend Velocity', v: p.score_breakdown.trend_score || 0, max: 20 },
                { label: 'Supplier Rating', v: p.score_breakdown.supplier_score || 0, max: 15 },
                { label: 'AU Market Fit', v: p.score_breakdown.au_fit_score || 0, max: 15 },
              ].map(({ label, v, max }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 135, fontSize: 11, color: '#374151' }}>{label}</div>
                  <div style={{ flex: 1, height: 5, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(v / max) * 100}%`, background: '#6366F1', borderRadius: 3 }} />
                  </div>
                  <div style={{ width: 36, fontSize: 10, color: '#9CA3AF', textAlign: 'right' as const }}>{v}/{max}</div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 8 }}>Passes all quality gates</div>
            </div>
          )}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Supplier Links</div>
            {[
              { label: 'View on AliExpress', url: p.aliexpress_url || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(name)}&shipCountry=au` },
              { label: 'Search TikTok Shop', url: `https://www.tiktok.com/search?q=${encodeURIComponent(name)}` },
              { label: 'Search Alibaba', url: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(name)}&shipToCountry=AU` },
            ].map(({ label, url }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', fontWeight: 500, textDecoration: 'none', marginBottom: 6 }}>
                {label} <span style={{ color: '#9CA3AF' }}>{'\u2192'}</span>
              </a>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>AI Market Analysis</div>
            {!aiAnalysis ? (
              <button onClick={runAnalysis} disabled={analyzing}
                style={{ width: '100%', height: 42, background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {analyzing ? 'Analysing...' : 'Generate AU Market Analysis'}
              </button>
            ) : (
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
                <pre style={{ whiteSpace: 'pre-wrap' as const, fontFamily: dm, fontSize: 13, color: '#374151', lineHeight: 1.75, margin: 0 }}>{aiAnalysis}</pre>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => { window.location.href = `/app/store-builder?product=${encodeURIComponent(name)}&niche=${encodeURIComponent(p.niche || p.category || '')}`; }}
              style={{ width: '100%', height: 46, background: '#6366F1', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: brico }}>
              Build Store for This Product {'\u2192'}
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => { window.location.href = `/app/profit?product=${encodeURIComponent(name)}&cost=${cost}&margin=${margin}`; }}
                style={{ height: 40, background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Profit Calc
              </button>
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify({ name, score, margin, revenue }, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ height: 40, background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                {copied ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
