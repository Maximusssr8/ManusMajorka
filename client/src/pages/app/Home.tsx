import { Link } from 'wouter';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, useProductStats, type Product } from '@/hooks/useProducts';
import { getCategoryStyle } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import { Sparkline, ProductSparkline } from '@/components/app/Sparkline';
import { scorePillStyle } from '@/lib/scorePill';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

const MARKETS = [
  { flag: '🇦🇺', code: 'AU', active: true },
  { flag: '🇺🇸', code: 'US', active: false },
  { flag: '🇬🇧', code: 'UK', active: false },
  { flag: '🇨🇦', code: 'CA', active: false },
  { flag: '🇳🇿', code: 'NZ', active: false },
  { flag: '🇩🇪', code: 'DE', active: false },
  { flag: '🇸🇬', code: 'SG', active: false },
];

const SHIMMER = `
@keyframes mj-app-shim {
  0%   { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
.mj-shim {
  background: linear-gradient(90deg, #141417 0%, #1a1a1f 50%, #141417 100%);
  background-size: 300px 100%;
  animation: mj-app-shim 1.4s linear infinite;
  border-radius: 4px;
  display: inline-block;
}
@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.live-pulse { animation: livePulse 2s ease-in-out infinite; }
.mj-live-dot {
  display: inline-block;
  width: 6px; height: 6px; border-radius: 50%;
  background: #22c55e;
}
`;

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

interface KpiCard {
  label: string;
  value: string;
  sub: string;
  accentColor: string;
}

interface KpiCardComponentProps {
  card: KpiCard;
  loading: boolean;
}
function KpiCardCmp({ card, loading }: KpiCardComponentProps) {
  return (
    <div style={{
      background: '#141417',
      border: '1px solid rgba(255,255,255,0.07)',
      borderLeft: `3px solid ${card.accentColor}`,
      borderRadius: 9,
      padding: '18px 20px',
      position: 'relative',
      minHeight: 110,
    }}>
      <div style={{
        fontFamily: mono,
        fontSize: 9,
        color: '#52525b',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 10,
      }}>{card.label}</div>
      <div style={{
        fontFamily: display,
        fontSize: 34,
        fontWeight: 800,
        color: '#ededed',
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        {loading ? <span className="mj-shim" style={{ height: 28, width: 90 }} /> : card.value}
      </div>
      <div style={{ fontFamily: sans, fontSize: 12, color: '#52525b', marginTop: 6 }}>{card.sub}</div>
      <div style={{ position: 'absolute', bottom: 14, right: 16 }}>
        <Sparkline color={card.accentColor} />
      </div>
    </div>
  );
}

function ProductRowImage({ image, title, category }: { image: string | null; title: string; category: string | null }) {
  const cs = getCategoryStyle(category);
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 8,
      background: cs.gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 22,
      flexShrink: 0,
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
      overflow: 'hidden',
    }}>
      {image ? (
        <img
          src={proxyImage(image) ?? image}
          alt={title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        cs.emoji
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1.5fr 110px 80px 80px 95px 110px 60px 60px',
      gap: 14,
      padding: '14px 16px',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span className="mj-shim" style={{ height: 12, width: 24 }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="mj-shim" style={{ height: 40, width: 40, borderRadius: 6 }} />
        <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      </span>
      <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      <span className="mj-shim" style={{ height: 12, width: '80%' }} />
      <span className="mj-shim" style={{ height: 14, width: 50 }} />
      <span className="mj-shim" style={{ height: 24, width: 36, borderRadius: 5 }} />
    </div>
  );
}

export default function AppHome() {
  const { user, isPro } = useAuth();
  const stats = useProductStats();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products, loading: prodLoading, total } = useProducts({ limit: 12, orderBy: 'sold_count' });
  const firstName = (user?.name ?? user?.email?.split('@')[0] ?? 'Operator').split(' ')[0];
  const planLabel = isPro ? 'Scale Plan · Live' : 'Builder Plan · Live';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeOfDay = getTimeOfDay();

  const kpiCards: KpiCard[] = [
    { label: 'PRODUCTS IN DB', value: fmtNum(stats.total),    sub: 'Total tracked products', accentColor: '#6366F1' },
    { label: 'HOT PRODUCTS',   value: fmtNum(stats.hotCount), sub: 'Score 65+ products',     accentColor: '#f97316' },
    { label: 'AVG SCORE',      value: `${stats.avgScore}/100`, sub: 'Mean dropship score',   accentColor: '#22c55e' },
    { label: 'TOP SCORE',      value: stats.topScore ? `${stats.topScore}/100` : '—', sub: 'Highest in database', accentColor: '#a855f7' },
  ];

  return (
    <>
      <style>{SHIMMER}</style>

      {/* Greeting */}
      <div style={{
        padding: '28px 32px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
            <span style={{ fontFamily: mono, fontSize: 11, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{planLabel}</span>
          </div>
          <h1 style={{
            fontFamily: display,
            fontSize: 32,
            fontWeight: 800,
            color: '#ededed',
            letterSpacing: '-0.03em',
            margin: '0 0 6px',
            lineHeight: 1.1,
          }}>
            Good {timeOfDay}, <span style={{ color: '#6366F1' }}>{firstName}</span>
          </h1>
          <p style={{ fontFamily: sans, fontSize: 14, color: '#52525b', margin: 0 }}>{today}</p>
        </div>
        <Link href="/app/products" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 20px',
          background: '#6366F1',
          color: '#fff',
          borderRadius: 8,
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
          transition: 'background 150ms, transform 150ms',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#7c83f4'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >Find Products →</Link>
      </div>

      {/* Market chips strip */}
      <div style={{ margin: '20px 32px 0', display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <span style={{ fontFamily: mono, fontSize: 10, color: '#52525b', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Market:</span>
        {MARKETS.map((m) => (
          <button key={m.code} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            background: m.active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${m.active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
            color: m.active ? '#6366F1' : '#71717a',
            fontFamily: mono,
            fontSize: 11,
            fontWeight: m.active ? 600 : 400,
            flexShrink: 0,
          }}>
            <span>{m.flag}</span>
            <span>{m.code}</span>
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div style={{
        margin: '24px 32px 0',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
      }}>
        {kpiCards.map((card) => (
          <KpiCardCmp key={card.label} card={card} loading={stats.loading} />
        ))}
      </div>

      {/* Quick action cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 12,
        margin: '20px 32px 0',
      }}>
        {[
          { icon: '🔥', label: 'Top Trending Now', sub: 'Products scoring 65+',  href: '/app/products', grad: 'linear-gradient(135deg,rgba(249,115,22,0.15),rgba(239,68,68,0.05))', border: 'rgba(249,115,22,0.2)', color: '#f97316' },
          { icon: '💰', label: 'Highest Margin',   sub: 'Best profit potential', href: '/app/products', grad: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.05))', border: 'rgba(34,197,94,0.2)', color: '#22c55e' },
          { icon: '⚡', label: 'New Products',     sub: 'Added in last 24 hours', href: '/app/products', grad: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.05))', border: 'rgba(99,102,241,0.2)', color: '#6366F1' },
        ].map((card) => (
          <Link key={card.label} href={card.href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: card.grad,
            border: `1px solid ${card.border}`,
            borderRadius: 10,
            padding: '14px 18px',
            textDecoration: 'none',
            transition: 'transform 150ms, border-color 150ms',
            cursor: 'pointer',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>{card.icon}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: '#ededed', marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontFamily: sans, fontSize: 12, color: '#6b7280' }}>{card.sub}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: card.color, fontSize: 18, flexShrink: 0 }}>→</span>
          </Link>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ margin: '24px 32px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: display, fontSize: 18, fontWeight: 700, color: '#ededed', margin: 0, letterSpacing: '-0.015em' }}>This Week&apos;s Leaders</h2>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 8px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 999,
              fontFamily: mono,
              fontSize: 10,
              color: '#22c55e',
            }}>
              <span className="mj-live-dot live-pulse" />
              LIVE DATA
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 8px',
              background: 'rgba(255,90,0,0.08)',
              border: '1px solid rgba(255,90,0,0.2)',
              borderRadius: 999,
              fontFamily: mono,
              fontSize: 9,
              color: 'rgba(255,120,0,0.9)',
              letterSpacing: '0.05em',
            }}>
              🛒 ALIEXPRESS ADVANCED API
            </span>
          </div>
          <Link href="/app/products" style={{ fontFamily: sans, fontSize: 13, color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>
            View all {total > 0 ? total.toLocaleString() : ''} products →
          </Link>
        </div>

        <div style={{
          background: '#0d0d10',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1.5fr 110px 80px 80px 95px 110px 60px 60px',
            gap: 14,
            padding: '12px 16px',
            fontFamily: mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#52525b',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span>#</span>
            <span>Product</span>
            <span>Category</span>
            <span>Score</span>
            <span style={{ textAlign: 'right' }}>Price</span>
            <span style={{ textAlign: 'right' }}>Orders/mo</span>
            <span style={{ textAlign: 'right' }}>Est. Revenue</span>
            <span>Trend</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </div>

          {prodLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : products.length === 0 ? (
            <div style={{
              padding: '40px 16px',
              textAlign: 'center',
              fontFamily: sans,
              fontSize: 13,
              color: '#52525b',
            }}>No products in database yet</div>
          ) : (
            products.map((p, i) => {
              const score = p.winning_score ?? 0;
              const orders = p.sold_count ?? 0;
              const sp = scorePillStyle(score);
              const estRevenue = orders > 0 && p.price_aud != null ? Math.round(orders * Number(p.price_aud)) : null;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1.5fr 110px 80px 80px 95px 110px 60px 60px',
                    gap: 14,
                    padding: '14px 16px',
                    alignItems: 'center',
                    borderBottom: i === products.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 120ms',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontFamily: mono, fontSize: 13, color: '#52525b' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <ProductRowImage image={p.image_url} title={p.product_title} category={p.category} />
                    <span style={{
                      fontFamily: sans,
                      fontSize: 13,
                      color: '#ededed',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{p.product_title}</span>
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 9px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 999,
                    fontFamily: sans,
                    fontSize: 12,
                    color: '#71717a',
                    width: 'fit-content',
                  }}>{p.category ?? '—'}</span>
                  <span>
                    <span style={{
                      background: sp.background,
                      color: sp.color,
                      fontFamily: mono,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 999,
                      display: 'inline-block',
                    }}>{score || '—'}</span>
                  </span>
                  <span style={{
                    fontFamily: mono,
                    fontSize: 12,
                    color: '#a1a1aa',
                    textAlign: 'right',
                  }}>{p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}</span>
                  <span style={{
                    fontFamily: mono,
                    fontSize: 13,
                    color: orders > 0 ? '#22c55e' : '#52525b',
                    textAlign: 'right',
                  }}>
                    {orders > 0 ? (
                      orders.toLocaleString()
                    ) : (
                      <span style={{ fontSize: 11, color: '#3f3f46', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3f3f46', display: 'inline-block' }} />
                        pending
                      </span>
                    )}
                  </span>
                  <span style={{
                    fontFamily: mono,
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'right',
                    color: estRevenue != null ? '#22c55e' : '#4b5563',
                  }}>{estRevenue != null ? `~$${estRevenue.toLocaleString()}/mo` : '—'}</span>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <ProductSparkline productId={p.id} score={score} />
                  </span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Link href="/app/products" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 5,
                      fontFamily: sans,
                      fontSize: 12,
                      color: '#71717a',
                      textDecoration: 'none',
                      transition: 'border-color 150ms, color 150ms',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#71717a'; }}
                    ><ArrowUpRight size={11} /></Link>
                  </span>
                </div>
              );
            })
          )}

          {/* Last synced footer */}
          <div style={{
            padding: '10px 16px',
            background: '#0c0c0e',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span className="mj-live-dot" />
            <span style={{ fontFamily: mono, fontSize: 11, color: '#52525b' }}>
              Sourced from AliExpress Affiliate API · Real order counts · Auto-refreshed every 6 hours
            </span>
          </div>
        </div>
      </div>

      {/* Database snapshot */}
      <div style={{ margin: '24px 32px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}>
          {[
            { label: 'Score 80+ products', value: stats.loading ? '—' : stats.highScoreCount.toLocaleString(), icon: '🔥', color: '#f97316', sub: 'High potential, ready to sell' },
            { label: 'Elite tier (90+)',   value: stats.loading ? '—' : stats.eliteCount.toLocaleString(),     icon: '⭐', color: '#6366F1', sub: 'Top performers in database' },
            { label: 'Categories tracked', value: stats.loading ? '—' : stats.categoryCount.toLocaleString(),  icon: '🗂️', color: '#22c55e', sub: 'Across all niches' },
          ].map((s) => (
            <Link key={s.label} href="/app/products" style={{
              display: 'block',
              background: '#141417',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: 20,
              textDecoration: 'none',
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: display, fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4, letterSpacing: '-0.025em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#ededed', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: sans, fontSize: 11, color: '#6b7280' }}>{s.sub}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Explore the Database */}
      <div style={{ margin: '24px 32px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: '#ededed', margin: '0 0 2px', letterSpacing: '-0.015em' }}>Explore the Database</h3>
            <p style={{ fontFamily: sans, fontSize: 13, color: '#6b7280', margin: 0 }}>
              {stats.total.toLocaleString()} products scored and ranked. Find your next winner.
            </p>
          </div>
          <Link href="/app/products" style={{ fontFamily: sans, fontSize: 13, color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>Browse all →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {[
            { label: 'High Margin',      sub: 'Net margin > 50%',     count: '340+ products',   icon: '💰', color: '#22c55e', bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.15)' },
            { label: 'Exploding Trend',  sub: 'Score 90–100',          count: '89 products',     icon: '🚀', color: '#f97316', bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.15)' },
            { label: 'New Today',        sub: 'Added via AE API',      count: 'Updated live',    icon: '⚡', color: '#6366F1', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)' },
          ].map((cat) => (
            <Link key={cat.label} href="/app/products" style={{
              display: 'block',
              background: cat.bg,
              border: `1px solid ${cat.border}`,
              borderRadius: 10,
              padding: 20,
              textDecoration: 'none',
              transition: 'transform 150ms, border-color 150ms',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{cat.icon}</div>
              <div style={{ fontFamily: display, fontSize: 15, fontWeight: 700, color: '#ededed', marginBottom: 4 }}>{cat.label}</div>
              <div style={{ fontFamily: sans, fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{cat.sub}</div>
              <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: cat.color }}>{cat.count}</div>
            </Link>
          ))}
        </div>
      </div>

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
