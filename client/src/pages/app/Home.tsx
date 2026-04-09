import { Link } from 'wouter';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, useProductStats, type Product } from '@/hooks/useProducts';
import { useNicheStats } from '@/hooks/useNicheStats';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import { t, labelStyle, btnPrimaryStyle, numStyle } from '@/lib/designTokens';

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
   Styles — one shared block for row hover + shimmer + chart bar hover.
   ────────────────────────────────────────────────────────────── */

const STYLES = `
@keyframes mj-shim {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.mj-shim {
  background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%);
  background-size: 400px 100%;
  animation: mj-shim 1.4s linear infinite;
  display: inline-block;
}
.mj-row { transition: background ${t.dur} ${t.ease}; cursor: pointer; }
.mj-row:hover { background: rgba(255,255,255,0.02); }
.mj-bar:hover rect { fill: rgba(255,255,255,0.35) !important; }
`;

/* ──────────────────────────────────────────────────────────────
   Score pill — smaller, less saturated, no ring.
   ────────────────────────────────────────────────────────────── */

function scorePill(score: number): React.CSSProperties {
  if (score >= 90) {
    return {
      background: t.greenDim,
      color: t.green,
      border: `1px solid ${t.greenDim}`,
    };
  }
  if (score >= 65) {
    return {
      background: t.amberDim,
      color: t.amber,
      border: `1px solid ${t.amberDim}`,
    };
  }
  return {
    background: 'rgba(255,255,255,0.06)',
    color: t.body,
    border: `1px solid ${t.line}`,
  };
}

/* ──────────────────────────────────────────────────────────────
   KPI — no card border. Just a label + massive number + thin
   bottom hairline on the row.
   ────────────────────────────────────────────────────────────── */

interface KpiData {
  label: string;
  value: string;
  sub: string;
}

function Kpi({ data, loading }: { data: KpiData; loading: boolean }) {
  return (
    <div
      style={{
        padding: `${t.s6}px ${t.s6}px ${t.s6}px 0`,
        borderRight: `1px solid ${t.line}`,
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ ...labelStyle, marginBottom: t.s5 }}>{data.label}</div>
      <div
        style={{
          ...numStyle,
          fontSize: t.fKpi,
          lineHeight: 1,
          marginBottom: t.s3,
          minHeight: t.fKpi,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {loading && (!data.value || data.value === '—') ? (
          <span className="mj-shim" style={{ height: 28, width: 100, borderRadius: 2 }} />
        ) : (
          data.value && data.value !== '—' ? data.value : '0'
        )}
      </div>
      <div
        style={{
          fontFamily: t.fontBody,
          fontSize: t.fCaption,
          color: t.muted,
        }}
      >
        {data.sub}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Row thumb — no card background, just an image with a hairline.
   ────────────────────────────────────────────────────────────── */

function RowThumb({ image, title }: { image: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const initial = (title?.trim()?.[0] || '?').toUpperCase();
  const hasImage = image && !failed;
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: t.rSm,
        border: `1px solid ${t.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        background: t.bg,
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
            fontSize: 15,
            fontWeight: 600,
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
   Leaderboard table — editorial. Thin column dividers via gap,
   no row fills, no borders except a single hairline per row.
   ────────────────────────────────────────────────────────────── */

const COLS = '32px minmax(0,1fr) 140px 72px 80px 80px 20px';
const HEADERS = ['#', 'Product', 'Category', 'Score', 'Orders', 'Price', ''];

function SkeletonRow() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: COLS,
        gap: t.s5,
        padding: `${t.s4}px 0`,
        alignItems: 'center',
        minHeight: 64,
        borderBottom: `1px solid ${t.line}`,
      }}
    >
      <span className="mj-shim" style={{ height: 11, width: 18, borderRadius: 2 }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: t.s3 }}>
        <span className="mj-shim" style={{ height: 40, width: 40, borderRadius: t.rSm }} />
        <span className="mj-shim" style={{ height: 12, width: '70%', borderRadius: 2 }} />
      </span>
      <span className="mj-shim" style={{ height: 11, width: 90, borderRadius: 2 }} />
      <span className="mj-shim" style={{ height: 18, width: 36, borderRadius: t.rPill }} />
      <span className="mj-shim" style={{ height: 11, width: 48, borderRadius: 2 }} />
      <span className="mj-shim" style={{ height: 11, width: 48, borderRadius: 2 }} />
      <span />
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

  const chartData = categoryChartData.map((n) => ({
    name: shortenCategory(n.name).slice(0, 12),
    fullName: n.name,
    orders: n.totalOrders,
    productCount: n.count,
  }));

  const kpiCards: KpiData[] = [
    { label: 'Products tracked', value: fmtNum(stats.total),    sub: 'Live AliExpress feed' },
    { label: 'Hot products',     value: fmtNum(stats.hotCount), sub: 'Score 65 and above' },
    { label: 'Average score',    value: stats.avgScore ? `${stats.avgScore}` : '—', sub: 'Out of 100' },
    { label: 'Top score',        value: stats.topScore ? `${stats.topScore}` : '—', sub: 'Highest in database' },
  ];

  interface Shortcut {
    label: string;
    href: string;
    product: Product | null;
    badge: string;
  }

  const shortcuts: Shortcut[] = [
    {
      label: 'Top trending',
      href: '/app/products?tab=trending',
      product: topProduct ?? null,
      badge: topProduct?.sold_count ? `${fmtK(topProduct.sold_count)} orders` : '',
    },
    {
      label: 'Best margin',
      href: '/app/products?tab=highmargin',
      product: highMarginProduct ?? null,
      badge: highMarginProduct?.price_aud != null ? `$${Number(highMarginProduct.price_aud).toFixed(2)}` : '',
    },
    {
      label: 'Newest',
      href: '/app/products?tab=new',
      product: newestProduct ?? null,
      badge: 'This week',
    },
  ];

  return (
    <>
      <style>{STYLES}</style>

      <div
        style={{
          padding: `${t.s10}px ${t.s9}px`,
          maxWidth: 1320,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* ── HERO ────────────────────────────────────────
            Massive H1. Date above in 13px faint grey. Nothing
            else on that line. Primary CTA is the only gold. */}
        <header style={{ marginBottom: t.s10 }}>
          <div
            style={{
              fontFamily: t.fontBody,
              fontSize: t.fBody,
              color: t.muted,
              marginBottom: t.s4,
              letterSpacing: '0.01em',
            }}
          >
            {today}
          </div>
          <h1
            style={{
              fontFamily: t.fontDisplay,
              fontSize: t.fH1,
              fontWeight: 600,
              color: t.text,
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Good {tod}, {firstName}.
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: t.s6,
              flexWrap: 'wrap',
              marginTop: t.s6,
            }}
          >
            <p
              style={{
                fontFamily: t.fontBody,
                fontSize: t.fLead,
                color: t.body,
                margin: 0,
                maxWidth: '56ch',
                lineHeight: 1.55,
              }}
            >
              Your product intelligence is live. Here is what is moving across the Australian market today.
            </p>
            <Link
              href="/app/products"
              style={btnPrimaryStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = t.accentHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = t.accent; }}
            >
              Discover products
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>
        </header>

        {/* ── KPIs ────────────────────────────────────────
            Four columns split by thin vertical rules — no card
            borders, no fills. Reads like a stat bar in a
            magazine, not a dashboard. */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            borderTop: `1px solid ${t.line}`,
            borderBottom: `1px solid ${t.line}`,
            marginBottom: t.s10,
          }}
        >
          {kpiCards.map((data, i) => (
            <div
              key={data.label}
              style={{
                padding: `${t.s6}px ${t.s5}px`,
                borderRight: i < kpiCards.length - 1 ? `1px solid ${t.line}` : 'none',
                minHeight: 148,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={labelStyle}>{data.label}</div>
              <div
                style={{
                  ...numStyle,
                  fontSize: t.fKpi,
                  lineHeight: 1,
                  marginTop: t.s5,
                  marginBottom: t.s3,
                  minHeight: t.fKpi,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {stats.loading && (!data.value || data.value === '—') ? (
                  <span className="mj-shim" style={{ height: 28, width: 100, borderRadius: 2 }} />
                ) : (
                  data.value && data.value !== '—' ? data.value : '0'
                )}
              </div>
              <div
                style={{
                  fontFamily: t.fontBody,
                  fontSize: t.fCaption,
                  color: t.muted,
                }}
              >
                {data.sub}
              </div>
            </div>
          ))}
        </section>

        {/* ── CATEGORY CHART + QUICK ACTIONS ─────────────
            Two columns, divided by a single vertical hairline.
            No cards. The label is the whole container identity. */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)',
            gap: 0,
            marginBottom: t.s10,
          }}
        >
          {/* Chart column */}
          <div
            style={{
              paddingRight: t.s9,
              borderRight: `1px solid ${t.line}`,
            }}
          >
            <div style={{ ...labelStyle, marginBottom: t.s2 }}>Category performance</div>
            <div
              style={{
                fontFamily: t.fontBody,
                fontSize: t.fCaption,
                color: t.faint,
                marginBottom: t.s6,
              }}
            >
              Top 8 by order volume
            </div>
            <div style={{ height: 260 }}>
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
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
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
                              background: t.bg,
                              border: `1px solid ${t.lineStrong}`,
                              borderRadius: t.rMd,
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
                    <Bar dataKey="orders" radius={[1, 1, 0, 0]} className="mj-bar">
                      {chartData.map((_, i) => (
                        <Cell key={i} fill="rgba(255,255,255,0.15)" cursor="pointer" />
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
                  Loading category data
                </div>
              )}
            </div>
          </div>

          {/* Quick actions — no card, just a label + stacked list */}
          <div style={{ paddingLeft: t.s9 }}>
            <div style={{ ...labelStyle, marginBottom: t.s6 }}>Quick actions</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {shortcuts.map((s, i) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="mj-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: t.s4,
                    padding: `${t.s4}px 0`,
                    textDecoration: 'none',
                    borderTop: i === 0 ? 'none' : `1px solid ${t.line}`,
                  }}
                >
                  {s.product ? (
                    <RowThumb image={s.product.image_url} title={s.product.product_title} />
                  ) : (
                    <div
                      className="mj-shim"
                      style={{ width: 40, height: 40, borderRadius: t.rSm }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: t.fontBody,
                        fontSize: t.fMicro,
                        color: t.muted,
                        marginBottom: 2,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
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
                      {s.product?.product_title ?? '—'}
                    </div>
                    {s.badge && (
                      <div
                        style={{
                          fontFamily: t.fontBody,
                          fontSize: t.fMicro,
                          color: t.muted,
                          marginTop: 2,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {s.badge}
                      </div>
                    )}
                  </div>
                  <ArrowRight size={14} strokeWidth={1.5} color={t.muted} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── LEADERBOARD ───────────────────────────────── */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: t.s6,
            }}
          >
            <h2
              style={{
                fontFamily: t.fontDisplay,
                fontSize: t.fH2,
                fontWeight: 600,
                color: t.text,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Top products
            </h2>
            <Link
              href="/app/products"
              style={{
                fontFamily: t.fontBody,
                fontSize: t.fBody,
                color: t.muted,
                textDecoration: 'none',
                fontWeight: 500,
                transition: `color ${t.dur} ${t.ease}`,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.text; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.muted; }}
            >
              View all {total > 0 ? total.toLocaleString() : ''} →
            </Link>
          </div>

          <div style={{ borderTop: `1px solid ${t.line}` }}>
            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: COLS,
                gap: t.s5,
                padding: `${t.s3}px 0`,
                borderBottom: `1px solid ${t.line}`,
              }}
            >
              {HEADERS.map((h, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: t.fontBody,
                    fontSize: t.fMicro,
                    fontWeight: 500,
                    color: t.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
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
                const sp = scorePill(score);
                const categoryShort = shortenCategory(p.category);
                return (
                  <div
                    key={p.id}
                    className="mj-row"
                    onClick={() => setSelectedProduct(p)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: COLS,
                      gap: t.s5,
                      padding: `${t.s4}px 0`,
                      alignItems: 'center',
                      minHeight: 68,
                      borderBottom: `1px solid ${t.line}`,
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
                      {score ? (
                        <span
                          style={{
                            background: sp.background,
                            color: sp.color,
                            border: sp.border,
                            fontFamily: t.fontBody,
                            fontSize: t.fMicro,
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                            padding: '2px 8px',
                            borderRadius: t.rPill,
                            display: 'inline-block',
                          }}
                        >
                          {score}
                        </span>
                      ) : (
                        <span style={{ color: t.faint, fontSize: t.fCaption }}>—</span>
                      )}
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
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <ArrowRight size={13} strokeWidth={1.5} color={t.faint} />
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Empty state — teaches, does not decorate.
   ────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div
      style={{
        padding: `${t.s10}px ${t.s5}px`,
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
          marginBottom: t.s6,
          maxWidth: '44ch',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        The AliExpress feed refreshes every 6 hours. Run the scout to seed the database now.
      </div>
      <Link href="/app/products" style={btnPrimaryStyle}>
        Go to Products
      </Link>
    </div>
  );
}
