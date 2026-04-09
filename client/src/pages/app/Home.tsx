import { Link } from 'wouter';
import { useState } from 'react';
import {
  ArrowRight, ArrowUp, Package, Flame, Star, Trophy,
} from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, useProductStats, type Product } from '@/hooks/useProducts';
import { useNicheStats } from '@/hooks/useNicheStats';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';

/* ──────────────────────────────────────────────────────────────
   Fonts — Syne for headings/big numbers, Inter for everything else.
   JetBrains Mono is banned from visible UI text per spec.
   ────────────────────────────────────────────────────────────── */

const SYNE = "'Syne', sans-serif";
const INTER = "'Inter', sans-serif";

/* ──────────────────────────────────────────────────────────────
   Palette — exact hexes from the spec, local to this file so
   no token-file indirection gets in the way.
   ────────────────────────────────────────────────────────────── */

const C = {
  bg: '#0f1117',
  surface: '#161b27',
  raised: '#1a2035',
  navBg: '#0a0d14',
  text: '#f9fafb',
  body: '#9ca3af',
  muted: '#6b7280',
  faint: '#4b5563',
  accent: '#6366f1',
  accentHover: '#818cf8',
  green: '#10b981',
  line: 'rgba(255,255,255,0.08)',
  lineSoft: 'rgba(255,255,255,0.05)',
  lineStrong: 'rgba(255,255,255,0.1)',
} as const;

/* ──────────────────────────────────────────────────────────────
   Shared CSS — pulse dot, row hover, skeleton
   ────────────────────────────────────────────────────────────── */

const STYLES = `
@keyframes mj-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}
.mj-pulse {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  animation: mj-pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
.mj-kpi {
  transition: border-color 150ms ${`cubic-bezier(0.16,1,0.3,1)`}, background 150ms ${`cubic-bezier(0.16,1,0.3,1)`};
}
.mj-kpi:hover {
  border-color: rgba(99,102,241,0.3) !important;
  background: #1a2035 !important;
}
.mj-chart-row {
  transition: background 150ms ease, margin 150ms ease, padding 150ms ease;
  border-radius: 6px;
}
.mj-chart-row:hover {
  background: rgba(255,255,255,0.02);
  margin-left: -4px;
  padding-left: 4px;
}
.mj-chart-row:hover .mj-chart-bar-fill {
  filter: brightness(1.15);
}
.mj-chart-bar-fill {
  transition: filter 150ms ease, width 700ms cubic-bezier(0.16,1,0.3,1);
}
.mj-row {
  transition: background 150ms ease;
  cursor: pointer;
}
.mj-row:hover {
  background: rgba(99,102,241,0.04);
}
.mj-opp {
  transition: background 150ms ease;
}
.mj-opp:hover {
  background: rgba(255,255,255,0.02);
}
.mj-arrow {
  transition: color 150ms ease, transform 150ms ease;
}
.mj-opp:hover .mj-arrow {
  color: #6366f1;
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
  background: #6366f1;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  border: none;
  box-shadow: none;
  cursor: pointer;
  transition: background 150ms ease;
  white-space: nowrap;
}
.mj-btn-primary:hover { background: #818cf8; }
`;

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString();
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
        border: `1px solid ${C.line}`,
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
            fontFamily: SYNE,
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
   KPI card
   ────────────────────────────────────────────────────────────── */

interface KpiCardData {
  label: string;
  value: string;
  sub: string;
  Icon: typeof Package;
  trend: { text: string; positive: boolean };
}

function KpiCard({ card, loading }: { card: KpiCardData; loading: boolean }) {
  const Icon = card.Icon;
  return (
    <div
      className="mj-kpi"
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: '20px 24px',
        cursor: 'default',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          fontFamily: INTER,
          fontWeight: 500,
          color: C.muted,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <span>{card.label}</span>
        <Icon size={14} color={C.muted} strokeWidth={1.75} />
      </div>
      <div
        style={{
          fontFamily: SYNE,
          fontSize: 36,
          fontWeight: 700,
          color: C.text,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.025em',
          lineHeight: 1,
          margin: '10px 0 6px',
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {loading && (!card.value || card.value === '—') ? (
          <span className="mj-shim" style={{ height: 24, width: 96 }} />
        ) : (
          card.value || '0'
        )}
      </div>
      <div style={{ fontSize: 12, fontFamily: INTER, color: C.muted, marginBottom: 10 }}>
        {card.sub}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          fontFamily: INTER,
          fontWeight: 500,
          color: card.trend.positive ? C.green : C.muted,
        }}
      >
        {card.trend.positive && <ArrowUp size={11} strokeWidth={2.25} />}
        <span>{card.trend.text}</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Home
   ────────────────────────────────────────────────────────────── */

export default function AppHome() {
  const { user } = useAuth();
  const stats = useProductStats();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products, loading: prodLoading, total } = useProducts({ limit: 10, orderBy: 'sold_count' });
  const { products: highMarginProducts } = useProducts({ limit: 1, orderBy: 'price_asc' });
  const { products: newestProducts } = useProducts({ limit: 1, orderBy: 'created_at' });
  const { niches: categoryChartData } = useNicheStats(8);

  const firstName = (user?.name ?? user?.email?.split('@')[0] ?? 'Operator').split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const tod = timeOfDay();

  const topProduct = products[0];
  const highMarginProduct = highMarginProducts[0] ?? products[0];
  const newestProduct = newestProducts[0] ?? products[0];

  const kpiCards: KpiCardData[] = [
    {
      label: 'Products Tracked',
      value: fmtNum(stats.total),
      sub: 'Live AliExpress feed',
      Icon: Package,
      trend: { text: '+142 this week', positive: true },
    },
    {
      label: 'Hot Products',
      value: fmtNum(stats.hotCount),
      sub: 'Score 65 and above',
      Icon: Flame,
      trend: { text: '+8% this week', positive: true },
    },
    {
      label: 'Average Score',
      value: stats.avgScore ? `${stats.avgScore}` : '—',
      sub: 'Out of 100',
      Icon: Star,
      trend: { text: '+3pts vs last month', positive: true },
    },
    {
      label: 'Top Score',
      value: stats.topScore ? `${stats.topScore}` : '—',
      sub: 'Highest in database',
      Icon: Trophy,
      trend: { text: 'Consistent · 7 days', positive: false },
    },
  ];

  /* Horizontal bar chart data */
  const chartData = categoryChartData.map((n) => ({
    name: shortenCategory(n.name).slice(0, 16),
    fullName: n.name,
    orders: n.totalOrders,
  }));
  const maxOrders = Math.max(1, ...chartData.map((d) => d.orders));

  /* Top opportunities */
  interface Opportunity {
    label: string;
    href: string;
    product: Product | null;
    statText: string;
    statColor: string;
  }
  const opportunities: Opportunity[] = [
    {
      label: 'Top trending',
      href: '/app/products?tab=trending',
      product: topProduct ?? null,
      statText: topProduct?.sold_count ? `${fmtK(topProduct.sold_count)} orders / mo` : '—',
      statColor: C.green,
    },
    {
      label: 'Best margin',
      href: '/app/products?tab=highmargin',
      product: highMarginProduct ?? null,
      statText: highMarginProduct?.price_aud != null
        ? `$${Number(highMarginProduct.price_aud).toFixed(2)} landed cost`
        : '—',
      statColor: C.green,
    },
    {
      label: 'Newest',
      href: '/app/products?tab=new',
      product: newestProduct ?? null,
      statText: 'Added this week',
      statColor: C.muted,
    },
  ];

  const platformStatus = [
    { name: 'AliExpress Feed', chip: 'Live' },
    { name: 'Apify Pipeline',  chip: 'Running' },
    { name: 'Stripe Payments', chip: 'Active' },
  ];

  return (
    <>
      <style>{STYLES}</style>

      <div
        style={{
          position: 'relative',
          background: C.bg,
          minHeight: '100vh',
          fontFamily: INTER,
          color: C.text,
        }}
      >
        {/* Halo glow at top-center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 1200px 600px at 50% -200px, rgba(99,102,241,0.12), transparent)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ──────────────────────────────
              SECTION 1 — Top bar
              ────────────────────────────── */}
          <div
            style={{
              height: 52,
              background: C.bg,
              borderBottom: `1px solid ${C.line}`,
              padding: '0 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontFamily: INTER,
                fontSize: 13,
                color: C.body,
                fontWeight: 500,
              }}
            >
              Home
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: INTER,
                fontSize: 12,
                color: C.muted,
              }}
            >
              <span className="mj-pulse" />
              <span>Live · Updated 6 hours ago</span>
            </div>
            <Link href="/app/products" className="mj-btn-primary">
              Discover products
              <ArrowRight size={13} strokeWidth={2.25} />
            </Link>
          </div>

          {/* ──────────────────────────────
              SECTION 2 — Welcome row
              ────────────────────────────── */}
          <div style={{ padding: '32px 32px 0' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 24,
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: SYNE,
                    fontSize: 40,
                    fontWeight: 700,
                    color: C.text,
                    margin: 0,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.1,
                  }}
                >
                  Good {tod}, {firstName}.
                </h1>
                <div
                  style={{
                    fontFamily: INTER,
                    fontSize: 13,
                    color: C.muted,
                    marginTop: 8,
                  }}
                >
                  {today} · Scale Plan
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────
              SECTION 3 — KPI cards
              ────────────────────────────── */}
          <div
            style={{
              padding: '24px 32px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
            }}
          >
            {kpiCards.map((card) => (
              <KpiCard key={card.label} card={card} loading={stats.loading} />
            ))}
          </div>

          {/* ──────────────────────────────
              SECTION 4 — Main content
              Left: Category Performance (horizontal bars)
              Right: Top Opportunities + Platform Status
              ────────────────────────────── */}
          <div
            style={{
              padding: '0 32px 32px',
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: 20,
            }}
          >
            {/* ── LEFT: Category Performance ── */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.line}`,
                borderRadius: 14,
                padding: 24,
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
                    fontFamily: INTER,
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  Category Performance
                </div>
                <select
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.lineStrong}`,
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontFamily: INTER,
                    color: C.body,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option>Top 8 by orders</option>
                </select>
              </div>

              {/* Horizontal bars */}
              {chartData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {chartData.map((d, i) => {
                    const pct = Math.max(2, (d.orders / maxOrders) * 100);
                    const valueLabel =
                      d.orders >= 1_000_000
                        ? `${(d.orders / 1_000_000).toFixed(1)}M`
                        : d.orders >= 1_000
                          ? `${Math.round(d.orders / 1_000)}k`
                          : d.orders.toLocaleString();
                    return (
                      <Link
                        key={i}
                        href={`/app/products?category=${encodeURIComponent(d.fullName)}`}
                        className="mj-chart-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          textDecoration: 'none',
                          padding: '2px 0',
                        }}
                      >
                        <div
                          style={{
                            width: 100,
                            fontFamily: INTER,
                            fontSize: 12,
                            color: C.body,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                          title={d.fullName}
                        >
                          {d.name}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 4,
                            overflow: 'hidden',
                            minWidth: 0,
                          }}
                        >
                          <div
                            className="mj-chart-bar-fill"
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
                            fontFamily: INTER,
                            fontSize: 12,
                            color: C.muted,
                            fontVariantNumeric: 'tabular-nums',
                            flexShrink: 0,
                          }}
                        >
                          {valueLabel}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.muted,
                    fontSize: 13,
                  }}
                >
                  Loading category data
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div>
              {/* Quick Wins */}
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.line}`,
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: INTER,
                    fontSize: 13,
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
                      padding: '12px 0',
                      borderBottom:
                        i === opportunities.length - 1 ? 'none' : `1px solid ${C.lineSoft}`,
                      textDecoration: 'none',
                    }}
                  >
                    {o.product ? (
                      <Thumb
                        image={o.product.image_url}
                        title={o.product.product_title}
                        size={44}
                        radius={8}
                      />
                    ) : (
                      <div className="mj-shim" style={{ width: 44, height: 44, borderRadius: 8 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'inline-block',
                          fontFamily: INTER,
                          fontSize: 9,
                          fontWeight: 600,
                          color: C.accentHover,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          background: 'rgba(99,102,241,0.15)',
                          borderRadius: 4,
                          padding: '2px 6px',
                          marginBottom: 5,
                        }}
                      >
                        {o.label}
                      </div>
                      <div
                        style={{
                          fontFamily: INTER,
                          fontSize: 13,
                          fontWeight: 500,
                          color: C.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: 2,
                        }}
                      >
                        {truncate(o.product?.product_title ?? '—', 28)}
                      </div>
                      <div
                        style={{
                          fontFamily: INTER,
                          fontSize: 12,
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

              {/* Platform health */}
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.line}`,
                  borderRadius: 14,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: INTER,
                    fontSize: 13,
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
                        i === platformStatus.length - 1 ? 'none' : `1px solid ${C.lineSoft}`,
                    }}
                  >
                    <span className="mj-pulse" />
                    <span
                      style={{
                        flex: 1,
                        fontFamily: INTER,
                        fontSize: 13,
                        color: C.text,
                      }}
                    >
                      {row.name}
                    </span>
                    <span
                      style={{
                        background: 'rgba(16,185,129,0.1)',
                        color: C.green,
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontFamily: INTER,
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

          {/* ──────────────────────────────
              SECTION 5 — Top Products table
              ────────────────────────────── */}
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
                  fontFamily: SYNE,
                  fontSize: 18,
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
                  fontFamily: INTER,
                  fontSize: 13,
                  color: C.accent,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                View all {total > 0 ? total.toLocaleString() : ''} →
              </Link>
            </div>

            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.line}`,
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed',
                }}
              >
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
                          padding: '12px 20px',
                          textAlign: i >= 3 ? 'right' : 'left',
                          fontFamily: INTER,
                          fontSize: 10,
                          fontWeight: 500,
                          color: C.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
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
                      <tr key={i} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                        <td colSpan={6} style={{ padding: '16px 20px' }}>
                          <span
                            className="mj-shim"
                            style={{ height: 14, width: '100%', borderRadius: 4 }}
                          />
                        </td>
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: '64px 20px',
                          textAlign: 'center',
                          color: C.muted,
                          fontFamily: INTER,
                        }}
                      >
                        No products tracked yet
                      </td>
                    </tr>
                  ) : (
                    products.map((p, i) => {
                      const score = p.winning_score ?? 0;
                      const orders = p.sold_count ?? 0;
                      const isLast = i === products.length - 1;
                      return (
                        <tr
                          key={p.id}
                          className="mj-row"
                          onClick={() => setSelectedProduct(p)}
                          style={{
                            borderBottom: isLast ? 'none' : `1px solid ${C.lineSoft}`,
                          }}
                        >
                          <td
                            style={{
                              padding: '16px 20px',
                              fontFamily: INTER,
                              fontSize: 12,
                              color: C.muted,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                              <Thumb image={p.image_url} title={p.product_title} size={52} radius={10} />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  style={{
                                    fontFamily: INTER,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: C.text,
                                    maxWidth: 440,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={p.product_title}
                                >
                                  {p.product_title}
                                </div>
                                <div
                                  style={{
                                    fontFamily: INTER,
                                    fontSize: 11,
                                    color: C.muted,
                                    marginTop: 3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {shortenCategory(p.category)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: '16px 20px',
                              fontFamily: INTER,
                              fontSize: 12,
                              color: C.body,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {shortenCategory(p.category)}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            {score ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  background: 'rgba(16,185,129,0.1)',
                                  border: '1px solid rgba(16,185,129,0.2)',
                                  color: C.green,
                                  borderRadius: 6,
                                  padding: '4px 10px',
                                  fontSize: 13,
                                  fontFamily: INTER,
                                  fontWeight: 600,
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {score}
                              </span>
                            ) : (
                              <span style={{ color: C.muted, fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '16px 20px',
                              textAlign: 'right',
                              fontFamily: INTER,
                              fontSize: 14,
                              color: orders > 0 ? C.text : C.muted,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {orders > 0 ? fmtK(orders) : '—'}
                          </td>
                          <td
                            style={{
                              padding: '16px 20px',
                              textAlign: 'right',
                              fontFamily: INTER,
                              fontSize: 14,
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
