import { useIsMobile } from '@/hooks/useIsMobile';
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
  Eye,
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
import { SEO } from '@/components/SEO';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { ProductImage } from '@/components/ProductImage';
import OnboardingModal from '@/components/OnboardingModal';
import { ProductImporter } from '@/components/ProductImporter';
import ProductTour from '@/components/ProductTour';
import TrialBanner from '@/components/TrialBanner';
import WelcomeModal from '@/components/WelcomeModal';
import { OnboardingRegionModal } from '@/components/OnboardingRegionModal';
import { useActiveProduct } from '@/hooks/useActiveProduct';
import StreakWidget from '@/components/StreakWidget';
import { type ActivityEntry, getActivityLog, getRelativeTime } from '@/lib/activity';
import { allTools, getToolByPath, recordRecentTool, stages } from '@/lib/tools';
import { trpc } from '@/lib/trpc';
import { supabase } from '@/lib/supabase';
import { ONBOARDING_KEY } from '@/pages/Onboarding';
import { toast } from 'sonner';
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
  const isMobile = useIsMobile();
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const isToolPage = location.startsWith('/app/') && location !== '/app';
  const currentTool = isToolPage ? getToolByPath(location) : null;
  useDocumentTitle(currentTool?.label ?? 'Dashboard');
  const [showRegionOnboarding, setShowRegionOnboarding] = useState(() => {
    return !localStorage.getItem('majorka_onboarded') && !localStorage.getItem('majorka_region');
  });

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
    <>
      <div data-tour="dashboard" className="h-full">
        {isToolPage ? <ToolPage /> : <DashboardHome />}
      </div>
      {user && <OnboardingModal userName={user.name ?? undefined} />}
      {user && <WelcomeModal userName={user.name ?? undefined} />}
      {showRegionOnboarding && <OnboardingRegionModal onComplete={() => setShowRegionOnboarding(false)} />}
      <ProductTour />
    </>
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
      className="stat-card-top-border group rounded-xl p-4 transition-all"
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
              className="group-hover:text-[#6366F1] transition-colors"
              style={{ color: iconColor }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
            {label}
          </span>
        </div>
        {/* change badges removed — would need real analytics data */}
      </div>

      <div
        className="font-bold mb-1"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#6366F1', letterSpacing: '-0.02em', fontSize: 28, fontWeight: 700 }}
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
        background: 'rgba(99,102,241,0.07)',
        border: '1px solid rgba(99,102,241,0.18)',
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
      <span style={{ fontSize: 12, color: '#6366F1', fontWeight: 600 }}>
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
      background: 'white',
      border: '1px solid #F0F0F0',
      borderRadius: 16, padding: 20, marginBottom: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 15, fontWeight: 700, color: '#0A0A0A', margin: 0 }}>
          {userNiche ? `🔥 Top Products in ${userNiche}` : '🔥 Today\'s Top Revenue Products'}
        </h3>
        <a href="/app/winning-products" style={{ fontSize: 12, color: '#6366F1', textDecoration: 'none' }}>View all →</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {products.map((p, i) => (
          <div key={String(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#FAFAFA', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: '#6B7280', width: 20 }}>#{i+1}</span>
            <ProductImage src={p.image_url ? String(p.image_url) : undefined} alt="" size={32} />
            <span style={{ flex: 1, fontSize: 13, color: '#111111', fontWeight: 500 }}>{String(p.product_title ?? '')}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1' }}>
              ${Math.round((Number(p.est_daily_revenue_aud) || 0) * 30 / 1000)}k/mo
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: p.trend === 'exploding' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: p.trend === 'exploding' ? '#ef4444' : '#22c55e' }}>
              {p.trend === 'exploding' ? '🔥' : '📈'} {String(p.trend ?? '')}
            </span>
          </div>
        ))}
      </div>
      {!userNiche && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10 }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            💡 Set your niche in <a href="/app/settings" style={{ color: '#6366F1' }}>Settings</a> to see personalised product recommendations
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
      date: days <= 7 ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()] : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
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
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontFamily: UI, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#6366F1' }}>${payload[0].value.toLocaleString()}</div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, padding: '6px 12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(99,102,241,0.75)', fontWeight: 500, flex: 1 }}>
            📊 Showing sample data — orders from your store will appear here automatically
          </span>
          <button onClick={() => setBannerDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.5 }}>
            <X size={11} style={{ color: '#6B7280' }} />
          </button>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          Sales Overview
        </span>
        <div style={{ display: 'flex', gap: 3, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 3 }}>
          {RANGE_OPTIONS.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} style={{
              padding: '4px 11px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, fontFamily: UI, letterSpacing: '-0.01em',
              background: range === r.key ? '#6366F1' : 'transparent',
              color: range === r.key ? '#FAFAFA' : '#6B7280',
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
          <div key={k.label} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 9 }}>
              <k.icon size={12} style={{ color: '#9CA3AF' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, letterSpacing: '0.01em' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, color: '#374151', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginBottom: 8, lineHeight: 1 }}>
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
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '18px 14px 10px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 12, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Revenue</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke="#F9FAFB" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: UI }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis width={45} tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: UI }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<SalesTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={1.8} fill="url(#goldGrad)" dot={false} activeDot={{ r: 3, fill: '#6366F1', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Top Products</span>
          <a href="/app/winning-products" style={{ fontSize: 12, color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>View all →</a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F9FAFB' }}>
                {['#', 'Product', 'Category', 'Units Sold', 'Revenue', 'vs last period'].map((h) => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Units Sold' || h === 'Revenue' ? 'right' as const : 'left' as const, color: '#9CA3AF', fontWeight: 600, fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase' as const, fontFamily: UI, whiteSpace: 'nowrap' as const }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_PRODUCTS.map((p, i) => {
                const cc = CAT_CFG[p.cat] ?? { bg: 'rgba(113,113,122,0.12)', text: '#6B7280' };
                return (
                  <tr key={p.rank} style={{ borderBottom: '1px solid #FAFAFA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '9px 10px', color: '#6B7280', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', width: 28 }}>{i + 1}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>{p.emoji}</span>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, whiteSpace: 'nowrap' as const }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: cc.bg, color: cc.text, fontWeight: 600 }}>{p.cat}</span>
                    </td>
                    <td style={{ padding: '9px 10px', color: '#6B7280', fontSize: 13, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' }}>{p.units.toLocaleString()}</td>
                    <td style={{ padding: '9px 10px', color: '#6366F1', fontWeight: 600, fontSize: 13, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' }}>${p.revenue.toLocaleString()}</td>
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
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Recent Orders</span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>Updated just now</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {DEMO_ORDERS.map((o) => {
            const sc = STATUS_CFG[o.status];
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderRadius: 8, transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {/* Avatar */}
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: o.color + '22', border: `1px solid ${o.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: o.color }}>{o.initials}</span>
                </div>
                {/* Name + product */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{o.customer}</span>
                    <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 400 }}>{o.id}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#6B7280', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{o.product}</span>
                </div>
                {/* Amount */}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  ${o.amount.toFixed(2)}
                </span>
                {/* Status pill */}
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: sc.bg, color: sc.text, textTransform: 'capitalize' as const, flexShrink: 0 }}>
                  {o.status}
                </span>
                {/* Time */}
                <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, minWidth: 52, textAlign: 'right' as const }}>{o.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DashboardHome() {
  const { user, isPro, subPlan } = useAuth();
  const [, setLocation] = useLocation();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const plan = subPlan ?? 'free';


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const token = data?.session?.access_token;
      fetch('/api/products?limit=5&sortBy=winning_score&sortDir=desc', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(d => {
          const arr = Array.isArray(d) ? d : Array.isArray(d?.products) ? d.products : [];
          setProducts(arr);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, []);

  // Real weekly opportunity — sum from actual tracked products
  const totalDailyRevOpp = products.reduce((sum: number, p: any) => sum + (p.est_daily_revenue_aud ?? p.est_daily_revenue ?? 0), 0);
  const weeklyRevOpp = Math.round(totalDailyRevOpp * 7);
  const fmtWeekly = weeklyRevOpp >= 1_000_000
    ? `$${(weeklyRevOpp / 1_000_000).toFixed(1)}M`
    : weeklyRevOpp >= 1_000
    ? `$${(weeklyRevOpp / 1_000).toFixed(1)}k`
    : `$${weeklyRevOpp}`;
  // Distribute across 7 days with slight growth curve (proportional to real total)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
    const growthFactors = [0.82, 0.88, 0.90, 0.94, 0.97, 1.02, 1.06];
    return { day, rev: Math.round((totalDailyRevOpp || 4500) * growthFactors[i]) };
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '0' }}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ background: 'white', borderBottom: '1px solid #F0F0F0', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 26, color: '#0A0A0A', marginBottom: 4 }}>
            {getGreeting()}, {firstName} <span role="img" aria-label="wave">👋</span>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>{formatDate()} &middot; {plan === 'free' ? 'Free Plan' : plan === 'builder' ? 'Builder Plan' : plan === 'scale' ? 'Scale Plan' : plan === 'pro' ? 'Scale Plan' : (plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {plan === 'free' && (
            <button onClick={() => setLocation('/pricing')} style={{ height: 38, padding: '0 18px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'transform 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              Upgrade to Builder &rarr;
            </button>
          )}
          <button onClick={() => setLocation('/app/intelligence')} style={{ height: 38, padding: '0 18px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'transform 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            <Package size={14} /> Find Products
          </button>
        </div>
      </div>

      {/* ── Widget grid ──────────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 32px)', maxWidth: 1400, margin: '0 auto' }}>

        {/* Row 1: 4 stat cards */}
        <div className="stats-grid-responsive" style={{ gap: 16, marginBottom: 20 }}>
          {([
            { label: 'Products Found', value: '192', delta: '+12 this week', icon: Package, positive: true, color: '#6366F1', hero: false },
            { label: 'Est. Best Revenue', value: '$41.2k', delta: 'Top product / mo', icon: TrendingUp, positive: true, color: '#10B981', hero: true },
            { label: 'Avg Margin', value: '57%', delta: 'Across all products', icon: Percent, positive: true, color: '#8B5CF6', hero: false },
            { label: 'Hot Products', value: '23', delta: 'Score 80+', icon: Zap, positive: true, color: '#F59E0B', hero: false },
          ] as const).map((card, i) => (
            <div key={i} style={{
              background: card.hero ? 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)' : 'white',
              border: card.hero ? '1.5px solid #6EE7B7' : '1px solid #F0F0F0',
              borderLeft: card.hero ? '4px solid #10B981' : undefined,
              borderRadius: 14,
              padding: '22px 24px',
              cursor: 'default',
              transition: 'box-shadow 200ms, border-color 200ms',
              boxShadow: card.hero ? '0 2px 8px rgba(16,185,129,0.10), 0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = card.hero ? '0 4px 20px rgba(16,185,129,0.18)' : '0 4px 16px #E5E7EB'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = card.hero ? '0 2px 8px rgba(16,185,129,0.10), 0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: card.hero ? '#065F46' : '#6B7280' }}>{card.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${card.color}${card.hero ? '25' : '15'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={16} color={card.color} />
                </div>
              </div>
              <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: card.hero ? 36 : 30, color: card.hero ? '#065F46' : '#0A0A0A', lineHeight: 1, marginBottom: 8 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: card.positive ? (card.hero ? '#059669' : '#059669') : '#EF4444' }}>&uarr; {card.delta}</div>
            </div>
          ))}
        </div>

        {/* Row 2: Wide chart + Quick actions */}
        <div className="chart-insight-grid">

          {/* Revenue trend chart */}
          <div style={{ background: 'white', border: '1px solid #F0F0F0', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17, color: '#0A0A0A' }}>Market Revenue Trend</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Estimated AU market weekly revenue across tracked products — not your store revenue</div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Bricolage Grotesque, sans-serif', color: '#6366F1' }}>{loading ? '—' : fmtWeekly}</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="indigo-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis width={46} tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v/1000).toFixed(1)}k`} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`$${(v / 1000).toFixed(1)}k`, 'Revenue']} />
                <Area type="monotone" dataKey="rev" stroke="#6366F1" strokeWidth={2.5} fill="url(#indigo-grad)" dot={{ fill: '#6366F1', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Workflow guide */}
          <div style={{ background: 'white', border: '1px solid #F0F0F0', borderRadius: 14, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17, color: '#0A0A0A', marginBottom: 4 }}>Your Workflow</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>The fastest path from zero to first sale</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {([
                { step: '1', icon: Search, label: 'Find a winning product', sub: 'Filter by niche, margin & trend', path: '/app/product-intelligence', done: products.length > 0, color: '#6366F1' },
                { step: '2', icon: BarChart2, label: 'Run the numbers', sub: 'Check margins before buying stock', path: '/app/profit', done: false, color: '#8B5CF6' },
                { step: '3', icon: Eye, label: 'Spy on competitor ads', sub: 'See what\'s working before spending', path: '/app/ad-spy', done: false, color: '#0891B2' },
                { step: '4', icon: Megaphone, label: 'Generate your ad creative', sub: 'Maya writes Meta + TikTok ads', path: '/app/ads-studio', done: false, color: '#7C3AED' },
                { step: '5', icon: Globe, label: 'Build your store', sub: 'Live Shopify store in 60 seconds', path: '/app/store-builder', done: false, color: '#059669' },
              ] as const).map((s, i) => (
                <button key={i} onClick={() => setLocation(s.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, background: '#FAFAFA', border: '1px solid #F0F0F0', cursor: 'pointer', textAlign: 'left' as const }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = `${s.color}40`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#F0F0F0'; }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.done ? '#ECFDF5' : `${s.color}15`, border: `1.5px solid ${s.done ? '#10B981' : s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.done ? <span style={{ fontSize: 10, color: '#10B981' }}>✓</span> : <span style={{ fontSize: 9, fontWeight: 700, color: s.color }}>{s.step}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0A', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{s.sub}</div>
                  </div>
                  <ArrowRight size={12} color="#D1D5DB" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Top products table + AI tip card */}
        <div className="products-ai-grid">

          {/* Top products */}
          <div style={{ background: 'white', border: '1px solid #F0F0F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17, color: '#0A0A0A' }}>Top Products Today</div>
              <button onClick={() => setLocation('/app/intelligence')} style={{ fontSize: 13, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>View all &rarr;</button>
            </div>
            {loading ? (
              <div style={{ padding: '0 24px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid #F9FAFB' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 13, width: '60%', borderRadius: 4, background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 6 }} />
                      <div style={{ height: 10, width: '35%', borderRadius: 4, background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {products.length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                    <p style={{ marginBottom: 12 }}>No products yet — let's find your first winner.</p>
                    <a href="/app/intelligence" style={{ color: '#6366F1', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>Browse Product Intelligence →</a>
                  </div>
                ) : null}
                {(products.slice(0, 5)).map((p: any, i: number) => {
                  const score = p.winning_score ?? p.opportunity_score ?? 0;
                  const revenue = p.est_monthly_revenue_aud ?? 0;
                  const margin = p.profit_margin ?? 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < 4 ? '1px solid #F9FAFB' : 'none', cursor: 'pointer', transition: 'background 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => setLocation('/app/intelligence')}
                    >
                      {p.image_url ? (
                        <img src={String(p.image_url)} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #E5E7EB', background: '#F9FAFB' }} onError={e => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.style && ((e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'); }} />
                      ) : null}
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', display: p.image_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#6366F1', flexShrink: 0 }}>
                        {(p.product_title ?? p.name ?? 'P').charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.product_title ?? p.name}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{margin > 0 ? `${margin}% margin · ` : ''}{p.category ?? 'General'}</div>
                      </div>
                      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>${(revenue / 1000).toFixed(1)}k/mo</div>
                        <div style={{ marginTop: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: '50px', ...(score >= 80 ? { background: '#6366F1', color: 'white' } : score >= 65 ? { background: 'white', border: '1.5px solid #6366F1', color: '#6366F1' } : { background: '#F3F4F6', color: '#9CA3AF' }) }}>{score}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top product spotlight — real data from DB */}
          {products[0] && (
            <div style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', borderRadius: 14, padding: '24px', color: 'white', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, opacity: 0.75, marginBottom: 12 }}>🏆 Top Product Right Now</div>
              {products[0].image_url && (
                <img src={String(products[0].image_url)} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 12, opacity: 0.9 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
              )}
              <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 16, lineHeight: 1.4, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{products[0].product_title}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                <span>Score <strong style={{ color: 'white' }}>{products[0].winning_score}</strong></span>
                <span>{products[0].category}</span>
                {products[0].profit_margin && <span>{products[0].profit_margin}% margin</span>}
              </div>
              <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5, flex: 1 }}>
                Est. ${((products[0].est_monthly_revenue_aud ?? 0) / 1000).toFixed(1)}k/mo · {products[0].trend === 'rising' || products[0].tiktok_signal ? '🔥 Trending' : '📈 Active'}
              </div>
              <button onClick={() => setLocation('/app/intelligence')} style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'background 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              >View full database &rarr;</button>
            </div>
          )}
        </div>

        {/* Row 4: Tools grid */}
        <div style={{ background: 'white', border: '1px solid #F0F0F0', borderRadius: 14, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17, color: '#0A0A0A' }}>Your Tools</div>
            <span style={{ fontSize: 12, color: '#6B7280' }}>20+ AI tools</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
            {([
              { icon: Search, label: 'Product Intel', path: '/app/intelligence', color: '#6366F1' },
              { icon: Globe, label: 'Store Builder', path: '/app/store-builder', color: '#8B5CF6' },
              { icon: Eye, label: 'Competitor Spy', path: '/app/competitor-spy', color: '#0891B2' },
              { icon: BarChart2, label: 'Market Intel', path: '/app/market-intel', color: '#059669' },
              { icon: Megaphone, label: 'Ads Studio', path: '/app/ads-studio', color: '#D97706' },
              { icon: DollarSign, label: 'Profit Calc', path: '/app/profit-calculator', color: '#10B981' },
              { icon: MessageSquare, label: 'Maya AI', path: '/app/ai-chat', color: '#6366F1' },
              { icon: TrendingUp, label: 'Trend Radar', path: '/app/trend-radar', color: '#EC4899' },
              { icon: BookOpen, label: 'Learn Hub', path: '/app/learn', color: '#F59E0B' },
              { icon: ShoppingBag, label: 'My Products', path: '/app/my-products', color: '#374151' },
            ] as const).map((tool, i) => (
              <button key={i} onClick={() => setLocation(tool.path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', borderRadius: 10, background: '#FAFAFA', border: '1px solid #F0F0F0', cursor: 'pointer', transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = `${tool.color}30`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#F0F0F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tool.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <tool.icon size={18} color={tool.color} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 768px) {
          .dashboard-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .stats-grid-responsive { display: grid; grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 900px) { .stats-grid-responsive { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .stats-grid-responsive { grid-template-columns: 1fr; } }
        .chart-insight-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 20px; }
        @media (max-width: 900px) { .chart-insight-grid { grid-template-columns: 1fr; } }
        .products-ai-grid { display: grid; grid-template-columns: 3fr 1fr; gap: 16px; margin-bottom: 20px; }
        @media (max-width: 900px) { .products-ai-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
