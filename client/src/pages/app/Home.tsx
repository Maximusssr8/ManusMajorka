import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowUp, Package, Flame, Star, Trophy,
} from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useStatsOverview } from '@/hooks/useStatsOverview';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import { C } from '@/lib/designTokens';

/* Category keyword → colour scheme, shared visual language with Products. */
function categoryColor(cat: string | null): { bg: string; fg: string } {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('car') || c.includes('auto'))                                return { bg: 'rgba(249,115,22,0.12)', fg: '#f97316' };
  if (c.includes('phone') || c.includes('mobile'))                            return { bg: 'rgba(99,102,241,0.12)', fg: '#818cf8' };
  if (c.includes('home') || c.includes('kitchen') || c.includes('household')) return { bg: 'rgba(16,185,129,0.12)', fg: '#10b981' };
  if (c.includes('hair') || c.includes('beauty') || c.includes('wig'))        return { bg: 'rgba(236,72,153,0.12)', fg: '#f472b6' };
  if (c.includes('hardware') || c.includes('tool'))                           return { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b' };
  return { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.55)' };
}

/* ──────────────────────────────────────────────────────────────
   Fonts — Nohemi for display, Inter for body. No mono.
   Colours — only C tokens, never raw hex.
   ABSOLUTE RULE — every rendered data value comes from a live
   hook: useStatsOverview, useProducts, useNicheStats. If any
   value is missing, render a skeleton.
   ────────────────────────────────────────────────────────────── */

const DISPLAY = C.fontDisplay;
const BODY = C.fontBody;

/* ──────────────────────────────────────────────────────────────
   Shared CSS
   ────────────────────────────────────────────────────────────── */

const STYLES = `
@keyframes mj-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}
.mj-pulse {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${C.green};
  animation: mj-pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
.mj-kpi {
  transition: border-color ${C.dur} ${C.ease}, background ${C.dur} ${C.ease};
}
.mj-kpi:hover {
  border-color: rgba(99,102,241,0.25);
  background: #1c2033;
}
.mj-chart-row {
  transition: background ${C.dur} ${C.ease};
  border-radius: 6px;
}
.mj-chart-row:hover {
  background: rgba(255,255,255,0.025);
}
.mj-chart-row:hover .mj-chart-fill {
  filter: brightness(1.15);
}
.mj-chart-fill {
  transition: filter ${C.dur} ${C.ease}, width 600ms ${C.ease};
}
.mj-row {
  transition: background ${C.dur} ${C.ease};
  cursor: pointer;
}
.mj-row:hover {
  background: rgba(99,102,241,0.04);
}
.mj-opp {
  transition: background ${C.dur} ${C.ease};
}
.mj-opp:hover {
  background: rgba(255,255,255,0.025);
}
.mj-arrow {
  transition: color ${C.dur} ${C.ease}, transform ${C.dur} ${C.ease};
}
.mj-opp:hover .mj-arrow {
  color: ${C.accent};
  transform: translateX(2px);
}
@keyframes mj-shim {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.mj-shim {
  background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 100%);
  background-size: 400px 100%;
  animation: mj-shim 1.4s linear infinite;
  border-radius: 4px;
  display: inline-block;
}
.mj-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${C.accent};
  color: #ffffff;
  padding: 9px 18px;
  border-radius: ${C.rSm}px;
  font-family: ${BODY};
  font-size: ${C.fBody}px;
  font-weight: 500;
  text-decoration: none;
  border: none;
  box-shadow: none;
  cursor: pointer;
  transition: background ${C.dur} ${C.ease};
  white-space: nowrap;
}
.mj-btn-primary:hover { background: ${C.accentHover}; }
`;

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function timeAgoShort(iso: string | null): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const days = Math.round((Date.now() - ts) / (24 * 60 * 60 * 1000));
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  return `${Math.round(days / 30)} months ago`;
}

function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/* ──────────────────────────────────────────────────────────────
   Thumb
   ────────────────────────────────────────────────────────────── */

function Thumb({ image, title, size, radius }: { image: string | null; title: string; size: number; radius: number }) {
  const [failed, setFailed] = useState(false);
  const initial = (title?.trim()?.[0] || '?').toUpperCase();
  const hasImage = image && !failed;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: C.raised,
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {hasImage ? (
        <img
          src={proxyImage(image) ?? image}
          alt={title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: size * 0.4,
            fontWeight: 700,
            color: C.muted,
          }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   KPI card — every value and trend is computed from live stats.
   ────────────────────────────────────────────────────────────── */

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  Icon: typeof Package;
  trendText: string | null;
  trendPositive: boolean;
  accentLine: string;
  loading: boolean;
}

function KpiCard({ label, value, sub, Icon, trendText, trendPositive, accentLine, loading }: KpiCardProps) {
  return (
    <div
      className="mj-kpi"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: C.rLg,
        padding: '22px 24px',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent top line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accentLine,
          borderRadius: `${C.rLg}px ${C.rLg}px 0 0`,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: C.fXxs,
          fontFamily: BODY,
          fontWeight: 500,
          color: C.muted,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
        }}
      >
        <span>{label}</span>
        <Icon size={14} color={C.muted} strokeWidth={1.75} />
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 38,
          fontWeight: 700,
          color: C.text,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.025em',
          lineHeight: 1,
          margin: '12px 0 6px',
          minHeight: 38,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {loading ? <span className="mj-shim" style={{ height: 24, width: 96 }} /> : value}
      </div>
      <div style={{ fontSize: C.fXs, fontFamily: BODY, color: C.muted, marginBottom: 10 }}>
        {sub}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: C.fXs,
          fontFamily: BODY,
          fontWeight: 500,
          color: trendPositive ? C.green : C.muted,
          minHeight: 14,
        }}
      >
        {loading ? (
          <span className="mj-shim" style={{ height: 10, width: 80 }} />
        ) : trendText ? (
          <>
            {trendPositive && <ArrowUp size={11} strokeWidth={2.25} />}
            <span>{trendText}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Home
   ────────────────────────────────────────────────────────────── */

export default function AppHome() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStatsOverview();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { products, loading: prodLoading, total } = useProducts({ limit: 10, orderBy: 'sold_count' });
  const { products: bestMarginProducts } = useProducts({ limit: 1, orderBy: 'price_asc', minScore: 80 });
  const { products: newestProducts } = useProducts({ limit: 1, orderBy: 'created_at' });

  /* Category chart — fetched live from /api/products/stats-categories.
     No useNicheStats here anymore; this is now the single source of
     truth for the Home bar chart. */
  interface CategoryRow { category: string; total_orders: number; product_count: number; }
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [nicheLoading, setNicheLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/products/stats-categories?limit=8', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data: { categories?: CategoryRow[] }) => {
        if (cancelled) return;
        setCategoryRows(Array.isArray(data.categories) ? data.categories : []);
        setNicheLoading(false);
      })
      .catch(() => { if (!cancelled) setNicheLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const firstName = (user?.name ?? user?.email?.split('@')[0] ?? 'Operator').split(' ')[0];
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const tod = timeOfDay();

  /* ── KPI derived values — EVERY number from the API ── */
  const kpiTotal     = stats?.total ?? null;
  const kpiHot       = stats?.hotProducts ?? null;
  const kpiAvgScore  = stats?.avgScore ?? null;
  const kpiTopScore  = stats?.topScore ?? null;

  const totalDelta = stats?.totalDelta ?? 0;
  const totalTrend =
    totalDelta > 0 ? { text: `+${totalDelta.toLocaleString()} this week`, positive: true }
    : totalDelta < 0 ? { text: `${totalDelta.toLocaleString()} this week`, positive: false }
    : { text: 'No change this week', positive: false };

  const hotDelta = stats?.hotDelta ?? null;
  const hotTrend =
    hotDelta == null ? { text: '', positive: false }
    : hotDelta > 0 ? { text: `+${hotDelta}% vs last week`, positive: true }
    : hotDelta < 0 ? { text: `${hotDelta}% vs last week`, positive: false }
    : { text: 'Flat vs last week', positive: false };

  const kpiCards = [
    {
      label: 'Products Tracked',
      value: kpiTotal != null ? kpiTotal.toLocaleString() : '—',
      sub: 'Live AliExpress feed',
      Icon: Package,
      trendText: totalTrend.text || null,
      trendPositive: totalTrend.positive,
      accentLine: C.accent,
    },
    {
      label: 'Hot Products',
      value: kpiHot != null ? kpiHot.toLocaleString() : '—',
      sub: 'Score 65 and above',
      Icon: Flame,
      trendText: hotTrend.text || null,
      trendPositive: hotTrend.positive,
      accentLine: C.amber,
    },
    {
      label: 'Average Score',
      value: kpiAvgScore != null ? kpiAvgScore.toString() : '—',
      sub: 'Out of 100',
      Icon: Star,
      trendText: stats ? `${stats.categoryCount} niches tracked` : null,
      trendPositive: false,
      accentLine: C.green,
    },
    {
      label: 'Top Score',
      value: kpiTopScore != null ? kpiTopScore.toString() : '—',
      sub: 'Highest in database',
      Icon: Trophy,
      trendText: stats && stats.newThisWeek === 0 && stats.newLastWeek === 0 ? null : null,
      trendPositive: false,
      accentLine: C.cyan,
    },
  ];

  /* ── Category chart — derived from server endpoint data ── */
  const chartRows = categoryRows.map((n) => ({
    name: shortenCategory(n.category),
    fullName: n.category,
    orders: n.total_orders,
  }));
  const maxOrders = Math.max(1, ...chartRows.map((r) => r.orders));

  /* ── Opportunities — from live queries ── */
  const topProduct     = products[0];
  const bestMargin     = bestMarginProducts[0] ?? null;
  const newestProduct  = newestProducts[0] ?? null;

  interface Opportunity {
    label: string;
    chipBg: string;
    chipFg: string;
    href: string;
    product: Product | null;
    statText: string;
    statColor: string;
  }
  const opportunities: Opportunity[] = [
    {
      label: 'Top Trending',
      chipBg: C.amberSubtle,
      chipFg: C.amber,
      href: '/app/products?tab=trending',
      product: topProduct ?? null,
      statText: topProduct?.sold_count != null ? `${topProduct.sold_count.toLocaleString()} orders / mo` : '',
      statColor: C.green,
    },
    {
      label: 'Best Margin',
      chipBg: C.greenSubtle,
      chipFg: C.green,
      href: '/app/products?tab=highmargin',
      product: bestMargin,
      statText: bestMargin?.price_aud != null ? `$${Number(bestMargin.price_aud).toFixed(2)} landed` : '',
      statColor: C.green,
    },
    {
      label: 'Newest',
      chipBg: C.accentSubtle,
      chipFg: C.accentHover,
      href: '/app/products?tab=new',
      product: newestProduct,
      statText: newestProduct?.created_at ? `Added ${timeAgoShort(newestProduct.created_at)}` : '',
      statColor: C.muted,
    },
  ];

  const platformStatus = [
    { name: 'AliExpress Feed', chip: 'Live' },
    { name: 'Apify Pipeline',  chip: 'Running' },
    { name: 'Stripe Payments', chip: 'Active' },
  ];

  const lastUpdateLabel = stats?.updatedAt
    ? `Live · AliExpress feed · ${formatRelativeTime(stats.updatedAt)}`
    : 'Live · AliExpress feed';

  return (
    <>
      <style>{STYLES}</style>

      <div
        style={{
          position: 'relative',
          background: C.bg,
          minHeight: '100vh',
          fontFamily: BODY,
          color: C.text,
        }}
      >
        {/* Halo glow at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 600,
            background:
              'radial-gradient(ellipse 1400px 700px at 50% -300px, rgba(99,102,241,0.13), transparent)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ── STATUS BAR ── */}
          <div
            style={{
              height: 48,
              borderBottom: `1px solid ${C.border}`,
              padding: '0 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: BODY,
                fontSize: C.fSm,
                color: C.muted,
              }}
            >
              <span className="mj-pulse" />
              <span>{lastUpdateLabel}</span>
            </div>
            <Link href="/app/products" className="mj-btn-primary">
              Discover products
              <ArrowRight size={13} strokeWidth={2.25} />
            </Link>
          </div>

          {/* ── HERO ── */}
          <div style={{ padding: '40px 32px 24px' }}>
            <div
              style={{
                fontFamily: BODY,
                fontSize: C.fSm,
                color: C.muted,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              {today} · Scale Plan
            </div>
            <h1
              style={{
                fontFamily: DISPLAY,
                fontSize: C.fH1,
                fontWeight: 800,
                color: C.text,
                letterSpacing: '-0.03em',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Good {tod}, {firstName}.
            </h1>
            <p
              style={{
                fontFamily: BODY,
                fontSize: C.fLead,
                color: C.body,
                margin: '10px 0 0',
                maxWidth: 540,
                lineHeight: 1.55,
              }}
            >
              Your product intelligence is live across the Australian market.
            </p>
          </div>

          {/* ── KPI GRID ── */}
          <div
            style={{
              padding: '0 32px 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
            }}
          >
            {kpiCards.map((card) => (
              <KpiCard key={card.label} {...card} loading={statsLoading} />
            ))}
          </div>

          {/* ── MAIN CONTENT GRID ── */}
          <div
            style={{
              padding: '0 32px 32px',
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: 20,
            }}
          >
            {/* LEFT — Category chart */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: C.rXl,
                padding: '24px 28px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY,
                    fontSize: C.fBody,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  Category Performance
                </div>
                <select
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.borderStrong}`,
                    borderRadius: C.rXs,
                    padding: '4px 10px',
                    fontSize: C.fSm,
                    fontFamily: BODY,
                    color: C.body,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option>Top 8 by orders</option>
                </select>
              </div>

              {nicheLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="mj-shim" style={{ width: 100, height: 12 }} />
                      <span className="mj-shim" style={{ flex: 1, height: 8 }} />
                      <span className="mj-shim" style={{ width: 48, height: 12 }} />
                    </div>
                  ))}
                </div>
              ) : chartRows.length === 0 ? (
                <div
                  style={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.muted,
                    fontSize: C.fBody,
                  }}
                >
                  No category data available yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {chartRows.map((d, i) => {
                    const pct = Math.max(2, (d.orders / maxOrders) * 100);
                    const label = d.orders >= 1_000_000
                      ? `${(d.orders / 1_000_000).toFixed(1)}M`
                      : d.orders >= 1000
                        ? `${Math.round(d.orders / 1000)}k`
                        : d.orders.toLocaleString();
                    return (
                      <Link
                        key={i}
                        href={`/app/products?category=${encodeURIComponent(d.fullName)}`}
                        className="mj-chart-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '6px 8px',
                          textDecoration: 'none',
                        }}
                      >
                        <div
                          title={d.fullName}
                          style={{
                            width: 110,
                            flexShrink: 0,
                            fontFamily: BODY,
                            fontSize: C.fBody,
                            color: C.body,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {d.name}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 4,
                            overflow: 'hidden',
                            minWidth: 0,
                          }}
                        >
                          <div
                            className="mj-chart-fill"
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <div
                          style={{
                            width: 64,
                            textAlign: 'right',
                            fontFamily: BODY,
                            fontSize: C.fSm,
                            color: C.muted,
                            fontVariantNumeric: 'tabular-nums',
                            flexShrink: 0,
                          }}
                        >
                          {label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT — Opportunities + Status */}
            <div>
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: C.rLg,
                  padding: 20,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY,
                    fontSize: C.fBody,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 4,
                  }}
                >
                  Top Opportunities
                </div>
                {opportunities.map((o, i) => (
                  <Link
                    key={o.label}
                    href={o.href}
                    className="mj-opp"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '13px 0',
                      borderBottom:
                        i === opportunities.length - 1 ? 'none' : `1px solid ${C.border}`,
                      textDecoration: 'none',
                    }}
                  >
                    {o.product ? (
                      <Thumb image={o.product.image_url} title={o.product.product_title} size={44} radius={8} />
                    ) : (
                      <div className="mj-shim" style={{ width: 44, height: 44, borderRadius: 8 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'inline-block',
                          fontFamily: BODY,
                          fontSize: C.fXxs,
                          fontWeight: 600,
                          color: o.chipFg,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          background: o.chipBg,
                          borderRadius: C.rXs,
                          padding: '2px 6px',
                          marginBottom: 5,
                        }}
                      >
                        {o.label}
                      </div>
                      <div
                        style={{
                          fontFamily: BODY,
                          fontSize: C.fBody,
                          fontWeight: 500,
                          color: C.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: 2,
                        }}
                      >
                        {truncate(o.product?.product_title ?? '—', 32)}
                      </div>
                      <div
                        style={{
                          fontFamily: BODY,
                          fontSize: C.fSm,
                          color: o.statColor,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {o.statText}
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      strokeWidth={1.75}
                      className="mj-arrow"
                      color={C.muted}
                    />
                  </Link>
                ))}
              </div>

              {/* Platform status */}
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: C.rLg,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY,
                    fontSize: C.fBody,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 4,
                  }}
                >
                  Platform Status
                </div>
                {platformStatus.map((row, i) => (
                  <div
                    key={row.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 0',
                      borderBottom:
                        i === platformStatus.length - 1 ? 'none' : `1px solid ${C.border}`,
                    }}
                  >
                    <span className="mj-pulse" />
                    <span
                      style={{
                        flex: 1,
                        fontFamily: BODY,
                        fontSize: C.fBody,
                        color: C.body,
                      }}
                    >
                      {row.name}
                    </span>
                    <span
                      style={{
                        background: C.greenSubtle,
                        color: C.green,
                        borderRadius: C.rXs,
                        padding: '2px 8px',
                        fontSize: C.fXs,
                        fontFamily: BODY,
                        fontWeight: 500,
                      }}
                    >
                      {row.chip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── TOP PRODUCTS TABLE ── */}
          <div style={{ margin: '0 32px 48px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontFamily: DISPLAY,
                  fontSize: C.fH3,
                  fontWeight: 600,
                  color: C.text,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Top products
              </h2>
              <Link
                href="/app/products"
                style={{
                  fontFamily: BODY,
                  fontSize: C.fBody,
                  color: C.accent,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                View all {total > 0 ? total.toLocaleString() : '…'} →
              </Link>
            </div>

            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: C.rXl,
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 60 }} />
                  <col />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 100 }} />
                </colgroup>
                <thead>
                  <tr style={{ background: C.raised }}>
                    {['#', 'Product', 'Category', 'Score', 'Orders', 'Price'].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '14px 24px',
                          textAlign: i >= 3 ? 'right' : 'left',
                          fontFamily: BODY,
                          fontSize: C.fXxs,
                          fontWeight: 500,
                          color: C.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prodLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td colSpan={6} style={{ padding: '18px 24px' }}>
                          <span className="mj-shim" style={{ height: 14, width: '100%' }} />
                        </td>
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: '64px 24px',
                          textAlign: 'center',
                          color: C.muted,
                          fontFamily: BODY,
                        }}
                      >
                        No products tracked yet.
                      </td>
                    </tr>
                  ) : (
                    products.map((p, i) => {
                      const score = p.winning_score ?? 0;
                      const orders = p.sold_count ?? 0;
                      const isLast = i === products.length - 1;
                      const scoreTier =
                        score >= 90 ? { bg: C.greenSubtle, fg: C.green }
                        : score >= 70 ? { bg: C.amberSubtle, fg: C.amber }
                        : { bg: C.orangeSubtle, fg: C.orange };
                      return (
                        <tr
                          key={p.id}
                          className="mj-row"
                          onClick={() => setSelectedProduct(p)}
                          style={{ borderBottom: isLast ? 'none' : `1px solid ${C.border}` }}
                        >
                          <td
                            style={{
                              padding: '18px 24px',
                              fontFamily: BODY,
                              fontSize: C.fSm,
                              color: C.muted,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </td>
                          <td style={{ padding: '18px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                              <Thumb image={p.image_url} title={p.product_title} size={56} radius={10} />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  title={p.product_title}
                                  style={{
                                    fontFamily: BODY,
                                    fontSize: C.fBody,
                                    fontWeight: 500,
                                    color: C.text,
                                    maxWidth: 440,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    marginBottom: 4,
                                  }}
                                >
                                  {p.product_title}
                                </div>
                                {(() => {
                                  const cc = categoryColor(p.category);
                                  return (
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        background: cc.bg,
                                        color: cc.fg,
                                        borderRadius: 4,
                                        padding: '2px 8px',
                                        fontSize: 11,
                                        fontFamily: BODY,
                                        fontWeight: 500,
                                        maxWidth: 160,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {shortenCategory(p.category)}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: '18px 24px',
                              fontFamily: BODY,
                              fontSize: C.fSm,
                              color: C.body,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {shortenCategory(p.category)}
                          </td>
                          <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                            {score ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  background: scoreTier.bg,
                                  border: `1px solid ${scoreTier.bg}`,
                                  color: scoreTier.fg,
                                  borderRadius: 6,
                                  padding: '4px 10px',
                                  fontSize: C.fBody,
                                  fontFamily: BODY,
                                  fontWeight: 600,
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {Math.round(score)}
                              </span>
                            ) : (
                              <span style={{ color: C.muted, fontSize: C.fSm }}>—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '18px 24px',
                              textAlign: 'right',
                              fontFamily: BODY,
                              fontSize: C.fH4,
                              color: orders > 0 ? C.text : C.muted,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {orders > 150000 && (
                              <span style={{ color: C.amber, marginRight: 4 }}>🔥</span>
                            )}
                            {orders > 0 ? fmtK(orders) : '—'}
                          </td>
                          <td
                            style={{
                              padding: '18px 24px',
                              textAlign: 'right',
                              fontFamily: BODY,
                              fontSize: C.fH4,
                              color: C.text,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}
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
      </div>

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
