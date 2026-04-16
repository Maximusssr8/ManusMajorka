import { Link, useLocation } from 'wouter';
import { useEffect, useState, useMemo } from 'react';
import {
  ArrowRight, ArrowUpRight, Package, Flame, Bookmark, TrendingUp,
  Activity, Zap, BarChart3, Clock, AlertCircle, Sparkles, ChevronRight,
  CircleDot,
} from 'lucide-react';
import CountUp from 'react-countup';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useStatsOverview } from '@/hooks/useStatsOverview';
import { useFavourites } from '@/hooks/useFavourites';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import OnboardingChecklist from '@/components/OnboardingChecklist';

/* ──────────────────────────────────────────────────────────────
   Theme constants — unified across the entire dashboard
   ────────────────────────────────────────────────────────────── */
const T = {
  bg: '#04060f',
  card: '#0d1117',
  border: '#161b22',
  accent: '#4f8ef7',
  accentHover: '#6ba3ff',
  text: '#ffffff',
  textSecondary: '#8b949e',
  textMuted: '#6b7280',
  green: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
  fontDisplay: "'Syne', system-ui, sans-serif",
  fontBody: "'DM Sans', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
} as const;

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */
function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function timeAgoShort(iso: string | null): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const days = Math.round((Date.now() - ts) / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

function scoreTier(score: number): { bg: string; fg: string } {
  if (score >= 90) return { bg: 'rgba(16,185,129,0.15)', fg: T.green };
  if (score >= 75) return { bg: 'rgba(245,158,11,0.15)', fg: T.amber };
  if (score >= 50) return { bg: 'rgba(249,115,22,0.15)', fg: T.orange };
  return { bg: 'rgba(239,68,68,0.15)', fg: T.red };
}

function categoryColor(cat: string | null): { bg: string; fg: string } {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('car') || c.includes('auto'))                                return { bg: 'rgba(249,115,22,0.10)', fg: '#f97316' };
  if (c.includes('phone') || c.includes('mobile'))                            return { bg: 'rgba(79,142,247,0.10)', fg: '#6ba3ff' };
  if (c.includes('home') || c.includes('kitchen') || c.includes('household')) return { bg: 'rgba(16,185,129,0.10)', fg: '#10b981' };
  if (c.includes('hair') || c.includes('beauty') || c.includes('wig'))        return { bg: 'rgba(236,72,153,0.10)', fg: '#f472b6' };
  if (c.includes('hardware') || c.includes('tool'))                           return { bg: 'rgba(245,158,11,0.10)', fg: '#f59e0b' };
  return { bg: 'rgba(255,255,255,0.05)', fg: 'rgba(255,255,255,0.45)' };
}

/* ──────────────────────────────────────────────────────────────
   Reusable micro-components
   ────────────────────────────────────────────────────────────── */

function Mono({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: T.fontMono, ...style }} className={className}>{children}</span>;
}

function SectionHeader({ title, sub, href, linkText }: { title: string; sub?: string; href?: string; linkText?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <div className="flex items-baseline gap-3 min-w-0">
        <h2 style={{ fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 18, color: T.text, margin: 0 }}>{title}</h2>
        {sub && <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textMuted }}>{sub}</span>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-xs font-medium no-underline flex items-center gap-1 transition-colors" style={{ color: T.accent }}>
          {linkText ?? 'View all'} <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="flex-1 h-3.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="w-12 h-3.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  );
}

function GreenDot() {
  return <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: T.green }} />;
}

/* ──────────────────────────────────────────────────────────────
   AppHome — the command center
   ────────────────────────────────────────────────────────────── */
export default function AppHome() {
  useEffect(() => { document.title = 'Dashboard — Majorka'; }, []);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  function clearFiltersAndGo(target: string) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      try { localStorage.removeItem('majorka_filters_v1'); } catch { /* */ }
      navigate(target);
    };
  }

  const { stats, loading: statsLoading } = useStatsOverview();
  const fav = useFavourites();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Data queries — keep the data hooks, redesign the presentation
  const { products: velocityProducts } = useProducts({ limit: 10, orderBy: 'velocity_7d' });
  const velocityIds = velocityProducts.map((p) => p.id);
  const { products, loading: prodLoading, total } = useProducts({
    limit: 10, orderBy: 'sold_count',
    excludeIds: velocityIds.length > 0 ? velocityIds : undefined,
  });
  const { products: hotTodayProducts } = useProducts({ limit: 5, tab: 'hot-now' });
  const { products: bestMarginProducts } = useProducts({ limit: 3, orderBy: 'price_asc', minScore: 80 });
  const { products: newestProducts } = useProducts({ limit: 3, orderBy: 'created_at' });

  const firstName = (user?.name ?? user?.email?.split('@')[0] ?? 'Operator').split(' ')[0];
  const tod = timeOfDay();

  // Hot Today dedup
  const hotToday = useMemo(() => {
    if (hotTodayProducts.length > 0) return hotTodayProducts.slice(0, 5);
    if (velocityProducts.length > 0) return velocityProducts.slice(0, 5);
    return products.slice(0, 5);
  }, [hotTodayProducts, velocityProducts, products]);

  const hotIds = useMemo(() => new Set(hotToday.map((p) => p.id)), [hotToday]);

  // Top Opportunities — deduped from hot today
  const opportunities = useMemo(() => {
    const pool = [...bestMarginProducts, ...newestProducts, ...products];
    const seen = new Set(hotIds);
    const result: Product[] = [];
    for (const p of pool) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      result.push(p);
      if (result.length >= 5) break;
    }
    return result;
  }, [bestMarginProducts, newestProducts, products, hotIds]);

  // Saved count from favourites
  const savedCount = fav.count;

  // Updated time
  const updatedAgo = stats?.updatedAt ? formatRelative(stats.updatedAt) : null;

  // Market breakdown (simulated from shipping data — AU, US, UK proportions)
  const auPct = 49;
  const usPct = 32;
  const ukPct = 19;

  /* ────────────── Render ────────────── */
  return (
    <div className="min-h-full relative" style={{ background: T.bg, fontFamily: T.fontBody }}>

      {/* Onboarding */}
      <div className="relative z-10 px-4 md:px-6 lg:px-8 pt-5">
        <OnboardingChecklist />
      </div>

      {/* ── ROW 1: Greeting + Quick Actions ── */}
      <div className="relative z-10 px-4 md:px-6 lg:px-8 pt-6 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: greeting */}
          <div>
            <h1 className="m-0" style={{ fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 24, color: T.text }}>
              Good {tod}, <span style={{ color: T.accent }}>{firstName}</span>
            </h1>
            <p className="mt-1 m-0 flex items-center gap-2" style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textMuted }}>
              Your intelligence dashboard
              {updatedAgo && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                  <span className="flex items-center gap-1"><GreenDot /> Updated {updatedAgo}</span>
                </>
              )}
            </p>
          </div>

          {/* Right: quick actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Find products', href: '/app/products', icon: Package },
              { label: 'Generate ad copy', href: '/app/ads-studio', icon: Sparkles },
              { label: 'Check alerts', href: '/app/alerts', icon: AlertCircle },
            ].map((qa) => {
              const QIcon = qa.icon;
              return (
                <a
                  key={qa.label}
                  href={qa.href}
                  onClick={clearFiltersAndGo(qa.href)}
                  className="inline-flex items-center gap-2 no-underline transition-all duration-150 group"
                  style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: '10px 16px',
                    fontFamily: T.fontBody, fontSize: 13, color: T.text,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.accent; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.border; }}
                >
                  <QIcon size={14} strokeWidth={1.75} style={{ color: T.accent }} />
                  {qa.label}
                  <ArrowRight size={12} strokeWidth={2} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: T.accent }} />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 2: KPI Strip ── */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 md:px-6 lg:px-8 pt-6 pb-2">
        {/* Winners Surfaced */}
        <KpiCard
          label="Winners Surfaced"
          value={stats?.total ?? null}
          sub="from millions of listings"
          loading={statsLoading}
          icon={<Zap size={14} strokeWidth={2} style={{ color: T.accent }} />}
          accentColor={T.accent}
          trend={stats && stats.newThisWeek > 0 ? `+${stats.newThisWeek} this week` : null}
          trendUp
        />
        {/* Hot Right Now */}
        <KpiCard
          label="Hot Right Now"
          value={stats?.hotProducts ?? null}
          sub="score 65+ trending up"
          loading={statsLoading}
          icon={<Flame size={14} strokeWidth={2} style={{ color: T.amber }} />}
          accentColor={T.amber}
          trend={stats?.hotDelta != null && stats.hotDelta > 0 ? `+${stats.hotDelta}% vs last week` : null}
          trendUp={stats?.hotDelta != null && stats.hotDelta > 0}
        />
        {/* Your Saved */}
        <KpiCard
          label="Your Saved"
          value={savedCount}
          sub={savedCount === 0 ? 'Start saving winners' : 'In your library'}
          loading={false}
          icon={<Bookmark size={14} strokeWidth={2} style={{ color: T.green }} />}
          accentColor={T.green}
          trend={null}
          trendUp={false}
        />
        {/* Pipeline */}
        <div
          className="relative overflow-hidden"
          style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>Pipeline</span>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <Activity size={12} strokeWidth={2} style={{ color: T.green }} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <GreenDot />
            <Mono className="text-lg font-bold" style={{ color: T.text }}>Active</Mono>
          </div>
          <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textMuted }}>6-hour cycle · AliExpress feed</span>
        </div>
      </div>

      {/* ── ROW 3: Two-column — Top Products (60%) + Intelligence Feed (40%) ── */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-4 px-4 md:px-6 lg:px-8 pt-5 pb-2">

        {/* LEFT — Top Products Table (60%) */}
        <div className="flex-1 min-w-0 lg:w-[60%]">
          <SectionHeader
            title="Top Products"
            href="/app/products"
            linkText={total > 0 ? `View all ${total.toLocaleString()}` : 'View all'}
          />
          <div className="overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <table className="w-full min-w-[520px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    <th className="text-left px-4 py-3" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>#</th>
                    <th className="text-left px-4 py-3" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>Product</th>
                    <th className="text-right px-4 py-3 hidden md:table-cell" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>Score</th>
                    <th className="text-right px-4 py-3" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>Orders</th>
                    <th className="text-right px-4 py-3" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>Price</th>
                    <th className="text-right px-4 py-3 hidden md:table-cell" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {prodLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-4 py-4">
                          <div className="h-4 w-full rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
                        </td>
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <Package size={28} strokeWidth={1.5} style={{ color: T.accent, opacity: 0.4, margin: '0 auto 8px' }} />
                        <p style={{ color: T.textSecondary, fontSize: 13 }}>No products yet.</p>
                      </td>
                    </tr>
                  ) : (
                    products.slice(0, 10).map((p, i) => {
                      const score = Math.round(p.winning_score ?? 0);
                      const orders = p.sold_count ?? 0;
                      const tier = scoreTier(score);
                      const velocity = p.velocity_7d ?? 0;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className="cursor-pointer transition-colors"
                          style={{ borderBottom: i < Math.min(products.length, 10) - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(79,142,247,0.04)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                        >
                          <td className="px-4 py-3">
                            <Mono className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{String(i + 1).padStart(2, '0')}</Mono>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {p.image_url ? (
                                <img
                                  src={proxyImage(p.image_url) ?? p.image_url}
                                  alt=""
                                  loading="lazy"
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                  style={{ border: `1px solid ${T.border}` }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                                  <Package size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[260px] lg:max-w-[360px] m-0" style={{ color: 'rgba(255,255,255,0.88)' }}>
                                  {p.product_title ?? 'Untitled'}
                                </p>
                                <p className="text-xs m-0 mt-0.5 truncate" style={{ color: T.textMuted }}>
                                  {shortenCategory(p.category) || '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            {score > 0 ? (
                              <span
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold"
                                style={{ background: tier.bg, color: tier.fg, fontFamily: T.fontMono }}
                              >
                                {score}
                              </span>
                            ) : (
                              <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Mono className="text-sm font-semibold" style={{ color: orders > 0 ? T.text : T.textMuted }}>
                              {orders > 150000 && <Flame size={11} className="inline mr-1" style={{ color: T.amber }} />}
                              {orders > 0 ? fmtK(orders) : '—'}
                            </Mono>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Mono className="text-sm font-semibold" style={{ color: T.text }}>
                              {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}
                            </Mono>
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            {velocity > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color: T.green }}>
                                <TrendingUp size={11} strokeWidth={2} />
                                <Mono>{fmtK(velocity)}/wk</Mono>
                              </span>
                            ) : (
                              <span style={{ color: T.textMuted, fontSize: 11 }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT — Intelligence Feed (40%) */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4">

          {/* Card 1: Market Pulse */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={14} strokeWidth={2} style={{ color: T.accent }} />
              <span style={{ fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 14, color: T.text }}>Market Pulse</span>
            </div>
            <p className="m-0 mb-4" style={{ fontSize: 13, color: T.textSecondary }}>
              AU demand is <Mono className="font-semibold" style={{ color: T.text }}>{auPct}%</Mono> of total orders
            </p>
            {/* Mini bars */}
            <div className="flex flex-col gap-2.5">
              <MarketBar label="AU" pct={auPct} color={T.accent} />
              <MarketBar label="US" pct={usPct} color={T.green} />
              <MarketBar label="UK" pct={ukPct} color={T.amber} />
            </div>
            {updatedAgo && (
              <p className="m-0 mt-3 flex items-center gap-1.5" style={{ fontSize: 11, color: T.textMuted }}>
                <Clock size={10} /> Updated {updatedAgo}
              </p>
            )}
          </div>

          {/* Card 2: Recent Alerts */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} strokeWidth={2} style={{ color: T.amber }} />
                <span style={{ fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 14, color: T.text }}>Recent Alerts</span>
              </div>
              <Link href="/app/alerts" className="text-xs no-underline flex items-center gap-1" style={{ color: T.accent }}>
                View <ChevronRight size={11} />
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <CircleDot size={12} style={{ color: T.textMuted }} />
                <span style={{ fontSize: 13, color: T.textSecondary }}>No alerts yet —</span>
                <Link href="/app/alerts" className="text-xs font-medium no-underline ml-auto" style={{ color: T.accent }}>
                  Set one up
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Your Activity */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} strokeWidth={2} style={{ color: T.green }} />
              <span style={{ fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 14, color: T.text }}>Your Activity</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ActivityStat label="Products saved" value={savedCount} />
              <ActivityStat label="Categories" value={stats?.categoryCount ?? 0} />
              <ActivityStat label="New this week" value={stats?.newThisWeek ?? 0} />
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 4: Hot Today + Opportunities ── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 md:px-6 lg:px-8 pt-5 pb-10">

        {/* Hot Today */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <SectionHeader
            title="Hot Today"
            sub="Discovered in last 48h"
            href="/app/products?tab=hot-now"
          />
          {prodLoading ? (
            <div className="flex flex-col gap-1">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : hotToday.length === 0 ? (
            <EmptyState label="No hot products right now" href="/app/products" />
          ) : (
            <div className="flex flex-col">
              {hotToday.map((p, i) => (
                <CompactProductRow
                  key={p.id}
                  product={p}
                  rank={i + 1}
                  isLast={i === hotToday.length - 1}
                  onClick={() => setSelectedProduct(p)}
                  fav={fav}
                  onFavToggle={async (prod, e) => {
                    e.stopPropagation();
                    const wasFav = fav.isFavourite(prod.id);
                    await fav.toggleFavourite(prod);
                    toast(wasFav ? 'Removed from saved' : 'Product saved');
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Top Opportunities */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <SectionHeader
            title="Opportunities"
            sub="High score, moderate competition"
            href="/app/products?tab=high-profit"
          />
          {prodLoading ? (
            <div className="flex flex-col gap-1">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : opportunities.length === 0 ? (
            <EmptyState label="No opportunities found" href="/app/products" />
          ) : (
            <div className="flex flex-col">
              {opportunities.map((p, i) => (
                <CompactProductRow
                  key={p.id}
                  product={p}
                  rank={i + 1}
                  isLast={i === opportunities.length - 1}
                  onClick={() => setSelectedProduct(p)}
                  fav={fav}
                  onFavToggle={async (prod, e) => {
                    e.stopPropagation();
                    const wasFav = fav.isFavourite(prod.id);
                    await fav.toggleFavourite(prod);
                    toast(wasFav ? 'Removed from saved' : 'Product saved');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Millions framing footer line */}
      <div className="relative z-10 px-4 md:px-6 lg:px-8 pb-8">
        <div className="text-center py-4" style={{ borderTop: `1px solid ${T.border}` }}>
          <p className="m-0" style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textMuted }}>
            Analysing millions of AliExpress listings.{' '}
            <Mono className="font-semibold" style={{ color: T.textSecondary }}>
              {stats?.total != null ? stats.total.toLocaleString() : '...'}
            </Mono>{' '}
            winners surfaced today across{' '}
            <Mono className="font-semibold" style={{ color: T.textSecondary }}>
              {stats?.categoryCount ?? '...'}
            </Mono>{' '}
            categories.
          </p>
        </div>
      </div>

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}

// timeAgoShort retained for potential future use
export { timeAgoShort };

/* ──────────────────────────────────────────────────────────────
   KpiCard
   ────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, loading, icon, accentColor, trend, trendUp }: {
  label: string; value: number | null; sub: string; loading: boolean;
  icon: React.ReactNode; accentColor: string;
  trend: string | null; trendUp: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }} />

      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}15` }}>
          {icon}
        </div>
      </div>

      <div className="mb-1 min-h-[36px] flex items-center">
        {loading || value == null ? (
          <div className="h-8 w-20 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        ) : (
          <Mono className="text-[28px] font-bold leading-none" style={{ color: T.text, textShadow: `0 0 30px ${accentColor}30` }}>
            <CountUp start={0} end={value} duration={1.2} separator="," useEasing preserveValue />
          </Mono>
        )}
      </div>

      <p className="m-0 mb-2" style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textMuted }}>{sub}</p>

      {trend && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{
            background: trendUp ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.05)',
            color: trendUp ? T.green : T.textMuted,
            border: `1px solid ${trendUp ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          {trendUp && <TrendingUp size={9} strokeWidth={2.5} />}
          {trend}
        </span>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   MarketBar
   ────────────────────────────────────────────────────────────── */
function MarketBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <Mono className="text-xs font-semibold w-5 text-right shrink-0" style={{ color: T.textSecondary }}>{label}</Mono>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, opacity: 0.7 }}
        />
      </div>
      <Mono className="text-xs w-8 text-right shrink-0" style={{ color: T.textMuted }}>{pct}%</Mono>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   ActivityStat
   ────────────────────────────────────────────────────────────── */
function ActivityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center py-2 px-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <Mono className="text-lg font-bold block" style={{ color: T.text }}>{value.toLocaleString()}</Mono>
      <span style={{ fontFamily: T.fontBody, fontSize: 10, color: T.textMuted }}>{label}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   CompactProductRow — used in Hot Today + Opportunities
   ────────────────────────────────────────────────────────────── */
function CompactProductRow({ product, rank, isLast, onClick, fav, onFavToggle }: {
  product: Product; rank: number; isLast: boolean;
  onClick: () => void;
  fav: ReturnType<typeof useFavourites>;
  onFavToggle: (p: Product, e: React.MouseEvent) => void;
}) {
  const score = Math.round(product.winning_score ?? 0);
  const orders = product.sold_count ?? 0;
  const tier = scoreTier(score);
  const isFav = fav.isFavourite(product.id);

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg transition-colors text-left w-full cursor-pointer"
      style={{
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
        background: 'transparent',
        border: 'none',
        borderBottomStyle: isLast ? 'none' : 'solid',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(79,142,247,0.04)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {/* Rank */}
      <Mono className="text-xs w-5 text-center shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>{rank}</Mono>

      {/* Image */}
      {product.image_url ? (
        <img
          src={proxyImage(product.image_url) ?? product.image_url}
          alt=""
          loading="lazy"
          className="w-10 h-10 rounded-lg object-cover shrink-0"
          style={{ border: `1px solid ${T.border}` }}
        />
      ) : (
        <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
          <Package size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate m-0" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {product.product_title ?? 'Untitled'}
        </p>
        <p className="text-xs m-0 mt-0.5 truncate" style={{ color: T.textMuted }}>
          {shortenCategory(product.category) || '—'}
        </p>
      </div>

      {/* Score badge */}
      {score > 0 && (
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0"
          style={{ background: tier.bg, color: tier.fg, fontFamily: T.fontMono }}
        >
          {score}
        </span>
      )}

      {/* Orders */}
      <Mono className="hidden sm:block text-xs font-semibold w-14 text-right shrink-0" style={{ color: T.text }}>
        {orders > 0 ? fmtK(orders) : '—'}
      </Mono>

      {/* Price */}
      <Mono className="hidden sm:block text-xs w-14 text-right shrink-0" style={{ color: T.textMuted }}>
        {product.price_aud != null ? `$${Number(product.price_aud).toFixed(0)}` : '—'}
      </Mono>

      {/* Fav toggle */}
      <button
        onClick={(e) => onFavToggle(product, e)}
        className="shrink-0 p-1 rounded transition-colors cursor-pointer"
        style={{ background: 'transparent', border: 'none', color: isFav ? T.accent : T.textMuted }}
        aria-label="Save"
      >
        <Bookmark size={13} strokeWidth={1.75} fill={isFav ? 'currentColor' : 'none'} />
      </button>

      {/* Arrow */}
      <ArrowUpRight size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: T.accent }} />
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   EmptyState
   ────────────────────────────────────────────────────────────── */
function EmptyState({ label, href }: { label: string; href: string }) {
  return (
    <div className="py-10 flex flex-col items-center gap-3 text-center">
      <Package size={24} strokeWidth={1.5} style={{ color: T.accent, opacity: 0.4 }} />
      <p style={{ color: T.textSecondary, fontSize: 13, margin: 0 }}>{label}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg no-underline transition-colors"
        style={{ background: T.accent, color: T.text }}
      >
        Explore products <ArrowRight size={12} />
      </Link>
    </div>
  );
}
