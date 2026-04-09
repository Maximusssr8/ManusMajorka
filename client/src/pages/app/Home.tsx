import { Link } from 'wouter';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, useProductStats, type Product } from '@/hooks/useProducts';
import { useNicheStats } from '@/hooks/useNicheStats';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import { scorePillStyle, fmtScore } from '@/lib/scorePill';
import { t, labelStyle, cardStyle, btnPrimaryStyle, numStyle } from '@/lib/designTokens';

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

/* ──────────────────────────────────────────────────────────────
   Shimmer — one small style block, reused by skeletons
   ────────────────────────────────────────────────────────────── */

const SHIMMER = `
@keyframes mj-shim {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.mj-shim {
  background: linear-gradient(90deg, ${t.surface} 0%, ${t.raised} 50%, ${t.surface} 100%);
  background-size: 400px 100%;
  animation: mj-shim 1.4s linear infinite;
  border-radius: 4px;
  display: inline-block;
}
.mj-row { transition: background ${t.dur} ${t.ease}; cursor: pointer; }
.mj-row:hover { background: ${t.raised}; }
`;

/* ──────────────────────────────────────────────────────────────
   KPI Card — flat, no border-left stripe, no decorative sparkline,
   no icon-in-top-right template. Just label + big number + delta.
   ────────────────────────────────────────────────────────────── */

interface KpiCardData {
  label: string;
  value: string;
  sub: string;
  delta?: { value: string; positive: boolean } | null;
}

function KpiCard({ card, loading }: { card: KpiCardData; loading: boolean }) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: `${t.s5}px ${t.s6}px`,
        minHeight: 128,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={labelStyle}>{card.label}</div>
      <div
        style={{
          ...numStyle,
          fontSize: 36,
          lineHeight: 1,
          marginTop: t.s3,
          marginBottom: t.s2,
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {loading && (!card.value || card.value === '—') ? (
          <span className="mj-shim" style={{ height: 22, width: 88 }} />
        ) : (
          card.value && card.value !== '—' ? card.value : '0'
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: t.s2,
          fontFamily: t.fontBody,
          fontSize: t.fCaption,
          color: t.muted,
        }}
      >
        <span>{card.sub}</span>
        {card.delta && (
          <span
            style={{
              color: card.delta.positive ? t.green : t.red,
              fontFamily: t.fontBody,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {card.delta.value}
          </span>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Product row thumb — no category gradient background, just a
   single surface with the image. Initial fallback in display font.
   ────────────────────────────────────────────────────────────── */

function RowThumb({ image, title }: { image: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const initial = (title?.trim()?.[0] || '?').toUpperCase();
  const hasImage = image && !failed;
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: t.rSm,
        background: t.raised,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1px solid ${t.line}`,
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
            fontFamily: t.fontDisplay,
            fontSize: 18,
            fontWeight: 700,
            color: t.muted,
          }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Leaderboard table — borderless rows, divider lines only.
   ────────────────────────────────────────────────────────────── */

const COLS = '28px minmax(0,1fr) 112px 72px 80px 72px';
const HEADERS = ['#', 'Product', 'Category', 'Score', 'Orders', 'Price'];

function SkeletonRow() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: COLS,
        gap: t.s4,
        padding: `${t.s3}px ${t.s5}px`,
        alignItems: 'center',
        minHeight: 68,
        borderBottom: `1px solid ${t.line}`,
      }}
    >
      <span className="mj-shim" style={{ height: 12, width: 18 }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: t.s3 }}>
        <span className="mj-shim" style={{ height: 44, width: 44, borderRadius: t.rSm }} />
        <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      </span>
      <span className="mj-shim" style={{ height: 12, width: 84 }} />
      <span className="mj-shim" style={{ height: 18, width: 40, borderRadius: t.rPill }} />
      <span className="mj-shim" style={{ height: 12, width: 48 }} />
      <span className="mj-shim" style={{ height: 12, width: 48 }} />
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

  // Bar chart — category by order volume
  const chartData = categoryChartData.map((n) => ({
    name: shortenCategory(n.name).slice(0, 12),
    fullName: n.name,
    orders: n.totalOrders,
    productCount: n.count,
  }));

  const kpiCards: KpiCardData[] = [
    { label: 'Products Tracked', value: fmtNum(stats.total),    sub: 'Live AliExpress feed' },
    { label: 'Hot Products',     value: fmtNum(stats.hotCount), sub: 'Score 65 and above' },
    { label: 'Average Score',    value: stats.avgScore ? `${stats.avgScore}` : '—', sub: 'Out of 100' },
    { label: 'Top Score',        value: stats.topScore ? `${stats.topScore}` : '—', sub: 'Highest in database' },
  ];

  interface Shortcut {
    label: string;
    href: string;
    product: Product | null;
    badge: string;
    cta: string;
  }

  const shortcuts: Shortcut[] = [
    {
      label: 'Top trending',
      href: '/app/products?tab=trending',
      product: topProduct ?? null,
      badge: topProduct?.sold_count ? `${fmtK(topProduct.sold_count)} orders / mo` : 'Live',
      cta: 'View product',
    },
    {
      label: 'Best margin',
      href: '/app/products?tab=highmargin',
      product: highMarginProduct ?? null,
      badge: highMarginProduct?.price_aud != null ? `$${Number(highMarginProduct.price_aud).toFixed(2)}` : '',
      cta: 'Calculate profit',
    },
    {
      label: 'Newest',
      href: '/app/products?tab=new',
      product: newestProduct ?? null,
      badge: 'Added this week',
      cta: 'See what is new',
    },
  ];

  return (
    <>
      <style>{SHIMMER}</style>

      <div
        style={{
          padding: `${t.s8}px ${t.s8}px ${t.s9}px`,
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* ── HEADER ──
            Left-aligned. No gradient text, no "live" dot, no
            "12,302 products tracked" caption — the KPI card below
            already says it. H1 is restrained; weight + colour
            carry the hierarchy, not massive scale. */}
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: t.s6,
            flexWrap: 'wrap',
            marginBottom: t.s8,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: t.fontBody,
                fontSize: t.fCaption,
                color: t.muted,
                marginBottom: t.s2,
                letterSpacing: '0.02em',
              }}
            >
              {today}
            </div>
            <h1
              style={{
                fontFamily: t.fontDisplay,
                fontSize: t.fH1,
                fontWeight: 700,
                color: t.text,
                letterSpacing: '-0.025em',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Good {tod}, {firstName}.
            </h1>
            <p
              style={{
                fontFamily: t.fontBody,
                fontSize: t.fLead,
                color: t.body,
                margin: `${t.s3}px 0 0`,
                maxWidth: '52ch',
                lineHeight: 1.5,
              }}
            >
              Your product intelligence is live. Here is what is moving across the Australian market today.
            </p>
          </div>
          <Link
            href="/app/products"
            style={btnPrimaryStyle}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = t.accentHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = t.accent; }}
          >
            Discover products
            <ArrowUpRight size={14} strokeWidth={2} />
          </Link>
        </header>

        {/* ── KPI CARDS ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: t.s4,
            marginBottom: t.s7,
          }}
        >
          {kpiCards.map((card) => (
            <KpiCard key={card.label} card={card} loading={stats.loading} />
          ))}
        </div>

        {/* ── CATEGORY CHART + SHORTCUTS ──
            Asymmetric 2-column: the chart is the hero, shortcuts
            stack to the right. On narrow screens they wrap to a
            single column. Breaks the generic 3-card row. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.55fr) minmax(280px, 1fr)',
            gap: t.s4,
            marginBottom: t.s7,
          }}
        >
          {/* Chart */}
          <div style={{ ...cardStyle, padding: `${t.s5}px ${t.s6}px` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: t.s5,
              }}
            >
              <div>
                <div style={labelStyle}>Category performance</div>
                <div
                  style={{
                    fontFamily: t.fontBody,
                    fontSize: t.fCaption,
                    color: t.faint,
                    marginTop: 2,
                  }}
                >
                  Top 8 by order volume
                </div>
              </div>
            </div>
            <div style={{ height: 220 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 4, right: 0, left: 0, bottom: 4 }}
                    onClick={(d) => {
                      const active = d?.activePayload?.[0]?.payload as { fullName?: string } | undefined;
                      if (active?.fullName) {
                        window.location.href = `/app/products?category=${encodeURIComponent(active.fullName)}`;
                      }
                    }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke={t.faint}
                      tick={{ fontSize: 11, fontFamily: t.fontBody, fill: t.muted }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={t.faint}
                      tick={{ fontSize: 10, fontFamily: t.fontBody, fill: t.muted }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                    />
                    <Tooltip
                      cursor={{ fill: t.accentTint }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const row = payload[0].payload as {
                          fullName: string;
                          orders: number;
                          productCount: number;
                        };
                        return (
                          <div
                            style={{
                              background: t.raised,
                              border: `1px solid ${t.lineStrong}`,
                              borderRadius: t.rSm,
                              padding: `${t.s3}px ${t.s4}px`,
                              fontFamily: t.fontBody,
                              fontSize: t.fCaption,
                              minWidth: 180,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                color: t.text,
                                fontSize: t.fBody,
                                marginBottom: 2,
                              }}
                            >
                              {row.fullName}
                            </div>
                            <div style={{ color: t.muted }}>
                              {row.orders.toLocaleString()} orders · {row.productCount} products
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="orders" radius={[3, 3, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={t.accent} cursor="pointer" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: t.muted,
                    fontFamily: t.fontBody,
                    fontSize: t.fBody,
                  }}
                >
                  Loading category data…
                </div>
              )}
            </div>
          </div>

          {/* Shortcuts — borderless list, dividers between items */}
          <div style={{ ...cardStyle, padding: `${t.s5}px 0`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: `0 ${t.s6}px ${t.s4}px`, ...labelStyle }}>Quick actions</div>
            {shortcuts.map((s, i) => (
              <Link
                key={s.label}
                href={s.href}
                className="mj-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: t.s4,
                  padding: `${t.s4}px ${t.s6}px`,
                  textDecoration: 'none',
                  borderTop: i === 0 ? 'none' : `1px solid ${t.line}`,
                  flex: 1,
                }}
              >
                {s.product ? (
                  <RowThumb image={s.product.image_url} title={s.product.product_title} />
                ) : (
                  <div
                    className="mj-shim"
                    style={{ width: 44, height: 44, borderRadius: t.rSm }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: t.fontBody,
                      fontSize: t.fCaption,
                      color: t.muted,
                      marginBottom: 2,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: t.fontBody,
                      fontSize: t.fBody,
                      fontWeight: 500,
                      color: t.text,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.35,
                    }}
                  >
                    {s.product?.product_title ?? s.cta}
                  </div>
                  {s.badge && (
                    <div
                      style={{
                        fontFamily: t.fontBody,
                        fontSize: t.fCaption,
                        color: t.muted,
                        marginTop: 2,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {s.badge}
                    </div>
                  )}
                </div>
                <ArrowUpRight size={14} strokeWidth={2} color={t.faint} />
              </Link>
            ))}
          </div>
        </div>

        {/* ── LEADERBOARD ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: t.s4,
          }}
        >
          <h2
            style={{
              fontFamily: t.fontDisplay,
              fontSize: t.fH2,
              fontWeight: 700,
              color: t.text,
              margin: 0,
              letterSpacing: '-0.015em',
            }}
          >
            Top products
          </h2>
          <Link
            href="/app/products"
            style={{
              fontFamily: t.fontBody,
              fontSize: t.fBody,
              color: t.accent,
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            View all {total > 0 ? total.toLocaleString() : ''} →
          </Link>
        </div>

        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: COLS,
              gap: t.s4,
              padding: `${t.s3}px ${t.s5}px`,
              borderBottom: `1px solid ${t.line}`,
              background: 'transparent',
            }}
          >
            {HEADERS.map((h, i) => (
              <div
                key={i}
                style={{
                  fontFamily: t.fontBody,
                  fontSize: t.fCaption,
                  fontWeight: 600,
                  color: t.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: i === 3 || i === 4 || i === 5 ? 'right' : 'left',
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {prodLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : products.length === 0 ? (
            <EmptyState />
          ) : (
            products.map((p, i) => {
              const score = p.winning_score ?? 0;
              const orders = p.sold_count ?? 0;
              const sp = scorePillStyle(score);
              const categoryShort = shortenCategory(p.category);
              return (
                <div
                  key={p.id}
                  className="mj-row"
                  onClick={() => setSelectedProduct(p)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: COLS,
                    gap: t.s4,
                    padding: `${t.s3}px ${t.s5}px`,
                    alignItems: 'center',
                    minHeight: 68,
                    borderBottom: i === products.length - 1 ? 'none' : `1px solid ${t.line}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: t.fontBody,
                      fontSize: t.fCaption,
                      color: t.faint,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: t.s3, minWidth: 0 }}>
                    <RowThumb image={p.image_url} title={p.product_title} />
                    <span
                      title={p.product_title}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontFamily: t.fontBody,
                        fontSize: t.fBody,
                        fontWeight: 500,
                        color: t.text,
                        lineHeight: 1.35,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                      }}
                    >
                      {p.product_title}
                    </span>
                  </span>
                  <span
                    title={p.category ?? ''}
                    style={{
                      fontFamily: t.fontBody,
                      fontSize: t.fCaption,
                      color: t.muted,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {categoryShort}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        background: sp.background,
                        color: sp.color,
                        border: sp.border,
                        fontFamily: t.fontBody,
                        fontSize: t.fCaption,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        padding: '2px 9px',
                        borderRadius: t.rPill,
                        display: 'inline-block',
                      }}
                    >
                      {score ? fmtScore(score) : '—'}
                    </span>
                  </span>
                  <span
                    title={orders > 0 ? orders.toLocaleString() : ''}
                    style={{
                      fontFamily: t.fontBody,
                      fontSize: t.fBody,
                      color: orders > 0 ? t.text : t.faint,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                    }}
                  >
                    {orders > 0 ? fmtK(orders) : '—'}
                  </span>
                  <span
                    style={{
                      fontFamily: t.fontBody,
                      fontSize: t.fBody,
                      color: t.muted,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                    }}
                  >
                    {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Empty state — teaches the interface instead of just saying
   "nothing here".
   ────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div
      style={{
        padding: `${t.s9}px ${t.s5}px`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: t.fontDisplay,
          fontSize: t.fH3,
          fontWeight: 600,
          color: t.text,
          marginBottom: t.s2,
        }}
      >
        No products tracked yet
      </div>
      <div
        style={{
          fontFamily: t.fontBody,
          fontSize: t.fBody,
          color: t.muted,
          marginBottom: t.s5,
          maxWidth: '44ch',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        The AliExpress feed refreshes every 6 hours. Run the scout to seed the database now.
      </div>
      <Link
        href="/app/products"
        style={btnPrimaryStyle}
      >
        Go to Products
      </Link>
    </div>
  );
}
