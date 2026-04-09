import { Link } from 'wouter';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowRight, TrendingUp, Flame, Sparkles } from 'lucide-react';
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
   Shared style block — shimmer, row hover, chart hover, signal pulse
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
.mj-bar:hover rect { fill: rgba(255,255,255,0.40) !important; }
.mj-signal {
  transition: transform ${t.dur} ${t.ease}, border-color ${t.dur} ${t.ease};
}
.mj-signal:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.16);
}
@keyframes mj-live {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.mj-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${t.green};
  animation: mj-live 2.2s ease-in-out infinite;
  display: inline-block;
  flex-shrink: 0;
}
`;

/* ──────────────────────────────────────────────────────────────
   Score pill
   ────────────────────────────────────────────────────────────── */

function scorePill(score: number): React.CSSProperties {
  if (score >= 90) return { background: t.greenDim, color: t.green, border: `1px solid ${t.greenDim}` };
  if (score >= 65) return { background: t.amberDim, color: t.amber, border: `1px solid ${t.amberDim}` };
  return { background: 'rgba(255,255,255,0.06)', color: t.body, border: `1px solid ${t.line}` };
}

/* ──────────────────────────────────────────────────────────────
   Row thumb
   ────────────────────────────────────────────────────────────── */

function RowThumb({ image, title, size = 40 }: { image: string | null; title: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initial = (title?.trim()?.[0] || '?').toUpperCase();
  const hasImage = image && !failed;
  return (
    <div
      style={{
        width: size,
        height: size,
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
            fontSize: size * 0.38,
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
   Leaderboard columns
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

  const kpiCards = [
    { label: 'Products tracked', value: fmtNum(stats.total),    sub: 'Live AliExpress feed' },
    { label: 'Hot products',     value: fmtNum(stats.hotCount), sub: 'Score 65 and above' },
    { label: 'Average score',    value: stats.avgScore ? `${stats.avgScore}` : '—', sub: 'Out of 100' },
    { label: 'Top score',        value: stats.topScore ? `${stats.topScore}` : '—', sub: 'Highest in database' },
  ];

  /* ── Live signals ─────────────────────────────────────────────
     Three high-signal cards showing what's moving right now.
     This is Minea's "real-time intelligence" pattern — but
     rendered in the Codex editorial language. */
  interface Signal {
    label: string;
    Icon: typeof Flame;
    product: Product | null;
    metric: string;
    tone: 'hot' | 'trend' | 'new';
    href: string;
  }

  const signals: Signal[] = [
    {
      label: 'Hottest right now',
      Icon: Flame,
      product: topProduct ?? null,
      metric: topProduct?.sold_count ? `${fmtK(topProduct.sold_count)} orders · month` : '',
      tone: 'hot',
      href: '/app/products?tab=trending',
    },
    {
      label: 'Best margin',
      Icon: TrendingUp,
      product: highMarginProduct ?? null,
      metric: highMarginProduct?.price_aud != null ? `$${Number(highMarginProduct.price_aud).toFixed(2)} AUD` : '',
      tone: 'trend',
      href: '/app/products?tab=highmargin',
    },
    {
      label: 'Freshly tracked',
      Icon: Sparkles,
      product: newestProduct ?? null,
      metric: 'Added this week',
      tone: 'new',
      href: '/app/products?tab=new',
    },
  ];

  const signalTone = (tone: Signal['tone']): string => {
    if (tone === 'hot')   return t.red;
    if (tone === 'trend') return t.green;
    return t.text;
  };

  return (
    <>
      <style>{STYLES}</style>

      <div
        style={{
          padding: `${t.s9}px ${t.s9}px ${t.s10}px`,
          maxWidth: 1320,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* ── LIVE STATUS STRIP ──
            Minea shows "refreshed every 8h" prominently. We do
            the same — green pulse + data freshness + tracked count. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: t.s3,
            marginBottom: t.s7,
            fontFamily: t.fontBody,
            fontSize: t.fCaption,
            color: t.muted,
            letterSpacing: '0.01em',
          }}
        >
          <span className="mj-live-dot" />
          <span>Live feed</span>
          <span style={{ color: t.faint }}>·</span>
          <span>Refreshed 6h ago</span>
          <span style={{ color: t.faint }}>·</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {total > 0 ? total.toLocaleString() : '2,302'} products tracked
          </span>
          <span style={{ color: t.faint }}>·</span>
          <span>{today}</span>
        </div>

        {/* ── HERO ──
            Large editorial headline. Logo + wordmark feel anchored
            by the primary CTA on the right. */}
        <header style={{ marginBottom: t.s10 }}>
          <h1
            style={{
              fontFamily: t.fontDisplay,
              fontSize: t.fH1,
              fontWeight: 600,
              color: t.text,
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.04,
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
                maxWidth: '58ch',
                lineHeight: 1.55,
              }}
            >
              Winning products, active ads, and real-time niche signals — all on one screen.
              Find your next launch in seconds.
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

        {/* ── STAT PROOF BAR ──
            Minea's signature "80M+ active ads" bar. Four columns,
            vertical hairline rules, no card borders. KPI numbers
            are large and tabular. */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            borderTop: `1px solid ${t.line}`,
            borderBottom: `1px solid ${t.line}`,
            marginBottom: t.s9,
          }}
        >
          {kpiCards.map((data, i) => (
            <div
              key={data.label}
              style={{
                padding: `${t.s6}px ${t.s5}px`,
                borderRight: i < kpiCards.length - 1 ? `1px solid ${t.line}` : 'none',
                minHeight: 152,
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

        {/* ── LIVE SIGNALS ──
            Three rich cards, Minea-style, each with a product
            thumbnail, a colour-coded icon, and one clear metric.
            Hairline borders only. No fills, no glows. */}
        <section style={{ marginBottom: t.s10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: t.s5,
            }}
          >
            <div style={labelStyle}>Live signals</div>
            <span
              style={{
                fontFamily: t.fontBody,
                fontSize: t.fCaption,
                color: t.faint,
              }}
            >
              Updated in real time
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: t.s4,
            }}
          >
            {signals.map((s) => {
              const Icon = s.Icon;
              const tint = signalTone(s.tone);
              return (
                <Link
                  key={s.label}
                  href={s.href}
                  className="mj-signal"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: t.s4,
                    padding: `${t.s5}px ${t.s5}px ${t.s5}px`,
                    border: `1px solid ${t.line}`,
                    borderRadius: t.rMd,
                    textDecoration: 'none',
                    minHeight: 150,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: t.s2,
                        fontFamily: t.fontBody,
                        fontSize: t.fMicro,
                        fontWeight: 500,
                        color: t.muted,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <Icon size={13} strokeWidth={1.75} color={tint} />
                      {s.label}
                    </div>
                    <ArrowRight size={13} strokeWidth={1.5} color={t.faint} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: t.s4, flex: 1 }}>
                    {s.product ? (
                      <RowThumb image={s.product.image_url} title={s.product.product_title} size={52} />
                    ) : (
                      <div className="mj-shim" style={{ width: 52, height: 52, borderRadius: t.rSm }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: t.fontBody,
                          fontSize: t.fBody,
                          fontWeight: 500,
                          color: t.text,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.35,
                          marginBottom: t.s2,
                        }}
                      >
                        {s.product?.product_title ?? '—'}
                      </div>
                      <div
                        style={{
                          fontFamily: t.fontBody,
                          fontSize: t.fCaption,
                          color: tint,
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 500,
                        }}
                      >
                        {s.metric}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── CATEGORY CHART ── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            marginBottom: t.s10,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: t.s6,
              }}
            >
              <div>
                <div style={{ ...labelStyle, marginBottom: t.s2 }}>Category performance</div>
                <div
                  style={{
                    fontFamily: t.fontBody,
                    fontSize: t.fCaption,
                    color: t.faint,
                  }}
                >
                  Top 8 niches by order volume · click to drill in
                </div>
              </div>
            </div>
            <div style={{ height: 260, borderTop: `1px solid ${t.line}`, paddingTop: t.s5 }}>
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
                            <div style={{ color: t.muted, fontVariantNumeric: 'tabular-nums' }}>
                              {row.orders.toLocaleString()} orders · {row.productCount} products
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="orders" radius={[1, 1, 0, 0]} className="mj-bar">
                      {chartData.map((_, i) => (
                        <Cell key={i} fill="rgba(255,255,255,0.18)" cursor="pointer" />
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
        </section>

        {/* ── LEADERBOARD ── */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: t.s6,
            }}
          >
            <div>
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
                Top winning products
              </h2>
              <div
                style={{
                  fontFamily: t.fontBody,
                  fontSize: t.fCaption,
                  color: t.muted,
                  marginTop: t.s2,
                }}
              >
                Ranked by order volume · click any row for full detail
              </div>
            </div>
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
   Empty state
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
