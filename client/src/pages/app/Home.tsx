import { Link } from 'wouter';
import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, useProductStats, type Product } from '@/hooks/useProducts';
import { getCategoryStyle } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import { Sparkline, ProductSparkline } from '@/components/app/Sparkline';
import { scorePillStyle } from '@/lib/scorePill';

const display = "'Bricolage Grotesque', sans-serif";
const sans = "'DM Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";

const SHIMMER = `
@keyframes mj-app-shim {
  0%   { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
.mj-shim {
  background: linear-gradient(90deg, #0f0f14 0%, #1a1a22 50%, #0f0f14 100%);
  background-size: 300px 100%;
  animation: mj-app-shim 1.4s linear infinite;
  border-radius: 4px;
  display: inline-block;
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 6px rgba(34,197,94,0.4); }
  50% { box-shadow: 0 0 14px rgba(34,197,94,0.8), 0 0 24px rgba(34,197,94,0.2); }
}
@keyframes score-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  50% { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.majorka-row-hover { transition: background 100ms ease; cursor: pointer; }
.majorka-row-hover:hover { background: rgba(99,102,241,0.06) !important; }
.majorka-btn { transition: all 150ms ease; }
.majorka-btn:hover { transform: scale(1.05); filter: brightness(1.15); }
.majorka-btn:active { transform: scale(0.97); }
.majorka-live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #22c55e;
  animation: pulse-glow 2s ease-in-out infinite;
  flex-shrink: 0;
}
`;

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

interface KpiCardData {
  label: string;
  value: string;
  sub: string;
  accentGlow: string;
  accentColor: string;
}

function KpiCard({ card, loading }: { card: KpiCardData; loading: boolean }) {
  return (
    <div style={{
      background: '#0f0f14',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 124,
    }}>
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: card.accentGlow,
        filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        fontFamily: mono,
        fontSize: 9,
        color: '#4a4a5e',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 14,
        position: 'relative',
      }}>{card.label}</div>
      <div style={{
        fontFamily: display,
        fontSize: 32,
        fontWeight: 800,
        color: '#f1f1f3',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        marginBottom: 6,
        position: 'relative',
      }}>
        {loading ? <span className="mj-shim" style={{ height: 26, width: 80 }} /> : card.value}
      </div>
      <div style={{ fontFamily: sans, fontSize: 12, color: '#4a4a5e', position: 'relative' }}>{card.sub}</div>
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
      width: 40,
      height: 40,
      borderRadius: 8,
      background: cs.gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20,
      flexShrink: 0,
      border: '1px solid rgba(255,255,255,0.06)',
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

const COLS = '40px 1fr 130px 80px 100px 100px 70px 60px';
const HEADERS = ['#', 'PRODUCT', 'CATEGORY', 'SCORE', 'ORDERS', 'PRICE', 'TREND', ''];

function SkeletonRow() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: COLS,
      gap: 14,
      padding: '12px 16px',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span className="mj-shim" style={{ height: 12, width: 22 }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="mj-shim" style={{ height: 40, width: 40, borderRadius: 8 }} />
        <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      </span>
      <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      <span className="mj-shim" style={{ height: 18, width: 36, borderRadius: 999 }} />
      <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      <span className="mj-shim" style={{ height: 14, width: 50 }} />
      <span className="mj-shim" style={{ height: 18, width: 22 }} />
    </div>
  );
}

export default function AppHome() {
  const { user } = useAuth();
  const stats = useProductStats();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products, loading: prodLoading, total } = useProducts({ limit: 12, orderBy: 'sold_count' });
  const firstName = (user?.name ?? user?.email?.split('@')[0] ?? 'Operator').split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const tod = timeOfDay();

  const kpiCards: KpiCardData[] = [
    { label: 'PRODUCTS IN DB', value: fmtNum(stats.total),    sub: 'Total tracked products', accentGlow: 'rgba(99,102,241,0.2)',  accentColor: '#6366f1' },
    { label: 'HOT PRODUCTS',   value: fmtNum(stats.hotCount), sub: 'Score 65+ products',     accentGlow: 'rgba(239,68,68,0.15)',  accentColor: '#f97316' },
    { label: 'AVG SCORE',      value: `${stats.avgScore}/100`, sub: 'Mean dropship score',   accentGlow: 'rgba(34,197,94,0.15)',  accentColor: '#22c55e' },
    { label: 'TOP SCORE',      value: stats.topScore ? `${stats.topScore}/100` : '—', sub: 'Highest in database', accentGlow: 'rgba(168,85,247,0.15)', accentColor: '#a855f7' },
  ];

  const quickActions = [
    { icon: '🔥', label: 'Top Trending',  sub: 'Products scoring 65+',  href: '/app/products', grad: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(249,115,22,0.06))', border: 'rgba(239,68,68,0.2)',  arrow: '#f97316' },
    { icon: '💰', label: 'Highest Margin', sub: 'Best profit potential', href: '/app/products', grad: 'linear-gradient(135deg,rgba(34,197,94,0.12),rgba(16,185,129,0.06))', border: 'rgba(34,197,94,0.2)',  arrow: '#22c55e' },
    { icon: '⚡', label: 'New Products',  sub: 'Added last 24 hours',   href: '/app/products', grad: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.06))', border: 'rgba(99,102,241,0.2)', arrow: '#818cf8' },
  ];

  return (
    <>
      <style>{SHIMMER}</style>

      <div style={{ padding: '32px 36px', overflow: 'auto' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div className="majorka-live-dot" />
              <span style={{
                fontFamily: mono,
                fontSize: 10,
                color: '#4a4a5e',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>Live · AliExpress Advanced API</span>
            </div>
            <h1 style={{
              fontFamily: display,
              fontSize: 30,
              fontWeight: 800,
              color: '#f1f1f3',
              letterSpacing: '-0.03em',
              margin: '0 0 4px',
              lineHeight: 1.1,
            }}>
              Good {tod}, <span style={{
                background: 'linear-gradient(135deg,#818cf8,#6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>{firstName}</span>
            </h1>
            <p style={{ fontFamily: sans, fontSize: 13, color: '#5a5a6e', margin: 0 }}>{today} · Scale Plan</p>
          </div>
          <Link href="/app/products" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            background: 'linear-gradient(135deg,#6366f1,#818cf8)',
            color: 'white',
            borderRadius: 9,
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            transition: 'transform 120ms',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
          >
            Discover Products →
          </Link>
        </div>

        {/* Stat cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}>
          {kpiCards.map((card) => <KpiCard key={card.label} card={card} loading={stats.loading} />)}
        </div>

        {/* Quick actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 28,
        }}>
          {quickActions.map((c) => (
            <Link key={c.label} href={c.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              background: c.grad,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'all 150ms',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: '#e8e8f0', marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontFamily: sans, fontSize: 12, color: '#5a5a6e' }}>{c.sub}</div>
              </div>
              <span style={{ color: c.arrow, fontSize: 18, flexShrink: 0 }}>→</span>
            </Link>
          ))}
        </div>

        {/* Leaderboard */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, color: '#e8e8f0', margin: 0, letterSpacing: '-0.015em' }}>Top Products</h2>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 999,
              fontFamily: mono,
              fontSize: 9,
              color: '#22c55e',
              fontWeight: 700,
            }}>● LIVE</span>
          </div>
          <Link href="/app/products" style={{
            fontFamily: sans,
            fontSize: 13,
            color: '#6366f1',
            textDecoration: 'none',
            fontWeight: 500,
          }}>View all {total > 0 ? total.toLocaleString() : ''} →</Link>
        </div>

        <div style={{
          background: '#0c0c10',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: COLS,
            gap: 14,
            padding: '10px 16px',
            background: '#111118',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {HEADERS.map((h, i) => (
              <div key={i} style={{
                fontFamily: mono,
                fontSize: 9,
                color: '#3f3f52',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>{h}</div>
            ))}
          </div>

          {prodLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : products.length === 0 ? (
            <div style={{
              padding: '40px 16px',
              textAlign: 'center',
              fontFamily: sans,
              fontSize: 13,
              color: '#4a4a5e',
            }}>No products in database yet</div>
          ) : (
            products.map((p, i) => {
              const score = p.winning_score ?? 0;
              const orders = p.sold_count ?? 0;
              const sp = scorePillStyle(score);
              return (
                <div
                  key={p.id}
                  className="majorka-row-hover"
                  onClick={() => setSelectedProduct(p)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: COLS,
                    gap: 14,
                    padding: '12px 16px',
                    alignItems: 'center',
                    borderBottom: i === products.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    animation: 'fadeUp 300ms ease forwards',
                    animationDelay: `${i * 40}ms`,
                    opacity: 0,
                  }}
                >
                  <span style={{ fontFamily: mono, fontSize: 12, color: '#3f3f52' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <ProductRowImage image={p.image_url} title={p.product_title} category={p.category} />
                    <span style={{
                      fontFamily: sans,
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#e2e2e8',
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>{p.product_title}</span>
                  </span>
                  <span style={{
                    display: 'inline-block',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6,
                    padding: '3px 9px',
                    fontFamily: sans,
                    fontSize: 11,
                    color: '#6b6b80',
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
                      animation: score >= 95 ? 'score-pulse 2s ease-in-out infinite' : 'none',
                    }}>{score || '—'}</span>
                  </span>
                  <span style={{
                    fontFamily: mono,
                    fontSize: 13,
                    color: orders > 0 ? '#22c55e' : '#3f3f52',
                  }}>{orders > 0 ? orders.toLocaleString() : '—'}</span>
                  <span style={{
                    fontFamily: mono,
                    fontSize: 12,
                    color: '#8888a0',
                  }}>{p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}</span>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <ProductSparkline productId={p.id} score={score} />
                  </span>
                  <span style={{
                    fontFamily: mono,
                    fontSize: 14,
                    color: '#4a4a5e',
                    textAlign: 'right',
                  }}>→</span>
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
