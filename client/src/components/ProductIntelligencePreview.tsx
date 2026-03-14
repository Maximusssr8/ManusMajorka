import { useState } from 'react';
import { useLocation } from 'wouter';

// ── Demo data (hardcoded, no DB) ───────────────────────────────────────────────
const DEMO_PRODUCTS = [
  {
    rank: 1,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=80&h=80&fit=crop&crop=center&q=85',
    name: 'LED Light Therapy Face Mask Pro',
    category: 'Health & Beauty',
    platform: 'TikTok Shop AU',
    revenue: '$24,200/day',
    revenueRaw: 24200,
    salesDay: 272,
    growth: '+34%',
    growthPositive: true,
    score: 97,
    trend: 'EXPLODING',
    locked: false,
  },
  {
    rank: 2,
    image: '',
    name: 'Heatless Curl Ribbon Rods Set',
    category: 'Health & Beauty',
    platform: 'TikTok Shop AU',
    revenue: '$21,800/day',
    revenueRaw: 21800,
    salesDay: 529,
    growth: '+28%',
    growthPositive: true,
    score: 96,
    trend: 'EXPLODING',
    locked: true,
  },
  {
    rank: 3,
    image: '',
    name: 'Cordless Auto Hair Curler Waver',
    category: 'Health & Beauty',
    platform: 'TikTok Shop AU',
    revenue: '$19,600/day',
    revenueRaw: 19600,
    salesDay: 245,
    growth: '+19%',
    growthPositive: true,
    score: 95,
    trend: 'RISING',
    locked: true,
  },
  {
    rank: 4,
    image: '',
    name: 'Stanley Dupe 40oz Quencher Tumbler',
    category: 'Home & Kitchen',
    platform: 'TikTok Shop AU',
    revenue: '$18,500/day',
    revenueRaw: 18500,
    salesDay: 463,
    growth: '+22%',
    growthPositive: true,
    score: 96,
    trend: 'EXPLODING',
    locked: true,
  },
  {
    rank: 5,
    image: '',
    name: 'Dog Cooling Gel Mat Summer AU',
    category: 'Pet',
    platform: 'TikTok Shop AU',
    revenue: '$17,800/day',
    revenueRaw: 17800,
    salesDay: 509,
    growth: '+41%',
    growthPositive: true,
    score: 94,
    trend: 'EXPLODING',
    locked: true,
  },
  {
    rank: 6,
    image: '',
    name: 'Booty Resistance Bands Set 5 Levels',
    category: 'Fitness',
    platform: 'TikTok Shop AU',
    revenue: '$16,400/day',
    revenueRaw: 16400,
    salesDay: 547,
    growth: '+17%',
    growthPositive: true,
    score: 92,
    trend: 'RISING',
    locked: true,
  },
];

// ── Styles ─────────────────────────────────────────────────────────────────────
const PIP_CSS = `
@keyframes pip-fade-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

.pip-kalo-wrap {
  animation: pip-fade-in 0.5s ease-out forwards;
}

.pip-row-1:hover {
  background: rgba(212,175,55,0.06) !important;
  cursor: pointer;
}

.pip-action-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.35);
  border-radius: 5px;
  color: #d4af37;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
}
.pip-action-sm:hover {
  background: rgba(212,175,55,0.1);
  border-color: rgba(212,175,55,0.6);
}

.pip-filter-chip {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: #9ca3af;
  font-family: 'DM Sans', sans-serif;
  cursor: default;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.pip-unlock-cta {
  background: #d4af37;
  color: #080a0e;
  border-radius: 8px;
  padding: 12px 32px;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
  transition: all 0.15s;
  box-shadow: 0 4px 20px rgba(212,175,55,0.25);
  letter-spacing: 0.01em;
}
.pip-unlock-cta:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 6px 28px rgba(212,175,55,0.35);
}

/* Detail panel slide */
.pip-detail-panel {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease, opacity 0.2s ease;
  opacity: 0;
}
.pip-detail-panel.open {
  max-height: 200px;
  opacity: 1;
}

/* Mobile card */
@media (max-width: 767px) {
  .pip-table-area { display: none !important; }
  .pip-mobile-card { display: block !important; }
}
@media (min-width: 768px) {
  .pip-mobile-card { display: none !important; }
}
`;

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProductIntelligencePreview() {
  const [showDetail, setShowDetail] = useState(false);
  const [, navigate] = useLocation();

  const first = DEMO_PRODUCTS[0];

  return (
    <>
      <style>{PIP_CSS}</style>
      <section style={{ background: '#080a0e', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div
          className="pip-kalo-wrap"
          style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}
        >

          {/* ── Section header ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              {/* Live label */}
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#d4af37',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'live-pulse 2s ease-in-out infinite' }} />
                Live Product Intelligence
              </div>
              {/* H2 */}
              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 32,
                fontWeight: 800,
                color: '#fff',
                margin: '0 0 6px',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}>
                Find your next{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #d4af37, #f0c840)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>$10k/month</span>
                {' '}product
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                Real AU TikTok Shop data · Updated every 6 hours
              </p>
            </div>
            {/* Right: meta */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>
                🟢 47 products found today
              </div>
              <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'DM Sans, sans-serif' }}>
                Last updated: 2 hours ago
              </div>
            </div>
          </div>

          {/* ── Filter bar ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {['All Categories ▼', 'TikTok Shop AU ▼', 'This Week ▼', 'Revenue ▼'].map((label) => (
              <span key={label} className="pip-filter-chip">{label}</span>
            ))}
            {/* Spacer */}
            <div style={{ flex: 1 }} />
            <a href="/sign-up" style={{
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              color: '#d4af37',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s',
            }}>
              🔒 Unlock All →
            </a>
          </div>

          {/* ── Table (desktop) ─────────────────────────────────────────── */}
          <div className="pip-table-area" style={{ display: 'block' }}>
            <div style={{
              background: 'rgba(10,12,18,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              overflow: 'hidden',
              position: 'relative',
            }}>

              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr 130px 120px 80px 65px 56px',
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontSize: 10,
                color: '#4b5563',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                <span>#</span>
                <span>Product</span>
                <span>Category</span>
                <span>Revenue/Day</span>
                <span>Sales/Day</span>
                <span>Growth</span>
                <span>Score</span>
              </div>

              {/* Rows */}
              {DEMO_PRODUCTS.map((product) => (
                <div key={product.rank}>
                  {/* Row */}
                  <div
                    className={product.rank === 1 ? 'pip-row-1' : ''}
                    onClick={product.rank === 1 ? () => setShowDetail((v) => !v) : undefined}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr 130px 120px 80px 65px 56px',
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      alignItems: 'center',
                      background: product.rank === 1 ? 'rgba(212,175,55,0.03)' : 'transparent',
                      filter: product.locked ? 'blur(5px)' : 'none',
                      userSelect: product.locked ? 'none' : 'auto',
                      pointerEvents: product.locked ? 'none' : 'auto',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Rank */}
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 13,
                      color: '#4b5563',
                      fontWeight: 600,
                    }}>
                      {product.rank}
                    </span>

                    {/* Product name + image */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        {product.rank === 1 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: 13,
                              fontWeight: 500,
                              color: '#e5e7eb',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 200,
                            }}>
                              {product.name}
                            </span>
                            <span style={{
                              fontSize: 9,
                              padding: '1px 5px',
                              borderRadius: 3,
                              background: product.trend === 'EXPLODING' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                              color: product.trend === 'EXPLODING' ? '#f87171' : '#4ade80',
                              fontFamily: 'DM Sans, sans-serif',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              flexShrink: 0,
                            }}>
                              {product.trend}
                            </span>
                          </div>
                        ) : (
                          <span style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#e5e7eb',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          }}>
                            {product.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <span style={{
                      display: 'inline-block',
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.05)',
                      color: '#9ca3af',
                      fontFamily: 'DM Sans, sans-serif',
                      whiteSpace: 'nowrap',
                    }}>
                      {product.category}
                    </span>

                    {/* Revenue */}
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#d4af37',
                    }}>
                      {product.revenue}
                    </span>

                    {/* Sales/day */}
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      color: '#9ca3af',
                    }}>
                      {product.salesDay.toLocaleString()}
                    </span>

                    {/* Growth */}
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 12,
                      fontWeight: 600,
                      color: product.growthPositive ? '#4ade80' : '#f87171',
                    }}>
                      ▲ {product.growth.replace('+', '')}
                    </span>

                    {/* Score */}
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      color: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {product.score}
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: product.score >= 90 ? '#4ade80' : product.score >= 75 ? '#f59e0b' : '#f87171',
                        flexShrink: 0,
                        display: 'inline-block',
                      }} />
                    </span>
                  </div>

                  {/* Detail panel (row 1 only) */}
                  {product.rank === 1 && (
                    <div className={`pip-detail-panel${showDetail ? ' open' : ''}`}>
                      <div style={{
                        background: 'rgba(212,175,55,0.04)',
                        borderTop: '1px solid rgba(212,175,55,0.1)',
                        borderBottom: '1px solid rgba(212,175,55,0.1)',
                        padding: '12px 16px 12px 58px',
                        fontSize: 12,
                        color: '#9ca3af',
                        fontFamily: 'DM Sans, sans-serif',
                      }}>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ color: '#d4af37', fontWeight: 600 }}>💡 Why it's winning:</span>{' '}
                          Celebrity-endorsed skincare at 1/3 clinic price. 34% repeat buyer rate.
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ color: '#e5e7eb', fontStyle: 'italic' }}>
                            Ad angle: "Before/after in 4 weeks — no clinic needed"
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            className="pip-action-sm"
                            onClick={() => navigate('/app/suppliers?demo=led-face-mask')}
                          >
                            Find Suppliers →
                          </button>
                          <button
                            className="pip-action-sm"
                            onClick={() => navigate('/app/profit-calculator?price=89.99&cost=24.50&name=LED+Face+Mask')}
                          >
                            Profit Calc →
                          </button>
                          <button
                            className="pip-action-sm"
                            onClick={() => navigate('/app/website-generator?demo=health-beauty')}
                          >
                            Build Store →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Lock overlay — covers rows 2-6 */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '72%',
                background: 'linear-gradient(to bottom, rgba(8,10,14,0) 0%, rgba(8,10,14,0.85) 30%, rgba(8,10,14,0.97) 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 28,
                gap: 12,
                pointerEvents: 'none',
              }}>
                {/* Lock text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span style={{ color: '#d4af37', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600 }}>
                    46 more products locked
                  </span>
                </div>

                {/* CTA button */}
                <a href="/sign-up" className="pip-unlock-cta" style={{ pointerEvents: 'auto' }}>
                  Unlock All Products — Start Free →
                </a>

                <span style={{ color: '#4b5563', fontFamily: 'DM Sans, sans-serif', fontSize: 11, pointerEvents: 'auto' }}>
                  No credit card required · 10 free searches/day
                </span>
              </div>

            </div>

            {/* Hint below table */}
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#374151', fontFamily: 'DM Sans, sans-serif' }}>
              Click row #1 to see why it's winning ↑
            </div>
          </div>

          {/* ── Mobile card (hidden on desktop) ─────────────────────────── */}
          <div className="pip-mobile-card" style={{ display: 'none' }}>
            <div style={{
              background: 'rgba(10,12,18,0.9)',
              border: '1px solid rgba(212,175,55,0.18)',
              borderRadius: 12,
              padding: 20,
            }}>
              {/* Product image */}
              <img
                src={first.image}
                alt={first.name}
                style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 14, display: 'block' }}
              />
              {/* Trend badge */}
              <span style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 3,
                background: 'rgba(239,68,68,0.15)',
                color: '#f87171',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.05em',
                marginBottom: 8,
                display: 'inline-block',
              }}>
                {first.trend}
              </span>
              {/* Name */}
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#f5f5f5', margin: '8px 0 4px', lineHeight: 1.3 }}>
                {first.name}
              </h3>
              {/* Revenue + growth */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#d4af37' }}>
                  {first.revenue}
                </span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#4ade80' }}>
                  ▲ {first.growth.replace('+', '')}
                </span>
              </div>
              {/* Lock notice */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span style={{ color: '#d4af37', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600 }}>
                  46 more products locked
                </span>
              </div>
              {/* CTA */}
              <a href="/sign-up" className="pip-unlock-cta" style={{ display: 'block', textAlign: 'center' }}>
                Unlock All Products — Start Free →
              </a>
              <p style={{ fontSize: 11, color: '#4b5563', textAlign: 'center', marginTop: 10, fontFamily: 'DM Sans, sans-serif' }}>
                No credit card required · 10 free searches/day
              </p>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
