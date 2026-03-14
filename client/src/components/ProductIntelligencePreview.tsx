import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────
interface WinningProduct {
  id?: string;
  name: string;
  category: string;
  image_url?: string;
  est_daily_revenue_aud: number;
  est_monthly_revenue_aud?: number;
  winning_score?: number;
  au_relevance?: number;
  profit_margin?: number;
  competition_level?: string;
  trend_status?: string;
  why_winning?: string;
  ad_angle?: string;
}

// ── Fallback product ───────────────────────────────────────────────────────────
const FALLBACK_PRODUCT: WinningProduct = {
  name: 'LED Smart Ring Light & Beauty Mirror',
  category: 'Beauty & Wellness',
  image_url: 'https://images.unsplash.com/photo-1583241800698-e8ab01830a24?w=800&h=500&fit=crop&crop=center&q=90',
  est_daily_revenue_aud: 28400,
  est_monthly_revenue_aud: 852000,
  winning_score: 94,
  au_relevance: 97,
  profit_margin: 38,
  competition_level: 'Medium',
  trend_status: 'EXPLODING',
  why_winning: 'High-protein, low-calorie ice cream trend exploding on TikTok AU. Perfect for summer + gym culture. AUD price point 20% below US retail. Strong recurring purchase behaviour.',
  ad_angle: 'Show the transformation: unhealthy store-bought vs. clean, high-protein homemade. UGC-style "I made ice cream in 90 seconds" hooks are converting at 4.2% CTR.',
};

// ── Injected styles ────────────────────────────────────────────────────────────
const PIP_STYLES = `
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
  margin-top: 48px;
}
@media (max-width: 768px) {
  .pip-grid { grid-template-columns: 1fr; }
  .pip-locked { display: none; }
}
.pip-product-card {
  background: rgba(12,14,20,0.95);
  border: 1px solid rgba(212,175,55,0.2);
  border-radius: 12px;
  padding: 24px;
  position: relative;
}
.pip-product-card::before {
  content: '';
  position: absolute;
  top: -1px; left: -1px;
  width: 16px; height: 16px;
  border-top: 2px solid #d4af37;
  border-left: 2px solid #d4af37;
}
.pip-product-card::after {
  content: '';
  position: absolute;
  bottom: -1px; right: -1px;
  width: 16px; height: 16px;
  border-bottom: 2px solid #d4af37;
  border-right: 2px solid #d4af37;
}
.pip-revenue {
  font-family: 'Syne', sans-serif;
  font-size: 36px;
  font-weight: 800;
  color: #d4af37;
  text-shadow: 0 0 20px rgba(212,175,55,0.3);
  letter-spacing: -0.5px;
  line-height: 1;
  white-space: nowrap;
}
.pip-locked-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}
.pip-ghost-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  filter: blur(4px);
  pointer-events: none;
}
.pip-lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(8,10,14,0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  border: 1px solid rgba(212,175,55,0.15);
  border-radius: 12px;
}
.pip-unlock-btn {
  background: #d4af37;
  color: #080a0e;
  border: none;
  border-radius: 8px;
  padding: 14px 24px;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  width: 100%;
  margin-top: 0;
  transition: all 0.2s;
  text-decoration: none;
  display: block;
  text-align: center;
  box-sizing: border-box;
}
.pip-unlock-btn:hover {
  background: #e8c547;
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(212,175,55,0.35);
}
.pip-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(12,14,20,0.8);
  border: 1px solid rgba(212,175,55,0.3);
  border-radius: 8px;
  color: #d4af37;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}
.pip-action-btn:hover {
  background: #d4af37;
  color: #080a0e;
}
@keyframes step-activate {
  0%, 20%   { background: transparent; color: #d4af37; box-shadow: none; }
  25%, 45%  { background: #d4af37; color: #080a0e; box-shadow: 0 0 20px rgba(212,175,55,0.5); }
  50%, 100% { background: transparent; color: #d4af37; box-shadow: none; }
}
.workflow-step-1 .step-circle { animation: step-activate 10s ease-in-out 0s infinite; }
.workflow-step-2 .step-circle { animation: step-activate 10s ease-in-out 2s infinite; }
.workflow-step-3 .step-circle { animation: step-activate 10s ease-in-out 4s infinite; }
.workflow-step-4 .step-circle { animation: step-activate 10s ease-in-out 6s infinite; }
.workflow-step-5 .step-circle { animation: step-activate 10s ease-in-out 8s infinite; }
.step-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #d4af37;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 16px;
  color: #d4af37;
  transition: all 0.3s;
  flex-shrink: 0;
}
@keyframes pip-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.pip-animate-in {
  animation: pip-fade-in 0.6s ease-out forwards;
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: live-pulse 2s ease-in-out infinite;
  margin-right: 6px;
  vertical-align: middle;
}
`;

// ── Ghost card ─────────────────────────────────────────────────────────────────
function GhostCard({ revenue }: { revenue: string }) {
  return (
    <div style={{ background: 'rgba(12,14,20,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 10, padding: 16 }}>
      <div style={{ height: 100, background: 'rgba(255,255,255,0.04)', borderRadius: 6, marginBottom: 12 }} />
      <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8, width: '80%' }} />
      <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 14, width: '55%' }} />
      <div style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'rgba(212,175,55,0.5)', marginBottom: 3 }}>Est. Daily Revenue</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: 'rgba(212,175,55,0.6)', letterSpacing: '-0.5px' }}>
          {revenue}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[70, 50, 60].map((w, i) => (
          <div key={i} style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, flex: `0 0 ${w}px` }} />
        ))}
      </div>
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
          .order('est_daily_revenue_aud', { ascending: false })
          .limit(1)
          .single();
        if (!cancelled) {
          if (error || !data) {
            setProduct(FALLBACK_PRODUCT);
          } else {
            setProduct(data as WinningProduct);
          }
        }
      } catch {
        if (!cancelled) setProduct(FALLBACK_PRODUCT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProduct();
    return () => { cancelled = true; };
  }, []);

  const handleActionClick = (path: string) => {
    navigate('/sign-up');
    void path;
  };

  const p = product ?? FALLBACK_PRODUCT;
  const dailyRevFmt = `$${(p.est_daily_revenue_aud).toLocaleString()} AUD`;
  const monthlyRev = p.est_monthly_revenue_aud ?? p.est_daily_revenue_aud * 30;
  const monthlyRevFmt = `$${(monthlyRev / 1000).toFixed(0)}K AUD/mo`;
  const trendBadge = p.trend_status === 'EXPLODING'
    ? { label: '🔥 EXPLODING', color: '#22c55e' }
    : p.trend_status === 'RISING'
      ? { label: '📈 RISING', color: '#3b82f6' }
      : { label: '✨ TRENDING', color: '#a78bfa' };

  const WORKFLOW_STEPS = [
    { num: '1', label: 'FIND PRODUCT' },
    { num: '2', label: 'ANALYSE MARKET' },
    { num: '3', label: 'SOURCE SUPPLIER' },
    { num: '4', label: 'BUILD STORE' },
    { num: '5', label: 'RUN ADS' },
  ];

  const AVATARS_PROOF = [
    { initials: 'JM', bg: '#d4af37', color: '#000' },
    { initials: 'ST', bg: '#b8941f', color: '#000' },
    { initials: 'ML', bg: '#374151', color: '#e5e7eb' },
    { initials: 'PK', bg: '#d4af37', color: '#000' },
    { initials: 'TB', bg: '#4b5563', color: '#f9fafb' },
  ];

  return (
    <>
      <style>{PIP_STYLES}</style>
      <section style={{ background: '#080a0e', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="pip-section pip-animate-in">

          {/* ── PART A: Section header ─────────────────────────────────── */}
          <div style={{ textAlign: 'center' }}>
            {/* Live chip */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
              <span className="live-dot" />
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#d4af37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Live Product Intelligence
              </span>
            </div>

            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: '#f5f5f5', lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: 14 }}>
              Find your next{' '}
              <span style={{ background: 'linear-gradient(135deg, #d4af37, #f5d98a, #d4af37)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                $10k/month product
              </span>
            </h2>

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#94949e', marginBottom: 0 }}>
              Real AU TikTok Shop data. Updated every 6 hours.
            </p>
          </div>

          {/* ── PART B + C: Product grid ───────────────────────────────── */}
          <div className="pip-grid">

            {/* LEFT: Unlocked product */}
            <div className="pip-product-card">
              {/* Image area */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ width: '100%', height: 220, objectFit: 'cover', objectPosition: 'center', borderRadius: 8, display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 220, background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(12,14,20,0.95) 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 48 }}>📦</span>
                  </div>
                )}
                {/* Category chip */}
                <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(212,175,55,0.9)', color: '#080a0e', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.04em' }}>
                  {p.category}
                </div>
                {/* Trend badge */}
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', border: `1px solid ${trendBadge.color}`, borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: trendBadge.color }}>
                  {trendBadge.label}
                </div>
              </div>

              {/* Product name */}
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#f5f5f5', marginBottom: 4, lineHeight: 1.3 }}>
                {p.name}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(212,175,55,0.6)', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
                Trending on TikTok Shop AU
              </p>

              {/* Revenue hero numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 10, padding: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#52525b', fontFamily: "'DM Sans', sans-serif", marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Est. Daily Revenue
                  </div>
                  <div className="pip-revenue">{dailyRevFmt}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#52525b', fontFamily: "'DM Sans', sans-serif", marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Est. Monthly
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 600, color: '#4ade80', lineHeight: 1, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                    {monthlyRevFmt}
                  </div>
                </div>
              </div>

              {/* Metrics row */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
                {[
                  { label: 'Win Score', value: `${p.winning_score ?? 94}/100` },
                  { label: 'AU Relevance', value: `${p.au_relevance ?? 97}%` },
                  { label: 'Margin', value: `${p.profit_margin ?? 38}%` },
                  { label: 'Competition', value: p.competition_level ?? 'Medium' },
                ].map((metric, i, arr) => (
                  <div
                    key={metric.label}
                    style={{
                      flex: 1,
                      padding: '10px 6px',
                      textAlign: 'center',
                      borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: 10, color: '#52525b', fontFamily: "'DM Sans', sans-serif", marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {metric.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f5f5f5', fontFamily: 'Syne, sans-serif' }}>
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Why it's winning */}
              {p.why_winning && (
                <div style={{ borderLeft: '3px solid #d4af37', background: 'rgba(212,175,55,0.04)', borderRadius: '0 8px 8px 0', padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#d4af37', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Why It's Winning
                  </div>
                  <p style={{ fontSize: 13, color: '#94949e', lineHeight: 1.6, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                    {p.why_winning}
                  </p>
                </div>
              )}

              {/* Ad angle */}
              {p.ad_angle && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#52525b', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    💡 Winning Ad Angle
                  </div>
                  <p style={{ fontSize: 13, color: '#d4af37', lineHeight: 1.6, margin: 0, fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>
                    {p.ad_angle}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <button className="pip-action-btn" onClick={() => handleActionClick('/app/suppliers')}>
                  🔍 Find Suppliers →
                </button>
                <button className="pip-action-btn" onClick={() => handleActionClick('/app/profit-calculator')}>
                  💰 Profit Calc →
                </button>
                <button className="pip-action-btn" onClick={() => handleActionClick('/app/website-generator')}>
                  🏗 Build Store →
                </button>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[`#${p.category.replace(/\s+/g, '')}`, '#TikTokShopAU', '#Trending'].map((tag) => (
                  <span key={tag} style={{ fontSize: 11, color: '#52525b', fontFamily: "'DM Sans', sans-serif", background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT: Locked products */}
            <div className="pip-locked pip-locked-container">
              {/* Ghost grid behind the lock */}
              <div className="pip-ghost-grid">
                <GhostCard revenue="████ $21,800/day" />
                <GhostCard revenue="████ $19,200/day" />
                <GhostCard revenue="████ $17,800/day" />
                <GhostCard revenue="████ $16,400/day" />
              </div>

              {/* Lock overlay */}
              <div className="pip-lock-overlay">
                <div style={{ marginBottom: 12, color: '#d4af37', opacity: 0.85 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: '#f5f5f5', marginBottom: 16 }}>
                  47 more products today
                </div>

                {/* Peeking product names */}
                <div style={{ background: 'rgba(12,14,20,0.8)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 8, padding: '10px 14px', width: '100%', marginBottom: 4, textAlign: 'left' }}>
                  {[
                    'Ninja Creami Ice Cream Maker...',
                    'LED Light Therapy Face Mask...',
                    'Wide Leg Cargo Pants Y2K...',
                  ].map((name) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: '#d4af37', fontSize: 12 }}>•</span>
                      <span style={{ fontSize: 13, color: 'rgba(245,245,245,0.5)', fontFamily: "'DM Sans', sans-serif", filter: 'blur(3px)', userSelect: 'none' }}>
                        {name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a href="/sign-up" className="pip-unlock-btn">
                  Unlock All Products — Start Free →
                </a>

                <p style={{ fontSize: 11, color: '#52525b', marginTop: 10, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                  No credit card required
                </p>
              </div>
            </div>
          </div>

          {/* ── PART D: Workflow animation strip ──────────────────────── */}
          <div style={{ marginTop: 64, padding: '32px 24px', background: 'rgba(12,14,20,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#52525b', textTransform: 'uppercase', marginBottom: 28, fontFamily: 'Syne, sans-serif' }}>
              How It Works
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                  <div className={`workflow-step-${i + 1}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div className="step-circle">
                      {step.num}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94949e', fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div style={{ color: '#d4af37', fontSize: 18, padding: '0 12px', marginBottom: 24, flexShrink: 0 }}>
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── PART E: Social proof ───────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 32, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#94949e', fontFamily: "'DM Sans', sans-serif" }}>
              Joining <strong style={{ color: '#f5f5f5' }}>2,400+</strong> AU sellers already using Majorka
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {AVATARS_PROOF.map((av, i) => (
                  <div
                    key={i}
                    style={{
                      width: 32,
                      height: 32,
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
                      zIndex: AVATARS_PROOF.length - i,
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    {av.initials}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#d4af37', fontSize: 14 }}>⭐⭐⭐⭐⭐</span>
                <span style={{ fontSize: 13, color: '#94949e', fontFamily: "'DM Sans', sans-serif" }}>
                  <strong style={{ color: '#f5f5f5' }}>4.9</strong> / 5 (247 reviews)
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Loading shimmer overlay */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,14,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10, borderRadius: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#d4af37', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}
    </>
  );
}
