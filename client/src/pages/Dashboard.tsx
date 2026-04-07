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
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { GradientText } from '@/components/ui/GradientText';
import { Card3D } from '@/components/ui/Card3D';
import { EncryptedText } from '@/components/ui/EncryptedText';
import { Spotlight } from '@/components/ui/Spotlight';
import React, { createElement, useEffect, useMemo, useRef, useState } from 'react';
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
import { getCategoryStyle } from '@/lib/categoryColors';
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
          <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>
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
      background: '#0E1420',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, padding: 20, marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 15, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
          {userNiche ? `🔥 Top Products in ${userNiche}` : '🔥 Today\'s Top Revenue Products'}
        </h3>
        <a href="/app/winning-products" style={{ fontSize: 12, color: '#6366F1', textDecoration: 'none' }}>View all →</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {products.map((p, i) => (
          <div key={String(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: '#94A3B8', width: 20 }}>#{i+1}</span>
            <ProductImage src={p.image_url ? String(p.image_url) : undefined} alt="" size={32} />
            <span style={{ flex: 1, fontSize: 13, color: '#E5E7EB', fontWeight: 500 }}>{String(p.product_title ?? '')}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>
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
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
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
  Fitness:     { bg: 'rgba(6,182,212,0.15)',  text: '#22d3ee' },
  Supplements: { bg: 'rgba(168,85,247,0.15)',  text: '#c084fc' },
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
    <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', fontFamily: UI, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#22C55E' }}>${payload[0].value.toLocaleString()}</div>
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
            <X size={11} style={{ color: '#94A3B8' }} />
          </button>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          Sales Overview
        </span>
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 3 }}>
          {RANGE_OPTIONS.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} style={{
              padding: '4px 11px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, fontFamily: UI, letterSpacing: '-0.01em',
              background: range === r.key ? '#6366F1' : 'transparent',
              color: range === r.key ? '#FAFAFA' : '#9CA3AF',
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
          <div key={k.label} style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 9 }}>
              <k.icon size={12} style={{ color: '#818CF8' }} />
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, letterSpacing: '0.01em' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginBottom: 8, lineHeight: 1 }}>
              {k.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                ↑ {k.change}%
              </span>
              <MiniSparkSvg data={k.spark} color="#22C55E" />
            </div>
          </div>
        ))}
      </div>

      {/* Revenue area chart */}
      <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 14px 10px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 12, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Revenue</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: UI }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis width={45} tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: UI }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
            <Tooltip content={<SalesTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={1.8} fill="url(#goldGrad)" dot={false} activeDot={{ r: 3, fill: '#6366F1', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#94A3B8', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Top Products</span>
          <a href="/app/winning-products" style={{ fontSize: 12, color: '#818CF8', textDecoration: 'none', fontWeight: 500 }}>View all →</a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['#', 'Product', 'Category', 'Units Sold', 'Revenue', 'vs last period'].map((h) => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Units Sold' || h === 'Revenue' ? 'right' as const : 'left' as const, color: '#94A3B8', fontWeight: 600, fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase' as const, fontFamily: UI, whiteSpace: 'nowrap' as const }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_PRODUCTS.map((p, i) => {
                const isDark = p.cat === 'Supplements';
                const cc = isDark
                  ? { bg: 'rgba(168,85,247,0.15)', text: '#C084FC' }
                  : { bg: 'rgba(99,102,241,0.15)', text: '#818CF8' };
                return (
                  <tr key={p.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '9px 10px', color: i === 0 ? '#FACC15' : '#9CA3AF', fontSize: 12, fontWeight: i === 0 ? 700 : 600, fontVariantNumeric: 'tabular-nums', width: 28 }}>{i + 1}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>{p.emoji}</span>
                        <span style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500, whiteSpace: 'nowrap' as const }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: cc.bg, color: cc.text, fontWeight: 600 }}>{p.cat}</span>
                    </td>
                    <td style={{ padding: '9px 10px', color: '#94A3B8', fontSize: 13, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' }}>{p.units.toLocaleString()}</td>
                    <td style={{ padding: '9px 10px', color: '#22C55E', fontWeight: 600, fontSize: 13, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' }}>${p.revenue.toLocaleString()}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right' as const }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
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
      <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#94A3B8', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Recent Orders</span>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Updated just now</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {DEMO_ORDERS.map((o) => {
            const sc = STATUS_CFG[o.status];
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderRadius: 8, transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {/* Avatar */}
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: o.color + '22', border: `1px solid ${o.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: o.color }}>{o.initials}</span>
                </div>
                {/* Name + product */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{o.customer}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>{o.id}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{o.product}</span>
                </div>
                {/* Amount */}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#22C55E', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
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

interface LeaderboardProduct {
  id: string;
  product_title: string;
  category?: string;
  winning_score?: number;
  est_daily_revenue_aud?: number;
  trend?: string;
  image_url?: string;
}

// Category colors handled inline per section

function LeaderboardSection({ isMobile, setLocation }: { isMobile: boolean; setLocation: (p: string) => void }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardProduct[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        const res = await fetch('/api/products?limit=10&sortBy=winning_score&sortDir=desc', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const d = await res.json();
          const arr = Array.isArray(d) ? d : Array.isArray(d?.products) ? d.products : [];
          setLeaderboard(arr.slice(0, 10));
          setLeaderboardError(false);
        } else {
          setLeaderboardError(true);
        }
      } catch {
        setLeaderboardError(true);
      }
      setLeaderboardLoading(false);
    };
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getRankDisplay = (i: number) => {
    if (i === 0) return <span style={{ fontSize: 14, color: '#fbbf24', fontWeight: 800 }}>1</span>;
    return <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 700 }}>{i + 1}</span>;
  };

  const getScoreTier = (score: number) => {
    if (score >= 65) return { bg: 'rgba(34,197,94,0.15)', color: '#22C55E', label: '🔥 Hot' };
    if (score >= 60) return { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: '📈 Rising' };
    return { bg: 'rgba(255,255,255,0.06)', color: '#94A3B8', label: '' };
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', display: 'inline-block', marginRight: 8 }} />
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 700, color: '#FFFFFF' }}>This Week&apos;s Leaders</span>
        </div>
        <button onClick={() => setLocation('/app/intelligence')} style={{ fontSize: 13, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>View all →</button>
      </div>

      {leaderboardLoading ? (
        <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ width: 24, height: 14, borderRadius: 4, background: 'linear-gradient(90deg, rgba(255,255,255,.06) 25%, rgba(255,255,255,.10) 50%, rgba(255,255,255,.06) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ width: 36, height: 36, borderRadius: 6, background: 'linear-gradient(90deg, rgba(255,255,255,.06) 25%, rgba(255,255,255,.10) 50%, rgba(255,255,255,.06) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 13, width: '55%', borderRadius: 4, background: 'linear-gradient(90deg, rgba(255,255,255,.06) 25%, rgba(255,255,255,.10) 50%, rgba(255,255,255,.06) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 6 }} />
                <div style={{ height: 10, width: '30%', borderRadius: 4, background: 'linear-gradient(90deg, rgba(255,255,255,.06) 25%, rgba(255,255,255,.10) 50%, rgba(255,255,255,.06) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
              </div>
            </div>
          ))}
        </div>
      ) : leaderboardError ? (
        <div style={{ padding: '24px', textAlign: 'center' as const, color: '#9CA3AF', fontSize: 13, background: '#0E1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14 }}>
          Could not load leaderboard
        </div>
      ) : leaderboard.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center' as const, color: '#9CA3AF', fontSize: 13, background: '#0E1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14 }}>
          No products tracked yet
        </div>
      ) : isMobile ? (
        /* Mobile: horizontal scroll strip */
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto' as const, paddingBottom: 8, scrollbarWidth: 'none' as const }}>
          {leaderboard.map((p, i) => {
            const score = p.winning_score ?? 0;
            const tier = getScoreTier(score);
            return (
              <div key={p.id} onClick={() => setLocation('/app/intelligence')} style={{ flexShrink: 0, width: 160, background: '#0E1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, cursor: 'pointer' }}>
                <div style={{ marginBottom: 8 }}>{getRankDisplay(i)}</div>
                {p.image_url ? (
                  <img src={p.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' as const, marginBottom: 8, border: '1px solid rgba(255,255,255,0.1)' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#818CF8', marginBottom: 8 }}>
                    {(p.product_title || 'P').charAt(0)}
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, marginBottom: 6, lineHeight: 1.4 }}>{p.product_title}</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: tier.bg, color: tier.color }}>{score}/100</span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop: table layout */
        <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['#', 'Product', 'Category', 'Dropship Score', 'Est. Rev/Day', 'Trend', ''].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', padding: '10px 16px', textAlign: 'left' as const, whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((p, i) => {
                const score = p.winning_score ?? 0;
                const tier = getScoreTier(score);
                const cat = p.category ?? 'General';
                const cs = getCategoryStyle(cat);
                const truncTitle = (p.product_title || '').length > 32 ? (p.product_title || '').slice(0, 32) + '...' : (p.product_title || '');
                return (
                  <tr key={p.id} style={{ borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 120ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setLocation('/app/intelligence')}>
                    <td style={{ padding: '10px 16px', width: 40 }}>{getRankDisplay(i)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' as const, flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#818CF8', flexShrink: 0 }}>
                            {(p.product_title || 'P').charAt(0)}
                          </div>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{truncTitle}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: cs.background, color: cs.color, fontWeight: 600, border: cs.border }}>{cat}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, score)}%`, background: tier.color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: tier.color }}>{score}/100</span>
                        {tier.label && <span style={{ fontSize: 11, color: tier.color }}>{tier.label}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600 }}>
                      {p.est_daily_revenue_aud ? <span style={{ color: '#22C55E' }}>${p.est_daily_revenue_aud.toFixed(0)}</span> : <span style={{ color: '#94A3B8' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {(p.trend === 'rising' || p.trend === 'exploding') ? (
                        <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>↑ Rising</span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>→ Steady</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button onClick={e => { e.stopPropagation(); setLocation('/app/intelligence'); }} style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8', borderRadius: 6, padding: '4px 8px', fontSize: 12, border: 'none', cursor: 'pointer', fontWeight: 600 }}>→</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DailyBrief() {
  const [brief, setBrief] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const niche = localStorage.getItem('majorka_niche') || 'ecommerce';
    const cacheKey = `majorka_daily_brief_${today}_${niche}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setBrief(cached); return; }

    if (!session?.access_token) return;
    setLoading(true);

    fetch('/api/daily-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ niche }),
    })
      .then(r => r.json())
      .then(d => {
        const text = d.brief || '';
        if (text) localStorage.setItem(cacheKey, text);
        setBrief(text);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  if (!brief && !loading) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 14, padding: '18px 20px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>🔥</span>
        <span style={{ fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)' }}>
          Today's Best Opportunity
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
          {new Date().toLocaleDateString('en-AU', { weekday: 'long' })}
        </span>
      </div>
      {loading ? (
        <div style={{ height: 56, background: 'rgba(99,102,241,0.06)', borderRadius: 8, animation: 'shimmer 1.8s ease-in-out infinite' }} />
      ) : (
        <>
          <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.75, whiteSpace: 'pre-wrap' as const, margin: 0 }}>{brief}</p>
          <button
            onClick={() => setLocation('/app/intelligence')}
            style={{ marginTop: 12, fontSize: 12, color: '#818CF8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A5B4FC')}
            onMouseLeave={e => (e.currentTarget.style.color = '#818CF8')}
          >
            Find these products →
          </button>
        </>
      )}
    </div>
  );
}

const GETTING_STARTED_STEPS = [
  { id: 'profile',   label: 'Set your niche',          path: '/app/settings',             desc: 'Settings → Profile' },
  { id: 'products',  label: 'Find a winning product',   path: '/app/product-intelligence', desc: 'Products → Trending' },
  { id: 'profit',    label: 'Run a profit calculation',  path: '/app/profit-calc',          desc: 'Profit Calculator' },
  { id: 'ads',       label: 'Generate ad creative',     path: '/app/ads-studio',           desc: 'Ads Studio' },
  { id: 'store',     label: 'Build or connect a store',  path: '/app/store-builder',        desc: 'Store Builder' },
];

function GettingStartedChecklist({ userId, userCreatedAt, setLocation }: { userId?: string; userCreatedAt?: string; setLocation: (p: string) => void }) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`majorka_onboarding_${userId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [checklistDismissed, setChecklistDismissed] = useState(() =>
    localStorage.getItem(`majorka_onboarding_done_${userId}`) === '1'
  );

  const isNewUser = userCreatedAt
    ? (Date.now() - new Date(userCreatedAt).getTime()) < 14 * 24 * 60 * 60 * 1000
    : true;
  const showChecklist = !checklistDismissed && (isNewUser || completedSteps.size < GETTING_STARTED_STEPS.length);

  const markStep = (stepId: string) => {
    const next = new Set(completedSteps);
    next.add(stepId);
    setCompletedSteps(next);
    localStorage.setItem(`majorka_onboarding_${userId}`, JSON.stringify([...next]));
    if (next.size === GETTING_STARTED_STEPS.length) {
      setTimeout(() => {
        setChecklistDismissed(true);
        localStorage.setItem(`majorka_onboarding_done_${userId}`, '1');
      }, 2000);
    }
  };

  if (!showChecklist) return null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, marginBottom: 24, overflow: 'hidden',
    }}>
      <div
        onClick={() => setChecklistOpen(!checklistOpen)}
        style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>🚀</span>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#FFFFFF' }}>Getting Started</span>
          <span style={{ fontSize: 12, color: '#818CF8', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '2px 10px' }}>
            {completedSteps.size}/{GETTING_STARTED_STEPS.length} complete
          </span>
        </div>
        <span style={{ color: '#9CA3AF', fontSize: 18 }}>{checklistOpen ? '▾' : '▸'}</span>
      </div>
      {/* Progress bar */}
      <div style={{ padding: '0 20px', marginBottom: checklistOpen ? 12 : 0 }}>
        <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
          <div style={{ height: 4, background: '#6366F1', borderRadius: 99, width: `${(completedSteps.size / GETTING_STARTED_STEPS.length) * 100}%`, transition: 'width 300ms' }} />
        </div>
      </div>
      {checklistOpen && (
        <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GETTING_STARTED_STEPS.map(step => (
            <div
              key={step.id}
              onClick={() => { markStep(step.id); setLocation(step.path); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8,
                background: completedSteps.has(step.id) ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!completedSteps.has(step.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = completedSteps.has(step.id) ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.03)'; }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: completedSteps.has(step.id) ? '2px solid #6366F1' : '2px solid rgba(255,255,255,0.3)',
                background: completedSteps.has(step.id) ? '#6366F1' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {completedSteps.has(step.id) && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: completedSteps.has(step.id) ? '#6B7280' : '#E5E7EB', textDecoration: completedSteps.has(step.id) ? 'line-through' : 'none' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{step.desc}</div>
              </div>
              <span style={{ color: '#94A3B8', fontSize: 14, flexShrink: 0 }}>›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardHome() {
  const { user, isPro, subPlan, subStatus } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || (user as any)?.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'there';
  const isPaid = (subPlan === 'builder' || subPlan === 'scale') && subStatus === 'active';
  const planLabel = subPlan ? (subPlan.charAt(0).toUpperCase() + subPlan.slice(1) + ' Plan') : null;


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

  // Total product count from DB (for KPI card)
  const [totalProducts, setTotalProducts] = React.useState<number | null>(null);
  React.useEffect(() => {
    supabase.from('winning_products').select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count !== null) setTotalProducts(count); });
  }, []);

  // Real weekly opportunity — sum from actual tracked products
  const totalDailyRevOpp = products.reduce((sum: number, p: any) => sum + (p.est_daily_revenue_aud ?? p.est_daily_revenue ?? 0), 0);
  const weeklyRevOpp = Math.round(totalDailyRevOpp * 7);
  // Fallback: if API returns 0, compute from price x units_per_day x 7 for top 20
  const estimatedWeeklyOpp = weeklyRevOpp > 0 ? weeklyRevOpp : (() => {
    const sorted = [...products].sort((a: any, b: any) => ((b as any).winning_score || 0) - ((a as any).winning_score || 0));
    return Math.round(sorted.slice(0, 20).reduce((sum: number, p: any) => {
      const price = (p as any).price_aud || (p as any).estimated_retail_aud || 0;
      const upd = (p as any).units_per_day || 4;
      return sum + price * upd * 7;
    }, 0));
  })();
  const fmtWeeklyDisplay = estimatedWeeklyOpp >= 1_000_000
    ? `~$${(estimatedWeeklyOpp / 1_000_000).toFixed(1)}M`
    : estimatedWeeklyOpp >= 1_000
    ? `~$${(estimatedWeeklyOpp / 1_000).toFixed(1)}k`
    : `~$${estimatedWeeklyOpp}`;
  // Distribute across 7 days with slight growth curve (proportional to real total)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
    const growthFactors = [0.82, 0.88, 0.90, 0.94, 0.97, 1.02, 1.06];
    return { day, rev: Math.round((estimatedWeeklyOpp / 7 || 4500) * growthFactors[i]) };
  });

  const bestRevenue = useMemo(() => {
    if (!products.length) return '$41.2k';
    const top = Math.max(...(products as any[]).map((p: any) => p.est_monthly_revenue_aud || (p.est_daily_revenue_aud ? p.est_daily_revenue_aud * 30 : 0)));
    return top > 0 ? `$${(top / 1000).toFixed(1)}k` : '$41.2k';
  }, [products]);

  const avgMargin = useMemo(() => {
    const margins = (products as any[]).map((p: any) => p.profit_margin).filter((m: any) => m && m > 0);
    if (!margins.length) return '57%';
    const avg = Math.round(margins.reduce((a: number, b: number) => a + b, 0) / margins.length);
    return `${avg}%`;
  }, [products]);

  return (
    <div style={{ minHeight: '100vh', background: '#060A12', padding: '0' }}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ background: '#0E1420', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 26, color: '#FFFFFF', marginBottom: 4 }}>
            👋 {getGreeting()}, <GradientText>{firstName}</GradientText>
          </div>
          <div style={{ fontSize: 14, color: '#D1D5DB' }}>{formatDate()}{planLabel ? ` · ${planLabel}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isPaid && (
            <button onClick={() => setLocation('/pricing')} style={{ height: 38, padding: '0 18px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'transform 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              Upgrade to Builder &rarr;
            </button>
          )}
          <ShimmerButton onClick={() => setLocation('/app/intelligence')} className="flex items-center gap-2">
            <Package size={14} /> Find Products
          </ShimmerButton>
        </div>
      </div>

      {/* ── Widget grid ──────────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 32px)', maxWidth: 1400, margin: '0 auto' }}>
        <DailyBrief />

        {/* Getting Started checklist */}
        <GettingStartedChecklist userId={user?.id} userCreatedAt={(user as any)?.created_at} setLocation={setLocation} />

        {/* Row 1: 4 stat cards */}
        <div className="stats-grid-responsive" style={{ gap: 16, marginBottom: 20 }}>
          {([
            { label: 'Products in DB', value: totalProducts !== null ? totalProducts.toString() : '—', delta: 'Total tracked products', icon: Package, path: '/app/intelligence' },
            { label: 'Best Est. Revenue', value: bestRevenue, delta: 'Highest in DB / month', icon: TrendingUp, path: '/app/intelligence' },
            { label: 'Avg Margin', value: avgMargin, delta: 'Across top 5 products', icon: Percent, path: '/app/intelligence' },
            { label: 'Hot Products', value: loading ? '—' : products.filter((p: any) => (p.winning_score || 0) >= 65).length.toString(), delta: 'Dropship Score 65+', icon: Zap, path: '/app/intelligence' },
          ]).map((card, i) => {
            const hotCount = card.label === 'Hot Products' ? parseInt(card.value) || 0 : -1;
            return (
            <div key={i} onClick={() => card.path && setLocation(card.path)} style={{
              background: '#0E1420',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: '22px 24px',
              cursor: 'pointer',
              transition: 'box-shadow 200ms, border-color 200ms',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: '#9CA3AF' }}>{card.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={16} color="#818CF8" />
                </div>
              </div>
              <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 30, color: '#FFFFFF', lineHeight: 1, marginBottom: 8 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                {hotCount === 0 ? <span style={{ color: '#94A3B8' }}>— {card.delta}</span> : hotCount > 0 ? <span style={{ color: '#22C55E' }}>↑ {card.delta}</span> : card.delta}
              </div>
            </div>
            );
          })}
        </div>

        {/* This Week's Leaders — leaderboard */}
        <LeaderboardSection isMobile={isMobile} setLocation={setLocation} />

        {/* Row 2: Wide chart + Quick actions */}
        <div className="chart-insight-grid">

          {/* Revenue trend chart */}
          <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17, color: '#F1F5F9' }}>Est. Market Opportunity</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Estimated weekly revenue across tracked products — not your store revenue</div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Bricolage Grotesque, sans-serif', color: '#22C55E' }}>{loading ? '—' : estimatedWeeklyOpp === 0 ? 'N/A' : fmtWeeklyDisplay}</span>
                {!loading && estimatedWeeklyOpp === 0 && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Connect store to track</div>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="indigo-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis width={46} tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip contentStyle={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#F1F5F9' }} formatter={(v: any) => [`$${(v / 1000).toFixed(1)}k`, 'Revenue']} />
                <Area type="monotone" dataKey="rev" stroke="#6366F1" strokeWidth={2.5} fill="url(#indigo-grad)" dot={{ fill: '#6366F1', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Workflow guide */}
          <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17, color: '#F1F5F9' }}>Your Workflow</div>
              <span style={{ fontSize: 11, color: '#818CF8', fontWeight: 600, background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(99,102,241,0.25)' }}>Click any step →</span>
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>The fastest path from zero to first sale</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {([
                { step: '1', icon: Search, label: 'Find a winning product', sub: 'Filter by niche, margin & trend', path: '/app/product-intelligence', done: false, color: '#6366F1' },
                { step: '2', icon: BarChart2, label: 'Run the numbers', sub: 'Check margins before buying stock', path: '/app/profit', done: false, color: '#8B5CF6' },
                { step: '3', icon: Eye, label: 'Spy on competitor ads', sub: 'See what\'s working before spending', path: '/app/ad-spy', done: false, color: '#0891B2' },
                { step: '4', icon: Megaphone, label: 'Generate your ad creative', sub: 'Maya writes Meta + TikTok ads', path: '/app/ads-studio', done: false, color: '#8B5CF6' },
                { step: '5', icon: Globe, label: 'Build your store', sub: 'Live Shopify store in 60 seconds', path: '/app/store-builder', done: false, color: '#059669' },
              ] as const).map((s, i) => (
                <button key={i} onClick={() => setLocation(s.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, background: s.done ? 'rgba(16,185,129,.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${s.done ? 'rgba(16,185,129,.25)' : 'rgba(255,255,255,0.06)'}`, borderLeft: `3px solid ${s.done ? '#10B981' : s.color}`, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 150ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = `${s.color}60`; e.currentTarget.style.borderLeftColor = s.color; }}
                  onMouseLeave={e => { e.currentTarget.style.background = s.done ? 'rgba(16,185,129,.1)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = s.done ? 'rgba(16,185,129,.25)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderLeftColor = s.done ? '#10B981' : s.color; }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.done ? 'rgba(16,185,129,.2)' : `${s.color}20`, border: `1.5px solid ${s.done ? '#10B981' : s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.done ? <span style={{ fontSize: 10, color: '#10B981' }}>✓</span> : <span style={{ fontSize: 9, fontWeight: 700, color: s.color }}>{s.step}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>{s.sub}</div>
                  </div>
                  <ArrowRight size={12} color="#4B5563" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Top products table + AI tip card */}
        <div className="products-ai-grid">

          {/* Top products */}
          <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17, color: '#F1F5F9' }}>Top Products Today</div>
              <button onClick={() => setLocation('/app/intelligence')} style={{ fontSize: 13, color: '#818CF8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>View all &rarr;</button>
            </div>
            {loading ? (
              <div style={{ padding: '0 24px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 13, width: '60%', borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }} />
                      <div style={{ height: 10, width: '35%', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
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
                    <a href="/app/intelligence" style={{ color: '#818CF8', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>Browse Product Intelligence →</a>
                  </div>
                ) : null}
                {(products.slice(0, 5)).map((p: any, i: number) => {
                  const score = p.winning_score ?? p.opportunity_score ?? 0;
                  const estRevenue = p.est_monthly_revenue_aud || 
                    (p.real_orders_count && p.real_price_aud ? Math.round(p.real_orders_count * p.real_price_aud * 0.3) : null);
                  const revenueDisplay = estRevenue 
                    ? estRevenue >= 1000 ? `$${(estRevenue/1000).toFixed(1)}k/mo` : `$${estRevenue}/mo`
                    : '—';
                  const margin = p.profit_margin ?? 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => setLocation('/app/intelligence')}
                    >
                      {p.image_url ? (
                        <img src={String(p.image_url)} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)', background: '#0E1420' }} onError={e => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.style && ((e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'); }} />
                      ) : null}
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: p.image_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#818CF8', flexShrink: 0 }}>
                        {(p.product_title ?? p.name ?? 'P').charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.product_title ?? p.name}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{margin > 0 ? `${margin}% margin · ` : ''}{p.category ?? 'General'}</div>
                      </div>
                      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#22C55E' }}>{revenueDisplay}</div>
                        <div style={{ marginTop: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: '50px', ...(score >= 80 ? { background: '#6366F1', color: 'white' } : score >= 65 ? { background: 'transparent', border: '1.5px solid #6366F1', color: '#818CF8' } : { background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }) }}>{score}</span>
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
            <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14, padding: '24px', color: 'white', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#818CF8', marginBottom: 12 }}>🏆 Top Product Right Now</div>
              {products[0].image_url && (
                <img src={String(products[0].image_url)} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 12, opacity: 0.9 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
              )}
              <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 16, lineHeight: 1.4, marginBottom: 8, color: 'white', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{products[0].product_title}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#D1D5DB', marginBottom: 8 }}>
                <span>Dropship Score <strong style={{ color: 'white' }}>{products[0].winning_score}</strong></span>
                <span>{products[0].category}</span>
                {products[0].profit_margin && <span>{products[0].profit_margin}% margin</span>}
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5, flex: 1 }}>
                Est. ${((() => {
                  const estRevenue = products[0].est_monthly_revenue_aud || 
                    (products[0].est_daily_revenue_aud ? products[0].est_daily_revenue_aud * 30 : null) ||
                    (products[0].real_orders_count && products[0].real_price_aud ? Math.round(products[0].real_orders_count * products[0].real_price_aud * 0.3) : null) ||
                    0;
                  return (estRevenue / 1000).toFixed(1);
                })())}k/mo · {products[0].trend === 'rising' || products[0].tiktok_signal ? '🔥 Trending' : '📈 Active'}
              </div>
              <button onClick={() => setLocation('/app/intelligence')} style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(99,102,241,0.2)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.2)')}
              >View full database &rarr;</button>
            </div>
          )}
        </div>

        {/* Row 4: Tools Bento Grid */}
        <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17, color: '#F1F5F9' }}>Your Tools</div>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>9 AI tools</span>
          </div>
          <div className="mkr-bento-grid">
            {([
              { id: 'intelligence', label: 'Product Intel', desc: 'Discover winning products', icon: '🔍', path: '/app/intelligence', wide: true },
              { id: 'store-builder', label: 'Store Builder', desc: 'Build in 60 seconds', icon: '🏪', path: '/app/store-builder' },
              { id: 'spy', label: 'Competitor Spy', desc: 'Analyse any store', icon: '🕵️', path: '/app/competitor-spy' },
              { id: 'ads', label: 'Ads Studio', desc: 'Generate ad creatives', icon: '🎯', path: '/app/ads-studio' },
              { id: 'maya', label: 'Maya AI', desc: 'Your AI advisor', icon: '🤖', path: '/app/ai-chat', wide: true },
              { id: 'market', label: 'Market Intel', desc: 'Live market data', icon: '📊', path: '/app/market' },
              { id: 'profit', label: 'Profit Calc', desc: 'Run the numbers', icon: '💰', path: '/app/profit' },
              { id: 'trend', label: 'Trend Radar', desc: 'Spot trends early', icon: '📡', path: '/app/trend-radar' },
              { id: 'learn', label: 'Learn Hub', desc: 'Courses & tutorials', icon: '🎓', path: '/app/learn' },
            ] as const).map(tool => (
              <div key={tool.id} className={`mkr-bento-cell ${tool.wide ? 'mkr-bento-cell-wide' : ''}`} onClick={() => setLocation(tool.path)} style={{ cursor: 'pointer' }}>
                <span className="bento-icon">{tool.icon}</span>
                <span className="bento-name">{tool.label}</span>
                <span className="bento-desc">{tool.desc}</span>
              </div>
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
