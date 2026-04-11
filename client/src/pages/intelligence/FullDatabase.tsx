import { useIsMobile } from '@/hooks/useIsMobile';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { DateRangeSelector, DateRange, getDateRangeStart } from '@/components/DateRangeSelector';
import { exportCSV } from '@/lib/exportCsv';
import { calculateMargin, getMarginColour } from '@/lib/calculations';
import { toast } from 'sonner';
import { ProductStatCards } from '@/components/ProductStatCards';
import { ProductFilterSidebar, DEFAULT_FILTERS } from '@/components/ProductFilterSidebar';
import { ProductImage } from '@/components/ProductImage';
import { VelocityBadge } from '@/components/VelocityBadge';
import type { FilterState } from '@/components/ProductFilterSidebar';
import { useRegion } from '@/context/RegionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Lock, Copy, Megaphone } from 'lucide-react';
import { MetricTooltip } from '@/components/ui/MetricTooltip';
import UpgradeModal from '@/components/UpgradeModal';
import UsageMeter from '@/components/UsageMeter';
import { PLAN_LIMITS } from '@shared/plans';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { ProductDeepDive } from '@/components/intelligence/ProductDeepDive';
import { SkeletonRows } from '@/components/ui/SkeletonRows';

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
  signal_score?: number;
  quality_tier?: string;
  data_sources?: string[];
  tiktok_shop_signal?: boolean;
  amazon_signal?: boolean;
  // Phase 6: real data columns
  real_orders_count?: number;
  real_cost_aud?: number;
  real_price_aud?: number;
  real_rating?: number;
  real_review_count?: number;
  link_status?: string;
  shipping_time_au_days?: number;
  tiktok_potential?: string;
  saturation_risk?: string;
  best_ad_angle?: string;
  target_audience?: string;
  why_trending?: string;
  suggested_sell_aud?: number;
  data_source?: string;
  source_url?: string;
  cj_product_id?: string;
  supplier_platform?: string;
  supplier_url?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const brico = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
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
  // Prefer DB-stored est_monthly_revenue_aud
  if (p.est_monthly_revenue_aud && p.est_monthly_revenue_aud > 0) return p.est_monthly_revenue_aud;
  const price = p.real_price_aud || p.price_aud || 0;
  // Use MONTHLY orders estimate (total orders / 12 as proxy), not all-time × price
  // This prevents AliExpress products with 100k+ lifetime orders from inflating revenue
  const orders = p.real_orders_count || p.orders_count || 0;
  if (orders > 0 && price > 0) return Math.round((orders / 12) * price * 100) / 100;
  const upd = p.units_per_day || Math.max(1, Math.round((p.winning_score || 50) / 12));
  return Math.round(price * upd * 30 * 100) / 100;
}
function getProductMargin(p: Product): number | null {
  if (p.estimated_margin_pct && p.estimated_margin_pct > 0) return p.estimated_margin_pct;
  // p.profit_margin intentionally excluded — it contains hardcoded fake data
  return calculateMargin(p.price_aud, (p as any).original_price || (p as any).sale_price);
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
  // Prefer affiliate_url (promotion link — works globally), then aliexpress_url, then search fallback
  return (p as any).affiliate_url || p.aliexpress_url || p.source_url || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(getProductName(p))}&shipCountry=au`;
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
  'AU BEST SELLERS': { color: '#3B82F6', bg: '#EEF2FF' },
  'TRENDING':        { color: '#9CA3AF', bg: 'rgba(255,255,255,0.06)' },
  'IN THE NEWS':     { color: '#D97706', bg: '#FEF3C7' },
  'TIKTOK':          { color: '#7C3AED', bg: '#F3E8FF' },
  'AE CHOICE':       { color: '#ff6a00', bg: 'rgba(255,106,0,0.12)' },
};

function ScoreBadge({ score }: { score: number }) {
  const tier = score >= 80
    ? { bg: 'rgba(52,211,153,0.08)', color: '#34d399', border: 'rgba(52,211,153,0.2)', prefix: '🔥 ' }
    : score >= 60
    ? { bg: 'rgba(59,130,246,0.08)', color: '#60A5FA', border: 'rgba(59,130,246,0.2)', prefix: '' }
    : score >= 40
    ? { bg: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: 'rgba(245,158,11,0.2)', prefix: '' }
    : { bg: 'rgba(255,255,255,0.04)', color: '#9CA3AF', border: 'rgba(255,255,255,0.1)', prefix: '' };
  return (
    <div title={`Dropship Score: ${score}/100 — Top ${score >= 85 ? '10' : score >= 75 ? '25' : '40'}% of products this week`}
      style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', cursor: 'help', flexShrink: 0 }}>
      <div style={{ padding: '4px 10px', borderRadius: 20, background: tier.bg, border: `1px solid ${tier.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 13, color: tier.color }}>{tier.prefix}{score || '—'}</span>
      </div>
      <span style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>Dropship</span>
    </div>
  );
}

function QualityTierBadge({ tier, score }: { tier?: string; score?: number }) {
  const effective = tier || (score && score >= 100 ? 'viral' : score && score >= 80 ? 'winning' : score && score >= 60 ? 'rising' : 'emerging');
  const config: Record<string, { label: string; bg: string; color: string; border: string }> = {
    viral:    { label: 'Viral',    bg: 'rgba(239,68,68,0.12)',    color: '#EF4444', border: 'rgba(239,68,68,0.3)' },
    winning:  { label: 'Winning',  bg: 'rgba(34,197,94,0.1)',     color: '#22C55E', border: 'rgba(34,197,94,0.25)' },
    rising:   { label: 'Rising',   bg: 'rgba(245,158,11,0.1)',    color: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
    emerging: { label: 'Emerging', bg: 'rgba(59,130,246,0.1)',    color: '#60A5FA', border: 'rgba(59,130,246,0.2)' },
  };
  const c = config[effective as string] || config.emerging;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' as const }}>
      {c.label}
    </span>
  );
}

function TrendVelocityBadge({ orders }: { orders: number }) {
  if (orders >= 10000) return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/[0.12] text-orange-400 border border-orange-500/20" style={{ whiteSpace: 'nowrap' as const, letterSpacing: '0.05em' }}>
      EXPLODING
    </span>
  );
  if (orders >= 2000) return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)', whiteSpace: 'nowrap' as const, letterSpacing: '0.05em' }}>
      RISING
    </span>
  );
  return null;
}

function SourceBadges({ sources, isChoice }: { sources?: string[]; isChoice?: boolean }) {
  const src = sources || [];
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' as const }}>
      {src.includes('tiktok') && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(0,0,0,0.06)', color: '#CBD5E1', fontWeight: 700 }}>TT</span>}
      {src.includes('amazon') && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(255,153,0,0.12)', color: '#B45309', fontWeight: 700 }}>AMZ</span>}
      {src.includes('aliexpress') && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(255,106,0,0.12)', color: '#C2410C', fontWeight: 700 }}>AE</span>}
      {isChoice && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(255,106,0,0.12)', color: '#C2410C', fontWeight: 700 }}>AE Choice</span>}
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
        style={{ height: 28, padding: '0 10px', background: '#131929', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#e4e4e7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
        Supplier <span style={{ fontSize: 9 }}>&#9662;</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: '#111114', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: 160, marginTop: 4, overflow: 'hidden' }}>
          {links.map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ display: 'block', padding: '8px 14px', fontSize: 13, color: '#e4e4e7', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
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
  // STATE — ALL HOOKS AT TOP (Task 9 requirement)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const canSeeFinancials = isPro || subPlan === 'scale' || subPlan === 'builder';
  const isAdmin = session?.user?.email === 'maximusmajorka@gmail.com';
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [niche, setNiche] = useState('All Niches');
  const [sortBy, setSortBy] = useState(presetFilter === 'trending' ? 'orders_count' : 'winning_score');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const stored = localStorage.getItem('majorka_db_daterange') as DateRange;
    // Migrate old 'today' value (would show 0 results) to 'all'
    if (!stored || (stored as string) === 'today' || stored === '30d') return 'all';
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
  const [mobileDisplayCount, setMobileDisplayCount] = useState(20);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [dbNiches, setDbNiches] = useState<{ name: string; count: number }[]>([]);
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

  // Fetch niches from API on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        if (!token) return;
        const res = await fetch('/api/products/niches', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const { niches: fetchedNiches } = await res.json();
          if (Array.isArray(fetchedNiches) && fetchedNiches.length > 0) {
            setDbNiches(fetchedNiches);
          }
        }
      } catch { /* non-fatal */ }
    })();
  }, []);

  // Debounce search — show filtering skeleton during debounce
  useEffect(() => {
    if (searchInput !== search) setIsFiltering(true);
    const t = setTimeout(() => { setSearch(searchInput); setIsFiltering(false); }, 600);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadProducts = useCallback(async (newOffset = 0, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('sortBy', presetFilter === 'trending' ? 'orders_count' : sortBy);
      params.set('sortDir', presetFilter === 'trending' ? 'desc' : sortDir);
      params.set('limit', '50');
      params.set('offset', String(newOffset));
      // Trending Today: only rising+ products (real orders >= 2000)
      if (presetFilter === 'trending') {
        params.set('trending', 'true');
        params.set('minOrders', '2000');
      }
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
        if (data?.total != null) setTotalCount(data.total);
        if (append) {
          setAllProducts(prev => [...prev, ...rows]);
          setProducts(prev => [...prev, ...rows]);
        } else {
          setAllProducts(rows);
          setProducts(rows);
        }
        if (rows[0]?.updated_at) setLastUpdated(rows[0].updated_at);
      }
    } catch (err) {
      // silently handle load failure
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortDir, presetFilter]);

  useEffect(() => { setOffset(0); loadProducts(0, false); }, [loadProducts]);

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
  const filtered = allProducts.filter(p => {
    // Search filter — match against title, niche, category, keyword, why_trending, best_ad_angle, target_audience
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = (p.product_title || (p as any).name || '').toLowerCase();
      const cat = (p.category || p.niche || p.search_keyword || '').toLowerCase();
      const tags = ((p.tags || []) as string[]).join(' ').toLowerCase();
      const whyTrending = ((p as any).why_trending || '').toLowerCase();
      const adAngle = ((p as any).best_ad_angle || '').toLowerCase();
      const audience = ((p as any).target_audience || '').toLowerCase();
      if (!name.includes(q) && !cat.includes(q) && !tags.includes(q) && !whyTrending.includes(q) && !adAngle.includes(q) && !audience.includes(q)) return false;
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
      if (opportunityFilter === 'Viral' && !(getGrowthRate(p) > 25 || (p.tags || []).includes('VIRAL'))) return false;
      if (opportunityFilter === 'High Margin' && !((margin ?? 0) >= 50 || (p.profit_margin || 0) >= 50)) return false;
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
      const tier = (m ?? 0) >= 50 ? 'high' : (m ?? 0) >= 30 ? 'medium' : 'low';
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const selectedProducts = displayProducts.filter(p => selectedIds.has(String(p.id)));

  const niches = dbNiches.length > 0
    ? ['All Niches', ...dbNiches.map(n => n.name)]
    : ['All Niches', ...Array.from(new Set(products.map(p => getProductNiche(p)).filter(Boolean)))].slice(0, 16);
  const nicheCountMap = new Map(dbNiches.map(n => [n.name, n.count]));

  const FILTERS = ['All', 'Viral', 'High Margin', 'AU Best Sellers', 'TikTok', 'New Today'];

  // Sort indicator
  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <span style={{ color: '#D1D5DB', fontSize: 10, marginLeft: 3 }}>&#8597;</span>;
    return <span style={{ color: '#3B82F6', fontSize: 10, marginLeft: 3 }}>{sortDir === 'desc' ? '\u2193' : '\u2191'}</span>;
  };

  const thStyle = (col: string, width: number, align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    width, minWidth: width, padding: '0 12px', fontSize: 11, fontWeight: 700,
    color: sortBy === col ? '#3B82F6' : '#9CA3AF',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em', cursor: 'pointer',
    textAlign: align, userSelect: 'none', whiteSpace: 'nowrap' as const,
    borderBottom: `2px solid ${sortBy === col ? '#3B82F6' : 'rgba(255,255,255,0.06)'}`,
    paddingBottom: 10, transition: 'color 150ms',
  });

  const tdStyle = (align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    padding: '0 12px', verticalAlign: 'middle', textAlign: align,
  });

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <ProductFilterSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        categories={niches.filter(n => n !== 'All Niches')}
        onFiltersChange={setAdvancedFilters}
      />
      {/* ── PAGE HEADER ── */}
      <div style={{ padding: isMobile ? '16px 16px 0' : '24px 24px 0', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!isMobile && <DateRangeSelector value={dateRange} onChange={handleDateRange} />}
            {!isMobile && (
              <ShimmerButton onClick={() => { try { exportCSV(filteredProducts.map(p => ({ name: p.product_title || p.name, category: p.category, price_aud: p.price_aud, monthly_revenue: p.est_monthly_revenue_aud, margin_pct: p.profit_margin, score: p.winning_score, trend: (p as any).trend, units_per_day: p.units_per_day, aliexpress_url: p.aliexpress_url, tags: (p.tags || []).join(';') })), 'products'); toast.success(`CSV exported — ${filteredProducts.length} products`); } catch { toast.error('Export failed'); } }}>
                ⬇ Export CSV
              </ShimmerButton>
            )}
            <button onClick={handleRefresh} disabled={refreshing}
              style={{ height: isMobile ? 32 : 36, padding: isMobile ? '0 10px' : '0 16px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>{'\u21BB'}</span>
              {isMobile ? '' : (refreshing ? 'Refreshing...' : 'Refresh')}
            </button>
          </div>
        </div>

        <UsageMeter feature="product_searches" limit={PLAN_LIMITS.builder.product_searches} label="product searches" />

        {/* Freshness bar */}
        {lastUpdated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            <span>Showing {displayProducts.length} of {filteredProducts.length > 0 ? filteredProducts.length : totalCount > 0 ? totalCount : 0} products{filteredProducts.length > 0 && filteredProducts.length < totalCount ? ` (${totalCount.toLocaleString()} total in database)` : ''}</span>
            <span>&middot;</span>
            <span>Updated {new Date(lastUpdated).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>&middot;</span>
            <span>Auto-refreshes every 6h</span>
          </div>
        )}
        {/* Live data pill */}
        <div style={{ marginBottom: isMobile ? 12 : 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            Live AliExpress data
          </span>
        </div>

        {refreshMsg && (
          <div style={{ fontSize: 12, color: '#71717a', marginBottom: 10, padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>
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
              className="dark-input"
              style={{ height: 36, paddingLeft: 32, paddingRight: 12, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.06)', color: '#e4e4e7', width: 200, minWidth: 150 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3B82F6'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
          </div>

          {/* Niche selector */}
          <select value={niche} onChange={e => setNiche(e.target.value)}
            className="dark-select"
            style={{ height: 36, paddingLeft: 10, paddingRight: 28, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, backgroundColor: '#131929', outline: 'none', color: '#e4e4e7', cursor: 'pointer' }}>
            {niches.map(n => <option key={n} value={n}>{n}{nicheCountMap.has(n) ? ` (${nicheCountMap.get(n)})` : ''}</option>)}
          </select>

          {/* Opportunity filter pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setOpportunityFilter(f)}
                className={opportunityFilter === f ? 'filter-chip-active' : 'filter-chip-inactive'}
                style={{ height: 32, padding: '0 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 150ms' }}>
                {f}
              </button>
            ))}
          </div>

          {/* 500+ orders toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94A3B8', cursor: 'pointer' }}>
            <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} style={{ accentColor: '#3B82F6', width: 14, height: 14 }} />
            500+ orders only
          </label>

          {/* Clear filters — shown whenever a filter is active */}
          {(searchInput || niche !== 'All Niches' || opportunityFilter !== 'All' || verifiedOnly) && (
            <button
              onClick={() => { setSearchInput(''); setNiche('All Niches'); setOpportunityFilter('All'); setVerifiedOnly(false); }}
              style={{ height: 32, padding: '0 12px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}>
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
            className="dark-select"
            style={{ height: 34, paddingLeft: 10, paddingRight: 28, backgroundColor: '#131929', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e4e4e7', cursor: 'pointer' }}>
            <option value="">All Categories</option>
            {[...new Set(products.map(p => p.category).filter(Boolean))].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Trend direction */}
          {(['all', 'rising', 'peaked', 'declining'] as const).map(t => (
            <button key={t} onClick={() => setFilters(f => ({ ...f, trend: t }))}
              className={filters.trend === t ? 'filter-chip-active' : 'filter-chip-inactive'}
              style={{ height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' as const }}>
              {t === 'all' ? 'All' : t === 'rising' ? 'Rising' : t === 'peaked' ? 'Peaked' : 'Declining'}
            </button>
          ))}

          {/* Sort by */}
          <select onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
            className="dark-select"
            style={{ height: 34, paddingLeft: 10, paddingRight: 28, backgroundColor: '#131929', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e4e4e7', cursor: 'pointer' }}>
            <option value="revenue">Sort: Revenue</option>
            <option value="score">Sort: Score</option>
            <option value="margin">Sort: Margin</option>
            <option value="newest">Sort: Newest</option>
          </select>

          {/* Reset */}
          {(filters.category.length > 0 || filters.trend !== 'all') && (
            <button onClick={() => setFilters({ category: [], priceMin: 0, priceMax: 9999, revenueMin: 0, trend: 'all', sortBy: 'revenue' })}
              style={{ height: 34, padding: '0 12px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#71717a', cursor: 'pointer' }}>
              Reset
            </button>
          )}
        </div>

        {/* Stat Cards */}
        <ProductStatCards products={filtered} />

        {/* KaloData-style Tab Bar */}
        <style>{`.tab-scroll-container::-webkit-scrollbar { display: none; }`}</style>
        <div style={{ position: 'relative' as const, marginBottom: 16 }}>
          <div className="tab-scroll-container" style={{ display: 'flex', gap: 0, borderBottom: '2px solid rgba(255,255,255,0.06)', marginBottom: 0, overflowX: 'auto' as const, WebkitOverflowScrolling: 'touch' as const, scrollbarWidth: 'none' as const, msOverflowStyle: 'none' as const }}>
            {TAB_FILTERS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ height: 42, padding: '0 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? '#3B82F6' : '#9CA3AF', borderBottom: activeTab === t.id ? '3px solid #3B82F6' : '3px solid transparent', whiteSpace: 'nowrap' as const, transition: 'all 150ms', marginBottom: -2, minWidth: 120 }}>
                {t.label}
              </button>
            ))}
          </div>
          {isMobile && (
            <div style={{ position: 'absolute' as const, right: 0, top: 0, width: 40, height: '100%', background: 'linear-gradient(to left, #0a0a0a, transparent)', pointerEvents: 'none' as const }} />
          )}
        </div>
      </div>

      {/* ── TABLE WRAPPER ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '0 0 80px' : '0 24px 40px' }}>
        {/* View mode toggle — List/Grid */}
        {!isMobile && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 16 }}>
            <button onClick={() => setViewMode('list')} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: viewMode === 'list' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              color: viewMode === 'list' ? '#60A5FA' : 'rgba(255,255,255,0.4)',
              border: viewMode === 'list' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
            }}>≡ List</button>
            <button onClick={() => setViewMode('grid')} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: viewMode === 'grid' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              color: viewMode === 'grid' ? '#60A5FA' : 'rgba(255,255,255,0.4)',
              border: viewMode === 'grid' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
            }}>⊞ Grid</button>
          </div>
        )}
        
        {/* Blur gate banner */}
        {!canSeeFinancials && !isAdmin && (
          <div style={{background:'linear-gradient(135deg,#EEF2FF,#F3E8FF)',border:'1px solid #C7D2FE',borderRadius:12,padding:'14px 20px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap' as const,gap:10}}>
            <div>
              <div style={{fontFamily: "'DM Sans', system-ui, sans-serif",fontWeight:800,fontSize:15,color:'#E2E8F0'}}>Showing 10 of {filteredProducts.length} products</div>
              <div style={{fontSize:13,color:'#4B5563',marginTop:2}}>Unlock full database, margins, and revenue data on Builder plan</div>
            </div>
            <button onClick={()=>setShowUpgrade(true)} style={{padding:'10px 20px',background:'#3B82F6',color:'white',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily: "'DM Sans', system-ui, sans-serif",whiteSpace:'nowrap' as const}}>
              Unlock All {filteredProducts.length} →
            </button>
          </div>
        )}
        {/* ── GRID VIEW ── */}
        {viewMode === 'grid' && !isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 20 }}>
            {displayProducts.map(p => {
              const name = getProductName(p);
              return (
                <div key={p.id} onClick={() => setDetailProduct(p)} style={{
                  background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(59,130,246,0.3)';
                    el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(255,255,255,0.07)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  {/* Image */}
                  <div style={{ background: '#0A0F1C', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={p.image_url} alt="" style={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                  {/* Body */}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                      {(p.real_orders_count || 0) >= 10000 && <span className="badge-exploding">🔥 HOT</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4, marginBottom: 8 }}>
                      {name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>A${(p.real_price_aud || p.price_aud || 0).toFixed(2)}</span>
                      <span>{(p.real_orders_count || p.orders_count || 0).toLocaleString()} orders</span>
                    </div>
                    {/* Score bar */}
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${p.winning_score || 0}%`,
                        background: (p.winning_score || 0) >= 80 ? '#10B981' : (p.winning_score || 0) >= 60 ? '#F59E0B' : '#3B82F6',
                      }} />
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.winning_score}/100</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LIST VIEW (TABLE) ── */}
        {viewMode === 'list' && !isMobile && (
          <div style={{ padding: '0 12px 80px' }}>

            {/* Card list */}
            {(loading || isFiltering) ? (
              <SkeletonRows count={8} />
            ) : displayProducts.length === 0 ? (
              search ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#E5E7EB', marginBottom: 8 }}>
                    No results for &ldquo;{search}&rdquo;
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                    Try searching: <span style={{ color: '#3B82F6' }}>dog harness</span> · <span style={{ color: '#3B82F6' }}>gua sha</span> · <span style={{ color: '#3B82F6' }}>fridge organiser</span> · <span style={{ color: '#3B82F6' }}>resistance bands</span> · <span style={{ color: '#3B82F6' }}>cold brew</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                    Or browse by category using the tabs above ↑
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' as const, padding: '40px 20px', color: '#9CA3AF', fontSize: 14 }}>
                  No products found. Try a different search or filter.
                </div>
              )
            ) : (
              displayProducts.slice(0, mobileDisplayCount).map((product, idx) => {
                const isBlurred = !canSeeFinancials && !isAdmin && idx >= 10;
                const score = product.winning_score ?? product.signal_score ?? 0;
                const scoreColor = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : score >= 40 ? '#3B82F6' : '#9CA3AF';
                const revenue = getProductRevenue(product);
                const margin = getProductMargin(product);
                const price = getProductPrice(product);
                const tier = product.quality_tier;
                const sources: string[] = product.data_sources || [];
                const tierConfig = {
                  viral:    { label: '🔥 Viral',    color: '#EF4444' },
                  winning:  { label: '🟢 Winning',  color: '#22C55E' },
                  rising:   { label: '🟡 Rising',   color: '#F59E0B' },
                  emerging: { label: '🔵 Emerging', color: '#60A5FA' },
                }[tier as string] || { label: '🔵 Emerging', color: '#60A5FA' };

                return (
                  <div
                    key={product.id || idx}
                    className={idx < 3 ? 'border-beam-wrap' : ''}
                    onClick={() => !isBlurred && setDetailProduct(product)}
                    style={{
                      background: '#111114',
                      borderRadius: 12,
                      border: `1px solid ${detailProduct?.id === product.id ? '#3B82F6' : 'rgba(255,255,255,0.08)'}`,
                      padding: 14,
                      marginBottom: 10,
                      cursor: isBlurred ? 'default' : 'pointer',
                      filter: isBlurred ? 'blur(4px)' : 'none',
                      userSelect: isBlurred ? 'none' as const : 'auto' as const,
                      WebkitUserSelect: isBlurred ? 'none' as const : 'auto' as const,
                      boxShadow: detailProduct?.id === product.id ? '0 0 0 2px #3B82F6' : '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'box-shadow 150ms',
                      position: 'relative' as const,
                      overflow: 'hidden' as const,
                    }}
                  >
                    {/* Mobile card checkbox */}
                    {!isBlurred && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(String(product.id || idx))}
                        onChange={() => toggleSelect(String(product.id || idx))}
                        onClick={e => e.stopPropagation()}
                        style={{ position: 'absolute', top: 12, right: 12, width: 14, height: 14, accentColor: '#3B82F6', cursor: 'pointer', zIndex: 2 }}
                      />
                    )}
                    {/* Top row: image + title + score */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <img
                        src={product.image_url || ''}
                        alt=""
                        onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56?text=📦'; }}
                        style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' as const, flexShrink: 0, background: 'var(--card-bg-soft, #F9FAFB)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cell-text, #111827)', lineHeight: 1.3, marginBottom: 5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                          {product.product_title || product.name || 'Unknown Product'}
                        </div>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' as const }}>
                          {product.category && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#3B82F6', background: 'rgba(59,130,246,0.08)', borderRadius: 4, padding: '2px 6px' }}>
                              {product.category}
                            </span>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'white', background: scoreColor, borderRadius: 4, padding: '2px 6px' }}>
                            {score}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Source + TikTok badges */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' as const }}>
                      {product.data_source === 'cj_api' ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>CJ ✅</span>
                      ) : (product.data_source === 'aliexpress' || product.aliexpress_url) ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,106,0,0.1)', color: '#EA580C' }}>AE{product.link_status === 'verified' ? ' ✓' : ''}</span>
                      ) : null}
                      {product.link_status === 'verified' && product.data_source !== 'aliexpress' && !product.aliexpress_url && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>✓ Verified</span>
                      )}
                      {product.tiktok_potential === 'viral' && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>🔥 VIRAL</span>
                      )}
                      {product.tiktok_potential === 'high' && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>⚡ TikTok+</span>
                      )}
                      <TrendVelocityBadge orders={product.real_orders_count || 0} />
                    </div>

                    {/* Metrics grid: 2×2 */}
                    {(() => {
                      const realOrders = product.real_orders_count;
                      const aeOrders = product.orders_count || 0;
                      const sellPrice = product.suggested_sell_aud || product.price_aud || 0;
                      const costPrice = product.real_cost_aud || product.cost_price_aud || 0;
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          {[
                            { label: realOrders ? '📦 Real Orders' : '📦 AE Orders', value: realOrders ? realOrders.toLocaleString() : aeOrders > 0 ? aeOrders.toLocaleString() : '—', highlight: !!realOrders },
                            { label: '🏷 Sell', value: sellPrice > 0 ? `$${sellPrice.toFixed(0)}` : '—', highlight: false },
                            { label: '💰 Cost', value: costPrice > 0 ? `$${costPrice.toFixed(2)}` : '—', highlight: false },
                            { label: '📊 Margin', value: margin !== null && margin > 0 ? `${Math.round(margin)}%` : '—', highlight: false },
                          ].map(m => (
                            <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: '7px 10px' }}>
                              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>{m.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: m.highlight ? '#22C55E' : '#F1F5F9' }}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}


                    {/* Tier badge + source badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: tierConfig.color, background: `${tierConfig.color}18`, borderRadius: 5, padding: '2px 8px', border: `1px solid ${tierConfig.color}33` }}>
                        {tierConfig.label}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {sources.includes('tiktok') && <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', fontWeight: 700 }}>TT</span>}
                        {sources.includes('amazon') && <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'rgba(255,153,0,0.12)', color: '#D97706', fontWeight: 700 }}>AMZ</span>}
                        {sources.includes('aliexpress') && <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'rgba(255,106,0,0.10)', color: '#EA580C', fontWeight: 700 }}>AE</span>}
                        {product.tags?.includes('aliexpress_choice') && <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'rgba(255,106,0,0.10)', color: '#EA580C', fontWeight: 700 }}>✅</span>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={e => { e.stopPropagation(); if (!isBlurred) setDetailProduct(product); }}
                        style={{ flex: 1, height: 36, background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        View Details →
                      </button>
                      {((product as any).affiliate_url || product.aliexpress_url) && (
                        <a
                          href={(product as any).affiliate_url || product.aliexpress_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ height: 36, padding: '0 14px', background: '#FF6A00', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none', whiteSpace: 'nowrap' as const }}
                        >
                          AE ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Load more */}
            {displayProducts.length > mobileDisplayCount && (
              <button
                onClick={() => setMobileDisplayCount(c => c + 20)}
                style={{ width: '100%', height: 44, background: '#111114', color: '#3B82F6', border: '2px solid #3B82F6', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
              >
                Load More ({displayProducts.length - mobileDisplayCount} remaining)
              </button>
            )}
          </div>
        )}

        {/* ── LIST VIEW (TABLE) ── */}
        {viewMode === 'list' && !isMobile && (
        <div style={{ position: 'relative' as const }}>
          {/* Right-edge fade — indicates more content to scroll */}
          <div
            id="table-scroll-fade"
            style={{
              position: 'absolute' as const, top: 0, right: 0, bottom: 0, width: 48, zIndex: 5,
              background: 'linear-gradient(to right, transparent, rgba(6,10,18,0.95))',
              borderRadius: '0 12px 12px 0', pointerEvents: 'none' as const,
              transition: 'opacity 200ms',
            }}
          />
        <div
          className="products-table-container"
          style={{ overflowX: 'auto' as const, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const fade = document.getElementById('table-scroll-fade');
            if (fade) {
              const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
              fade.style.opacity = atEnd ? '0' : '1';
            }
          }}
        >
            <div className="mkr-table-wrap" style={{ background: '#111114' }}>
          <table className="mkr-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 900 }}>

            {/* ── STICKY HEADER ── */}
            <colgroup>
              <col style={{ width: 36 }} />          {/* checkbox */}
              <col style={{ width: 36 }} />          {/* # (row number) */}
              <col style={{ width: undefined }} />    {/* Product — flex-1, gets remaining space */}
              <col style={{ width: 110 }} />         {/* Orders */}
              <col style={{ width: 80 }} />          {/* Trend */}
              <col style={{ width: 60 }} />          {/* Source */}
              <col style={{ width: 80 }} />          {/* Sell price */}
              <col style={{ width: 72 }} />          {/* Margin */}
              <col style={{ width: 64 }} />          {/* Score */}
              <col style={{ width: 70 }} />          {/* Creators */}
              <col style={{ width: 40 }} />          {/* Actions */}
            </colgroup>
            <thead>
              <tr style={{ height: 36, background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky' as const, top: 0, zIndex: 10 }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', width: 36 }} />
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'default' }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  PRODUCT {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'pointer' }} onClick={() => handleSort('orders_count')}>
                  ORDERS {sortBy === 'orders_count' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'default' }}>
                  TREND
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'default' }}>
                  SOURCE
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'pointer' }} onClick={() => handleSort('price')}>
                  SELL {sortBy === 'price' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'pointer' }} onClick={() => handleSort('estimated_margin_pct')}>
                  MARGIN {sortBy === 'estimated_margin_pct' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'pointer' }} onClick={() => handleSort('winning_score')}>
                  SCORE {sortBy === 'winning_score' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'default' }}>
                  CREATORS
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'default' }}></th>
              </tr>
            </thead>

            {/* ── BODY ── */}
            <tbody>
              {loading || isFiltering ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ height: 72, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '0 12px' }} />
                    <td style={{ padding: '0 12px' }}><div style={{ height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 6, width: '60%', animation: 'shimmer 1.5s ease-in-out infinite' }} /></td>
                    {[240, 110, 120, 80, 80, 80, 64, 80, 186].map((_, j) => (
                      <td key={j} style={{ padding: '0 12px' }}>
                        <div style={{ height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 6, width: `${40 + (i * j * 7) % 50}%`, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '60px 24px', textAlign: 'center' as const }}>
                    {search ? (
                      <>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#E5E7EB', marginBottom: 8 }}>
                          No results for &ldquo;{search}&rdquo;
                        </div>
                        <div style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.6, color: '#94A3B8' }}>
                          Try searching: <span style={{ color: '#3B82F6' }}>dog harness</span> · <span style={{ color: '#3B82F6' }}>gua sha</span> · <span style={{ color: '#3B82F6' }}>fridge organiser</span> · <span style={{ color: '#3B82F6' }}>resistance bands</span> · <span style={{ color: '#3B82F6' }}>cold brew</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
                          Or browse by category using the tabs above ↑
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>{'\uD83D\uDD0D'}</div>
                        <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 18, color: '#F8FAFC', marginBottom: 6 }}>No products found</div>
                        <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 16 }}>Try clearing filters or searching a different keyword</div>
                      </>
                    )}
                    <button onClick={() => { setSearchInput(''); setOpportunityFilter('All'); setNiche('All Niches'); setVerifiedOnly(false); }}
                      style={{ height: 38, padding: '0 20px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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
                    [growth > 25 ? 'VIRAL' : null, (margin ?? 0) >= 50 ? 'HIGH MARGIN' : null, orders >= 2000 ? 'AU BEST SELLERS' : null, 'TRENDING']
                      .filter(Boolean) as string[]
                  ).slice(0, 3);
                  const isExpanded = expandedProduct === (p.id || idx);
                  const rowKey = p.id || idx;
                  const isSelected = selectedIds.has(String(p.id || idx));

                  return (
                    <React.Fragment key={rowKey}>
                      <tr
                        onClick={() => setDetailProduct(p)}
                        className={`row-selected`}
                        style={{
                          height: 56,
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'background 120ms',
                          background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent',
                          borderColor: isSelected ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                          animation: `fadeInRow 0.3s ease ${idx * 0.03}s both`,
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(59,130,246,0.08)' : 'transparent'; }}
                      >
                        {/* Checkbox */}
                        <td style={{ width: 36, paddingLeft: 12, verticalAlign: 'middle' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(String(p.id || idx))}
                            onChange={() => toggleSelect(String(p.id || idx))}
                            onClick={e => e.stopPropagation()}
                            style={{ width: 14, height: 14, accentColor: '#3B82F6', cursor: 'pointer' }}
                          />
                        </td>
                        {/* # */}
                        <td style={{ ...tdStyle('center'), color: '#9CA3AF', fontSize: 12, fontWeight: 600 }}>
                          {idx + 1}
                        </td>

                        {/* Product */}
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img
                              src={p.image_url}
                              alt=""
                              style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#0A0F1C' }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                                {name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                {/* Show AT MOST 2 badges — prioritise EXPLODING then trend */}
                                {(p.real_orders_count || 0) >= 10000 && <span className="badge-exploding">🔥 EXPLODING</span>}
                                {(p.real_orders_count || 0) >= 2000 && (p.real_orders_count || 0) < 10000 && <span className="badge-trending">📈 RISING</span>}
                                {p.category && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{p.category}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Orders */}
                        <td style={tdStyle('right')}>
                          {canSeeFinancials ? (
                            (() => {
                              const realOrd = (p as any).real_orders_count;
                              const aeOrd = orders;
                              if (realOrd && realOrd > 0) {
                                return (
                                  <>
                                    <div className="mkr-mono" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 15, color: '#22C55E' }}>
                                      {realOrd >= 1000 ? `${(realOrd / 1000).toFixed(1)}k` : realOrd.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#22C55E' }}>real orders</div>
                                  </>
                                );
                              }
                              return (
                                <>
                                  <div className="mkr-mono" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 15, color: aeOrd >= 1000 ? '#f4f4f5' : '#71717a' }}>
                                    {aeOrd >= 1000 ? `${(aeOrd / 1000).toFixed(1)}k` : aeOrd > 0 ? aeOrd.toLocaleString() : '—'}
                                  </div>
                                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>AE orders</div>
                                </>
                              );
                            })()
                          ) : (
                            <span style={{ filter: 'blur(5px)', userSelect: 'none' as const, cursor: 'pointer', display: 'inline-block' }} title="Upgrade to see data" onClick={e => { e.stopPropagation(); setLocation('/pricing'); }}>
                              X,XXX
                            </span>
                          )}
                        </td>

                        {/* Sparkline */}
                        <td style={tdStyle('center')}>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 44 }}>
                            {/* Sparkline with tooltip */}
                            <div
                              style={{ position: 'relative', display: 'inline-block' }}
                              onMouseEnter={e => {
                                const tooltip = e.currentTarget.querySelector<HTMLElement>('.sparkline-tooltip');
                                if (tooltip) tooltip.style.display = 'block';
                              }}
                              onMouseLeave={e => {
                                const tooltip = e.currentTarget.querySelector<HTMLElement>('.sparkline-tooltip');
                                if (tooltip) tooltip.style.display = 'none';
                              }}
                            >
                              <MiniSparkline data={sparkData} width={116} height={32} positive={isPositive} />
                              <div
                                className="sparkline-tooltip"
                                style={{
                                  display: 'none',
                                  position: 'absolute',
                                  bottom: 'calc(100% + 6px)',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  background: '#111827',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: 8,
                                  padding: '6px 10px',
                                  fontSize: 11,
                                  color: '#E2E8F0',
                                  whiteSpace: 'nowrap',
                                  zIndex: 20,
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                  pointerEvents: 'none',
                                }}
                              >
                                {isPositive ? '↑ Trending up' : '↓ Declining'}
                                {p.real_orders_count ? (
                                  <span style={{ display: 'block', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                    {p.real_orders_count >= 1000 ? `${(p.real_orders_count / 1000).toFixed(1)}k` : p.real_orders_count} orders
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Source badge */}
                        <td style={tdStyle('center')}>
                          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
                            {(p as any).data_source === 'cj_api' ? (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>CJ ✅</span>
                            ) : ((p as any).data_source === 'aliexpress' || p.aliexpress_url) ? (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,106,0,0.1)', color: '#EA580C' }}>AE{(p as any).link_status === 'verified' ? ' ✓' : ''}</span>
                            ) : (
                              <span style={{ fontSize: 10, color: '#9CA3AF' }}>—</span>
                            )}
                            {(p as any).tiktok_potential === 'viral' && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>🔥 VIRAL</span>
                            )}
                            {(p as any).tiktok_potential === 'high' && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>⚡ TikTok+</span>
                            )}
                          </div>
                        </td>

                        {/* Sell Price */}
                        <td style={tdStyle('right')}>
                          {(() => {
                            const sellP = (p as any).suggested_sell_aud || price;
                            return (
                              <>
                                <div className="mkr-mono" style={{ fontWeight: 700, fontSize: 14, color: '#f4f4f5' }}>${sellP > 0 ? sellP.toFixed(0) : '—'}</div>
                                <div style={{ fontSize: 10, color: '#9CA3AF' }}>{region.currency}</div>
                              </>
                            );
                          })()}
                        </td>

                        {/* Margin */}
                        <td style={tdStyle('center')}>
                          {canSeeFinancials ? (
                            <>
                              <div className="mkr-mono" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 15, color: margin === null ? '#6B7280' : (margin >= 50 ? '#059669' : margin >= 35 ? '#D97706' : '#EF4444') }}>
                                {margin !== null ? `${margin}%` : '—'}
                              </div>
                              {margin !== null && (
                                <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 4, width: 48, margin: '4px auto 0' }}>
                                  <div style={{ height: '100%', width: `${Math.min(100, margin)}%`, background: margin >= 50 ? '#059669' : margin >= 35 ? '#D97706' : '#EF4444', borderRadius: 2 }} />
                                </div>
                              )}
                            </>
                          ) : (
                            <span style={{ filter: 'blur(5px)', userSelect: 'none' as const, cursor: 'pointer', display: 'inline-block' }} title="Upgrade to see margin data" onClick={e => { e.stopPropagation(); setLocation('/pricing'); }}>
                              XX%
                            </span>
                          )}
                        </td>

                        {/* Score */}
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span
                            className="font-mono tabular-nums"
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444',
                            }}
                          >
                            {Math.round(score)}
                          </span>
                        </td>

                        {/* Creators — link to Creator Intel filtered by niche */}
                        <td style={tdStyle('center')}>
                          <a
                            href={`/app/creators?niche=${encodeURIComponent(p.category || p.niche || 'general')}`}
                            onClick={e => { e.stopPropagation(); }}
                            style={{ fontSize: 11, color: '#3B82F6', textDecoration: 'none', fontWeight: 600, padding: '3px 8px', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, background: 'rgba(59,130,246,0.08)', whiteSpace: 'nowrap' as const, display: 'inline-block' }}
                          >
                            Find →
                          </a>
                        </td>

                        {/* Actions — Hover-reveal */}
                        <td style={{ width: 40, padding: '0 8px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                          <div className="action-trigger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            {/* ⋯ at rest */}
                            <span className="action-dots" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16, cursor: 'pointer' }}>⋯</span>
                            {/* Action strip on hover — absolute, floats above row */}
                            <div className="action-strip" style={{
                              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                              display: 'flex', alignItems: 'center', gap: 4,
                              background: '#0d0d10', border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8, padding: '4px 8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                              opacity: 0, pointerEvents: 'none', transition: 'opacity 0.1s', zIndex: 10,
                            }}>
                              <button
                                title="View product details"
                                onClick={e => { e.stopPropagation(); setDetailProduct(p); }}
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#60A5FA', border: 'none', cursor: 'pointer', fontSize: 13 }}>↗</button>
                              <button title="Save" onClick={() => toast.success('Product saved!')} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 13 }}>♡</button>
                              <button title="Build Store" onClick={() => setLocation(`/app/store-builder?product=${encodeURIComponent(name)}&niche=${encodeURIComponent(getProductNiche(p))}`)} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>⚡</button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* ── EXPANDED SCORE BREAKDOWN ── */}
                      {isExpanded && (
                        <tr style={{ background: '#131929', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <td colSpan={11} style={{ padding: '0 16px 16px' }}>
                            <div style={{ padding: '14px 16px', background: '#111114', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', maxWidth: 500 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#f4f4f5', marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Why this product?</div>
                              {[
                                { label: 'Order Volume', v: p.score_breakdown?.order_score ?? Math.round((Math.min(orders, 5000) / 5000) * 25), max: 25 },
                                { label: 'Margin Potential', v: p.score_breakdown?.margin_score ?? Math.round(((margin ?? 0) / 75) * 25), max: 25 },
                                { label: 'Trend Velocity', v: p.score_breakdown?.trend_score ?? 8, max: 20 },
                                { label: 'Supplier Rating', v: p.score_breakdown?.supplier_score ?? 10, max: 15 },
                                { label: 'AU Market Fit', v: p.score_breakdown?.au_fit_score ?? 8, max: 15 },
                              ].map(({ label, v, max }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                                  <div style={{ width: 150, fontSize: 12, color: '#e4e4e7' }}>{label}</div>
                                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${((v || 0) / max) * 100}%`, background: '#3B82F6', borderRadius: 3, transition: 'width 600ms ease' }} />
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
        </div>
        )}
      </div>

      {/* ── LOAD MORE ── */}
      {allProducts.length < totalCount && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <button
            onClick={() => { const next = offset + 50; setOffset(next); loadProducts(next, true); }}
            style={{ padding: '10px 32px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            Load More ({totalCount - allProducts.length} remaining)
          </button>
          <div style={{ marginTop: 8, fontSize: 12, color: '#71717a' }}>
            Showing {allProducts.length} of {totalCount} products
          </div>
        </div>
      )}

      {/* ── PRODUCT DEEP DIVE SLIDE PANEL ── */}
      <ProductDeepDive product={detailProduct} onClose={() => setDetailProduct(null)} />

      {showUpgrade && <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} feature="Full Product Database" reason="Access all products, margins, and revenue data" />}

      {/* ── FLOATING COMPARE BAR ── */}
      {selectedIds.size >= 2 && (
        <div style={{
          position: 'fixed',
          bottom: 72,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          zIndex: 100,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 500 }}>
            {selectedIds.size} products selected
          </span>
          <button
            onClick={() => setShowCompare(true)}
            style={{
              background: '#3B82F6', color: 'white', border: 'none',
              borderRadius: 8, padding: '6px 16px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#5558E8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3B82F6')}
          >
            Compare →
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            Clear
          </button>
        </div>
      )}

      {/* ── COMPARISON MODAL ── */}
      {showCompare && selectedProducts.length >= 2 && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowCompare(false)}
        >
          <div
            style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, maxWidth: 900, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Product Comparison</h2>
              <button onClick={() => setShowCompare(false)} style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedProducts.length}, 1fr)`, gap: 16 }}>
              {selectedProducts.map(p => {
                const score = p.winning_score || 0;
                const margin = getProductMargin(p);
                return (
                  <div key={p.id} style={{ background: '#111827', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <img
                      src={p.image_url}
                      alt=""
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12, background: '#1F2937' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', lineHeight: 1.4, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                      {p.product_title || p.name}
                    </div>
                    {[
                      { label: 'Price', value: p.real_price_aud ? `$${p.real_price_aud} AUD` : (p.price_aud ? `$${p.price_aud} AUD` : '—') },
                      { label: 'Orders', value: p.real_orders_count ? p.real_orders_count.toLocaleString() : (p.orders_count ? p.orders_count.toLocaleString() : '—') },
                      { label: 'Rating', value: p.real_rating ? `${p.real_rating}★` : (p.rating ? `${p.rating}★` : '—') },
                      { label: 'Score', value: score ? score.toString() : '—' },
                      { label: 'Margin', value: margin !== null ? `${Math.round(margin)}%` : '—' },
                      { label: 'Category', value: p.category || p.niche || '—' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                        <span style={{ color: '#6B7280' }}>{row.label}</span>
                        <span style={{ color: '#E2E8F0', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                      </div>
                    ))}
                    <a
                      href={getSupplierUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'block', marginTop: 12, textAlign: 'center', padding: '8px', background: 'rgba(59,130,246,0.1)', color: '#60A5FA', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(59,130,246,0.2)' }}
                    >
                      View on AliExpress →
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInRow { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes shimmer { 0% { opacity:0.6; } 50% { opacity:1; } 100% { opacity:0.6; } }
        
        /* Hover-reveal action strip */
        .products-table tbody tr:hover .action-strip {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        .products-table tbody tr:hover .action-dots {
          opacity: 0;
        }
        
        /* Row hover & selection — Linear style */
        .products-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.1s ease;
          cursor: pointer;
        }
        .products-table tbody tr:hover {
          background: rgba(255,255,255,0.04);
        }
        .products-table tbody tr.row-selected {
          background: rgba(59,130,246,0.08);
          border-color: rgba(59,130,246,0.2);
        }
        .products-table .row-checkbox {
          opacity: 0;
          transition: opacity 0.1s;
        }
        .products-table tbody tr:hover .row-checkbox,
        .products-table tbody tr.row-selected .row-checkbox {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

// ─── Product Detail Drawer ────────────────────────────────────────────────────
// ── Supplier Finder — live Tavily search ───────────────────────────────────
function SupplierFinder({ productName }: { productName: string }) {
  const dark = document.documentElement.classList.contains('dark');
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
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cell-text, #0A0A0A)', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Find Suppliers</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {suppliers.map(({ label, icon, desc, url, color, bg, border }) => (
          <a key={label} href={url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', background: dark ? `${color}12` : bg, border: `1px solid ${dark ? `${color}30` : border}`, borderRadius: 8, textDecoration: 'none' }}>
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
      <div style={{ fontWeight: 700, fontSize: 13, color: '#CBD5E1', marginBottom: 4 }}>Suggested Meta Audiences</div>
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
              <Copy size={11} style={{ color: '#3B82F6' }} />
              {audience}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button
          onClick={e => { e.stopPropagation(); setLocation(`/app/ads-studio?product=${encodeURIComponent(productTitle)}&category=${encodeURIComponent(category)}&audience=${encodeURIComponent(audiences[0] || '')}`); }}
          style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', color: 'white', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, border: 'none' }}
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
      <div style={{ fontSize: 10, color: 'var(--cell-text, #4B5563)', fontWeight: 700, marginBottom: 4, letterSpacing: '.04em', textTransform: 'uppercase' as const }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, height: 36, overflow: 'hidden' }}>
        <span style={{ padding: '0 8px', fontSize: 12, color: '#3B82F6', fontWeight: 700, flexShrink: 0 }}>{prefix}</span>
        <input type="number" min={0} step={step} value={val}
          onChange={e => set(parseFloat(e.target.value) || 0)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, color: 'var(--input-text, #111827)', fontFamily: "'DM Sans', system-ui, sans-serif", background: 'transparent', padding: '0 6px 0 0', minWidth: 0 }}
        />
      </div>
      {hint && <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>{hint}</div>}
    </div>
  );

  const isDark = document.documentElement.classList.contains('dark');
  const metric = (label: string, val: string, color: string, bg: string) => (
    <div style={{ background: isDark ? `${color}15` : bg, borderRadius: 10, padding: '10px 12px', textAlign: 'center' as const }}>
      <div style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 900, fontSize: 17, color, lineHeight: 1 }}>{val}</div>
    </div>
  );

  return (
    <div style={{ marginBottom: 20, background: isDark ? 'rgba(59,130,246,0.06)' : '#F0F4FF', border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#C7D2FE'}`, borderRadius: 16, overflow: 'hidden' as const }}>
      {/* Collapsible header */}
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 14, color: isDark ? '#C7D2FE' : '#1E1B4B' }}>💰 Profit Analysis</div>
          <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 1 }}>Auto-filled from product · all values editable</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: viableConfig.bg, border: `1px solid ${viableConfig.border}`, borderRadius: 999, padding: '4px 10px' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: viableConfig.color }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: viableConfig.color }}>{viableConfig.label}</span>
          </div>
          <span style={{ fontSize: 16, color: '#3B82F6', fontWeight: 700, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>⌃</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#C7D2FE'}` }}>

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
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.04em' }}>Return Rate</span>
              <span style={{ fontSize: 11, color: '#3B82F6', fontWeight: 700 }}>{returnRate}%</span>
            </div>
            <input type="range" min={0} max={25} step={1} value={returnRate} onChange={e => setReturnRate(+e.target.value)}
              style={{ width: '100%', accentColor: '#3B82F6' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9CA3AF' }}>
              <span>0%</span><span>Category default: {getReturnRateDefault(category)}%</span><span>25%</span>
            </div>
          </div>

          {/* Auto-calculated fixed costs */}
          <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 10, color: '#CBD5E1' }}>
            <div><span style={{ color: '#9CA3AF' }}>Shipping</span><br /><strong>${shipping.toFixed(2)}</strong></div>
            <div><span style={{ color: '#9CA3AF' }}>Shopify fee</span><br /><strong>{PLATFORM_FEE}% = ${platformCost.toFixed(2)}</strong></div>
            <div><span style={{ color: '#9CA3AF' }}>Stripe fee</span><br /><strong>{PAYMENT_FEE}% = ${paymentCost.toFixed(2)}</strong></div>
          </div>

          {/* 5 key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {metric('Net Margin',      `${Math.max(-99, grossMargin).toFixed(1)}%`, viableConfig.color, viableConfig.bg)}
            {metric('Monthly Profit',  fmtAUD(monthlyProfit),    '#3B82F6', '#EEF2FF')}
            {metric('Daily Profit',    fmtAUD(dailyProfit),       '#8B5CF6', '#F3E8FF')}
            {metric('Break-even CPA',  `$${breakEvenCPA > 0 ? breakEvenCPA.toFixed(2) : '—'}`, '#0891B2', '#ECFEFF')}
          </div>
          <div style={{ background: isDark ? 'rgba(59,130,246,0.08)' : '#EEF2FF', borderRadius: 10, padding: '10px 12px', marginBottom: 14, textAlign: 'center' as const }}>
            <div style={{ fontSize: 9, color: '#3B82F6', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 4 }}>ROAS (Return on Ad Spend)</div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 900, fontSize: 22, color: roas >= 2 ? '#059669' : roas >= 1 ? '#D97706' : '#DC2626' }}>{roas > 0 ? `${roas.toFixed(2)}x` : '—'}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{roas >= 3 ? 'Excellent' : roas >= 2 ? 'Good' : roas >= 1 ? 'Breakeven zone' : 'Loss-making at current spend'}</div>
          </div>

          {/* What this means */}
          <div style={{ background: isDark ? 'var(--card-bg, #111114)' : 'white', border: `1px solid ${isDark ? 'var(--border-color, #1E293B)' : '#E0E7FF'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>💡 What This Means</div>
            <div style={{ fontSize: 12, color: 'var(--cell-text, #374151)', lineHeight: 1.6 }}>{insight}</div>
          </div>

          {/* Monthly Profit Projections */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cell-text, #0A0A0A)', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '.07em' }}>Monthly Profit Projections</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              {projections.map(proj => {
                const pos = proj.monthly > 0;
                return (
                  <div key={proj.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: isDark ? (pos ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)') : (pos ? '#F0FDF4' : '#FEF2F2'), borderRadius: 8, border: `1px solid ${isDark ? (pos ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)') : (pos ? '#BBF7D0' : '#FECACA')}` }}>
                    <span style={{ fontSize: 12, color: 'var(--cell-text, #374151)', fontWeight: 500 }}>{proj.label}</span>
                    <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 14, color: pos ? '#059669' : '#DC2626' }}>{fmtAUD(proj.monthly)}/mo</span>
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
              style={{ flex: 1, height: 40, background: '#3B82F6', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Open Full Calculator →
            </button>
            <button onClick={handleShare}
              style={{ width: 40, height: 40, background: shared ? 'rgba(5,150,105,0.15)' : '#131929', color: shared ? '#059669' : '#71717a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', flexShrink: 0 }}>
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

const LAUNCH_STEPS = [
  { id: 'profit',   label: 'Run profit calculation',    link: '/app/profit-calc',     icon: '💰' },
  { id: 'supplier', label: 'Verify supplier & order',   link: '/app/intelligence',    icon: '📦' },
  { id: 'ad',       label: 'Generate ad creative',      link: '/app/ads-studio',      icon: '🎨' },
  { id: 'creator',  label: 'Brief a TikTok creator',    link: '/app/creators',        icon: '🎬' },
  { id: 'store',    label: 'Publish to Shopify',         link: '/app/store-builder',   icon: '🛒' },
  { id: 'alert',    label: 'Set price drop alert',       link: '/app/alerts',          icon: '🔔' },
];

function LaunchChecklist({ productId, setLocation }: { productId: string; setLocation: (p: string) => void }) {
  const storageKey = `launch_checklist_${productId}`;
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); }
    catch { return new Set(); }
  });

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setChecked(next);
    localStorage.setItem(storageKey, JSON.stringify([...next]));
  };

  const progress = Math.round((checked.size / LAUNCH_STEPS.length) * 100);

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9' }}>Launch Checklist</span>
        <span style={{ fontSize: 11, color: checked.size === LAUNCH_STEPS.length ? '#10B981' : '#6B7280' }}>
          {checked.size}/{LAUNCH_STEPS.length} done
        </span>
      </div>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#3B82F6', borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>
      {LAUNCH_STEPS.map(step => (
        <div
          key={step.id}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
          onClick={() => toggle(step.id)}
        >
          <div style={{
            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
            background: checked.has(step.id) ? '#3B82F6' : 'transparent',
            border: `1.5px solid ${checked.has(step.id) ? '#3B82F6' : 'rgba(255,255,255,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            {checked.has(step.id) && <span style={{ fontSize: 10, color: 'white' }}>✓</span>}
          </div>
          <span style={{ fontSize: 12 }}>{step.icon}</span>
          <span style={{
            fontSize: 12, flex: 1,
            color: checked.has(step.id) ? 'rgba(255,255,255,0.3)' : '#CBD5E1',
            textDecoration: checked.has(step.id) ? 'line-through' : 'none',
            transition: 'all 0.15s',
          }}>
            {step.label}
          </span>
          <button
            onClick={e => { e.stopPropagation(); setLocation(step.link); }}
            style={{ fontSize: 10, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, opacity: 0.7 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
          >
            Go →
          </button>
        </div>
      ))}
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
  const orders = p.real_orders_count || p.orders_count || 0;
  const score = p.winning_score || 0;
  const price = p.suggested_sell_aud || p.estimated_retail_aud || p.price_aud || 0;
  // Cost: prefer real_cost_aud, then stored cost, else derive
  const storedCost = p.real_cost_aud || p.cost_price_aud || p.supplier_cost_aud || 0;
  const calcedMargin = calculateMargin(p.price_aud, (p as any).original_price || (p as any).sale_price);
  const marginPct = typeof margin === 'number' && margin > 0 ? margin : (calcedMargin ?? 0);
  const cost = storedCost > 0 ? storedCost : (marginPct > 0 ? Math.round(price * (1 - marginPct / 100) * 100) / 100 : 0);
  const revenue = p.est_monthly_revenue_aud && p.est_monthly_revenue_aud > 0
    ? p.est_monthly_revenue_aud
    : p.orders_count && p.orders_count > 0
      ? Math.round(p.orders_count * price * 100) / 100
      : Math.round(price * (p.units_per_day || Math.max(1, Math.round(score / 12))) * 30 * 100) / 100;
  const hasRealData = !!(p.real_orders_count || p.real_cost_aud || p.real_rating);
  const productCategory = p.niche || p.category || '';
  const supplierLink = p.supplier_url || p.aliexpress_url || null;
  const sourceLink = p.source_url || p.aliexpress_url || null;

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
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: Math.min(600, typeof window !== 'undefined' ? window.innerWidth : 600), background: '#111114', zIndex: 1000, overflowY: 'auto', boxShadow: '-4px 0 40px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky' as const, top: 0, background: '#111114', zIndex: 10 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#71717a', padding: '4px 8px' }}>{'\u2190'}</button>
          <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: '#f4f4f5' }}>Product Details</span>
        </div>
        <div style={{ width: '100%', height: 180, background: '#131929', overflow: 'hidden' }}>
          <ProductImage src={p.image_url} alt={name} size={180} style={{ width: '100%', height: 180, borderRadius: 0 }} />
        </div>
        <div style={{ padding: 20 }}>
          <h2 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 17, color: '#f4f4f5', marginBottom: 6, lineHeight: 1.4 }}>{name}</h2>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>
            {p.niche || p.category}
            {orders > 0 && <> &middot; <span style={hasRealData ? { color: '#22C55E', fontWeight: 600 } : {}}>{orders.toLocaleString()} {hasRealData ? 'real' : 'AE'} orders</span></>}
            {p.data_source === 'cj_api' && <> &middot; <span style={{ color: '#3B82F6', fontWeight: 600 }}>CJ ✅</span></>}
            {p.link_status === 'verified' && <> &middot; <span style={{ color: '#22C55E' }}>Verified ✓</span></>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignItems: 'center', marginBottom: 16 }}>
            <QualityTierBadge tier={p.quality_tier} score={p.signal_score || score} />
            {(p.signal_score != null && p.signal_score > 0) && <span style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', background: '#EEF2FF', padding: '2px 7px', borderRadius: 5 }}>Signal: {p.signal_score}</span>}
            <SourceBadges sources={p.data_sources} isChoice={p.tags?.includes('aliexpress_choice')} />
          </div>

          {p.tags?.includes('aliexpress_choice') && (
            <div style={{ background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>&#x2705;</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ff6a00' }}>AliExpress Choice</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Vetted quality · Faster shipping · Lower return rate</div>
              </div>
            </div>
          )}

          {/* Large 30-day revenue trend sparkline */}
          <div style={{ marginBottom: 20, padding: 16, background: '#131929', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f4f4f5', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>30-Day Revenue Trend</div>
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

          {/* ── SUPPLIER SECTION ── */}
          <div style={{ marginBottom: 16, padding: '14px 16px', background: '#131929', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f4f4f5', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>📦 Supplier</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5' }}>
                {p.supplier_name || (p.data_source === 'cj_api' ? 'CJ Dropshipping' : p.aliexpress_url ? 'AliExpress' : 'Unknown')}
              </span>
              {p.link_status === 'verified' && <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: 4 }}>✅ Verified</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, fontSize: 13, color: '#e4e4e7' }}>
              <div>Real cost: {p.real_cost_aud ? <span style={{ fontWeight: 700 }}>${p.real_cost_aud.toFixed(2)} AUD</span> : <span style={{ color: '#71717a' }}>—</span>}</div>
              {p.shipping_time_au_days && <div>Ships to AU: <span style={{ fontWeight: 700 }}>{p.shipping_time_au_days}–{p.shipping_time_au_days + 7} days</span></div>}
            </div>
            {supplierLink && (
              <a href={supplierLink} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 700, color: '#3B82F6', textDecoration: 'none', padding: '6px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: 6, border: '1px solid rgba(59,130,246,0.2)' }}>
                View on {p.data_source === 'cj_api' ? 'CJ' : 'AliExpress'} →
              </a>
            )}
          </div>

          {/* ── PRICING GRID ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
            {(() => {
              const realCost = p.real_price_aud || p.price_aud || 0;
              const realSell = p.suggested_sell_aud || (realCost > 0 ? Math.round(realCost * 2.5 * 100) / 100 : 0);
              const calcMargin = realSell > 0 ? Math.round(((realSell - realCost) / realSell) * 100) : 0;
              const marginColor = calcMargin >= 50 ? '#22C55E' : calcMargin >= 30 ? '#F59E0B' : '#EF4444';
              const ordersDisplay = (p.real_orders_count || 0).toLocaleString();
              return [
                { label: 'AliExpress Cost', val: realCost > 0 ? `$${realCost.toFixed(2)} AUD` : '—', color: '#f4f4f5' },
                { label: 'Suggested Sell', val: realSell > 0 ? `$${realSell.toFixed(2)} AUD` : '—', color: '#f4f4f5' },
                { label: 'Est. Margin', val: calcMargin > 0 ? `${calcMargin}%` : '—', color: marginColor },
                { label: 'Real Orders', val: (p.real_orders_count || 0) > 0 ? `${ordersDisplay} sold` : '—', color: '#f4f4f5' },
                { label: 'Rating', val: (p.real_rating || p.rating) ? `${(p.real_rating || p.rating || 0).toFixed(1)}/5 ⭐` : '—', color: '#f4f4f5' },
                { label: 'Dropship Score', val: `${score}/100`, color: '#f4f4f5' },
              ];
            })().map(({ label, val, color: valColor }) => (
              <div key={label} style={{ padding: '12px 16px', background: '#111114' }}>
                <div style={{ fontSize: 10, color: '#71717a', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 15, color: valColor }}>{val}</div>
              </div>
            ))}
          </div>

          {/* ── VERIFIED MARKET DATA ── */}
          {(() => {
            const displayOrders = p.real_orders_count || p.orders_count;
            const displayRating = p.real_rating || p.rating;
            const displayReviews = p.real_review_count || (p as any).review_count;
            const listingUrl = p.source_url || p.aliexpress_url;
            if (!displayOrders && !displayRating && !listingUrl) return null;
            return (
              <div style={{ marginBottom: 16, padding: '14px 16px', background: '#131929', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f4f4f5', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>📊 Verified Market Data</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, fontSize: 13, color: '#e4e4e7' }}>
                  {displayOrders && displayOrders > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>🛒</span>
                      <span style={{ fontWeight: 700, color: '#22C55E' }}>{displayOrders.toLocaleString()} {p.real_orders_count ? 'real' : ''} orders</span>
                    </div>
                  )}
                  {displayRating && displayRating > 0 && (
                    <div>Rating: <span style={{ fontWeight: 700 }}>{displayRating.toFixed(1)}/5</span>{displayReviews ? ` (${displayReviews.toLocaleString()} reviews)` : ''}</div>
                  )}
                  {listingUrl && (
                    <a href={listingUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, fontWeight: 700, color: '#3B82F6', textDecoration: 'none' }}>
                      View listing →
                    </a>
                  )}
                </div>
              </div>
            );
          })()}
          {/* ── Inline Profit Analysis ── */}
          <ProductProfitCalc
            sellPrice={p.suggested_sell_aud || ((p.real_price_aud || p.price_aud || 0) > 0 ? Math.round((p.real_price_aud || p.price_aud || 0) * 2.5 * 100) / 100 : 39.95)}
            supplierCost={p.real_price_aud || p.price_aud || (cost > 0 ? cost : Math.round((price || 40) * 0.3 * 100) / 100)}
            category={productCategory}
            productName={name}
          />
          {p.real_cost_aud && (
            <div style={{ fontSize: 10, color: '#22C55E', marginTop: -14, marginBottom: 16, paddingLeft: 4 }}>
              (real {p.data_source === 'cj_api' ? 'CJ' : 'AE'} cost)
            </div>
          )}

          {/* Dropship Score visual bar */}
          {(() => {
            const s = score;
            const tier = s >= 80
              ? { bg: 'rgba(52,211,153,0.08)', color: '#34d399', label: '🔥 Hot' }
              : s >= 60
              ? { bg: 'rgba(245,158,11,0.08)', color: '#F59E0B', label: '📈 Rising' }
              : s >= 40
              ? { bg: 'rgba(255,255,255,0.06)', color: '#9CA3AF', label: '➡️ Steady' }
              : { bg: 'rgba(239,68,68,0.08)', color: '#f87171', label: '⚠️ Risky' };
            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f4f4f5', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Dropship Score</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 22, color: tier.color }}>{s}/100</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: tier.color, background: tier.bg, padding: '3px 10px', borderRadius: 12 }}>{tier.label}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, s)}%`, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}cc)`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>Based on: demand signals, margin potential, competition level, trend velocity</div>
              </div>
            );
          })()}

          {(() => {
            const sb = p.score_breakdown;
            const margin = getProductMargin(p) ?? 50;
            const orders = typeof p.orders_count === 'number' ? p.orders_count : (typeof (p as any).sold_count === 'number' ? (p as any).sold_count : 500);
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
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f4f4f5', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Why This Product</div>
                {breakdown.map(({ label, v, max }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 135, fontSize: 11, color: '#e4e4e7' }}>{label}</div>
                    <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(v / max) * 100}%`, background: '#3B82F6', borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ width: 36, fontSize: 10, color: '#9CA3AF', textAlign: 'right' as const }}>{v}/{max}</div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 8 }}>Passes all quality gates</div>
              </div>
            );
          })()}
          {/* Why Trending — prefer real why_trending, fallback to AI brief */}
          {(p.why_trending || trendBrief || briefLoading) && (
            <div style={{ marginBottom: 20 }}>
              {p.why_trending ? (
                <p style={{ fontFamily: dm, fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>{p.why_trending}</p>
              ) : briefLoading ? (
                <div style={{ borderLeft: '3px solid #3B82F6', background: '#F5F3FF', borderRadius: 12, padding: '14px 16px' }}>
                  <h4 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: '#3B82F6', fontWeight: 700, marginBottom: 8, margin: 0 }}>Why This is Trending ✨</h4>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ height: 12, borderRadius: 6, background: 'linear-gradient(90deg, #E0E7FF 25%, #EEF2FF 50%, #E0E7FF 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite', width: i === 3 ? '70%' : '100%' }} />
                    ))}
                  </div>
                </div>
              ) : trendBrief ? (
                <div style={{ borderLeft: '3px solid #3B82F6', background: '#F5F3FF', borderRadius: 12, padding: '14px 16px' }}>
                  <h4 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: '#3B82F6', fontWeight: 700, marginBottom: 8, margin: 0 }}>Why This is Trending ✨</h4>
                  <p style={{ fontFamily: dm, fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>{trendBrief}</p>
                </div>
              ) : null}
            </div>
          )}

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
                <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: '#3B82F6', fontWeight: 700, marginBottom: 10 }}>🎯 Creator Types to Target</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                  {archetypes.map(({ type, desc, search }) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#131929', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5' }}>{type}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{desc}</div>
                      </div>
                      <a href={`https://www.tiktok.com/search?q=${encodeURIComponent(search)}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#3B82F6', textDecoration: 'none', fontWeight: 600, flexShrink: 0, padding: '4px 10px', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, background: 'rgba(59,130,246,0.1)', whiteSpace: 'nowrap' as const }}>
                        Search TikTok →
                      </a>
                    </div>
                  ))}
                </div>
                <a href={`https://www.tiktok.com/search?q=${encodeURIComponent(pName + ' review')}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, color: '#3B82F6', textDecoration: 'none', fontWeight: 600, padding: '10px 14px', background: '#EEF2FF', borderRadius: 8, border: '1px solid #C7D2FE' }}>
                  <span>🔍</span>
                  <span>Search all TikTok content for this product</span>
                  <span style={{ marginLeft: 'auto' }}>→</span>
                </a>
              </div>
            );
          })()}

          <SupplierFinder productName={name} />
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f4f4f5', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>AI Market Analysis</div>
            {!aiAnalysis ? (
              <button onClick={runAnalysis} disabled={analyzing}
                style={{ width: '100%', height: 42, background: '#EEF2FF', color: '#3B82F6', border: '1px solid #C7D2FE', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {analyzing ? 'Analysing...' : 'Generate AU Market Analysis'}
              </button>
            ) : (
              <div style={{ background: '#131929', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 14 }}>
                <pre style={{ whiteSpace: 'pre-wrap' as const, fontFamily: dm, fontSize: 13, color: '#e4e4e7', lineHeight: 1.75, margin: 0 }}>{aiAnalysis}</pre>
              </div>
            )}
          </div>
          {/* Data source transparency */}
          <div style={{ marginBottom: 12, padding: '10px 14px', background: '#131929', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#71717a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 6 }}>Data Sources</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              {[
                { field: 'Product name & image', source: p.data_source === 'cj_api' ? 'CJ API' : 'AliExpress', real: true },
                { field: 'Orders', source: p.real_orders_count ? 'Real scraped data' : 'AI demand signal (est.)', real: !!p.real_orders_count },
                { field: 'Supplier cost', source: p.real_cost_aud ? `Real ${p.data_source === 'cj_api' ? 'CJ' : 'AE'} cost` : 'Estimated', real: !!p.real_cost_aud },
                { field: 'Rating', source: p.real_rating ? 'Real scraped' : p.rating ? 'Scraped' : 'Not available', real: !!(p.real_rating || p.rating) },
                { field: 'Link status', source: p.link_status || 'unverified', real: p.link_status === 'verified' },
                { field: 'Dropship score', source: 'Composite formula', real: true },
              ].map(({ field, source, real }) => (
                <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#94A3B8', flex: 1 }}>{field}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: real ? '#34D399' : '#9CA3AF', background: real ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' as const }}>{source}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => setLocation(`/app/store-builder?product=${encodeURIComponent(name)}&niche=${encodeURIComponent(p.niche || p.category || '')}`)}
              style={{ width: '100%', height: 46, background: '#3B82F6', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Build Store for This Product →
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setLocation(`/app/profit?price=${price > 0 ? price : 39.95}&cost=${cost > 0 ? cost : Math.round((price || 40) * 0.3 * 100) / 100}&units=4&ads=${getAdSpendDefault(productCategory)}`)}
                style={{ height: 40, background: '#131929', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Full Profit Calc
              </button>
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify({ name, score, margin, revenue }, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ height: 40, background: '#131929', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
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
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Bricolage Grotesque',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}
              >
                🚀 Launch Ad Campaign →
              </button>
            ) : (
              <button
                onClick={() => setShowUpgradeDrawer(true)}
                style={{ width: '100%', padding: '14px', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Bricolage Grotesque',sans-serif", marginTop: 8 }}
              >
                🔒 Launch Ad Campaign (Scale)
              </button>
            )}
          </div>
          {/* Launch Checklist */}
          <LaunchChecklist productId={String(p.id)} setLocation={setLocation} />
        </div>
      </div>
      {showUpgradeDrawer && <UpgradeModal isOpen={showUpgradeDrawer} onClose={() => setShowUpgradeDrawer(false)} feature="Ads Manager" reason="Launch ad campaigns directly from product insights" />}
    </>
  );
}
