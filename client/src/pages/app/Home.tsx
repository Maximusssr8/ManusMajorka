import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, useProductStats, type Product } from '@/hooks/useProducts';
import { useNicheStats } from '@/hooks/useNicheStats';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import { t } from '@/lib/designTokens';

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
   Shared style block
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
  border-radius: 4px;
}
.mj-row { transition: background ${t.dur} ${t.ease}; cursor: pointer; }
.mj-row:hover { background: rgba(99,102,241,0.04); }
@keyframes mj-bar-grow {
  from { height: 0%; }
  to   { height: var(--target-height); }
}
.mj-bar {
  animation: mj-bar-grow 720ms ${t.ease} both;
  background: linear-gradient(180deg, #6366f1 0%, #22d3ee 100%);
  border-radius: 6px 6px 0 0;
  width: 100%;
  transition: filter ${t.dur} ${t.ease};
  cursor: pointer;
}
.mj-bar:hover { filter: brightness(1.15); }
`;

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
        borderRadius: 8,
        border: `1px solid ${t.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        background: t.surface,
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
            fontSize: size * 0.4,
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
   KPI card
   ────────────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, loading }: { label: string; value: string; sub: string; loading: boolean }) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.rLg,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontFamily: t.fontBody,
          fontWeight: 500,
          color: t.muted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: t.fontDisplay,
          fontSize: 40,
          fontWeight: 700,
          color: t.cyan,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: 10,
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {loading && (!value || value === '—') ? (
          <span className="mj-shim" style={{ height: 28, width: 100 }} />
        ) : (
          value || '0'
        )}
      </div>
      <div style={{ fontSize: 12, color: t.muted, fontFamily: t.fontBody }}>{sub}</div>
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
  const today = new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();
  const tod = timeOfDay();

  const topProduct = products[0];
  const highMarginProduct = highMarginProducts[0] ?? products[0];
  const newestProduct = newestProducts[0] ?? products[0];

  const kpiCards = [
    { label: 'Products tracked', value: fmtNum(stats.total),    sub: 'Live AliExpress feed' },
    { label: 'Hot products',     value: fmtNum(stats.hotCount), sub: 'Score 65 and above' },
    { label: 'Average score',    value: stats.avgScore ? `${stats.avgScore}` : '—', sub: 'Out of 100' },
    { label: 'Top score',        value: stats.topScore ? `${stats.topScore}` : '—', sub: 'Highest in database' },
  ];

  /* Bar chart — rendered as vertical divs with mount animation */
  const chartData = categoryChartData.map((n) => ({
    name: shortenCategory(n.name).slice(0, 10),
    fullName: n.name,
    orders: n.totalOrders,
  }));
  const maxOrders = Math.max(1, ...chartData.map((d) => d.orders));

  /* Quick actions */
  interface Shortcut {
    label: string;
    href: string;
    product: Product | null;
    stat: string;
  }
  const shortcuts: Shortcut[] = [
    {
      label: 'Top trending',
      href: '/app/products?tab=trending',
      product: topProduct ?? null,
      stat: topProduct?.sold_count ? `${fmtK(topProduct.sold_count)} orders this month` : '',
    },
    {
      label: 'Best margin',
      href: '/app/products?tab=highmargin',
      product: highMarginProduct ?? null,
      stat: highMarginProduct?.price_aud != null ? `$${Number(highMarginProduct.price_aud).toFixed(2)} AUD` : '',
    },
    {
      label: 'Newest',
      href: '/app/products?tab=new',
      product: newestProduct ?? null,
      stat: 'Added this week',
    },
  ];

  /* Force a re-mount so chart bars animate on navigation */
  const [chartKey, setChartKey] = useState(0);
  useEffect(() => { if (chartData.length > 0) setChartKey((k) => k + 1); }, [chartData.length]);

  return (
    <>
      <style>{STYLES}</style>

      {/* Page background + halo glow */}
      <div
        style={{
          position: 'relative',
          background: t.bg,
          minHeight: '100vh',
          fontFamily: t.fontBody,
          color: t.text,
        }}
      >
        {/* Futuristic radial glow at top-center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 800px 400px at 50% -100px, rgba(99,102,241,0.15), transparent)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ── HERO ── */}
          <div style={{ padding: '48px 40px 32px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 24,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: t.fontBody,
                    fontWeight: 500,
                    color: t.muted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  {today}
                </div>
                <h1
                  style={{
                    fontFamily: t.fontDisplay,
                    fontSize: 48,
                    fontWeight: 700,
                    color: t.text,
                    letterSpacing: '-0.025em',
                    margin: 0,
                    lineHeight: 1.08,
                  }}
                >
                  Good {tod}, {firstName}.
                </h1>
                <p
                  style={{
                    fontFamily: t.fontBody,
                    fontSize: 15,
                    color: t.body,
                    margin: '16px 0 0',
                    maxWidth: 480,
                    lineHeight: 1.55,
                  }}
                >
                  Your product intelligence is live across the Australian market.
                </p>
              </div>
              <Link
                href="/app/products"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: t.accent,
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: t.fontBody,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: `background ${t.dur} ${t.ease}`,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = t.accentHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = t.accent; }}
              >
                Discover products
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </div>

          {/* ── KPI ROW ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              margin: '32px 40px',
            }}
          >
            {kpiCards.map((card) => (
              <KpiCard
                key={card.label}
                label={card.label}
                value={card.value}
                sub={card.sub}
                loading={stats.loading}
              />
            ))}
          </div>

          {/* ── MIDDLE: CHART + QUICK ACTIONS ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1fr',
              gap: 20,
              margin: '0 40px 32px',
            }}
          >
            {/* Chart card */}
            <div
              style={{
                background: t.surface,
                border: `1px solid ${t.line}`,
                borderRadius: t.rLg,
                padding: '24px 28px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontFamily: t.fontBody,
                  fontWeight: 500,
                  color: t.muted,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Category performance
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: t.muted,
                  fontFamily: t.fontBody,
                  marginBottom: 28,
                }}
              >
                Top 8 by order volume
              </div>

              {/* Vertical bars in a flex row */}
              {chartData.length > 0 ? (
                <div
                  key={chartKey}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 10,
                    height: 220,
                    paddingBottom: 32,
                    position: 'relative',
                  }}
                >
                  {chartData.map((d, i) => {
                    const pct = Math.max(4, (d.orders / maxOrders) * 100);
                    return (
                      <div
                        key={i}
                        onClick={() => { window.location.href = `/app/products?category=${encodeURIComponent(d.fullName)}`; }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: '100%',
                          justifyContent: 'flex-end',
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: -18,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            fontSize: 11,
                            color: t.text,
                            fontFamily: t.fontBody,
                            fontVariantNumeric: 'tabular-nums',
                            fontWeight: 500,
                          }}
                        >
                          {d.orders >= 1000 ? `${Math.round(d.orders / 1000)}k` : d.orders}
                        </div>
                        <div
                          className="mj-bar"
                          style={{ ['--target-height' as never]: `${pct}%`, height: `${pct}%` }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -24,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            fontSize: 10,
                            color: t.muted,
                            fontFamily: t.fontBody,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {d.name}
                        </div>
                      </div>
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
                    color: t.muted,
                    fontSize: 13,
                  }}
                >
                  Loading category data
                </div>
              )}
            </div>

            {/* Quick actions card */}
            <div
              style={{
                background: t.surface,
                border: `1px solid ${t.line}`,
                borderRadius: t.rLg,
                padding: '24px 28px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontFamily: t.fontBody,
                  fontWeight: 500,
                  color: t.muted,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Quick actions
              </div>
              {shortcuts.map((s, i) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="mj-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 0',
                    borderBottom: i === shortcuts.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    textDecoration: 'none',
                  }}
                >
                  {s.product ? (
                    <RowThumb image={s.product.image_url} title={s.product.product_title} size={44} />
                  ) : (
                    <div className="mj-shim" style={{ width: 44, height: 44, borderRadius: 8 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 9,
                        fontFamily: t.fontBody,
                        fontWeight: 600,
                        color: t.cyan,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: 3,
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: t.text,
                        fontFamily: t.fontBody,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 2,
                      }}
                    >
                      {s.product?.product_title ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, color: t.muted, fontVariantNumeric: 'tabular-nums' }}>
                      {s.stat}
                    </div>
                  </div>
                  <ArrowRight size={14} strokeWidth={1.75} color={t.muted} />
                </Link>
              ))}
            </div>
          </div>

          {/* ── TOP PRODUCTS TABLE ── */}
          <div style={{ margin: '0 40px 48px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontFamily: t.fontDisplay,
                  fontSize: 22,
                  fontWeight: 700,
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
                  fontSize: 13,
                  color: t.accent,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                View all {total > 0 ? total.toLocaleString() : ''} →
              </Link>
            </div>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr>
                  {[
                    { label: '#', width: 40, align: 'left' as const },
                    { label: 'Product', width: 'auto', align: 'left' as const },
                    { label: 'Category', width: 140, align: 'left' as const },
                    { label: 'Score', width: 80, align: 'right' as const },
                    { label: 'Orders', width: 90, align: 'right' as const },
                    { label: 'Price', width: 90, align: 'right' as const },
                  ].map((c) => (
                    <th
                      key={c.label}
                      style={{
                        width: c.width,
                        fontSize: 10,
                        fontFamily: t.fontBody,
                        fontWeight: 500,
                        color: t.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        borderBottom: `1px solid ${t.lineStrong}`,
                        padding: '10px 0',
                        textAlign: c.align,
                      }}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prodLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td colSpan={6} style={{ padding: '16px 0' }}>
                        <span className="mj-shim" style={{ height: 14, width: '100%', borderRadius: 4 }} />
                      </td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '64px 0', textAlign: 'center', color: t.muted }}>
                      No products tracked yet
                    </td>
                  </tr>
                ) : (
                  products.map((p, i) => {
                    const score = p.winning_score ?? 0;
                    const orders = p.sold_count ?? 0;
                    return (
                      <tr
                        key={p.id}
                        className="mj-row"
                        onClick={() => setSelectedProduct(p)}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <td
                          style={{
                            padding: '16px 0',
                            fontSize: 12,
                            color: t.muted,
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: t.fontBody,
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td style={{ padding: '16px 16px 16px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                            <RowThumb image={p.image_url} title={p.product_title} size={40} />
                            <span
                              title={p.product_title}
                              style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize: 13,
                                color: t.text,
                                fontFamily: t.fontBody,
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 480,
                              }}
                            >
                              {p.product_title}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 0' }}>
                          <span
                            title={p.category ?? ''}
                            style={{
                              display: 'inline-block',
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: 6,
                              padding: '3px 8px',
                              fontSize: 11,
                              color: t.body,
                              fontFamily: t.fontBody,
                              maxWidth: 132,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {shortenCategory(p.category)}
                          </span>
                        </td>
                        <td style={{ padding: '16px 0', textAlign: 'right' }}>
                          {score ? (
                            <span
                              style={{
                                display: 'inline-block',
                                background: 'rgba(16,185,129,0.1)',
                                border: '1px solid rgba(16,185,129,0.25)',
                                color: t.green,
                                borderRadius: 6,
                                padding: '3px 8px',
                                fontSize: 12,
                                fontFamily: t.fontBody,
                                fontWeight: 600,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {score}
                            </span>
                          ) : (
                            <span style={{ color: t.muted, fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: '16px 0',
                            textAlign: 'right',
                            fontSize: 14,
                            color: orders > 0 ? t.text : t.muted,
                            fontFamily: t.fontBody,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {orders > 0 ? fmtK(orders) : '—'}
                        </td>
                        <td
                          style={{
                            padding: '16px 0',
                            textAlign: 'right',
                            fontSize: 14,
                            color: t.text,
                            fontFamily: t.fontBody,
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

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
