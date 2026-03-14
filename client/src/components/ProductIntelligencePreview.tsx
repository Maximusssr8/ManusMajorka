import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────
interface WinningProduct {
  id?: string;
  product_title?: string;
  name?: string;
  category: string;
  image_url?: string;
  est_daily_revenue_aud: number;
  est_monthly_revenue_aud?: number;
  winning_score?: number;
  au_relevance?: number;
  profit_margin?: number;
  competition_level?: string;
  trend?: string;
  trend_status?: string;
  why_winning?: string;
  ad_angle?: string;
}

// ── Hardcoded fallback ─────────────────────────────────────────────────────────
const FEATURED_PRODUCT: WinningProduct = {
  product_title: 'LED Light Therapy Face Mask Pro',
  name: 'LED Light Therapy Face Mask Pro',
  category: 'Health & Beauty',
  est_daily_revenue_aud: 24200,
  est_monthly_revenue_aud: 726000,
  winning_score: 97,
  trend: 'exploding',
  trend_status: 'EXPLODING',
  au_relevance: 97,
  profit_margin: 70,
  competition_level: 'Low',
  why_winning:
    'Celebrity-endorsed skincare at a fraction of clinic prices. AU women 25-45 are obsessed with at-home LED therapy. Repeat buyer rate 34%.',
  ad_angle: 'Before/after transformation in 4 weeks — no clinic needed',
  image_url:
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop&crop=center&q=90',
};

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&h=400&fit=crop&crop=center&q=90';

function isBadImage(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('food') ||
    lower.includes('creami') ||
    lower.includes('pizza') ||
    lower.includes('burger') ||
    lower.includes('cake') ||
    lower.includes('dessert')
  );
}

// ── Helper ─────────────────────────────────────────────────────────────────────
function fmtDailyRev(n: number): string {
  return '$' + n.toLocaleString('en-AU') + '/day';
}
function fmtMonthlyRev(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M/mo';
  return '$' + Math.round(n / 1000) + 'K/mo';
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const PIP_STYLES = `
@keyframes pip-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes type-line {
  from { width: 0; }
  to   { width: 100%; }
}
@keyframes pip-blink {
  50% { opacity: 0; }
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
@keyframes gold-dot-pulse {
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 1; }
}

.pip-animate-in {
  animation: pip-fade-in 0.6s ease-out forwards;
}

.pip-section {
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.pip-grid {
  display: grid;
  grid-template-columns: 55fr 45fr;
  gap: 24px;
  align-items: start;
  margin-top: 40px;
}

@media (max-width: 768px) {
  .pip-section { padding: 48px 16px 40px; }
  .pip-grid { grid-template-columns: 1fr; gap: 16px; }
  .pip-section-h2 { font-size: 28px !important; }
  .pip-product-img { height: 160px !important; }
  .pip-daily-rev { font-size: 26px !important; }
  .pip-actions { flex-direction: column !important; gap: 8px !important; }
  .pip-actions .pip-action-btn { width: 100% !important; justify-content: center !important; box-sizing: border-box !important; }
}

/* ── Product card ──────────────────────── */
.pip-product-card {
  background: rgba(11,13,19,0.95);
  border: 1px solid rgba(212,175,55,0.18);
  border-radius: 12px;
  padding: 20px;
  position: relative;
}
.pip-product-card::before {
  content: '';
  position: absolute;
  top: -1px; left: -1px;
  width: 18px; height: 18px;
  border-top: 2px solid #d4af37;
  border-left: 2px solid #d4af37;
  border-radius: 2px 0 0 0;
}
.pip-product-card::after {
  content: '';
  position: absolute;
  bottom: -1px; right: -1px;
  width: 18px; height: 18px;
  border-bottom: 2px solid #d4af37;
  border-right: 2px solid #d4af37;
  border-radius: 0 0 2px 0;
}

/* ── Action buttons ────────────────────── */
.pip-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.28);
  border-radius: 6px;
  color: #d4af37;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
  letter-spacing: 0.01em;
}
.pip-action-btn:hover {
  background: rgba(212,175,55,0.08);
  border-color: rgba(212,175,55,0.5);
}

/* ── Unlock button ─────────────────────── */
.pip-unlock-btn {
  background: #d4af37;
  color: #080a0e;
  border: none;
  border-radius: 8px;
  padding: 14px 20px;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
  text-decoration: none;
  display: block;
  text-align: center;
  box-sizing: border-box;
  letter-spacing: 0.01em;
}
.pip-unlock-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

/* ── Terminal ──────────────────────────── */
.pip-terminal-line {
  color: #d4af37;
  overflow: hidden;
  white-space: nowrap;
  width: 0;
  margin-bottom: 6px;
  font-size: 11px;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  animation: type-line 0.6s steps(30, end) forwards;
}
.pip-terminal-line:nth-child(1) { animation-delay: 0.3s; }
.pip-terminal-line:nth-child(2) { animation-delay: 1.1s; }
.pip-terminal-line:nth-child(3) { animation-delay: 1.9s; }
.pip-terminal-line:nth-child(4) { animation-delay: 2.7s; }
.pip-terminal-line:nth-child(5) { animation-delay: 3.5s; }
.pip-terminal-ready {
  color: #4ade80;
  font-size: 11px;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  margin-top: 8px;
  opacity: 0;
  animation: pip-fade-in 0.4s ease-out 4.5s forwards;
}
.pip-cursor {
  display: inline-block;
  width: 7px;
  height: 11px;
  background: #d4af37;
  animation: pip-blink 1s step-end infinite;
  vertical-align: middle;
  margin-left: 2px;
}

/* ── Blurred row shimmer ───────────────── */
.pip-shimmer-name {
  height: 10px;
  background: rgba(255,255,255,0.07);
  border-radius: 4px;
  flex: 1;
  filter: blur(6px);
}
.pip-shimmer-rev {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: rgba(212,175,55,0.55);
  filter: blur(3px);
  white-space: nowrap;
  user-select: none;
}
`;

// ── Terminal component ─────────────────────────────────────────────────────────
function TerminalAnimation({ dailyRev }: { dailyRev: number }) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKey((k) => k + 1), 9000);
    return () => clearInterval(t);
  }, []);

  return (
    <div key={key} style={{ padding: '14px 16px', background: 'rgba(8,10,14,1)', borderRadius: 8, flexShrink: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: '#d4af37', letterSpacing: '0.06em' }}>
          ◈ MAJORKA AI TERMINAL
        </span>
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
        </div>
      </div>
      {/* Lines */}
      <div className="pip-terminal-line">&gt; Analysing AU market trends...</div>
      <div className="pip-terminal-line">&gt; Found 47 winning products today</div>
      <div className="pip-terminal-line">&gt; Top revenue: {fmtDailyRev(dailyRev)}</div>
      <div className="pip-terminal-line">&gt; Suppliers sourced: 6 options</div>
      <div className="pip-terminal-line">&gt; Store ready in 12s <span className="pip-cursor" /></div>
      <div className="pip-terminal-ready">✓ Intelligence ready</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProductIntelligencePreview() {
  const [product, setProduct] = useState<WinningProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    let cancelled = false;
    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from('winning_products')
          .select('*')
          .gte('au_relevance', 90)
          .order('est_daily_revenue_aud', { ascending: false })
          .limit(10);

        if (!cancelled) {
          if (error || !data || data.length === 0) {
            setProduct(FEATURED_PRODUCT);
          } else {
            // Pick first item that doesn't have a food image
            const good = (data as WinningProduct[]).find((d) => !isBadImage(d.image_url));
            setProduct(good ?? FEATURED_PRODUCT);
          }
        }
      } catch {
        if (!cancelled) setProduct(FEATURED_PRODUCT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, []);

  const p = product ?? FEATURED_PRODUCT;
  const title = p.product_title ?? p.name ?? 'LED Light Therapy Face Mask Pro';
  const daily = p.est_daily_revenue_aud;
  const monthly = p.est_monthly_revenue_aud ?? daily * 30;
  const score = p.winning_score ?? 97;
  const auRel = p.au_relevance ?? 97;
  const margin = p.profit_margin ?? 70;
  const comp = p.competition_level ?? 'Low';
  const trend = (p.trend ?? p.trend_status ?? 'exploding').toUpperCase();
  const imgSrc = isBadImage(p.image_url) ? FEATURED_PRODUCT.image_url! : (p.image_url ?? FEATURED_PRODUCT.image_url!);

  const LOCKED_ROWS = [
    { rev: '$21,800/day' },
    { rev: '$19,600/day' },
    { rev: '$18,500/day' },
  ];

  return (
    <>
      <style>{PIP_STYLES}</style>
      <section style={{ background: '#080a0e', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="pip-section pip-animate-in">

          {/* ── Section header ─────────────────────────────────────────── */}
          <div style={{ textAlign: 'center' }}>
            {/* Live dot row */}
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#d4af37', animation: 'gold-dot-pulse 2s ease-in-out infinite' }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(212,175,55,0.6)' }}>
                Live intelligence · Updated 6h ago
              </span>
            </div>

            <h2
              className="pip-section-h2"
              style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 40,
                color: '#f5f5f5',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                marginBottom: 12,
              }}
            >
              Find your next{' '}
              <span style={{
                background: 'linear-gradient(135deg, #d4af37, #f0c840)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                $10k/month product
              </span>
            </h2>

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#6b7280', marginBottom: 0 }}>
              Real AU TikTok Shop data · Updated every 6 hours
            </p>
          </div>

          {/* ── Grid ───────────────────────────────────────────────────── */}
          <div className="pip-grid">

            {/* LEFT: Unlocked product card */}
            <div className="pip-product-card">

              {/* Image */}
              <div style={{ position: 'relative', marginBottom: 18 }}>
                <img
                  src={imgSrc}
                  alt={title}
                  className="pip-product-img"
                  style={{ width: '100%', height: 200, objectFit: 'cover', objectPosition: 'center', borderRadius: 8, display: 'block' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = IMAGE_FALLBACK;
                  }}
                />
                {/* Category chip */}
                <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(212,175,55,0.92)', color: '#080a0e', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.04em' }}>
                  {p.category}
                </div>
                {/* Trend badge */}
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(212,175,55,0.5)', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#d4af37', fontFamily: "'DM Sans', sans-serif" }}>
                  🔥 {trend === 'EXPLODING' ? 'TRENDING' : trend}
                </div>
              </div>

              {/* Product title */}
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#f5f5f5', marginBottom: 4, lineHeight: 1.3 }}>
                {title}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(212,175,55,0.6)', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
                Trending on TikTok Shop AU
              </p>

              {/* Revenue numbers — HERO */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
                <div>
                  <div className="pip-daily-rev" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 34, color: '#d4af37', lineHeight: 1, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                    {fmtDailyRev(daily)}
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#4ade80', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  {fmtMonthlyRev(monthly)}
                </div>
              </div>

              {/* Separator */}
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }} />

              {/* Metrics row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 12, flexWrap: 'nowrap', overflow: 'hidden' }}>
                {[
                  { label: 'Score', value: `${score}/100` },
                  { label: 'AU', value: `${auRel}%` },
                  { label: 'Margin', value: `${margin}%` },
                  { label: 'Comp', value: comp },
                ].map((m, i, arr) => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center', padding: '0 10px' }}>
                      <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: "'DM Sans', sans-serif" }}>
                        {m.label}{' '}
                        <span style={{ color: '#ffffff', fontWeight: 500 }}>{m.value}</span>
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 14, paddingRight: 0 }}>|</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Separator */}
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }} />

              {/* Why it's winning */}
              {p.why_winning && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'rgba(212,175,55,0.5)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Why it's winning
                  </div>
                  <p style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.55, margin: 0, fontFamily: "'DM Sans', sans-serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties}>
                    {p.why_winning}
                  </p>
                </div>
              )}

              {/* Ad angle */}
              {p.ad_angle && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 12, color: 'rgba(212,175,55,0.8)', fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>
                    💡 Ad angle: {p.ad_angle}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="pip-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <button className="pip-action-btn" onClick={() => navigate('/app/suppliers?demo=led-face-mask')}>
                  Find Suppliers →
                </button>
                <button className="pip-action-btn" onClick={() => navigate('/app/profit-calculator?price=89.99&cost=24.50&name=LED+Face+Mask')}>
                  Profit Calc →
                </button>
                <button className="pip-action-btn" onClick={() => navigate('/app/website-generator?demo=health-beauty')}>
                  Build Store →
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
                Try a live demo — no signup needed
              </div>
            </div>

            {/* RIGHT: Locked intelligence panel */}
            <div style={{ background: 'rgba(11,13,19,0.95)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* Terminal section */}
              <div style={{ padding: 16, borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                <TerminalAnimation dailyRev={daily} />
              </div>

              {/* Blurred products + lock */}
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {/* Lock header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13, color: '#ffffff' }}>
                    47 products locked
                  </span>
                </div>

                {/* Blurred product rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {LOCKED_ROWS.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 14px',
                        borderBottom: i < LOCKED_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: 'rgba(12,14,20,0.7)',
                      }}
                    >
                      <div className="pip-shimmer-name" />
                      <span className="pip-shimmer-rev">{row.rev}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{ marginTop: 4 }}>
                  <a href="/sign-up" className="pip-unlock-btn">
                    Unlock All Products — Start Free →
                  </a>
                  <p style={{ fontSize: 11, color: '#4b5563', textAlign: 'center', marginTop: 10, fontFamily: "'DM Sans', sans-serif" }}>
                    No credit card required
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Social proof ───────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 36, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#6b7280', fontFamily: "'DM Sans', sans-serif" }}>
              Joining <strong style={{ color: '#f5f5f5' }}>2,400+</strong> AU sellers already using Majorka
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>
                {[
                  { initials: 'JM', bg: '#d4af37', color: '#000' },
                  { initials: 'ST', bg: '#b8941f', color: '#000' },
                  { initials: 'ML', bg: '#374151', color: '#e5e7eb' },
                  { initials: 'PK', bg: '#d4af37', color: '#000' },
                  { initials: 'TB', bg: '#4b5563', color: '#f9fafb' },
                ].map((av, i) => (
                  <div
                    key={i}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: av.bg,
                      border: '2px solid #080a0e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 800,
                      fontSize: 10,
                      color: av.color,
                      marginLeft: i === 0 ? 0 : -10,
                      zIndex: 5 - i,
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    {av.initials}
                  </div>
                ))}
              </div>
              <span style={{ color: '#d4af37', fontSize: 13 }}>⭐⭐⭐⭐⭐</span>
              <span style={{ fontSize: 13, color: '#6b7280', fontFamily: "'DM Sans', sans-serif" }}>
                <strong style={{ color: '#f5f5f5' }}>4.9</strong> / 5 (247 reviews)
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Loading shimmer — barely visible overlay */}
      {loading && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 }} />
      )}
    </>
  );
}
