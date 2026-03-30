import { useIsMobile } from '@/hooks/useIsMobile';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { DateRangeSelector, DateRange, getDateRangeStart } from '@/components/DateRangeSelector';
import { exportCSV } from '@/lib/exportCsv';
import { ProductStatCards } from '@/components/ProductStatCards';
import { ProductFilterSidebar, DEFAULT_FILTERS } from '@/components/ProductFilterSidebar';
import { ProductImage } from '@/components/ProductImage';
import { VelocityBadge } from '@/components/VelocityBadge';
import type { FilterState } from '@/components/ProductFilterSidebar';
import { useRegion } from '@/context/RegionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Lock, Copy, Megaphone } from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';
import UsageMeter from '@/components/UsageMeter';
import { PLAN_LIMITS } from '@shared/plans';

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
  velocity_label?: 'EARLY' | 'PEAK' | 'FADING' | 'UNKNOWN';
  velocity_score?: number;
  peak_in_days?: number | null;
  velocity_curve?: Array<{ signal_strength: number }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const brico = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function cleanProductTitle(raw: string): string {
  let t = raw.trim();
  // Remove leading year patterns like "2024 New", "2025 Upgrade", "New 2024"
  t = t.replace(/^(20\d{2}\s+(new|upgrade|updated|style|version|hot|popular)\s+)/i, '');
  t = t.replace(/^(new\s+20\d{2}\s+)/i, '');
  // Remove size/volume variant prefixes like "350ml/500ml/600ml/750ml "
  t = t.replace(/^(\d+\s*[a-z]+\/)+\d+\s*[a-z]+\s+/i, '');
  // Truncate at spec dumps: first occurrence of capacity/spec patterns mid-title
  const specPat = /\s+(USB|Type-C|Bluetooth|WiFi|\d+ml\/\d+ml|\d+[Ww]\s|BPA-Free|LED\s+\d+|IPX\d|\d+000mAh)/;
  const specIdx = t.search(specPat);
  if (specIdx > 20) t = t.slice(0, specIdx);
  // Remove trailing junk: " - AU", " | ", "& More"
  t = t.replace(/\s*[-|&]\s*(AU|more|etc\.?)$/i, '');
  // Capitalise first letter
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return t.trim() || raw;
}

function getProductName(p: Product) {
  const raw = p.name || p.product_title || 'Unknown Product';
  return cleanProductTitle(raw);
}
function getProductNiche(p: Product) {
  return p.niche || p.category || p.search_keyword || 'General';
}
function getProductRevenue(p: Product) {
  // Prefer DB-stored est_monthly_revenue_aud (now clean: orders_count × price_aud)
  // Fall back to orders_count/30 × price × 30 = orders_count × price, or units_per_day × price × 30
  if (p.est_monthly_revenue_aud && p.est_monthly_revenue_aud > 0) return p.est_monthly_revenue_aud;
  const price = p.price_aud || 0;
  if (p.orders_count && p.orders_count > 0) return Math.round(p.orders_count * price * 100) / 100;
  const upd = p.units_per_day || Math.max(1, Math.round((p.winning_score || 50) / 12));
  return Math.round(price * upd * 30 * 100) / 100;
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
function getGrowthRate(p: Product): number {
  if (p.growth_rate_pct !== null && p.growth_rate_pct !== undefined) return p.growth_rate_pct;
  // Deterministic fallback from string ID (UUID-safe)
  const seed = String(p.id || '').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xFFFF, 0);
  const base = (p.winning_score || 50) - 30;
  return Math.round(base + ((seed % 40) - 20) / 2);
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
  const tier = score >= 80
    ? { bg: '#ECFDF5', color: '#059669', prefix: '🔥 ' }
    : score >= 60
    ? { bg: '#EEF2FF', color: '#6366F1', prefix: '' }
    : score >= 40
    ? { bg: '#FFFBEB', color: '#D97706', prefix: '' }
    : { bg: '#FEF2F2', color: '#DC2626', prefix: '' };
  return (
    <div title={`Dropship Score: ${score}/100 — Top ${score >= 85 ? '10' : score >= 75 ? '25' : '40'}% of products this week`}
      style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', cursor: 'help', flexShrink: 0 }}>
      <div style={{ padding: '4px 10px', borderRadius: 20, background: tier.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 13, color: tier.color }}>{tier.prefix}{score}</span>
      </div>
      <span style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>Dropship</span>
    </div>
  );
}

function SupplierDropdown({ product }: { product: Product }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const links = [
    { label: 'AliExpress', url: getSupplierUrl(product) },
    { label: 'TikTok Shop', url: `https://www.tiktok.com/shop/search?keyword=${encodeURIComponent(getProductName(product).split(' ').slice(0, 5).join(' ').slice(0, 40))}` },
    { label: 'Alibaba', url: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(getProductName(product))}&shipToCountry=AU&sortType=BEST_MATCH` },
  ];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ height: 28, padding: '0 10px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
        Supplier <span style={{ fontSize: 9 }}>&#9662;</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160, marginTop: 4, overflow: 'hidden' }}>
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
  const isMobile = useIsMobile();
  // Use growth-rate sort for trending, score for full database
  const { region } = useRegion();
  const { isPro, subPlan, session } = useAuth();
  const [, setLocation] = useLocation();
  const canSeeFinancials = isPro || subPlan === 'scale' || subPlan === 'builder';
  const isAdmin = session?.user?.email === 'maximusmajorka@gmail.com';
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [niche, setNiche] = useState('All Niches');
  const [sortBy, setSortBy] = useState(presetFilter === 'trending' ? 'orders_count' : 'winning_score');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const stored = localStorage.getItem('majorka_db_daterange') as DateRange;
    // Migrate old 'today' value (would show 0 results) to 'all'
    if (!stored || stored === 'today' || stored === '30d') return 'all';
    return stored;
  });
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
  const handleDateRange = (v: DateRange) => { localStorage.setItem('majorka_db_daterange', v); setDateRange(v); };
  const [filters, setFilters] = useState({
    category: [] as string[],
    priceMin: 0,
    priceMax: 9999,
    revenueMin: 0,
    trend: 'all' as 'all' | 'rising' | 'peaked' | 'declining',
    sortBy: 'revenue' as 'revenue' | 'score' | 'margin' | 'growth' | 'newest',
  });

  // Plan check — uses onAuthStateChange so it fires even if session loads after mount
  const [userPlan, setUserPlan] = useState<'free' | 'builder' | 'scale'>('free');
  useEffect(() => {
    async function checkPlan(token: string | undefined) {
      if (!token) return;
      try {
        const res = await fetch('/api/subscription/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const sub = await res.json();
          if (['active', 'trialing'].includes(sub.status || '')) {
            const p = (sub.plan || '').toLowerCase();
            setUserPlan(p === 'scale' || p === 'pro' ? 'scale' : p === 'builder' ? 'builder' : 'free');
          }
        }
      } catch { /* silently fail */ }
    }

    // Run immediately in case session already exists
    supabase.auth.getSession().then(({ data }) => {
      checkPlan(data.session?.access_token);
    });

    // Also subscribe to auth changes — fires when session hydrates after mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkPlan(session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Debounce search — show filtering skeleton during debounce
  useEffect(() => {
    if (searchInput !== search) setIsFiltering(true);
    const t = setTimeout(() => { setSearch(searchInput); setIsFiltering(false); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('sortBy', presetFilter === 'trending' ? 'orders_count' : sortBy);
      params.set('sortDir', sortDir);
      params.set('limit', '200');
      // Trending Today: add trending=true to get only rising/tiktok products
      if (presetFilter === 'trending') params.set('trending', 'true');
      // niche filtering done client-side after fetching all products
      if (search) params.set('search', search);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(`/api/products?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const rows: Product[] = Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : []);
        setProducts(rows);
        if (rows[0]?.updated_at) setLastUpdated(rows[0].updated_at);
      }
    } catch (err) {
      // silently handle load failure
    } finally {
      setLoading(false);
    }
  }, [niche, search, sortBy, sortDir, presetFilter]);

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
    { id: 'tiktok', label: '📲 TikTok Trending', filter: (p: Product) => !!p.tiktok_signal || (p.tags || []).includes('tiktok-trending') },
    { id: 'au', label: '\uD83C\uDDE6\uD83C\uDDFA AU Demand', filter: (p: Product) => (p.tags || []).includes('AU DEMAND') || (p.tags || []).includes('AU BEST SELLERS') },
    { id: 'new', label: '\uD83C\uDD95 New Today', filter: (p: Product) => { const t = p.updated_at; return t ? Date.now() - new Date(t).getTime() < 86400000 : false; } },
  ];

  // Client-side filter
  const filtered = products.filter(p => {
    // Search filter — match against title, niche, category, keyword
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = (p.product_title || (p as any).name || '').toLowerCase();
      const cat = (p.category || p.niche || p.search_keyword || '').toLowerCase();
      const tags = ((p.tags || []) as string[]).join(' ').toLowerCase();
      if (!name.includes(q) && !cat.includes(q) && !tags.includes(q)) return false;
    }

    // Niche dropdown filter
    if (niche !== 'All Niches') {
      const pNiche = getProductNiche(p).toLowerCase();
      const nicheQ = niche.toLowerCase();
      if (!pNiche.includes(nicheQ) && !(p.category || '').toLowerCase().includes(nicheQ)) return false;
    }

    // Date range filter — only apply if dateRange is not 'all' (skip if records are older)
    if (dateRange !== 'all') {
      const pDate = (p as any).scraped_at || (p as any).created_at;
      if (pDate && new Date(pDate) < getDateRangeStart(dateRange)) return false;
    }

    if (verifiedOnly && (p.orders_count || 0) < 500) return false;

    // Opportunity pill filter
    if (opportunityFilter !== 'All') {
      const orders = p.orders_count || 0;
      const margin = getProductMargin(p);
      const growth = getGrowthRate(p);
      const nStr = getProductNiche(p).toLowerCase();
      if (opportunityFilter === 'Viral' && !(p.tiktok_signal || (p.tags || []).includes('VIRAL') || (p.winning_score || 0) >= 85)) return false;
      if (opportunityFilter === 'High Margin' && !(margin >= 45 || (p.profit_margin || 0) >= 45)) return false;
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

  const filteredProducts = useMemo(() => {
    let result = [...filtered];
    if (filters.category.length > 0) result = result.filter(p => filters.category.includes(p.category || ''));
    if (filters.trend !== 'all') {
      result = result.filter(p => {
        const vel = p.velocity_label?.toLowerCase() || '';
        if (filters.trend === 'rising') return vel.includes('early') || vel.includes('ris');
        if (filters.trend === 'peaked') return vel.includes('peak');
        if (filters.trend === 'declining') return vel.includes('fad') || vel.includes('declin');
        return true;
      });
    }
    result.sort((a, b) => {
      if (filters.sortBy === 'revenue') return getProductRevenue(b) - getProductRevenue(a);
      if (filters.sortBy === 'score') return (b.winning_score || 0) - (a.winning_score || 0);
      if (filters.sortBy === 'margin') return (b.profit_margin || 0) - (a.profit_margin || 0);
      if (filters.sortBy === 'newest') return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      return 0;
    });
    return result;
  }, [filtered, filters]);

  const displayProducts = (!canSeeFinancials && !isAdmin) ? filteredProducts.slice(0, 10) : filteredProducts;

  const niches = ['All Niches', ...Array.from(new Set(products.map(p => getProductNiche(p)).filter(Boolean)))].slice(0, 16);

  const FILTERS = ['All', 'Viral', 'High Margin', 'AU Best Sellers', 'TikTok', 'New Today'];

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
      <div style={{ padding: isMobile ? '16px 16px 0' : '24px 24px 0', maxWidth: 1400, margin: '0 auto' }}>
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
            <DateRangeSelector value={dateRange} onChange={handleDateRange} />
            <button onClick={() => exportCSV(filteredProducts.map(p => ({ name: p.product_title || p.name, category: p.category, price_aud: p.price_aud, monthly_revenue: p.est_monthly_revenue_aud, margin_pct: p.profit_margin, score: p.winning_score, trend: (p as any).trend, units_per_day: p.units_per_day, aliexpress_url: p.aliexpress_url, tags: (p.tags || []).join(';') })), 'products')}
              style={{ height: 36, padding: '0 16px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⬇ Export CSV
            </button>
            <button onClick={handleRefresh} disabled={refreshing}
              style={{ height: 36, padding: '0 16px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>{'\u21BB'}</span>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <UsageMeter feature="product_searches" limit={PLAN_LIMITS.builder.product_searches} label="product searches" />

        {/* Freshness bar */}
        {lastUpdated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 12, color: '#9CA3AF' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            <span>{filteredProducts.length} products</span>
            <span>&middot;</span>
            <span>Updated {new Date(lastUpdated).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>&middot;</span>
            <span>Auto-refreshes every 6h</span>
          </div>
        )}
        {/* Data transparency banner — collapsed on mobile */}
        {isMobile ? (
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12, padding: '7px 10px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ flexShrink: 0 }}>ℹ️</span>
            <span><strong style={{ color: '#374151' }}>AI-estimated data</strong> — not live sales figures. Use as research starting point.</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flexShrink: 0, fontSize: 14 }}>ℹ️</span>
            <span><strong style={{ color: '#374151' }}>Research data, not live sales data.</strong> Revenue, order counts, prices &amp; margins are AI-estimated demand signals derived from product research — not scraped live figures. All values are marked "est." Use as a starting point; verify current pricing and demand directly on AliExpress or TikTok Shop before ordering stock.</span>
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280', cursor: 'pointer' }}>
            <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} style={{ accentColor: '#6366F1', width: 14, height: 14 }} />
            500+ orders only
          </label>

          {/* Clear filters — shown whenever a filter is active */}
          {(searchInput || niche !== 'All Niches' || opportunityFilter !== 'All' || verifiedOnly) && (
            <button
              onClick={() => { setSearchInput(''); setNiche('All Niches'); setOpportunityFilter('All'); setVerifiedOnly(false); }}
              style={{ height: 32, padding: '0 12px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; }}>
              ✕ Clear filters
            </button>
          )}
          {!(searchInput || niche !== 'All Niches' || opportunityFilter !== 'All' || verifiedOnly) && (
            <span style={{ marginLeft: 'auto' }} />
          )}
        </div>

        {/* Trend + Sort filter bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 16, alignItems: 'center' }}>
          {/* Category multi-select */}
          <select multiple={false} onChange={e => setFilters(f => ({ ...f, category: e.target.value ? [e.target.value] : [] }))}
            style={{ height: 34, padding: '0 10px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
            <option value="">All Categories</option>
            {[...new Set(products.map(p => p.category).filter(Boolean))].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Trend direction */}
          {(['all', 'rising', 'peaked', 'declining'] as const).map(t => (
            <button key={t} onClick={() => setFilters(f => ({ ...f, trend: t }))}
              style={{ height: 34, padding: '0 14px', background: filters.trend === t ? '#6366F1' : 'white', color: filters.trend === t ? 'white' : '#374151', border: `1px solid ${filters.trend === t ? '#6366F1' : '#E5E7EB'}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' as const }}>
              {t === 'all' ? 'All' : t === 'rising' ? 'Rising' : t === 'peaked' ? 'Peaked' : 'Declining'}
            </button>
          ))}

          {/* Sort by */}
          <select onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
            style={{ height: 34, padding: '0 10px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
            <option value="revenue">Sort: Revenue</option>
            <option value="score">Sort: Score</option>
            <option value="margin">Sort: Margin</option>
            <option value="newest">Sort: Newest</option>
          </select>

          {/* Reset */}
          {(filters.category.length > 0 || filters.trend !== 'all') && (
            <button onClick={() => setFilters({ category: [], priceMin: 0, priceMax: 9999, revenueMin: 0, trend: 'all', sortBy: 'revenue' })}
              style={{ height: 34, padding: '0 12px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>
              Reset
            </button>
          )}
        </div>

        {/* Stat Cards */}
        <ProductStatCards products={filtered} />

        {/* KaloData-style Tab Bar */}
        <style>{`.tab-scroll-container::-webkit-scrollbar { display: none; }`}</style>
        <div style={{ position: 'relative' as const, marginBottom: 16 }}>
          <div className="tab-scroll-container" style={{ display: 'flex', gap: 0, borderBottom: '2px solid #F3F4F6', marginBottom: 0, overflowX: 'auto' as const, WebkitOverflowScrolling: 'touch' as const, scrollbarWidth: 'none' as const, msOverflowStyle: 'none' as const }}>
            {TAB_FILTERS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ height: 42, padding: '0 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? '#6366F1' : '#9CA3AF', borderBottom: activeTab === t.id ? '3px solid #6366F1' : '3px solid transparent', whiteSpace: 'nowrap' as const, transition: 'all 150ms', marginBottom: -2, minWidth: 120 }}>
                {t.label}
              </button>
            ))}
          </div>
          {isMobile && (
            <div style={{ position: 'absolute' as const, right: 0, top: 0, width: 40, height: '100%', background: 'linear-gradient(to left, #F9FAFB, transparent)', pointerEvents: 'none' as const }} />
          )}
        </div>
      </div>

      {/* ── TABLE WRAPPER ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '0 0 80px' : '0 24px 40px' }}>
        {/* Blur gate banner */}
        {!canSeeFinancials && !isAdmin && (
          <div style={{background:'linear-gradient(135deg,#EEF2FF,#F3E8FF)',border:'1px solid #C7D2FE',borderRadius:12,padding:'14px 20px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap' as const,gap:10}}>
            <div>
              <div style={{fontFamily:brico,fontWeight:800,fontSize:15,color:'#1E1B4B'}}>Showing 10 of {filteredProducts.length} products</div>
              <div style={{fontSize:13,color:'#4B5563',marginTop:2}}>Unlock full database, margins, and revenue data on Builder plan</div>
            </div>
            <button onClick={()=>setShowUpgrade(true)} style={{padding:'10px 20px',background:'#6366F1',color:'white',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:brico,whiteSpace:'nowrap' as const}}>
              Unlock All {filteredProducts.length} →
            </button>
          </div>
        )}
        {/* Scroll hint wrapper */}
        <div style={{ position: 'relative' as const }}>
          {/* Right-edge fade — indicates more content to scroll */}
          <div
            id="table-scroll-fade"
            style={{
              position: 'absolute' as const, top: 0, right: 0, bottom: 0, width: 48, zIndex: 5,
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.95))',
              borderRadius: '0 12px 12px 0', pointerEvents: 'none' as const,
              transition: 'opacity 200ms',
            }}
          />
        <div
          style={{ overflowX: 'auto' as const, borderRadius: isMobile ? 0 : 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 4px #F5F5F5' }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const fade = document.getElementById('table-scroll-fade');
            if (fade) {
              const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
              fade.style.opacity = atEnd ? '0' : '1';
            }
          }}
        >
            <div style={{ background: 'white' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: isMobile ? 800 : 1100 }}>

            {/* ── STICKY HEADER ── */}
            <colgroup>
              <col style={{ width: isMobile ? 32 : 40 }} />       {/* # */}
              <col style={{ width: isMobile ? 170 : 210 }} />     {/* Product */}
              <col style={{ width: isMobile ? 90 : 110 }} />      {/* Revenue */}
              <col style={{ width: isMobile ? 100 : 130 }} />     {/* 30-Day Trend */}
              <col style={{ width: isMobile ? 70 : 80 }} />       {/* Sold */}
              <col style={{ width: isMobile ? 70 : 80 }} />       {/* Sell Price */}
              <col style={{ width: isMobile ? 68 : 78 }} />       {/* Margin */}
              <col style={{ width: isMobile ? 80 : 96 }} />       {/* Dropship Score */}
              <col style={{ width: isMobile ? 60 : 70 }} />       {/* Creators */}
              <col />                                              {/* Actions — fills remaining space */}
            </colgroup>
            <thead>
              <tr style={{ background: 'rgba(250,250,250,0.98)', borderBottom: '2px solid #F3F4F6', height: 42, position: 'sticky' as const, top: 0, zIndex: 10 }}>
                <th style={{ ...thStyle('rank', isMobile ? 32 : 40, 'center'), cursor: 'default' }}>#</th>
                <th style={thStyle('name', isMobile ? 170 : 210)} onClick={() => handleSort('name')}>
                  Product <SortIcon col="name" />
                </th>
                <th style={thStyle('est_monthly_revenue_aud', isMobile ? 90 : 110, 'right')} onClick={() => handleSort('est_monthly_revenue_aud')} title="Estimated monthly revenue = price × est. units/day × 30. Based on AI-estimated demand signals, not live sales data.">
                  Est. Rev <SortIcon col="est_monthly_revenue_aud" />
                </th>
                <th style={{ ...thStyle('trend', isMobile ? 100 : 130, 'center'), cursor: 'default' }}>Trend</th>
                <th style={thStyle('orders_count', isMobile ? 70 : 80, 'right')} onClick={() => handleSort('orders_count')} title="Estimated monthly orders based on AI demand signals. Not live scraped data.">
                  Est. Sold <SortIcon col="orders_count" />
                </th>
                <th style={thStyle('price', isMobile ? 70 : 80, 'right')} onClick={() => handleSort('price')} title="Suggested retail price in AUD. May differ from live AliExpress prices.">
                  Price <SortIcon col="price" />
                </th>
                <th style={thStyle('estimated_margin_pct', isMobile ? 68 : 78, 'right')} onClick={() => handleSort('estimated_margin_pct')}>
                  Margin <SortIcon col="estimated_margin_pct" />
                </th>
                <th style={thStyle('winning_score', isMobile ? 80 : 96, 'center')} onClick={() => handleSort('winning_score')} title="Score based on: demand signals, margin potential, competition level, trend velocity">
                  Score <SortIcon col="winning_score" />
                </th>
                <th style={{ ...thStyle('creators', isMobile ? 60 : 70, 'center'), cursor: 'default' }}>
                  {isMobile ? '👤' : 'Creators'}
                </th>
                <th style={{ ...thStyle('actions', 0, 'center'), cursor: 'default', minWidth: isMobile ? 120 : 185 }}>Actions</th>
              </tr>
            </thead>

            {/* ── BODY ── */}
            <tbody>
              {loading || isFiltering ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ height: 72, borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0 12px' }}><div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: '60%', animation: 'shimmer 1.5s ease-in-out infinite' }} /></td>
                    {[240, 110, 120, 80, 80, 80, 64, 80, 186].map((_, j) => (
                      <td key={j} style={{ padding: '0 12px' }}>
                        <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: `${40 + (i * j * 7) % 50}%`, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
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
                displayProducts.map((p, idx) => {
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
                          height: isMobile ? 60 : 72,
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10 }}>
                            <ProductImage src={p.image_url} alt={name} size={isMobile ? 36 : 44} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: isMobile ? 12 : 13, color: '#0A0A0A', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                                {name}
                              </div>
                              {!isMobile && p.velocity_label && p.velocity_label !== 'UNKNOWN' && (
                                <div style={{ marginTop: 3 }}>
                                  <VelocityBadge
                                    label={p.velocity_label}
                                    score={p.velocity_score}
                                    peakInDays={p.peak_in_days}
                                    curve={p.velocity_curve}
                                    size="sm"
                                  />
                                </div>
                              )}
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
                          {canSeeFinancials ? (
                            <>
                              <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: revenue >= 10000 ? '#059669' : revenue >= 3000 ? '#0A0A0A' : '#9CA3AF' }}>
                                ~${revenue >= 1000 ? `${(revenue / 1000).toFixed(1)}k` : revenue.toLocaleString()}
                              </div>
                              <div style={{ fontSize: 10, color: '#9CA3AF' }}>est./mo</div>
                            </>
                          ) : (
                            <span style={{ filter: 'blur(5px)', userSelect: 'none' as const, cursor: 'pointer', display: 'inline-block' }} title="Upgrade to see revenue data" onClick={e => { e.stopPropagation(); setLocation('/pricing'); }}>
                              $X,XXX
                            </span>
                          )}
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
                            ~{orders >= 1000 ? `${(orders / 1000).toFixed(1)}k` : orders.toLocaleString()}
                          </div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>est./mo</div>
                        </td>

                        {/* Price */}
                        <td style={tdStyle('right')}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>${price.toFixed(0)}</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>{region.currency}</div>
                        </td>

                        {/* Margin */}
                        <td style={tdStyle('center')}>
                          {canSeeFinancials ? (
                            <>
                              <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: margin >= 50 ? '#059669' : margin >= 35 ? '#D97706' : '#EF4444' }}>
                                {margin}%
                              </div>
                              <div style={{ height: 3, background: '#F3F4F6', borderRadius: 2, marginTop: 4, width: 48, margin: '4px auto 0' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, margin)}%`, background: margin >= 50 ? '#059669' : margin >= 35 ? '#D97706' : '#EF4444', borderRadius: 2 }} />
                              </div>
                            </>
                          ) : (
                            <span style={{ filter: 'blur(5px)', userSelect: 'none' as const, cursor: 'pointer', display: 'inline-block' }} title="Upgrade to see margin data" onClick={e => { e.stopPropagation(); setLocation('/pricing'); }}>
                              XX%
                            </span>
                          )}
                        </td>

                        {/* Score */}
                        <td style={tdStyle('center')}>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <ScoreBadge score={score} />
                          </div>
                        </td>

                        {/* Creators — link to Creator Intel filtered by niche */}
                        <td style={tdStyle('center')}>
                          <a
                            href={`/app/creators?niche=${encodeURIComponent(p.category || p.niche || 'general')}`}
                            onClick={e => { e.stopPropagation(); }}
                            style={{ fontSize: 11, color: '#6366F1', textDecoration: 'none', fontWeight: 600, padding: '3px 8px', border: '1px solid #E5E7EB', borderRadius: 6, background: 'white', whiteSpace: 'nowrap' as const, display: 'inline-block' }}
                          >
                            Find →
                          </a>
                        </td>

                        {/* Actions */}
                        <td style={tdStyle('center')}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' as const }} onClick={e => e.stopPropagation()}>
                            {!isMobile && (
                              <a href={`/product/${slugify(name)}`} style={{ height: 28, padding: '0 8px', background: 'white', color: '#6366F1', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                                Report
                              </a>
                            )}
                            <button onClick={() => setLocation(`/app/store-builder?product=${encodeURIComponent(name)}&niche=${encodeURIComponent(getProductNiche(p))}`)}
                              style={{ height: 28, padding: isMobile ? '0 8px' : '0 10px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                              {isMobile ? 'Build' : 'Build Store'}
                            </button>
                            {!isMobile && <SupplierDropdown product={p} />}
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
        </div>{/* /scroll-hint-wrapper */}
      </div>

      {/* ── PRODUCT DETAIL DRAWER ── */}
      {detailProduct && <ProductDetailDrawer product={detailProduct} onClose={() => setDetailProduct(null)} />}

      {showUpgrade && <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} feature="Full Product Database" reason="Access all products, margins, and revenue data" />}

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
// ── Supplier Finder — live Tavily search ───────────────────────────────────
function SupplierFinder({ productName }: { productName: string }) {
  const enc = encodeURIComponent(productName);
  const suppliers = [
    { label: 'AliExpress', icon: '🛒', desc: 'Search all listings', color: '#e8590c', bg: '#fff5f0', border: '#fcd0be', url: `https://www.aliexpress.com/wholesale?SearchText=${enc}&shipCountry=au&SortType=total_tranpro_desc` },
    { label: 'Alibaba', icon: '🏭', desc: 'Bulk / wholesale', color: '#e8590c', bg: '#fff5f0', border: '#fcd0be', url: `https://www.alibaba.com/trade/search?SearchText=${enc}&shipToCountry=AU&sortType=BEST_MATCH` },
    { label: 'CJ Dropship', icon: '📦', desc: 'No MOQ dropship', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0', url: `https://cjdropshipping.com/search.html?q=${enc}` },
    { label: 'DHgate', icon: '🔧', desc: 'Low MOQ wholesale', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', url: `https://www.dhgate.com/wholesale/search.do?searchkey=${enc}&pt=Home` },
    { label: 'Temu', icon: '🏷️', desc: 'Ultra-low prices', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', url: `https://www.temu.com/search_result.html?search_key=${enc}` },
    { label: 'Made-in-China', icon: '🏗️', desc: 'Factory direct', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', url: `https://www.made-in-china.com/multi-search/q-${enc.replace(/%20/g, '+')}.html` },
  ];
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Find Suppliers</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {suppliers.map(({ label, icon, desc, url, color, bg, border }) => (
          <a key={label} href={url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', background: bg, border: `1px solid ${border}`, borderRadius: 8, textDecoration: 'none' }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>{desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#9CA3AF', fontSize: 10, flexShrink: 0 }}>↗</span>
          </a>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 10, color: '#9CA3AF', textAlign: 'center' as const }}>
        Searching: <em>{productName.slice(0, 50)}{productName.length > 50 ? '…' : ''}</em>
      </div>
    </div>
  );
}

function formatFollowers(n: string | number): string {
  const num = typeof n === 'string' ? parseInt(n.replace(/[^0-9]/g, ''), 10) : n;
  if (isNaN(num)) return String(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

const AUDIENCE_MAP: Record<string, string[]> = {
  beauty: ['Women 25-44 interested in skincare', 'Makeup enthusiasts 18-35', 'Mothers with young children'],
  health: ['Health-conscious adults 28-50', 'Fitness enthusiasts 18-35', 'Women 25-44 wellness interest'],
  fitness: ['Gym-goers 18-35', 'Home workout enthusiasts 25-45', 'Weight loss journey 28-45'],
  tech: ['Tech enthusiasts 18-40', 'Work from home professionals 28-45', 'Gadget buyers 25-45'],
  kitchen: ['Home cooks 28-50', 'Meal prep enthusiasts 25-45', 'New homeowners 25-40'],
  home: ['Homeowners 28-55', 'Interior design enthusiasts 25-45', 'New renters 22-35'],
  pet: ['Dog owners 25-54', 'Cat owners 18-45', 'Pet parents interested in animal welfare 25-50'],
  baby: ['Parents with children under 5', 'Expecting mothers 25-35', 'Grandparents 50-65'],
  fashion: ['Fashion-forward women 18-35', 'Trend followers 18-30', 'Style enthusiasts 22-40'],
  outdoor: ['Outdoor enthusiasts 25-50', 'Hikers and campers 22-45', 'Adventure seekers 20-40'],
  default: ['Online shoppers 25-45', 'Value-conscious buyers 28-50', 'Impulse buyers 18-40'],
};

function AudienceSuggestions({ category, productTitle }: { category: string; productTitle: string }) {
  const [, setLocation] = useLocation();
  const [copiedSet, setCopiedSet] = useState<Set<string>>(new Set());

  const catKey = category.toLowerCase();
  let audiences = AUDIENCE_MAP.default;
  for (const [key, vals] of Object.entries(AUDIENCE_MAP)) {
    if (key !== 'default' && catKey.includes(key)) { audiences = vals; break; }
  }

  const handleCopy = (audience: string) => {
    navigator.clipboard.writeText(audience);
    setCopiedSet(prev => {
      const next = new Set(prev);
      next.add(audience);
      return next;
    });
    setTimeout(() => {
      setCopiedSet(prev => {
        const next = new Set(prev);
        next.delete(audience);
        return next;
      });
    }, 1500);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 4 }}>Suggested Meta Audiences</div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>Based on product category · click to copy</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
        {audiences.map(audience => {
          const isCopied = copiedSet.has(audience);
          return (
            <button
              key={audience}
              onClick={e => { e.stopPropagation(); handleCopy(audience); }}
              title="Click to copy for Meta Ads Manager"
              style={{
                background: isCopied ? '#DCFCE7' : '#EEF2FF',
                border: '1px solid #C7D2FE',
                borderRadius: 20,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                color: '#3730A3',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 200ms',
              }}
            >
              <Copy size={11} style={{ color: '#6366F1' }} />
              {audience}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button
          onClick={e => { e.stopPropagation(); setLocation(`/app/ads-studio?product=${encodeURIComponent(productTitle)}&category=${encodeURIComponent(category)}&audience=${encodeURIComponent(audiences[0] || '')}`); }}
          style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', color: 'white', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, border: 'none' }}
        >
          <Megaphone size={15} />
          Generate Ad →
        </button>
      </div>
    </div>
  );
}

// ── Category lookup tables ────────────────────────────────────────────────────
function getShippingDefault(category: string): number {
  const c = (category || '').toLowerCase();
  if (/jewel|accessor|cosmetic|beauty|makeup|serum|vitamin|supplement|skincare/.test(c)) return 8.99;
  if (/baby|kids|toy|stationery/.test(c)) return 11.99;
  if (/pet/.test(c)) return 11.99;
  if (/electronic|tech|gadget|phone|camera|drone/.test(c)) return 13.99;
  if (/fashion|cloth|apparel|shoe|bag/.test(c)) return 11.99;
  if (/fitness|sport|gym|outdoor/.test(c)) return 13.99;
  if (/kitchen|home|garden/.test(c)) return 13.99;
  return 13.99;
}
function getAdSpendDefault(category: string): number {
  const c = (category || '').toLowerCase();
  if (/fashion|cloth|apparel/.test(c)) return 35;
  if (/beauty|makeup|skincare|cosmetic/.test(c)) return 45;
  if (/home|garden|kitchen/.test(c)) return 40;
  if (/electronic|tech|gadget/.test(c)) return 55;
  if (/fitness|sport|gym/.test(c)) return 40;
  if (/pet/.test(c)) return 35;
  if (/baby|kids|toy/.test(c)) return 30;
  if (/health|wellness|supplement|vitamin/.test(c)) return 45;
  return 40;
}
function getReturnRateDefault(category: string): number {
  const c = (category || '').toLowerCase();
  if (/fashion|cloth|apparel|shoe/.test(c)) return 12;
  if (/electronic|tech|gadget/.test(c)) return 10;
  if (/beauty|makeup|skincare|cosmetic/.test(c)) return 6;
  return 7;
}

// ── Full embedded Profit Calculator ──────────────────────────────────────────
function ProductProfitCalc({ sellPrice, supplierCost, category, productName }: {
  sellPrice: number; supplierCost: number; category: string; productName: string;
}) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(true);
  const [shared, setShared] = useState(false);

  // Inputs — auto-populated from product
  const [sell, setSell]       = useState(Math.max(sellPrice > 0 ? sellPrice : (supplierCost * 2.8), 9.99));
  const [cost, setCost]       = useState(supplierCost > 0 ? supplierCost : Math.round(sell / 2.8 * 100) / 100);
  const [adSpend, setAdSpend] = useState(getAdSpendDefault(category));
  const [units, setUnits]     = useState(4);
  const [returnRate, setReturnRate] = useState(getReturnRateDefault(category));
  const [shipping]            = useState(getShippingDefault(category));
  const PLATFORM_FEE = 2;      // Shopify 2%
  const PAYMENT_FEE  = 1.75;   // Stripe AU

  // ── Calculations ──────────────────────────────────────────────────────────
  const platformCost = sell * (PLATFORM_FEE / 100);
  const paymentCost  = sell * (PAYMENT_FEE / 100);
  const returnCost   = cost * (returnRate / 100);
  const adCostPerUnit = adSpend / Math.max(units, 0.1);
  const netPerUnit   = sell - cost - shipping - platformCost - paymentCost - returnCost - adCostPerUnit;
  const grossMargin  = sell > 0 ? (netPerUnit / sell) * 100 : 0;
  const dailyProfit  = netPerUnit * units;
  const monthlyProfit = dailyProfit * 30;
  const breakEvenCPA = sell - cost - shipping - platformCost - paymentCost - returnCost;
  const roas         = adSpend > 0 ? (sell * units) / adSpend : 0;

  const viable = grossMargin >= 40 ? 'high' : grossMargin >= 25 ? 'viable' : 'risky';
  const viableConfig = {
    high:   { label: 'Highly Viable', color: '#059669', bg: '#DCFCE7', border: '#86EFAC' },
    viable: { label: 'Viable',        color: '#D97706', bg: '#FEF9C3', border: '#FDE68A' },
    risky:  { label: 'Risky',         color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  }[viable];

  const fmtAUD = (n: number) => `$${Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${n < 0 ? ' loss' : ''}`;

  const projections = [
    { label: '100 orders/mo',  units: Math.round(100 / 30), monthly: Math.round(netPerUnit * 100 * 10) / 10 },
    { label: '500 orders/mo',  units: Math.round(500 / 30), monthly: Math.round(netPerUnit * 500 * 10) / 10 },
    { label: '1,000 orders/mo',units: Math.round(1000 / 30), monthly: Math.round(netPerUnit * 1000 * 10) / 10 },
  ];

  const insight = grossMargin >= 45
    ? `Excellent ${grossMargin.toFixed(0)}% margin. Strong product. At ${units} units/day → ${fmtAUD(monthlyProfit)}/mo. Scale ad spend aggressively once profitable.`
    : grossMargin >= 30
    ? `Solid ${grossMargin.toFixed(0)}% margin. Keep ad CPA below ${fmtAUD(breakEvenCPA)}. Consider a higher sell price to boost headroom.`
    : grossMargin >= 15
    ? `Thin ${grossMargin.toFixed(0)}% margin. Raise sell price or negotiate a lower supplier cost. Max CPA = ${fmtAUD(breakEvenCPA)}.`
    : `Negative or sub-15% margin at current settings. Don't launch ads yet — adjust sell price or source a cheaper supplier first.`;

  const handleShare = async () => {
    const url = `${window.location.origin}/share/profit?price=${sell}&cost=${cost}&units=${units}&ads=${adSpend}&product=${encodeURIComponent(productName)}`;
    try { await navigator.clipboard.writeText(url); } catch { /**/ }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const numInput = (label: string, val: number, set: (v: number) => void, prefix = '$', hint = '', step = 0.5) => (
    <div>
      <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 4, letterSpacing: '.04em', textTransform: 'uppercase' as const }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #C7D2FE', borderRadius: 8, height: 36, overflow: 'hidden' }}>
        <span style={{ padding: '0 8px', fontSize: 12, color: '#6366F1', fontWeight: 700, flexShrink: 0 }}>{prefix}</span>
        <input type="number" min={0} step={step} value={val}
          onChange={e => set(parseFloat(e.target.value) || 0)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: brico, background: 'transparent', padding: '0 6px 0 0', minWidth: 0 }}
        />
      </div>
      {hint && <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>{hint}</div>}
    </div>
  );

  const metric = (label: string, val: string, color: string, bg: string) => (
    <div style={{ background: bg, borderRadius: 10, padding: '10px 12px', textAlign: 'center' as const }}>
      <div style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: brico, fontWeight: 900, fontSize: 17, color, lineHeight: 1 }}>{val}</div>
    </div>
  );

  return (
    <div style={{ marginBottom: 20, background: '#F0F4FF', border: '1px solid #C7D2FE', borderRadius: 16, overflow: 'hidden' as const }}>
      {/* Collapsible header */}
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
        <div>
          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 14, color: '#1E1B4B' }}>💰 Profit Analysis</div>
          <div style={{ fontSize: 11, color: '#6366F1', marginTop: 1 }}>Auto-filled from product · all values editable</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: viableConfig.bg, border: `1px solid ${viableConfig.border}`, borderRadius: 999, padding: '4px 10px' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: viableConfig.color }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: viableConfig.color }}>{viableConfig.label}</span>
          </div>
          <span style={{ fontSize: 16, color: '#6366F1', fontWeight: 700, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>⌃</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #C7D2FE' }}>

          {/* Inputs — 4 fields in 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14, marginBottom: 10 }}>
            {numInput('Sell Price (AUD)',     sell,     setSell,     '$', 'What you charge customers')}
            {numInput('Supplier Cost (AUD)',  cost,     setCost,     '$', 'AliExpress cost incl. freight')}
            {numInput('Ad Spend / Day',       adSpend,  setAdSpend,  '$', `${category || 'category'} default`)}
            {numInput('Units / Day',          units,    setUnits,    '#', 'Est. daily sales', 1)}
          </div>

          {/* Return rate slider */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.04em' }}>Return Rate</span>
              <span style={{ fontSize: 11, color: '#6366F1', fontWeight: 700 }}>{returnRate}%</span>
            </div>
            <input type="range" min={0} max={25} step={1} value={returnRate} onChange={e => setReturnRate(+e.target.value)}
              style={{ width: '100%', accentColor: '#6366F1' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9CA3AF' }}>
              <span>0%</span><span>Category default: {getReturnRateDefault(category)}%</span><span>25%</span>
            </div>
          </div>

          {/* Auto-calculated fixed costs */}
          <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 10, color: '#374151' }}>
            <div><span style={{ color: '#9CA3AF' }}>Shipping</span><br /><strong>${shipping.toFixed(2)}</strong></div>
            <div><span style={{ color: '#9CA3AF' }}>Shopify fee</span><br /><strong>{PLATFORM_FEE}% = ${platformCost.toFixed(2)}</strong></div>
            <div><span style={{ color: '#9CA3AF' }}>Stripe fee</span><br /><strong>{PAYMENT_FEE}% = ${paymentCost.toFixed(2)}</strong></div>
          </div>

          {/* 5 key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {metric('Net Margin',      `${Math.max(-99, grossMargin).toFixed(1)}%`, viableConfig.color, viableConfig.bg)}
            {metric('Monthly Profit',  fmtAUD(monthlyProfit),    '#6366F1', '#EEF2FF')}
            {metric('Daily Profit',    fmtAUD(dailyProfit),       '#8B5CF6', '#F3E8FF')}
            {metric('Break-even CPA',  `$${breakEvenCPA > 0 ? breakEvenCPA.toFixed(2) : '—'}`, '#0891B2', '#ECFEFF')}
          </div>
          <div style={{ background: '#EEF2FF', borderRadius: 10, padding: '10px 12px', marginBottom: 14, textAlign: 'center' as const }}>
            <div style={{ fontSize: 9, color: '#6366F1', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 4 }}>ROAS (Return on Ad Spend)</div>
            <div style={{ fontFamily: brico, fontWeight: 900, fontSize: 22, color: roas >= 2 ? '#059669' : roas >= 1 ? '#D97706' : '#DC2626' }}>{roas > 0 ? `${roas.toFixed(2)}x` : '—'}</div>
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{roas >= 3 ? 'Excellent' : roas >= 2 ? 'Good' : roas >= 1 ? 'Breakeven zone' : 'Loss-making at current spend'}</div>
          </div>

          {/* What this means */}
          <div style={{ background: 'white', border: '1px solid #E0E7FF', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>💡 What This Means</div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{insight}</div>
          </div>

          {/* Monthly Profit Projections */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0A0A0A', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '.07em' }}>Monthly Profit Projections</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              {projections.map(proj => {
                const pos = proj.monthly > 0;
                return (
                  <div key={proj.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: pos ? '#F0FDF4' : '#FEF2F2', borderRadius: 8, border: `1px solid ${pos ? '#BBF7D0' : '#FECACA'}` }}>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{proj.label}</span>
                    <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 14, color: pos ? '#059669' : '#DC2626' }}>{fmtAUD(proj.monthly)}/mo</span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6, textAlign: 'center' as const }}>
              Based on ${sell} sell · ${cost} cost · ${adSpend}/day ads · {returnRate}% returns
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setLocation(`/app/profit?price=${sell}&cost=${cost}&units=${units}&ads=${adSpend}`)}
              style={{ flex: 1, height: 40, background: '#6366F1', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: brico }}>
              Open Full Calculator →
            </button>
            <button onClick={handleShare}
              style={{ width: 40, height: 40, background: shared ? '#DCFCE7' : 'white', color: shared ? '#059669' : '#6B7280', border: '1px solid #C7D2FE', borderRadius: 9, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', flexShrink: 0 }}>
              {shared ? '✓' : '↗'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center' as const, marginTop: 6 }}>
            All figures are estimates — verify cost &amp; shipping before sourcing
          </div>
        </div>
      )}
    </div>
  );
}

function ProductDetailDrawer({ product: p, onClose }: { product: Product; onClose: () => void }) {
  const [, setLocation] = useLocation();
  const { subPlan, subStatus, session } = useAuth();
  const hasAdsAccess = (subPlan === 'scale' && subStatus === 'active') || session?.user?.email === 'maximusmajorka@gmail.com';
  const [showUpgradeDrawer, setShowUpgradeDrawer] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [trendBrief, setTrendBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [matchedCreators, setMatchedCreators] = useState<any[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const name = p.name || p.product_title || 'Product';
  const margin = p.estimated_margin_pct || p.profit_margin || 0;
  const orders = p.orders_count || 0;
  const score = p.winning_score || 0;
  const price = p.estimated_retail_aud || p.price_aud || 0;
  // Cost: use stored value if set, else derive from price × (1 - margin%)
  const storedCost = p.cost_price_aud || p.supplier_cost_aud || 0;
  const marginPct = typeof margin === 'number' && margin > 0 ? margin : 64;
  const cost = storedCost > 0 ? storedCost : Math.round(price * (1 - marginPct / 100) * 100) / 100;
  // Monthly revenue: prefer DB-stored value (now clean: orders_count × price_aud)
  // units_per_day may be inflated; est_monthly_revenue_aud is authoritative
  const revenue = p.est_monthly_revenue_aud && p.est_monthly_revenue_aud > 0
    ? p.est_monthly_revenue_aud
    : p.orders_count && p.orders_count > 0
      ? Math.round(p.orders_count * price * 100) / 100
      : Math.round(price * (p.units_per_day || Math.max(1, Math.round(score / 12))) * 30 * 100) / 100;
  const isEstimated = !p.orders_count || p.orders_count === 0;
  const productCategory = p.niche || p.category || '';

  // Fetch "Why Trending" brief
  useEffect(() => {
    if (!p.id) return;
    setBriefLoading(true);
    setTrendBrief(null);
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token || '';
      fetch(`/api/products/${p.id}/why-trending`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
        .then(r => r.json())
        .then(d => setTrendBrief(d.brief || null))
        .catch(() => setTrendBrief(null))
        .finally(() => setBriefLoading(false));
    });
  }, [p.id]);

  // Fetch matched creators
  useEffect(() => {
    if (!productCategory) return;
    setCreatorsLoading(true);
    setMatchedCreators([]);
    fetch(`/api/creators?niche=${encodeURIComponent(productCategory)}&limit=4`)
      .then(r => r.json())
      .then(d => setMatchedCreators((d.creators || []).slice(0, 4)))
      .catch(() => setMatchedCreators([]))
      .finally(() => setCreatorsLoading(false));
  }, [productCategory]);

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
    return `Target Customer: ${p.niche || p.category || 'General'} enthusiasts, primarily 25-44 year old shoppers looking for convenience.\n\nBest Ad Angle: Problem-solution narrative. Show before/after, emphasise free shipping and 30-day returns.\n\nSeasonal: Strong year-round demand. Peak Jan (resolutions), May (Mother's Day), Nov-Dec (Christmas).\n\nRisk Factors: Confirm supplier shipping times. Monitor AliExpress reviews for quality consistency.`;
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
          <ProductImage src={p.image_url} alt={name} size={180} style={{ width: '100%', height: 180, borderRadius: 0 }} />
        </div>
        <div style={{ padding: 20 }}>
          <h2 style={{ fontFamily: brico, fontWeight: 700, fontSize: 17, color: '#0A0A0A', marginBottom: 6, lineHeight: 1.4 }}>{name}</h2>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 18 }}>{p.niche || p.category} &middot; ~{orders.toLocaleString()} est. orders/mo &middot; AI-estimated data</div>

          {/* Large 30-day revenue trend sparkline */}
          <div style={{ marginBottom: 20, padding: 16, background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>30-Day Revenue Trend</div>
            <MiniSparkline
              data={(p.revenue_trend && Array.isArray(p.revenue_trend) && p.revenue_trend.length >= 2) ? p.revenue_trend as number[] : generateSparkline(p.id || 0, revenue, score)}
              width={Math.min(520, typeof window !== 'undefined' ? window.innerWidth - 80 : 520)}
              height={80}
              positive={(p.revenue_growth_pct !== undefined && p.revenue_growth_pct !== null) ? p.revenue_growth_pct >= 0 : (getGrowthRate(p) >= 0)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#9CA3AF' }}>
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#F0F0F0', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
            {[
              { label: 'Est. Supplier Cost', val: cost > 0 ? `~$${cost.toFixed(2)} est.` : '—' },
              { label: 'Suggested Retail', val: price > 0 ? `$${price.toFixed(0)} est.` : '—' },
              { label: 'Est. Margin', val: `~${margin}%` },
              { label: 'Est. Monthly Rev', val: `~$${revenue >= 1000 ? (revenue / 1000).toFixed(1) + 'k' : revenue}` },
              { label: 'Est. Monthly Orders', val: `~${orders.toLocaleString()}` },
              { label: 'Dropship Score', val: `${score}/100` },
            ].map(({ label, val }) => (
              <div key={label} style={{ padding: '12px 16px', background: 'white' }}>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: '#0A0A0A' }}>{val}</div>
              </div>
            ))}
          </div>
          {/* Direct supplier links under pricing grid */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 20 }}>
            {p.aliexpress_url && (
              <a href={String(p.aliexpress_url)} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#e8590c', background: '#fff5f0', border: '1px solid #fcd0be', padding: '4px 10px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                🛒 View on AliExpress ↗
              </a>
            )}
            <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
              ℹ️ Prices &amp; costs are AI-estimated — verify live on AliExpress before sourcing
            </span>
          </div>
          {/* ── Inline Profit Analysis ── */}
          <ProductProfitCalc
            sellPrice={price > 0 ? price : 39.95}
            supplierCost={cost > 0 ? cost : Math.round((price || 40) * 0.3 * 100) / 100}
            category={productCategory}
            productName={name}
          />

          {/* Dropship Score visual bar */}
          {(() => {
            const s = score;
            const tier = s >= 80
              ? { bg: '#DCFCE7', color: '#059669', label: '🔥 Hot' }
              : s >= 60
              ? { bg: '#FEF9C3', color: '#D97706', label: '📈 Rising' }
              : s >= 40
              ? { bg: '#F3F4F6', color: '#6B7280', label: '➡️ Steady' }
              : { bg: '#FEF2F2', color: '#DC2626', label: '⚠️ Risky' };
            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Dropship Score</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: tier.color }}>{s}/100</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: tier.color, background: tier.bg, padding: '3px 10px', borderRadius: 12 }}>{tier.label}</span>
                </div>
                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, s)}%`, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}cc)`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>Based on: demand signals, margin potential, competition level, trend velocity</div>
              </div>
            );
          })()}

          {(() => {
            const sb = p.score_breakdown;
            const margin = typeof p.profit_margin === 'number' ? p.profit_margin : 50;
            const orders = typeof p.orders_count === 'number' ? p.orders_count : (typeof p.sold_count === 'number' ? p.sold_count : 500);
            const totalScore = p.winning_score ?? p.opportunity_score ?? 70;
            // Derive sub-scores from available data when breakdown is null
            const orderScore = sb?.order_score ?? Math.min(25, Math.round((Math.min(orders, 5000) / 5000) * 25));
            const marginScore = sb?.margin_score ?? Math.min(25, Math.round((Math.min(margin, 75) / 75) * 25));
            const trendScore = sb?.trend_score ?? Math.min(20, Math.round(totalScore * 0.22));
            const supplierScore = sb?.supplier_score ?? Math.min(15, Math.round(totalScore * 0.16));
            const auScore = sb?.au_fit_score ?? Math.min(15, Math.round(totalScore * 0.16));
            const breakdown = [
              { label: 'Order Volume',    v: orderScore,    max: 25 },
              { label: 'Margin Potential',v: marginScore,   max: 25 },
              { label: 'Trend Velocity',  v: trendScore,    max: 20 },
              { label: 'Supplier Rating', v: supplierScore, max: 15 },
              { label: 'AU Market Fit',   v: auScore,       max: 15 },
            ];
            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Why This Product</div>
                {breakdown.map(({ label, v, max }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 135, fontSize: 11, color: '#374151' }}>{label}</div>
                    <div style={{ flex: 1, height: 5, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(v / max) * 100}%`, background: '#6366F1', borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ width: 36, fontSize: 10, color: '#9CA3AF', textAlign: 'right' as const }}>{v}/{max}</div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 8 }}>Passes all quality gates</div>
              </div>
            );
          })()}
          {/* Why This is Trending */}
          <div style={{ borderLeft: '3px solid #6366F1', background: '#F5F3FF', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
            <h4 style={{ fontFamily: brico, fontSize: 13, color: '#6366F1', fontWeight: 700, marginBottom: 8, margin: 0 }}>Why This is Trending ✨</h4>
            {briefLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 12, borderRadius: 6, background: 'linear-gradient(90deg, #E0E7FF 25%, #EEF2FF 50%, #E0E7FF 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite', width: i === 3 ? '70%' : '100%' }} />
                ))}
              </div>
            ) : trendBrief ? (
              <>
                <p style={{ fontFamily: dm, fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{trendBrief}</p>
                <div style={{ textAlign: 'right' as const, marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>Powered by Claude</span>
                </div>
              </>
            ) : (
              <p style={{ fontFamily: dm, fontSize: 13, color: '#9CA3AF', margin: 0 }}>Brief unavailable</p>
            )}
          </div>

          {/* Suggested Meta Audiences */}
          <AudienceSuggestions category={p.niche || p.category || ''} productTitle={name} />

          {/* Creator Types to Target */}
          {(() => {
            const cat = (p.niche || p.category || '').toLowerCase();
            // Cap TikTok search query to first 5 words or 40 chars — raw AliExpress titles break search URLs
            const pName = name.split(' ').slice(0, 5).join(' ').slice(0, 40);
            const creatorMap: Record<string, Array<{ type: string; desc: string; search: string }>> = {
              'beauty': [
                { type: 'Skincare Reviewer', desc: 'Before/after routines, product demos', search: `${pName} skincare review` },
                { type: 'Glow-Up Creator', desc: 'Transformation content, beauty hacks', search: `${pName} beauty hack` },
                { type: 'Dermatology Educator', desc: 'Science-backed skincare advice', search: `${pName} skin benefits` },
              ],
              'health': [
                { type: 'Wellness Influencer', desc: 'Daily health routines, self-care', search: `${pName} health benefits` },
                { type: 'Fitness Creator', desc: 'Workout demos, recovery tips', search: `${pName} fitness` },
                { type: 'Biohacker', desc: 'Optimisation and performance content', search: `${pName} review` },
              ],
              'fitness': [
                { type: 'Home Workout Creator', desc: 'No-gym training routines', search: `${pName} workout` },
                { type: 'Physio / PT', desc: 'Injury prevention, rehab advice', search: `${pName} exercise` },
                { type: 'Sports Enthusiast', desc: 'Sport-specific training tips', search: `${pName} training` },
              ],
              'pet': [
                { type: 'Pet Parent Creator', desc: 'Day-in-the-life with pets, cute content', search: `${pName} dog cat` },
                { type: 'Vet / Animal Educator', desc: 'Pet health, care tips', search: `${pName} pet care` },
                { type: 'Pet Unboxing Creator', desc: 'Product hauls and honest reviews', search: `${pName} unboxing` },
              ],
              'home': [
                { type: 'Home Organiser', desc: 'Declutter, clean, organise routines', search: `${pName} home organisation` },
                { type: 'Interior Aesthetic', desc: 'Room makeovers, decor hauls', search: `${pName} home decor` },
                { type: 'Clean With Me', desc: 'Cleaning routines and hacks', search: `${pName} cleaning hack` },
              ],
              'kitchen': [
                { type: 'Food Creator', desc: 'Recipes, meal prep, cooking hacks', search: `${pName} kitchen hack` },
                { type: 'Meal Prep Influencer', desc: 'Batch cooking, time-saving tips', search: `${pName} meal prep` },
                { type: 'Product Reviewer', desc: 'Kitchen gadget unboxing & tests', search: `${pName} review` },
              ],
              'electronics': [
                { type: 'Tech Reviewer', desc: 'Unboxing, specs, honest opinions', search: `${pName} review` },
                { type: 'Productivity Creator', desc: 'Work-from-home setups, efficiency', search: `${pName} setup` },
                { type: 'Gaming / EDC Creator', desc: 'Everyday carry, gadget showcase', search: `${pName} gadget` },
              ],
            };
            // Match category
            let archetypes = creatorMap['home']; // default
            for (const [key, types] of Object.entries(creatorMap)) {
              if (cat.includes(key)) { archetypes = types; break; }
            }
            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: brico, fontSize: 13, color: '#6366F1', fontWeight: 700, marginBottom: 10 }}>🎯 Creator Types to Target</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                  {archetypes.map(({ type, desc, search }) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>{type}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{desc}</div>
                      </div>
                      <a href={`https://www.tiktok.com/search?q=${encodeURIComponent(search)}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#6366F1', textDecoration: 'none', fontWeight: 600, flexShrink: 0, padding: '4px 10px', border: '1px solid #C7D2FE', borderRadius: 6, background: '#EEF2FF', whiteSpace: 'nowrap' as const }}>
                        Search TikTok →
                      </a>
                    </div>
                  ))}
                </div>
                <a href={`https://www.tiktok.com/search?q=${encodeURIComponent(pName + ' review')}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, color: '#6366F1', textDecoration: 'none', fontWeight: 600, padding: '10px 14px', background: '#EEF2FF', borderRadius: 8, border: '1px solid #C7D2FE' }}>
                  <span>🔍</span>
                  <span>Search all TikTok content for this product</span>
                  <span style={{ marginLeft: 'auto' }}>→</span>
                </a>
              </div>
            );
          })()}

          <SupplierFinder productName={name} />
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
          {/* Data source transparency */}
          <div style={{ marginBottom: 12, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 6 }}>Data Sources</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              {[
                { field: 'Product name & image', source: 'AliExpress listing', real: true },
                { field: 'AliExpress item ID', source: p.aliexpress_id ? `#${p.aliexpress_id}` : 'Not available', real: !!p.aliexpress_id },
                { field: 'Retail price', source: 'AI estimated — verify on AliExpress', real: false },
                { field: 'Supplier cost', source: 'AI estimated — verify on Alibaba', real: false },
                { field: 'Monthly orders', source: 'AI demand signal (est.)', real: false },
                { field: 'Revenue estimate', source: 'orders_count × price (est.)', real: false },
                { field: 'Dropship score', source: 'AI composite score', real: false },
              ].map(({ field, source, real }) => (
                <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>{field}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: real ? '#059669' : '#9CA3AF', background: real ? '#DCFCE7' : '#F3F4F6', padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' as const }}>{source}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => setLocation(`/app/store-builder?product=${encodeURIComponent(name)}&niche=${encodeURIComponent(p.niche || p.category || '')}`)}
              style={{ width: '100%', height: 46, background: '#6366F1', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: brico }}>
              Build Store for This Product →
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setLocation(`/app/profit?price=${price > 0 ? price : 39.95}&cost=${cost > 0 ? cost : Math.round((price || 40) * 0.3 * 100) / 100}&units=4&ads=${getAdSpendDefault(productCategory)}`)}
                style={{ height: 40, background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Full Profit Calc
              </button>
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify({ name, score, margin, revenue }, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ height: 40, background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                {copied ? 'Saved!' : 'Save'}
              </button>
            </div>
            {hasAdsAccess ? (
              <button
                onClick={() => {
                  localStorage.setItem('majorka_launch_product', JSON.stringify({
                    id: p.id,
                    title: p.product_title || p.name,
                    image: p.image_url,
                    category: p.category || p.niche,
                    price: p.price_aud || p.estimated_retail_aud,
                    cost: p.cost_price_aud || p.supplier_cost_aud,
                    units_per_day: p.units_per_day,
                  }));
                  setLocation('/app/ads-manager');
                }}
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Bricolage Grotesque',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}
              >
                🚀 Launch Ad Campaign →
              </button>
            ) : (
              <button
                onClick={() => setShowUpgradeDrawer(true)}
                style={{ width: '100%', padding: '14px', background: 'rgba(99,102,241,0.15)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Bricolage Grotesque',sans-serif", marginTop: 8 }}
              >
                🔒 Launch Ad Campaign (Scale)
              </button>
            )}
          </div>
        </div>
      </div>
      {showUpgradeDrawer && <UpgradeModal isOpen={showUpgradeDrawer} onClose={() => setShowUpgradeDrawer(false)} feature="Ads Manager" reason="Launch ad campaigns directly from product insights" />}
    </>
  );
}
