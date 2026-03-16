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

/* ─── Demo data for SalesOverview ─── */
const DEMO_PRODUCTS = [
  { rank: 1, name: 'EMS Muscle Stimulator Pro', cat: 'Fitness', units: 847, revenue: 38115, trend: 18.4 },
  { rank: 2, name: 'Whey Protein Isolate 1kg', cat: 'Supplements', units: 612, revenue: 24480, trend: 24.1 },
  { rank: 3, name: 'Resistance Band Set (5-Pack)', cat: 'Fitness', units: 589, revenue: 17670, trend: 11.2 },
  { rank: 4, name: 'Creatine Monohydrate 500g', cat: 'Supplements', units: 534, revenue: 16020, trend: 9.8 },
  { rank: 5, name: 'Ab Roller Wheel Pro', cat: 'Fitness', units: 421, revenue: 12630, trend: 6.3 },
  { rank: 6, name: 'Collagen Peptides Powder', cat: 'Supplements', units: 398, revenue: 11940, trend: 31.7 },
  { rank: 7, name: 'Adjustable Dumbbell Set', cat: 'Fitness', units: 287, revenue: 28700, trend: 4.1 },
  { rank: 8, name: 'Pre-Workout Energy Formula', cat: 'Supplements', units: 261, revenue: 7830, trend: 15.9 },
];

const DEMO_ORDERS = [
  { id: '#1842', customer: 'Sarah M.', product: 'EMS Muscle Stimulator Pro', amount: 45, status: 'paid' as const, time: '2m ago' },
  { id: '#1841', customer: 'Jake T.', product: 'Whey Protein Isolate 1kg', amount: 40, status: 'paid' as const, time: '8m ago' },
  { id: '#1840', customer: 'Emma K.', product: 'Creatine Monohydrate 500g', amount: 30, status: 'fulfilled' as const, time: '14m ago' },
  { id: '#1839', customer: 'Liam R.', product: 'Resistance Band Set', amount: 30, status: 'paid' as const, time: '22m ago' },
  { id: '#1838', customer: 'Olivia S.', product: 'Collagen Peptides Powder', amount: 30, status: 'fulfilled' as const, time: '31m ago' },
];

const BASE_REVENUES = [1820,2140,1960,2380,2720,1840,1620,2060,2280,2440,2150,1980,2310,2580,2420,2190,1870,2650,2880,2730,2410,2060,1950,2340,2710,2490,2230,1880,2560,2840];

function getDemoChartData(range: string) {
  const today = new Date();
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const slice = days <= 30 ? BASE_REVENUES.slice(-Math.min(days, 14)) : BASE_REVENUES;
  const points: { date: string; revenue: number }[] = [];
  const count = Math.min(slice.length, 14);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    points.push({
      date: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      revenue: days === 1 ? Math.round(slice[i % slice.length] / 24 * (i + 8)) : slice[i % slice.length],
    });
  }
  return points;
}

function getDemoKpis(range: string) {
  const multiplier = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return {
    totalRevenue: Math.round(2200 * multiplier),
    orders: Math.round(48 * multiplier),
    aov: 45.83,
    conversionRate: 3.2,
    revenueChange: 12.4,
    ordersChange: 8.7,
    aovChange: 3.2,
    conversionChange: 1.8,
  };
}

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  paid: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  fulfilled: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  pending: { bg: 'rgba(234,179,8,0.15)', text: '#eab308' },
};

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  Fitness: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  Supplements: { bg: 'rgba(168,85,247,0.15)', text: '#a855f7' },
};

function MiniSparkSvg({ data, color = '#22c55e' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#d4af37' }}>${payload[0].value.toLocaleString()}</div>
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
    { label: 'Total Revenue', value: `$${kpis.totalRevenue.toLocaleString()}`, change: kpis.revenueChange, icon: DollarSign, spark: [2,4,3,5,6,4,7] },
    { label: 'Orders', value: kpis.orders.toLocaleString(), change: kpis.ordersChange, icon: ShoppingBag, spark: [3,5,4,6,5,7,8] },
    { label: 'Avg Order Value', value: `$${kpis.aov.toFixed(2)}`, change: kpis.aovChange, icon: TrendingUp, spark: [4,4,5,5,6,5,6] },
    { label: 'Conversion Rate', value: `${kpis.conversionRate}%`, change: kpis.conversionChange, icon: Percent, spark: [2,3,3,4,3,4,5] },
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Demo banner */}
      {isDemo && !bannerDismissed && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#d4af37' }}>Sample data — connect your store to see real analytics</span>
          <button onClick={() => setBannerDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <X size={12} style={{ color: '#71717a' }} />
          </button>
        </div>
      )}

      {/* Section header + date pills */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#52525b', fontFamily: 'Syne, sans-serif', margin: 0 }}>
          Sales Overview
        </h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              style={{
                padding: '4px 12px',
                borderRadius: 100,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                background: range === r.key ? '#d4af37' : 'rgba(255,255,255,0.06)',
                color: range === r.key ? '#080a0e' : '#71717a',
                transition: 'all 0.15s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue area chart */}
      <div style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 16px 12px', marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={2} fill="url(#goldGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 16 }}>
        {kpiCards.map((kpi) => (
          <div key={kpi.label} style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <kpi.icon size={14} style={{ color: '#71717a' }} />
              <span style={{ fontSize: 11, color: '#71717a', fontWeight: 500 }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f0ede8', fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>{kpi.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                +{kpi.change}%
              </span>
              <MiniSparkSvg data={kpi.spark} />
            </div>
          </div>
        ))}
      </div>

      {/* Top Products table */}
      <div style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#52525b', fontFamily: 'Syne, sans-serif', margin: '0 0 12px' }}>
          Top Products
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['#', 'Product', 'Category', 'Units', 'Revenue', 'Trend'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#52525b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_PRODUCTS.map((p, i) => {
                const catColor = CAT_COLORS[p.cat] ?? { bg: 'rgba(113,113,122,0.15)', text: '#71717a' };
                return (
                  <tr key={p.rank} style={{ background: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 12px', color: '#52525b', fontWeight: 600 }}>{p.rank}</td>
                    <td style={{ padding: '10px 12px', color: '#f0ede8', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: catColor.bg, color: catColor.text, fontWeight: 600 }}>{p.cat}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#a1a1aa' }}>{p.units.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: '#d4af37', fontWeight: 600 }}>${p.revenue.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: p.trend >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: p.trend >= 0 ? '#22c55e' : '#ef4444',
                      }}>
                        {p.trend >= 0 ? '+' : ''}{p.trend}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders table */}
      <div style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#52525b', fontFamily: 'Syne, sans-serif', margin: 0 }}>
            Recent Orders
          </h4>
          <a href="#" style={{ fontSize: 12, color: '#d4af37', textDecoration: 'none' }}>View all →</a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Order #', 'Customer', 'Product', 'Amount', 'Status', 'Time'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#52525b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_ORDERS.map((o, i) => {
                const sc = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
                return (
                  <tr key={o.id} style={{ background: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 12px', color: '#a1a1aa', fontWeight: 500 }}>{o.id}</td>
                    <td style={{ padding: '10px 12px', color: '#f0ede8' }}>{o.customer}</td>
                    <td style={{ padding: '10px 12px', color: '#a1a1aa' }}>{o.product}</td>
                    <td style={{ padding: '10px 12px', color: '#d4af37', fontWeight: 600 }}>${o.amount}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: sc.bg, color: sc.text, fontWeight: 600, textTransform: 'capitalize' as const }}>{o.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#52525b', fontSize: 12 }}>{o.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
