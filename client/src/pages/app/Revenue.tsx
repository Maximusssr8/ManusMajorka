import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useProducts } from '@/hooks/useProducts';
import { scorePillStyle, fmtScore } from '@/lib/scorePill';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { ProductSparkline } from '@/components/app/Sparkline';

const display = "'Bricolage Grotesque', sans-serif";
const sans = "'DM Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";

// Demo data — clearly labelled. Revenue pipeline is unconnected; when a user
// connects Shopify this is replaced with real figures.
const DEMO_TOTAL_REVENUE = 24750;
const DEMO_ORDERS = 847;
const DEMO_AOV = 29.22;
const DEMO_DAYS = 30;

function generateDemoSeries(days: number, total: number): number[] {
  const avg = total / days;
  const out: number[] = [];
  for (let i = 0; i < days; i++) {
    const dayOfWeek = (i + 1) % 7;
    const weekendDip = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1;
    const growth = 0.7 + (i / days) * 0.6; // gradual upward trend
    const noise = 0.85 + Math.sin(i * 1.3) * 0.2;
    out.push(Math.round(avg * weekendDip * growth * noise));
  }
  return out;
}

function LineChart({ data, width = 800, height = 200, color = '#10b981' }: { data: number[]; width?: number; height?: number; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pad = 16;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;
  const norm = (v: number) => pad + usableH - ((v - min) / (max - min || 1)) * usableH;
  const stride = usableW / (data.length - 1);
  const points = data.map((v, i) => `${pad + i * stride},${norm(v)}`).join(' ');
  const areaPoints = `${pad},${pad + usableH} ${points} ${pad + usableW},${pad + usableH}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="rev-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#rev-gradient)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Revenue() {
  const [showDemo, setShowDemo] = useState(false);
  const { products } = useProducts({ limit: 5, orderBy: 'sold_count' });

  const demoSeries = useMemo(() => generateDemoSeries(DEMO_DAYS, DEMO_TOTAL_REVENUE), []);
  const bestProductTitle = products[0]?.product_title ?? 'Oil Dispenser Bottle';

  return (
    <div style={{ padding: '32px 36px', overflow: 'auto', color: '#e8e8f0', fontFamily: sans }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: display, fontSize: 28, fontWeight: 800,
            letterSpacing: '-0.02em', margin: '0 0 4px', lineHeight: 1.1,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Revenue Tracker</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Connect your store to track real performance
          </p>
        </div>
        <Link href="/app/store-builder" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 18px',
          background: 'linear-gradient(135deg,#7c6aff,#a78bfa)',
          color: 'white', borderRadius: 9,
          fontFamily: sans, fontSize: 13, fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(124,106,255,0.35)',
        }}>Connect Store →</Link>
      </div>

      {!showDemo ? (
        <div style={{
          background: '#1c1c1c',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: '48px 32px',
          textAlign: 'center',
          maxWidth: 640,
          margin: '48px auto 0',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: 'rgba(124,106,255,0.1)',
            border: '1px solid rgba(124,106,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l3-6h12l3 6" />
              <path d="M3 9v12h18V9" />
              <path d="M9 21V12h6v9" />
            </svg>
          </div>
          <h2 style={{ fontFamily: display, fontSize: 22, fontWeight: 700, color: '#e8e8f0', margin: '0 0 8px' }}>
            Connect your Shopify store to unlock Revenue tracking
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            See real-time revenue, top products, daily trends, and profit margins — all in one place.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/app/store-builder" style={{
              padding: '12px 22px', borderRadius: 9,
              background: 'linear-gradient(135deg,#7c6aff,#a78bfa)',
              color: 'white', fontFamily: sans, fontSize: 14, fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(124,106,255,0.35)',
            }}>Connect Shopify →</Link>
            <button
              onClick={() => setShowDemo(true)}
              style={{
                padding: '12px 22px', borderRadius: 9,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
                fontFamily: sans, fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
              }}
            >Or explore with demo data →</button>
          </div>
        </div>
      ) : (
        <>
          {/* Demo banner */}
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 500 }}>
              Demo data — connect your store to see real numbers
            </span>
            <button
              onClick={() => setShowDemo(false)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'rgba(245,158,11,0.6)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >Hide demo</button>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard label="Total Revenue"   value={`$${DEMO_TOTAL_REVENUE.toLocaleString()}`} sub="Last 30 days" accent="#10b981" glow="rgba(16,185,129,0.25)" />
            <StatCard label="Orders"          value={DEMO_ORDERS.toLocaleString()}              sub="This month"  accent="#7c6aff" glow="rgba(124,106,255,0.25)" />
            <StatCard label="Best Product"    value={shortenCategory(bestProductTitle.slice(0, 22))} sub="Top seller" accent="#f59e0b" glow="rgba(245,158,11,0.2)" />
            <StatCard label="Avg Order Value" value={`$${DEMO_AOV.toFixed(2)}`}                  sub="Per order"   accent="#a855f7" glow="rgba(168,85,247,0.25)" />
          </div>

          {/* Line chart */}
          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 28,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>30-Day Revenue</div>
                <div style={{ fontFamily: display, fontSize: 22, fontWeight: 700, color: '#e8e8f0', marginTop: 2 }}>${DEMO_TOTAL_REVENUE.toLocaleString()}</div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#10b981' }}>↑ 18.4%</div>
            </div>
            <LineChart data={demoSeries} height={200} />
          </div>

          {/* Top products table */}
          <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Top Products</h2>
          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '30px minmax(0,2fr) 120px 110px 90px 110px',
              gap: 14,
              padding: '10px 16px', background: '#222222',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              <span>#</span><span>Product</span><span>Score</span>
              <span style={{ textAlign: 'right' }}>Orders</span>
              <span style={{ textAlign: 'right' }}>Revenue</span>
              <span>Trend</span>
            </div>
            {products.map((p, i) => {
              const score = p.winning_score ?? 0;
              const orders = p.sold_count ?? 0;
              const sp = scorePillStyle(score);
              const demoRev = Math.round((orders / 10000) * 1200 + 800);
              return (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '30px minmax(0,2fr) 120px 110px 90px 110px',
                  gap: 14, padding: '14px 16px', alignItems: 'center', minHeight: 60,
                  borderBottom: i === products.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontFamily: mono, fontSize: 12, color: '#52525b' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{
                    fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#e8e8f0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                  }}>{p.product_title}</span>
                  <span>
                    <span style={{
                      background: sp.background, color: sp.color, border: sp.border,
                      fontFamily: mono, fontSize: 11, fontWeight: 700,
                      padding: '3px 9px', borderRadius: 999, display: 'inline-block',
                    }}>{fmtScore(score)}</span>
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 13, color: '#10b981', textAlign: 'right' }}>{fmtK(orders)}</span>
                  <span style={{ fontFamily: mono, fontSize: 13, color: '#e8e8f0', textAlign: 'right' }}>${demoRev.toLocaleString()}</span>
                  <span><ProductSparkline productId={p.id} score={score} width={80} height={22} /></span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, accent, glow }: { label: string; value: string; sub: string; accent: string; glow: string }) {
  return (
    <div style={{
      background: '#1c1c1c',
      border: '1px solid rgba(255,255,255,0.07)',
      borderLeft: `3px solid ${accent}`,
      borderRadius: 12,
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 110,
    }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%', background: glow, filter: 'blur(28px)', pointerEvents: 'none' }} />
      <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>{label}</div>
      <div style={{ fontFamily: display, fontSize: 26, fontWeight: 800, color: '#f1f1f3', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
    </div>
  );
}
