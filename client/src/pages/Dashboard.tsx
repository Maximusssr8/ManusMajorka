import {
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  BookOpen,
  Clock,
  Globe,
  Megaphone,
  MessageSquare,
  Package,
  Search,
  ShoppingBag,
  Star,
  Timer,
  Zap,
  DollarSign,
  Percent,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { createElement, useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useDocumentTitle } from '@/_core/hooks/useDocumentTitle';
import { DashboardAISuggestion } from '@/components/DashboardAISuggestion';
import LaunchReadiness from '@/components/LaunchReadiness';
import MajorkaAppShell from '@/components/MajorkaAppShell';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import OnboardingModal from '@/components/OnboardingModal';
import { ProductImporter } from '@/components/ProductImporter';
import ProductTour from '@/components/ProductTour';
import TrialBanner from '@/components/TrialBanner';
import WelcomeModal from '@/components/WelcomeModal';
import { useActiveProduct } from '@/hooks/useActiveProduct';
import StreakWidget from '@/components/StreakWidget';
import { type ActivityEntry, getActivityLog, getRelativeTime } from '@/lib/activity';
import { allTools, getToolByPath, recordRecentTool, stages } from '@/lib/tools';
import { trpc } from '@/lib/trpc';
import { supabase } from '@/lib/supabase';
import { ONBOARDING_KEY } from '@/pages/Onboarding';
import ToolPage from './ToolPage';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

function getRecentToolIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem('majorka_recent_tools') || '[]');
  } catch {
    return [];
  }
}

const GOAL_TOOL_MAP: Record<string, string[]> = {
  'find-product': ['product-discovery', 'trend-radar', 'niche-scorer', 'competitor-breakdown'],
  'build-store': ['website-generator', 'brand-dna', 'copywriter', 'email-sequences'],
  'launch-ads': ['meta-ads', 'ads-studio', 'tiktok', 'audience-profiler'],
  'scale-up': ['market-intel', 'analytics-decoder', 'scaling-playbook', 'store-auditor'],
};
const DEFAULT_RECOMMENDED = ['product-discovery', 'website-generator', 'meta-ads', 'ai-chat'];

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const isToolPage = location.startsWith('/app/') && location !== '/app';
  const currentTool = isToolPage ? getToolByPath(location) : null;
  useDocumentTitle(currentTool?.label ?? 'Dashboard');

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation('/login');
  }, [loading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (isToolPage) {
      const tool = getToolByPath(location);
      if (tool) {
        localStorage.setItem(
          'majorka_last_tool',
          JSON.stringify({ path: tool.path, label: tool.label })
        );
        recordRecentTool(tool.id);
      }
    }
  }, [location, isToolPage]);

  return (
    <MajorkaAppShell>
      <div data-tour="dashboard" className="h-full">
        {isToolPage ? <ToolPage /> : <DashboardHome />}
      </div>
      {user && <OnboardingModal userName={user.name ?? undefined} />}
      {user && <WelcomeModal userName={user.name ?? undefined} />}
      <ProductTour />
    </MajorkaAppShell>
  );
}

function StatCard({
  label,
  numericValue,
  displayValue,
  sub,
  subColor,
  icon: Icon,
  iconColor,
  iconBg,
  sparkIdx,
}: {
  label: string;
  numericValue: number | null;
  displayValue?: string;
  sub: string;
  subColor: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  sparkIdx: number;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div
      ref={ref}
      className="stat-card-top-border glass-card group rounded-xl p-4 transition-all"
      style={{ userSelect: 'none' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: iconBg }}
          >
            <Icon
              size={10}
              className="group-hover:text-[#d4af37] transition-colors"
              style={{ color: iconColor }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: '#71717a' }}>
            {label}
          </span>
        </div>
        {/* change badges removed — would need real analytics data */}
      </div>

      <div
        className="font-bold mb-1"
        style={{ fontFamily: 'Syne, sans-serif', color: '#d4af37', letterSpacing: '-0.02em', fontSize: 28, fontWeight: 700 }}
      >
        {displayValue ??
          (numericValue !== null && inView ? (
            <CountUp start={0} end={numericValue} duration={1.5} separator="," />
          ) : (
            (numericValue ?? '—')
          ))}
      </div>
      <div className="text-xs mb-2" style={{ color: subColor }}>
        {sub}
      </div>

      {/* Sparklines hidden — real chart data not yet wired */}
    </div>
  );
}

// Community badge — static, honest copy
function SellersJoinedBadge() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(212,175,55,0.07)',
        border: '1px solid rgba(212,175,55,0.18)',
        borderRadius: 100,
        padding: '4px 12px',
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px #22c55e',
        }}
      />
      <span style={{ fontSize: 12, color: '#d4af37', fontWeight: 600 }}>
        Growing community of sellers worldwide
      </span>
    </div>
  );
}

// PersonalisedFeed component — shows products based on user niche
function PersonalisedFeed() {
  const { session, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [userNiche, setUserNiche] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch user's profile niche
    supabase.from('user_profiles')
      .select('target_niche')
      .eq('user_id', session?.user?.id)
      .single()
      .then(({ data }) => {
        setUserNiche((data as { target_niche?: string } | null)?.target_niche || null);
      });

    // Fetch relevant products
    supabase
      .from('winning_products')
      .select('*')
      .order('est_daily_revenue_aud', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setProducts((data || []) as Record<string, unknown>[]);
      });
  }, [isAuthenticated, session]);

  if (!isAuthenticated || !products.length) return null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: 20, marginBottom: 24
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: 0 }}>
          {userNiche ? `🔥 Top Products in ${userNiche}` : '🔥 Today\'s Top Revenue Products'}
        </h3>
        <a href="/app/winning-products" style={{ fontSize: 12, color: '#d4af37', textDecoration: 'none' }}>View all →</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {products.map((p, i) => (
          <div key={String(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.4)', width: 20 }}>#{i+1}</span>
            {p.image_url ? <img src={String(p.image_url)} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} /> : null}
            <span style={{ flex: 1, fontSize: 13, color: '#f0ede8', fontWeight: 500 }}>{String(p.product_title ?? '')}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#d4af37' }}>
              ${Math.round((Number(p.est_daily_revenue_aud) || 0) * 30 / 1000)}k/mo
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: p.trend === 'exploding' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: p.trend === 'exploding' ? '#ef4444' : '#22c55e' }}>
              {p.trend === 'exploding' ? '🔥' : '📈'} {String(p.trend ?? '')}
            </span>
          </div>
        ))}
      </div>
      {!userNiche && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.6)' }}>
            💡 Set your niche in <a href="/app/settings" style={{ color: '#d4af37' }}>Settings</a> to see personalised product recommendations
          </span>
        </div>
      )}
    </div>
  );
}

// "Most used" & "NEW" tool badge helpers
const MOST_USED_IDS = ['product-discovery', 'website-generator'];
const NEW_TOOL_IDS = ['au-trending', 'launch-kit'];

/* ─── Sales Overview — demo data + Shopify-style layout ─── */
const UI = "'Inter', 'DM Sans', system-ui, sans-serif";  // Inter for all data/labels

const DEMO_PRODUCTS = [
  { rank: 1, name: 'EMS Muscle Stimulator Pro', cat: 'Fitness',      emoji: '⚡', units: 847,  revenue: 38_115, trend: 18.4 },
  { rank: 2, name: 'Whey Protein Isolate 1kg',   cat: 'Supplements',  emoji: '🥛', units: 612,  revenue: 24_480, trend: 24.1 },
  { rank: 3, name: 'Resistance Band Set 5-Pack',  cat: 'Fitness',      emoji: '🏋️', units: 589,  revenue: 17_670, trend: 11.2 },
  { rank: 4, name: 'Creatine Monohydrate 500g',   cat: 'Supplements',  emoji: '💊', units: 534,  revenue: 16_020, trend:  9.8 },
  { rank: 5, name: 'Ab Roller Wheel Pro',          cat: 'Fitness',      emoji: '🔄', units: 421,  revenue: 12_630, trend:  6.3 },
  { rank: 6, name: 'Collagen Peptides Powder',     cat: 'Supplements',  emoji: '✨', units: 398,  revenue: 11_940, trend: 31.7 },
  { rank: 7, name: 'Adjustable Dumbbell Set',      cat: 'Fitness',      emoji: '🏆', units: 287,  revenue: 28_700, trend:  4.1 },
  { rank: 8, name: 'Pre-Workout Energy Formula',   cat: 'Supplements',  emoji: '🔥', units: 261,  revenue:  7_830, trend: 15.9 },
];

const DEMO_ORDERS = [
  { id: '#10842', customer: 'Sarah M.',  initials: 'SM', color: '#7c6af5', product: 'EMS Muscle Stimulator Pro',  amount: 44.95, status: 'paid'      as const, time: '2m ago'  },
  { id: '#10841', customer: 'Jake T.',   initials: 'JT', color: '#10b981', product: 'Whey Protein Isolate 1kg',   amount: 39.90, status: 'paid'      as const, time: '9m ago'  },
  { id: '#10840', customer: 'Emma K.',   initials: 'EK', color: '#f59e0b', product: 'Creatine Monohydrate 500g',  amount: 29.95, status: 'fulfilled' as const, time: '17m ago' },
  { id: '#10839', customer: 'Liam R.',   initials: 'LR', color: '#3b82f6', product: 'Resistance Band Set',        amount: 34.95, status: 'paid'      as const, time: '23m ago' },
  { id: '#10838', customer: 'Olivia S.', initials: 'OS', color: '#ec4899', product: 'Collagen Peptides Powder',   amount: 32.00, status: 'fulfilled' as const, time: '38m ago' },
  { id: '#10837', customer: 'Noah W.',   initials: 'NW', color: '#14b8a6', product: 'Pre-Workout Energy Formula', amount: 28.50, status: 'pending'   as const, time: '51m ago' },
];

// Realistic daily revenue — intentionally irregular, AU-market pattern
const BASE_REVENUES = [
  1843, 2267, 1914, 2538, 2891, 1762, 1534,
  2183, 2347, 2619, 2084, 1923, 2476, 2754,
  2391, 2108, 1884, 2713, 2966, 2637, 2382,
  1994, 1876, 2418, 2783, 2512, 2249, 1867, 2641, 2918,
];

function getDemoChartData(range: string) {
  const today = new Date();
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const count = days <= 7 ? 7 : 14;
  const slice = BASE_REVENUES.slice(-count);
  return slice.map((rev, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    return {
      date: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      revenue: days === 1 ? Math.round(rev / 24 * (i * 1.7 + 4)) : rev,
    };
  });
}

function getDemoKpis(range: string) {
  const m = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return {
    totalRevenue:    Math.round(2263 * m),
    orders:          Math.round(47  * m),
    aov:             48.16,
    convRate:        3.17,
    revChange:       12.4,
    ordChange:        8.7,
    aovChange:        3.2,
    cvrChange:        1.8,
  };
}

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today'   },
  { key: '7d',   label: '7 days'  },
  { key: '30d',  label: '30 days' },
  { key: '90d',  label: '90 days' },
] as const;

const STATUS_CFG = {
  paid:      { bg: 'rgba(34,197,94,0.12)',  text: '#22c55e', dot: '#22c55e' },
  fulfilled: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', dot: '#3b82f6' },
  pending:   { bg: 'rgba(234,179,8,0.12)',  text: '#fbbf24', dot: '#f59e0b' },
} as const;

const CAT_CFG: Record<string, { bg: string; text: string }> = {
  Fitness:     { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa' },
  Supplements: { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc' },
};

function MiniSparkSvg({ data, color = '#22c55e' }: { data: number[]; color?: string }) {
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const W = 52, H = 18;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / rng) * H}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function SalesTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontFamily: UI }}>
      <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#d4af37' }}>${payload[0].value.toLocaleString()}</div>
    </div>
  );
}

function SalesOverview({ orderCount }: { orderCount: number }) {
  const [range, setRange] = useState<string>('30d');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isDemo = orderCount === 0;
  const chartData = getDemoChartData(range);
  const kpis = getDemoKpis(range);

  const kpiCards = [
    { label: 'Total Revenue', value: `$${kpis.totalRevenue.toLocaleString()}`,  change: kpis.revChange, icon: DollarSign,  spark: [18,22,19,24,28,23,30] },
    { label: 'Orders',        value: kpis.orders.toLocaleString(),               change: kpis.ordChange, icon: ShoppingBag, spark: [14,18,15,20,17,22,24] },
    { label: 'Avg Order',     value: `$${kpis.aov.toFixed(2)}`,                  change: kpis.aovChange, icon: TrendingUp,  spark: [44,46,45,47,46,48,49] },
    { label: 'Conv. Rate',    value: `${kpis.convRate}%`,                         change: kpis.cvrChange, icon: Percent,     spark: [28,30,29,31,30,32,33] },
  ];

  return (
    <div style={{ marginBottom: 32, fontFamily: UI }}>

      {/* Demo badge — subtle, not obtrusive */}
      {isDemo && !bannerDismissed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, padding: '6px 12px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.14)', borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(212,175,55,0.75)', fontWeight: 500, flex: 1 }}>
            📊 Showing sample data — orders from your store will appear here automatically
          </span>
          <button onClick={() => setBannerDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.5 }}>
            <X size={11} style={{ color: '#a1a1aa' }} />
          </button>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#52525b', fontFamily: 'Syne, sans-serif' }}>
          Sales Overview
        </span>
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 3 }}>
          {RANGE_OPTIONS.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} style={{
              padding: '4px 11px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, fontFamily: UI, letterSpacing: '-0.01em',
              background: range === r.key ? '#d4af37' : 'transparent',
              color: range === r.key ? '#080a0e' : '#71717a',
              transition: 'all 0.12s',
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
        {kpiCards.map((k) => (
          <div key={k.label} style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 9 }}>
              <k.icon size={12} style={{ color: '#52525b' }} />
              <span style={{ fontSize: 11, color: '#52525b', fontWeight: 500, letterSpacing: '0.01em' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, color: '#f0ede8', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginBottom: 8, lineHeight: 1 }}>
              {k.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                ↑ {k.change}%
              </span>
              <MiniSparkSvg data={k.spark} color="#22c55e" />
            </div>
          </div>
        ))}
      </div>

      {/* Revenue area chart */}
      <div style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 14px 10px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#52525b', marginBottom: 12, fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Revenue</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#d4af37" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#d4af37" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10, fontFamily: UI }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#52525b', fontSize: 10, fontFamily: UI }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<SalesTooltip />} cursor={{ stroke: 'rgba(212,175,55,0.2)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={1.8} fill="url(#goldGrad)" dot={false} activeDot={{ r: 3, fill: '#d4af37', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      <div style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#52525b', fontFamily: 'Syne, sans-serif' }}>Top Products</span>
          <a href="/app/winning-products" style={{ fontSize: 12, color: '#d4af37', textDecoration: 'none', fontWeight: 500 }}>View all →</a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['#', 'Product', 'Category', 'Units Sold', 'Revenue', 'vs last period'].map((h) => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Units Sold' || h === 'Revenue' ? 'right' as const : 'left' as const, color: '#3f3f46', fontWeight: 600, fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase' as const, fontFamily: UI, whiteSpace: 'nowrap' as const }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_PRODUCTS.map((p, i) => {
                const cc = CAT_CFG[p.cat] ?? { bg: 'rgba(113,113,122,0.12)', text: '#71717a' };
                return (
                  <tr key={p.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '9px 10px', color: '#3f3f46', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', width: 28 }}>{i + 1}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>{p.emoji}</span>
                        <span style={{ fontSize: 13, color: '#e4e4e7', fontWeight: 500, whiteSpace: 'nowrap' as const }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: cc.bg, color: cc.text, fontWeight: 600 }}>{p.cat}</span>
                    </td>
                    <td style={{ padding: '9px 10px', color: '#a1a1aa', fontSize: 13, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' }}>{p.units.toLocaleString()}</td>
                    <td style={{ padding: '9px 10px', color: '#d4af37', fontWeight: 600, fontSize: 13, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' }}>${p.revenue.toLocaleString()}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right' as const }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                        ↑ {p.trend}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#52525b', fontFamily: 'Syne, sans-serif' }}>Recent Orders</span>
          <span style={{ fontSize: 11, color: '#52525b' }}>Updated just now</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {DEMO_ORDERS.map((o) => {
            const sc = STATUS_CFG[o.status];
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderRadius: 8, transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {/* Avatar */}
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: o.color + '22', border: `1px solid ${o.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: o.color }}>{o.initials}</span>
                </div>
                {/* Name + product */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{o.customer}</span>
                    <span style={{ fontSize: 11, color: '#3f3f46', fontWeight: 400 }}>{o.id}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#71717a', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{o.product}</span>
                </div>
                {/* Amount */}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  ${o.amount.toFixed(2)}
                </span>
                {/* Status pill */}
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: sc.bg, color: sc.text, textTransform: 'capitalize' as const, flexShrink: 0 }}>
                  {o.status}
                </span>
                {/* Time */}
                <span style={{ fontSize: 11, color: '#3f3f46', flexShrink: 0, minWidth: 52, textAlign: 'right' as const }}>{o.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DashboardHome() {
  const [, setLocation] = useLocation();
  const { user, session, isAuthenticated } = useAuth();
  const { activeProduct } = useActiveProduct();
  const productsQuery = trpc.products.list.useQuery(undefined, { enabled: isAuthenticated });
  const ordersQuery = trpc.storefront.getOrders.useQuery(undefined, { enabled: isAuthenticated });
  const subscriptionQuery = trpc.subscription.get.useQuery(undefined, { enabled: isAuthenticated });
  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  const [toolsToday, setToolsToday] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [onboardingBannerDismissed, setOnboardingBannerDismissed] = useState<boolean>(
    () => typeof window !== 'undefined' && !!localStorage.getItem('majorka_banner_dismissed')
  );

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isAuthenticated) return;
    const localDone = localStorage.getItem(ONBOARDING_KEY);
    if (!localDone && profileQuery.isFetched) {
      const profile = profileQuery.data as { onboardingCompleted?: boolean } | null | undefined;
      if (!profile?.onboardingCompleted) {
        setLocation('/onboarding');
      }
    }
  }, [isAuthenticated, profileQuery.isFetched, profileQuery.data, setLocation]);

  useEffect(() => {
    const today = new Date().toDateString();
    // Primary: new daily-keyed counters; fallback: legacy keys
    try {
      const raw = localStorage.getItem(`majorka_tool_usage_${today}`);
      if (raw !== null) {
        setToolsToday(Number(raw) || 0);
      } else {
        // Fallback to legacy array key
        const legacy = localStorage.getItem('majorka_tools_today');
        if (legacy) {
          const p = JSON.parse(legacy);
          setToolsToday(Array.isArray(p) ? p.length : 0);
        }
      }
    } catch {}
    try {
      const raw = localStorage.getItem(`majorka_ai_requests_${today}`);
      if (raw !== null) {
        setAiCount(Number(raw) || 0);
      } else {
        // Fallback to legacy counter key
        const legacy = localStorage.getItem('majorka_ai_count');
        if (legacy) setAiCount(Number(legacy) || 0);
      }
    } catch {}
    setActivityLog(getActivityLog().slice(0, 6));
    setRecentToolIds(getRecentToolIds());
  }, []);

  const productCount = productsQuery.data?.length ?? 0;
  const orders = ordersQuery.data ?? [];
  const orderCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat((o as any).amount ?? '0'), 0);
  // Never fake revenue — show real orders only, never productCount × 49
  const revenuePotential = totalRevenue > 0 ? totalRevenue : 0;
  const rawDisplayName =
    user?.name?.trim() ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split('@')[0] ||
    null;
  const firstName = rawDisplayName ? (rawDisplayName as string).split(' ')[0] : 'there';
  const savedGoal = typeof window !== 'undefined' ? localStorage.getItem('majorka_goal') : null;
  const recommendedIds =
    savedGoal && GOAL_TOOL_MAP[savedGoal] ? GOAL_TOOL_MAP[savedGoal] : DEFAULT_RECOMMENDED;
  const recommendedTools = recommendedIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as typeof allTools;
  const recentTools = recentToolIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as typeof allTools;
  const timeSavedHours = Math.round(aiCount * 0.5 * 10) / 10;
  const filteredStages = searchQuery.trim()
    ? stages
        .map((s) => ({
          ...s,
          tools: s.tools.filter(
            (t) =>
              t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.description.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((s) => s.tools.length > 0)
    : stages;

  const isFreePlan = !subscriptionQuery.data || subscriptionQuery.data.plan === 'free';

  return (
    <div
      className="h-full overflow-auto dashboard-bg"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
    >
      {isFreePlan && <TrialBanner />}
      {/* Onboarding personalisation nudge — shown when user skipped onboarding */}
      {!onboardingBannerDismissed &&
        isAuthenticated &&
        profileQuery.isFetched &&
        !(profileQuery.data as { onboardingCompleted?: boolean } | null)?.onboardingCompleted &&
        localStorage.getItem(ONBOARDING_KEY) && (
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-3"
            style={{
              background: 'rgba(212,175,55,0.07)',
              borderBottom: '1px solid rgba(212,175,55,0.18)',
            }}
          >
            <span className="text-sm" style={{ color: '#d4af37' }}>
              ✨ Personalise Majorka to your business →
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation('/onboarding')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: '#d4af37',
                  color: '#080a0e',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Set up (2 min)
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('majorka_banner_dismissed', '1');
                  setOnboardingBannerDismissed(true);
                }}
                className="text-xs transition-all"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                }}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5' }}
              >
                {getGreeting()}
                {firstName ? `, ${firstName}` : ''}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <p className="text-sm" style={{ color: '#a1a1aa' }}>
                  Your AI Ecommerce OS &middot;{' '}
                  <span style={{ color: '#52525b' }}>{formatDate()}</span>
                </p>
                <SellersJoinedBadge />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocation('/app/history')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                <Clock size={14} /> History
              </button>
              <button
                onClick={() => setLocation('/app/ai-chat')}
                className="cta-shimmer flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold"
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: '#d4af37',
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.08)')}
              >
                <MessageSquare size={14} /> Ask AI
              </button>
            </div>
          </div>
        </div>

        {/* ── New User Welcome Banner ── */}
        {productCount === 0 && !productsQuery.isLoading && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.02) 100%)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: 16,
              padding: '24px',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(212,175,55,0.7)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Welcome to Majorka
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#f0ede8', marginBottom: 8, margin: 0 }}>
                  Let's find your first winning product
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.5)', marginTop: 8, marginBottom: 0 }}>
                  69 winning products tracked · Updated daily · AU-specific data
                </p>
              </div>
              <button
                onClick={() => setLocation('/app/winning-products')}
                style={{
                  padding: '10px 20px',
                  background: '#d4af37',
                  color: '#080a0e',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Scout Products →
              </button>
            </div>

            {/* 3 featured products */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 20 }}>
              {[
                { title: 'Red Light Therapy Wand', niche: 'Health & Wellness', revenue: '$96K/mo', trend: 'Exploding', score: 88 },
                { title: 'LED Teeth Whitening Kit', niche: 'Beauty & Skincare', revenue: '$108K/mo', trend: 'Exploding', score: 86 },
                { title: 'Smart Herb Garden Kit', niche: 'Home & Kitchen', revenue: '$72K/mo', trend: 'Exploding', score: 84 },
              ].map((p) => (
                <div
                  key={p.title}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setLocation('/app/winning-products')}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                >
                  <div style={{ fontSize: 10, color: 'rgba(212,175,55,0.7)', fontWeight: 700, marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>
                    {p.trend}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0ede8', fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.4)', marginBottom: 6 }}>{p.niche}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#d4af37' }}>{p.revenue}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <OnboardingChecklist />
        <LaunchReadiness userId={user?.id} />

        {/* Daily Streak Widget */}
        <div style={{ marginBottom: 20 }}>
          <StreakWidget />
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Active Products"
            numericValue={productsQuery.isLoading ? null : productCount}
            sub={productCount > 0 ? 'Active' : 'Add your first product'}
            subColor={productCount > 0 ? '#10b981' : '#52525b'}
            icon={Package}
            iconColor="#3b82f6"
            iconBg="rgba(59,130,246,0.1)"
            sparkIdx={0}
          />
          <StatCard
            label="Tools Today"
            numericValue={toolsToday}
            sub={
              toolsToday > 0
                ? `${toolsToday} tool${toolsToday !== 1 ? 's' : ''} used`
                : 'Start exploring'
            }
            subColor={toolsToday > 0 ? '#10b981' : '#52525b'}
            icon={Zap}
            iconColor="#d4af37"
            iconBg="rgba(212,175,55,0.1)"
            sparkIdx={1}
          />
          <StatCard
            label="AI Requests"
            numericValue={aiCount}
            sub={aiCount > 0 ? 'Requests today' : 'Ask anything'}
            subColor={aiCount > 0 ? '#10b981' : '#52525b'}
            icon={MessageSquare}
            iconColor="#8b5cf6"
            iconBg="rgba(139,92,246,0.1)"
            sparkIdx={2}
          />
          {/* Revenue: shows real order data when available, else "—" (productCount×49 estimate removed) */}
          <StatCard
            label={
              timeSavedHours > 0 ? 'Time Saved' : orderCount > 0 ? 'Revenue (AUD)' : 'Revenue (AUD)'
            }
            numericValue={
              timeSavedHours > 0
                ? null
                : ordersQuery.isLoading
                  ? null
                  : orderCount > 0
                    ? revenuePotential
                    : null
            }
            displayValue={
              timeSavedHours > 0
                ? `${timeSavedHours}h`
                : orderCount === 0 && !ordersQuery.isLoading
                  ? '—'
                  : undefined
            }
            sub={
              timeSavedHours > 0
                ? 'Hours saved with AI'
                : orderCount > 0
                  ? `${orderCount} order${orderCount !== 1 ? 's' : ''}`
                  : 'Connect your store'
            }
            subColor={timeSavedHours > 0 || orderCount > 0 ? '#10b981' : '#52525b'}
            icon={timeSavedHours > 0 ? Timer : BarChart2}
            iconColor="#10b981"
            iconBg="rgba(16,185,129,0.1)"
            sparkIdx={3}
          />
        </div>

        {/* Sales Overview */}
        <SalesOverview orderCount={orderCount} />

        {/* Maya's Daily Recommendation */}
        <DashboardAISuggestion
          userProfile={{
            niche: profileQuery.data?.targetNiche ?? undefined,
            market: profileQuery.data?.country ?? 'Australia',
            experience: profileQuery.data?.experienceLevel ?? undefined,
          }}
        />

        {/* Personalised Product Feed */}
        <PersonalisedFeed />

        {/* Quick Actions */}
        <div className="mb-8">
          <div
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: '#52525b', fontFamily: 'Syne, sans-serif' }}
          >
            Quick Actions
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                {
                  label: 'Winning Products',
                  path: '/app/winning-products',
                  icon: ShoppingBag,
                  color: '#10b981',
                  desc: 'AU trending products',
                },
                {
                  label: 'Ask Maya',
                  path: '/app/ai-chat',
                  icon: MessageSquare,
                  color: '#d4af37',
                  desc: 'AI market intelligence',
                },
                {
                  label: 'Supplier Search',
                  path: '/app/suppliers',
                  icon: Package,
                  color: '#7c6af5',
                  desc: 'Source AU-ready products',
                },
                {
                  label: 'Store Health',
                  path: '/store-health',
                  icon: Star,
                  color: '#f59e0b',
                  desc: 'Free health score',
                },
              ] as const
            ).map(({ label, path, icon: Icon, color, desc }) => (
              <button
                key={path}
                onClick={() => setLocation(path)}
                className="flex flex-col rounded-xl p-4 transition-all text-left"
                style={{
                  background: '#0c0c10',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${color}50`;
                  e.currentTarget.style.background = `${color}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.background = '#0c0c10';
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${color}12` }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
                <span
                  className="text-sm font-bold block mb-0.5"
                  style={{ color: '#f5f5f5', fontFamily: 'Syne, sans-serif' }}
                >
                  {label}
                </span>
                <span
                  className="text-xs"
                  style={{ color: '#52525b' }}
                >
                  {desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Tools */}
        {recommendedTools.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#52525b', fontFamily: 'Syne, sans-serif' }}
              >
                Recommended for you
              </div>
              <span className="text-xs" style={{ color: '#3f3f46' }}>
                Based on your goals
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recommendedTools.map((tool, idx) => {
                const isMostUsed = MOST_USED_IDS.includes(tool.id) && idx < 2;
                const isNew = NEW_TOOL_IDS.includes(tool.id);
                const isHovered = hoveredTool === tool.id;
                return (
                  <div
                    key={tool.id}
                    className="relative"
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 6px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 50,
                          background: '#1a1a24',
                          border: '1px solid rgba(212,175,55,0.2)',
                          borderRadius: 8,
                          padding: '6px 10px',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                        }}
                      >
                        <span style={{ fontSize: 11, color: '#a1a1aa' }}>{tool.description}</span>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -5,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 8,
                            height: 8,
                            background: '#1a1a24',
                            borderRight: '1px solid rgba(212,175,55,0.2)',
                            borderBottom: '1px solid rgba(212,175,55,0.2)',
                            rotate: '45deg',
                          }}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => setLocation(tool.path)}
                      className="w-full text-left rounded-xl p-4 transition-all"
                      style={{
                        background: '#0c0c10',
                        border: `1px solid ${isHovered ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.1)'}`,
                        cursor: 'pointer',
                        transform: isHovered ? 'translateY(-4px)' : 'none',
                        boxShadow: isHovered ? '0 8px 24px rgba(212,175,55,0.1)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8, minHeight: 16 }}>
                        {isMostUsed && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              background: 'rgba(212,175,55,0.12)',
                              color: '#d4af37',
                              borderRadius: 4,
                              padding: '2px 6px',
                              letterSpacing: '0.03em',
                            }}
                          >
                            Most popular
                          </span>
                        )}
                        {isNew && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              background: 'rgba(139,92,246,0.15)',
                              color: '#8b5cf6',
                              borderRadius: 4,
                              padding: '2px 6px',
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                        style={{
                          background: 'rgba(212,175,55,0.08)',
                          filter: isHovered ? 'drop-shadow(0 0 8px #d4af37)' : 'none',
                          transition: 'filter 0.2s ease',
                        }}
                      >
                        {createElement(tool.icon, { size: 16, style: { color: '#d4af37' } })}
                      </div>
                      <div
                        className="text-sm font-bold mb-0.5"
                        style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5' }}
                      >
                        {tool.label}
                      </div>
                      <div className="text-xs mb-3" style={{ color: '#52525b', lineHeight: 1.5 }}>
                        {tool.description}
                      </div>
                      <div
                        className="flex items-center gap-1 text-xs font-bold"
                        style={{ color: '#d4af37' }}
                      >
                        Try it <ArrowRight size={10} />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recently Used */}
        {recentTools.length > 0 && (
          <div className="mb-8">
            <div
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: '#52525b', fontFamily: 'Syne, sans-serif' }}
            >
              Recently Used
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {recentTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setLocation(tool.path)}
                  className="flex items-center gap-2.5 rounded-lg p-3 transition-all"
                  style={{
                    background: '#0c0c10',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.background = '#0c0c10';
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(212,175,55,0.08)' }}
                  >
                    {createElement(tool.icon, { size: 12, style: { color: '#d4af37' } })}
                  </div>
                  <span className="text-xs font-medium truncate" style={{ color: '#f5f5f5' }}>
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Two-column */}
        <div className="flex gap-6 mb-8" style={{ alignItems: 'flex-start' }}>
          <div className="flex-1 min-w-0 space-y-4">
            <div
              className="rounded-xl p-4"
              style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: '#52525b', fontFamily: 'Syne, sans-serif' }}
              >
                Active Product
              </div>
              {activeProduct ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-sm font-bold"
                      style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5' }}
                    >
                      {activeProduct.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(212,175,55,0.1)', color: '#d4af37' }}
                    >
                      {activeProduct.niche}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
                    {activeProduct.summary.slice(0, 120)}
                    {activeProduct.summary.length > 120 ? '...' : ''}
                  </p>
                  <button
                    onClick={() => setLocation('/app/product-discovery')}
                    className="flex items-center gap-1.5 text-xs font-bold"
                    style={{
                      color: '#d4af37',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Open in Tools <ArrowRight size={12} />
                  </button>
                </div>
              ) : (
                <ProductImporter compact={false} onSuccess={() => {}} />
              )}
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: '#52525b', fontFamily: 'Syne, sans-serif' }}
                >
                  Recent Activity
                </div>
                {activityLog.length > 0 && (
                  <button
                    onClick={() => setLocation('/app/history')}
                    className="text-xs flex items-center gap-1"
                    style={{
                      color: '#d4af37',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    View all <ArrowUpRight size={10} />
                  </button>
                )}
              </div>
              {activityLog.length === 0 ? (
                <p className="text-xs" style={{ color: '#52525b' }}>
                  No recent activity.{' '}
                  <button
                    onClick={() => setLocation('/app/product-discovery')}
                    className="underline"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#d4af37',
                      padding: 0,
                      fontSize: 'inherit',
                    }}
                  >
                    Start exploring
                  </button>
                </p>
              ) : (
                <div className="space-y-1">
                  {activityLog.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-2 py-2 rounded-lg">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(245,158,11,0.1)' }}
                      >
                        <span style={{ fontSize: 9, color: '#d4af37' }}>&#x25CF;</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: '#f5f5f5' }}>
                          {entry.label}
                        </div>
                      </div>
                      <div className="text-xs flex-shrink-0" style={{ color: '#52525b' }}>
                        {getRelativeTime(entry.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ width: 280, flexShrink: 0 }} className="space-y-4 hidden md:block">
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(212,175,55,0.03)',
                border: '1px solid rgba(212,175,55,0.15)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Star size={12} style={{ color: '#d4af37' }} />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}
                >
                  Launch Kit
                </span>
              </div>
              <h3
                className="text-sm font-bold mb-1"
                style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5' }}
              >
                Full AU Launch Kit
              </h3>
              <p className="text-xs mb-4" style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
                Brand &rarr; Copy &rarr; Website &rarr; Ads &rarr; Emails — all AU-native.
              </p>
              <button
                onClick={() => setLocation('/app/launch-kit')}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #d4af37, #b8941f)',
                  color: '#060608',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                Try Launch Kit <ArrowRight size={11} />
              </button>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: '#52525b', fontFamily: 'Syne, sans-serif' }}
              >
                Your Progress
              </div>
              <div className="flex items-center gap-1">
                {['Research', 'Brand', 'Copy', 'Launch'].map((step, idx) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: idx === 0 ? '#10b981' : 'rgba(255,255,255,0.06)',
                          color: idx === 0 ? '#0a0a0a' : '#52525b',
                          fontSize: 9,
                        }}
                      >
                        {idx === 0 ? '\u2713' : idx + 1}
                      </div>
                      <span style={{ fontSize: 9, color: idx === 0 ? '#10b981' : '#52525b' }}>
                        {step}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div
                        className="flex-1 h-px mb-3"
                        style={{ background: idx === 0 ? '#10b981' : 'rgba(255,255,255,0.06)' }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full Tool Grid */}
        <div className="mb-3 flex items-center justify-between">
          <div
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: '#52525b', fontFamily: 'Syne, sans-serif' }}
          >
            All Tools
          </div>
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: '#52525b' }}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tools..."
              className="pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#f5f5f5',
                width: 160,
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.3)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.06)')}
            />
          </div>
        </div>
        {filteredStages.map((stage) => (
          <div key={stage.stage} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: stage.color, fontFamily: 'Syne, sans-serif' }}
              >
                {stage.stage}
              </span>
              <span className="text-xs" style={{ color: '#3f3f46' }}>
                {stage.tools.length} tools
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stage.tools.map((tool) => {
                const isNew =
                  tool.id === 'tiktok' || tool.id === 'launch-kit' || tool.id === 'au-trending';
                const isPopular =
                  tool.id === 'product-discovery' ||
                  tool.id === 'website-generator' ||
                  tool.id === 'meta-ads';
                return (
                  <button
                    key={tool.id}
                    onClick={() => setLocation(tool.path)}
                    className="text-left rounded-xl p-4 transition-all"
                    style={{
                      background: '#0c0c10',
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${stage.color}40`;
                      e.currentTarget.style.background = `${stage.color}06`;
                      e.currentTarget.style.boxShadow = `0 4px 24px ${stage.color}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.background = '#0c0c10';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${stage.color}12` }}
                      >
                        {createElement(tool.icon, { size: 14, style: { color: stage.color } })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className="text-sm font-bold"
                            style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5' }}
                          >
                            {tool.label}
                          </span>
                          {isNew && (
                            <span
                              className="px-1.5 py-0.5 rounded text-xs"
                              style={{
                                background: 'rgba(212,175,55,0.15)',
                                color: '#d4af37',
                                fontSize: 9,
                                fontWeight: 700,
                              }}
                            >
                              NEW
                            </span>
                          )}
                          {isPopular && !isNew && (
                            <span
                              className="px-1.5 py-0.5 rounded text-xs"
                              style={{
                                background: 'rgba(139,92,246,0.12)',
                                color: '#8b5cf6',
                                fontSize: 9,
                                fontWeight: 700,
                              }}
                            >
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs mb-2" style={{ color: '#71717a', lineHeight: 1.5 }}>
                          {tool.description}
                        </p>
                        <div
                          className="flex items-center gap-1 text-xs"
                          style={{ color: stage.color, fontWeight: 600 }}
                        >
                          Try it <ArrowRight size={10} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
