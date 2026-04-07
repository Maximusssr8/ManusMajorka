import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';
import { useIsMobile } from '@/hooks/useIsMobile';

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#0a0a0a',
  bgAlt: '#0d0d10',
  bgElevated: '#0e0e10',
  bgSurface: '#111114',
  bgPanel: '#0d0d10',
  bgChrome: '#1a1a1f',
  bgChromeAlt: '#16161a',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  borderFaint: 'rgba(255,255,255,0.05)',
  text: '#ededed',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  textFaint: '#52525b',
  textGhost: '#3f3f46',
  accent: '#6366F1',
  accentHover: '#7c83f4',
  accentDim: 'rgba(99,102,241,0.12)',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
} as const;

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

// ── Global styles ────────────────────────────────────────────────────────────
const STYLES = `
*::selection { background: rgba(99,102,241,0.3); color: #fff; }
html, body { background: ${T.bg}; }

@keyframes mj-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
@keyframes mj-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes mj-fade-in-down {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes mj-row-stagger {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes mj-row-pulse-green {
  0%   { box-shadow: inset 3px 0 0 ${T.green}, 0 0 0 0 rgba(34,197,94,0.4); }
  50%  { box-shadow: inset 3px 0 0 ${T.green}, 0 0 0 4px rgba(34,197,94,0.0); }
  100% { box-shadow: inset 3px 0 0 transparent, 0 0 0 0 rgba(34,197,94,0); }
}
@keyframes mj-shimmer {
  0%   { transform: translateX(-120%) skewX(-20deg); }
  60%  { transform: translateX(220%) skewX(-20deg); }
  100% { transform: translateX(220%) skewX(-20deg); }
}
@keyframes mj-bar-grow { from { width: 0; } }
@keyframes mj-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.mj-eyebrow {
  font-family: ${mono};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${T.accent};
}
.mj-link {
  color: ${T.textMuted};
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 150ms;
}
.mj-link:hover { color: ${T.text}; }

.mj-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 22px;
  background: ${T.accent};
  color: #fff;
  font-family: ${sans};
  font-weight: 600;
  font-size: 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background 150ms, transform 150ms;
  white-space: nowrap;
}
.mj-btn-primary:hover { background: ${T.accentHover}; transform: translateY(-1px); }

.mj-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 22px;
  background: transparent;
  color: ${T.text};
  font-family: ${sans};
  font-weight: 500;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid ${T.borderStrong};
  cursor: pointer;
  text-decoration: none;
  transition: border-color 150ms, background 150ms;
  white-space: nowrap;
}
.mj-btn-secondary:hover { border-color: ${T.accent}; background: rgba(99,102,241,0.06); }

.mj-card {
  background: ${T.bgSurface};
  border: 1px solid ${T.border};
  border-radius: 8px;
  transition: border-color 200ms, background 200ms, transform 200ms;
}
.mj-card:hover { border-color: ${T.borderStrong}; background: ${T.bgElevated}; }

.mj-pulse-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${T.green};
  box-shadow: 0 0 8px rgba(34,197,94,0.6);
  animation: mj-pulse 1.6s infinite;
}
.mj-marquee-track {
  display: flex;
  gap: 64px;
  width: max-content;
  animation: mj-marquee 32s linear infinite;
}
.mj-ticker-track {
  display: flex;
  gap: 48px;
  width: max-content;
  animation: mj-marquee 35s linear infinite;
}

.mj-row-pulse { animation: mj-row-pulse-green 3s ease-out 1; }
.mj-row-enter { animation: mj-fade-in-down 400ms ease-out; }

@keyframes mj-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.mj-shimmer-btn { position: relative; overflow: hidden; isolation: isolate; }
.mj-shimmer-btn::after {
  content: "";
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 60%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  animation: mj-shimmer 3s ease-in-out infinite;
  pointer-events: none;
}

.mj-ticker-strip { position: relative; }
.mj-ticker-strip::before, .mj-ticker-strip::after {
  content: "";
  position: absolute;
  top: 0; bottom: 0;
  width: 80px;
  pointer-events: none;
  z-index: 2;
}
.mj-ticker-strip::before { left: 0;  background: linear-gradient(90deg, ${T.bgPanel}, transparent); }
.mj-ticker-strip::after  { right: 0; background: linear-gradient(-90deg, ${T.bgPanel}, transparent); }

.mj-glow-edge {
  mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
}

.mj-dot-grid {
  background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 28px 28px;
}

.mj-window-shadow {
  box-shadow:
    0 0 0 1px rgba(99,102,241,0.18),
    0 40px 80px rgba(0,0,0,0.6),
    0 8px 24px rgba(99,102,241,0.18);
}
.mj-mockup-shadow {
  box-shadow:
    0 0 0 1px ${T.border},
    0 40px 80px rgba(0,0,0,0.5);
}

.mj-feature-panel-header {
  font-family: ${display};
  font-weight: 700;
  font-size: 44px;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: ${T.text};
  margin: 0 0 18px;
}
.mj-feature-panel-header span { color: ${T.accent}; }

.mj-bar { animation: mj-bar-grow 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .mj-marquee-track, .mj-ticker-track { animation: none !important; }
}

@media (max-width: 968px) {
  .mj-feat-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
  .mj-feat-grid > * { grid-row: auto !important; }
  .mj-feat-grid .mj-feat-text { order: 1 !important; }
  .mj-feat-grid .mj-feat-mock { order: 2 !important; }
  .mj-stats-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 768px) {
  .mj-hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
  .mj-pricing-grid { grid-template-columns: 1fr !important; }
  .mj-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
  .mj-nav-links { display: none !important; }
  .mj-hero-h1 { font-size: 42px !important; }
  .mj-section-h2 { font-size: 32px !important; }
  .mj-cta-h2 { font-size: 48px !important; }
  .mj-feature-panel-header { font-size: 30px !important; }
  .mj-hero-cta { flex-direction: column !important; align-items: stretch !important; }
  .mj-hero-cta > * { width: 100% !important; }
  .mj-hero-window { display: none !important; }
  .mj-credibility { flex-wrap: wrap !important; gap: 12px 14px !important; }
  .mj-comparison { font-size: 12px !important; }
  .mj-stat-num { font-size: 44px !important; }
  .mj-discovery-grid { grid-template-columns: 1fr !important; }
  .mj-creative-grid { grid-template-columns: 1fr !important; }
}
`;

// ── Data ─────────────────────────────────────────────────────────────────────
const TICKER_ITEMS: string[] = [
  '🇦🇺 AU operator found $14,200/mo product · 2 min ago',
  '🇺🇸 US store launched via Store Builder · 4 min ago',
  '🇬🇧 UK competitor spy scan completed · 7 min ago',
  '🇨🇦 CA margin calculator: 44% net margin · 9 min ago',
  '🇩🇪 DE winning product: 91 score · 11 min ago',
  '🇸🇬 SG ad creative generated · 14 min ago',
  '2.4M+ products tracked across 7 markets',
  '500+ active operators online now',
];

const STEPS: { num: string; title: string; body: string }[] = [
  { num: '01', title: 'Pick a market', body: 'Choose your region. Majorka adapts pricing, suppliers, and compliance to where you sell.' },
  { num: '02', title: 'Discover and validate', body: 'Find scored product opportunities. Run the profit calculator. Spy on competitor stores.' },
  { num: '03', title: 'Build, launch, scale', body: 'Generate the brand and store, push to Shopify, ship ad creatives. Monitor performance.' },
];

const FAQ_DATA: { q: string; a: string }[] = [
  { q: 'How is Majorka different from KaloData or Minea?', a: 'Majorka is the operating system, not a single tool. Product research, competitor spying, store building, ad creative, and profit math live in one dashboard with one bill.' },
  { q: 'Where does product data come from?', a: 'AliExpress (via affiliate API for real images and pricing), TikTok Shop, and partner marketplace integrations. We refresh signals continuously.' },
  { q: 'Do I need a Shopify store first?', a: 'No. You can build one inside Majorka and push it live to a new or existing Shopify account in minutes.' },
  { q: 'Which markets are supported?', a: 'Australia, United States, United Kingdom, Canada, New Zealand, Germany, and Singapore — with localised currency, shipping, and tax.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Month-to-month, no contracts. Annual plans save 20% and refund the unused portion.' },
];

// ── Section Header ──────────────────────────────────────────────────────────
interface SectionHeaderProps {
  eyebrow: string;
  line1: string;
  line2: string;
  description?: string;
  align?: 'left' | 'center';
  maxWidth?: number;
}
function SectionHeader({ eyebrow, line1, line2, description, align = 'left', maxWidth = 700 }: SectionHeaderProps) {
  return (
    <div
      style={{
        marginBottom: 56,
        maxWidth,
        marginLeft: align === 'center' ? 'auto' : undefined,
        marginRight: align === 'center' ? 'auto' : undefined,
        textAlign: align,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        justifyContent: align === 'center' ? 'center' : 'flex-start',
      }}>
        <span style={{ display: 'inline-block', width: 4, height: 32, background: T.accent, borderRadius: 2 }} />
        <span className="mj-eyebrow">{eyebrow}</span>
      </div>
      <h2 className="mj-section-h2" style={{
        fontFamily: display,
        fontWeight: 700,
        fontSize: 48,
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
        color: T.text,
        margin: '0 0 16px',
      }}>
        {line1}<br />
        <span style={{ color: T.accent }}>{line2}</span>
      </h2>
      {description && (
        <p style={{ fontSize: 16, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>{description}</p>
      )}
    </div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(10,10,10,0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      height: 60,
      padding: '0 32px',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/majorka-logo.jpg" alt="Majorka" height={28} style={{ height: 28, width: 'auto', display: 'block', borderRadius: 6 }} />
          <span style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 18,
            color: T.text,
            letterSpacing: '-0.03em',
            marginLeft: 10,
          }}>majorka</span>
          <span style={{
            fontSize: 10,
            fontFamily: mono,
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#6366F1',
            padding: '2px 7px',
            borderRadius: 20,
            marginLeft: 10,
            letterSpacing: '0.05em',
          }}>BETA</span>
        </a>

        <div className="mj-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#features" style={{ fontSize: 14, color: '#71717a', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
          >Features</a>
          <a href="#compare" style={{ fontSize: 14, color: '#71717a', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
          >Compare</a>
          <a href="#workflow" style={{ fontSize: 14, color: '#71717a', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
          >Workflow</a>
          <a href="#pricing" style={{ fontSize: 14, color: '#71717a', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
          >Pricing</a>
          <a href="/blog" style={{ fontSize: 14, color: '#71717a', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
          >Blog</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/sign-in" style={{ color: '#9ca3af', fontSize: 14, textDecoration: 'none', marginRight: 8, transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >Log in</Link>
          <Link href="/sign-up" style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#6366F1',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 150ms',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#7c83f4')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
          >Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      background: '#0a0a0a',
      position: 'relative',
      overflow: 'hidden',
      padding: '160px 24px 100px',
      borderBottom: `1px solid ${T.border}`,
      marginTop: 60,
    }}>
      {/* Glow blobs */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        top: -100, left: -150, pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        top: 50, right: -100, pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
        bottom: -50, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        <div className="mj-hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px rgba(34,197,94,0.8)',
                animation: 'mj-pulse 1.6s infinite',
                display: 'inline-block',
              }} />
              <span style={{
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#6366F1',
              }}>The Ecommerce Operating System</span>
            </div>

            {/* Headline */}
            <h1 className="mj-hero-h1" style={{
              fontFamily: display,
              fontSize: 'clamp(44px, 6vw, 72px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: '#f0f0f0',
              margin: '0 0 24px',
            }}>
              The unfair advantage<br />
              serious dropshippers<br />
              <span style={{ color: '#6366F1' }}>don&apos;t talk about.</span>
            </h1>

            <p style={{
              fontSize: 18,
              color: '#71717a',
              lineHeight: 1.65,
              margin: '0 0 36px',
              maxWidth: 460,
            }}>
              Product intelligence, margin data, competitor spy, and store builder — across 7 markets. One platform, one bill.
            </p>

            {/* CTAs */}
            <div className="mj-hero-cta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <Link href="/sign-up" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 52,
                padding: '0 28px',
                background: '#6366F1',
                color: '#fff',
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 15,
                borderRadius: 999,
                textDecoration: 'none',
                transition: 'background 150ms, transform 150ms',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#7c83f4'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >Find my first winning product →</Link>
              <a href="#features" style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 52,
                padding: '0 24px',
                background: 'transparent',
                color: '#9ca3af',
                fontFamily: sans,
                fontWeight: 500,
                fontSize: 15,
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.12)',
                textDecoration: 'none',
                transition: 'border-color 150ms, color 150ms',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#ededed'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#9ca3af'; }}
              >See it in action</a>
            </div>

            <SocialProofBar />

            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontFamily: mono, fontSize: 11, color: '#9ca3af', letterSpacing: '0.02em' }}>127 operators found a winning product this week · 23 new products added in the last 24h</span>
              </div>
            </div>
          </div>

          {/* Right: floating browser window */}
          <div style={{ position: 'relative' }}>
            {/* Glow ring behind the window */}
            <div style={{
              position: 'absolute',
              inset: -20,
              borderRadius: 20,
              background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)',
              zIndex: 0,
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <BrowserWindow />
            </div>
            {/* Floating LIVE badge */}
            <div style={{
              position: 'absolute',
              bottom: -16,
              right: -16,
              background: '#111114',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 10,
              padding: '10px 14px',
              zIndex: 2,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#22c55e', marginBottom: 2 }}>● LIVE FEED</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#6b7280' }}>7 markets · refreshed live</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Social Proof Bar ────────────────────────────────────────────────────────
function SocialProofBar() {
  const avatars = [
    { i: 'A', from: '#6366F1', to: '#8B5CF6' },
    { i: 'J', from: '#059669', to: '#10B981' },
    { i: 'S', from: '#DC2626', to: '#F97316' },
    { i: 'M', from: '#0891B2', to: '#06B6D4' },
  ];
  return (
    <div className="mj-credibility" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '14px 20px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      width: 'fit-content',
    }}>
      <div style={{ display: 'flex' }}>
        {avatars.map((a, i) => (
          <div key={a.i} style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
            border: '2px solid #0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            marginLeft: i === 0 ? 0 : -8,
            zIndex: 4 - i,
            position: 'relative',
          }}>{a.i}</div>
        ))}
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ color: '#FBBF24', fontSize: 12, letterSpacing: '1px' }}>★★★★★</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#6b7280' }}>500+ operators</div>
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#ededed' }}>2.4M+</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#6b7280' }}>products tracked</div>
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px rgba(34,197,94,0.8)',
          animation: 'mj-pulse 1.6s infinite',
          display: 'inline-block',
        }} />
        <span style={{ fontFamily: mono, fontSize: 11, color: '#6b7280' }}>live data</span>
      </div>
    </div>
  );
}

// ── Browser Window (hero) ──────────────────────────────────────────────────
interface PRow { name: string; score: number; trend: string; vol: string; isNew?: boolean }
const PRODUCT_POOL: PRow[] = [
  { name: 'Posture Corrector Pro',   score: 94, trend: '+18%', vol: '12,847' },
  { name: 'LED Strip Lights 5m',     score: 91, trend: '+22%', vol: '9,213' },
  { name: 'Pet Hair Remover Roller', score: 88, trend: '+11%', vol: '7,402' },
  { name: 'Magnetic Phone Charger',  score: 86, trend: '+9%',  vol: '6,891' },
  { name: 'Cloud Slippers Memory',   score: 92, trend: '+27%', vol: '11,420' },
  { name: 'Mini Portable Blender',   score: 87, trend: '+15%', vol: '8,118' },
  { name: 'Solar Garden Lights x6',  score: 89, trend: '+14%', vol: '5,943' },
  { name: 'Heated Massage Pillow',   score: 90, trend: '+19%', vol: '10,302' },
];

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setVal(Math.round(target * (0.5 - Math.cos(Math.PI * t) / 2)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function ScoreCell({ score }: { score: number }) {
  const v = useCountUp(score);
  return <span style={{ color: T.accent, textAlign: 'right' }}>{v}</span>;
}

function BrowserWindow() {
  const [rows, setRows] = useState<PRow[]>(PRODUCT_POOL.slice(0, 5).map((p, i) => ({ ...p, isNew: i === 4 })));
  const [tick, setTick] = useState(0);
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const cycle = setInterval(() => {
      setRows((prev) => {
        const next = { ...PRODUCT_POOL[(tick + 5) % PRODUCT_POOL.length], isNew: true };
        const cleared = prev.map((r) => ({ ...r, isNew: false }));
        return [next, ...cleared.slice(0, 4)];
      });
      setTick((t) => t + 1);
      setSecondsAgo(0);
    }, 3000);
    const ticker = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => { clearInterval(cycle); clearInterval(ticker); };
  }, [tick]);

  return (
    <div className="mj-hero-window mj-window-shadow" style={{
      background: T.bgPanel,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Title bar */}
      <div style={{
        height: 38,
        background: T.bgChrome,
        borderBottom: `1px solid ${T.borderFaint}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 8,
      }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
        <div style={{ flex: 1, textAlign: 'center', fontFamily: mono, fontSize: 11, color: T.textFaint, letterSpacing: '0.02em' }}>Majorka — Discover</div>
        <div style={{ width: 36 }} />
      </div>

      {/* Tab strip */}
      <div style={{
        display: 'flex',
        background: T.bgChromeAlt,
        borderBottom: `1px solid ${T.borderFaint}`,
        padding: '0 8px',
        height: 36,
        alignItems: 'flex-end',
      }}>
        {[
          { label: 'Discover', active: true },
          { label: 'Trends', active: false },
          { label: 'Spy', active: false },
        ].map((tab) => (
          <div key={tab.label} style={{
            padding: '8px 16px 9px',
            fontFamily: sans,
            fontSize: 12,
            fontWeight: tab.active ? 600 : 500,
            color: tab.active ? T.text : T.textDim,
            background: tab.active ? T.bgPanel : 'transparent',
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            borderTop: tab.active ? `1px solid ${T.borderFaint}` : 'none',
            borderLeft: tab.active ? `1px solid ${T.borderFaint}` : 'none',
            borderRight: tab.active ? `1px solid ${T.borderFaint}` : 'none',
            marginBottom: tab.active ? -1 : 0,
            cursor: 'default',
          }}>{tab.label}</div>
        ))}
      </div>

      {/* URL bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: T.bgChromeAlt,
        borderBottom: `1px solid ${T.borderFaint}`,
      }}>
        {/* Lock icon (CSS shape) */}
        <div style={{ position: 'relative', width: 12, height: 13 }}>
          <div style={{ position: 'absolute', top: 0, left: 2, width: 8, height: 5, border: `1.5px solid ${T.textFaint}`, borderBottom: 'none', borderRadius: '4px 4px 0 0' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 8, background: T.textFaint, borderRadius: 2 }} />
        </div>
        <div style={{
          flex: 1,
          padding: '5px 10px',
          background: T.bgPanel,
          border: `1px solid ${T.borderFaint}`,
          borderRadius: 6,
          fontFamily: mono,
          fontSize: 11,
          color: T.textMuted,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: T.textFaint }}>https://</span>majorka.io<span style={{ color: T.textFaint }}>/app/discover?market=US&amp;score=80+</span>
        </div>
      </div>

      {/* Toolbar with LIVE badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        background: T.bgPanel,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(34,197,94,0.1)',
            border: `1px solid rgba(34,197,94,0.3)`,
            borderRadius: 4,
            fontFamily: mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: T.green,
            textTransform: 'uppercase',
          }}>
            <span className="mj-pulse-dot" style={{ width: 6, height: 6 }} />
            LIVE
          </span>
          <span style={{ fontFamily: mono, fontSize: 11, color: T.textFaint }}>discover · US · 80+</span>
        </div>
        <span style={{ fontFamily: mono, fontSize: 10, color: T.textFaint }}>refreshed {secondsAgo}s ago</span>
      </div>

      {/* Body / table */}
      <div style={{ padding: 18, fontFamily: mono, fontSize: 12, lineHeight: 1.65 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '24px 1fr 56px 60px 76px',
          gap: 10,
          padding: '6px 0',
          borderBottom: `1px solid ${T.border}`,
          color: T.textFaint,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          <span>#</span>
          <span>PRODUCT</span>
          <span style={{ textAlign: 'right' }}>SCORE</span>
          <span style={{ textAlign: 'right' }}>TREND</span>
          <span style={{ textAlign: 'right' }}>VOL/MO</span>
        </div>
        {rows.map((p, i) => (
          <div
            key={`${p.name}-${tick}-${i}`}
            className={p.isNew ? 'mj-row-pulse mj-row-enter' : ''}
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr 56px 60px 76px',
              gap: 10,
              padding: '12px 0 12px 8px',
              borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${T.border}`,
              alignItems: 'center',
              color: T.textMuted,
              animation: !p.isNew ? `mj-row-stagger 350ms ease-out ${i * 80}ms both` : undefined,
            }}
          >
            <span style={{ color: T.textFaint }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <ScoreCell score={p.score} />
            <span style={{ color: T.green, textAlign: 'right' }}>↑ {p.trend}</span>
            <span style={{ textAlign: 'right' }}>{p.vol}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Live Activity Ticker ────────────────────────────────────────────────────
function LiveTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <section style={{
      background: '#0d0d10',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      padding: '12px 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 120,
        background: 'linear-gradient(to right, #0d0d10, transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 120,
        background: 'linear-gradient(to left, #0d0d10, transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div className="mj-ticker-track">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: mono,
            fontSize: 12,
            color: '#9ca3af',
            whiteSpace: 'nowrap',
          }}>
            {item}
            <span style={{ color: '#3f3f46', fontSize: 16, margin: '0 8px' }}>·</span>
          </span>
        ))}
      </div>
    </section>
  );
}

// ── Stats Section ───────────────────────────────────────────────────────────
interface StatCardData { eyebrow: string; numNode: React.ReactNode; body: string }
const STATS_CARDS: StatCardData[] = [
  { eyebrow: 'Products Tracked', numNode: <>2,400<span style={{ color: '#6366F1' }}>+</span></>, body: 'Verified AliExpress products across all 7 markets' },
  { eyebrow: 'Global Markets',   numNode: <>7</>,                                                  body: 'AU, US, UK, CA, NZ, DE, SG — each with local data' },
  { eyebrow: 'Active Operators', numNode: <>500<span style={{ color: '#6366F1' }}>+</span></>,    body: 'Serious sellers running revenue on Majorka' },
  { eyebrow: 'Score Accuracy',   numNode: <>94<span style={{ color: '#6366F1', fontSize: 32, verticalAlign: 'top', marginLeft: 4 }}>%</span></>, body: 'AI demand scores validated against real sales data' },
];

function Stats() {
  return (
    <section style={{
      padding: '64px 24px',
      background: '#0a0a0a',
    }}>
      <div className="mj-stats-grid" style={{
        maxWidth: 1000,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {STATS_CARDS.map((s) => (
          <div key={s.eyebrow} style={{
            background: '#0d0d10',
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            transition: 'background 200ms',
          }}>
            <div style={{
              fontFamily: mono,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#6366F1',
              marginBottom: 4,
            }}>{s.eyebrow}</div>
            <div className="mj-stat-num" style={{
              fontFamily: display,
              fontSize: 52,
              fontWeight: 800,
              color: '#f0f0f0',
              lineHeight: 1,
              letterSpacing: '-0.04em',
            }}>{s.numNode}</div>
            <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5, marginTop: 4 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Partner Bar (integrations) ──────────────────────────────────────────────
const INTEGRATIONS: { name: string; icon: string }[] = [
  { name: 'Shopify',     icon: '🛍️' },
  { name: 'AliExpress',  icon: '🛒' },
  { name: 'Meta Ads',    icon: '📘' },
  { name: 'TikTok',      icon: '🎵' },
  { name: 'Stripe',      icon: '💳' },
  { name: 'Google Ads',  icon: '🔍' },
  { name: 'DHL',         icon: '📦' },
];

function PartnerBar() {
  return (
    <section style={{
      padding: '40px 24px',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: '#0a0a0a',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          fontFamily: mono,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#3f3f46',
          marginBottom: 24,
        }}>Integrates with</div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          {INTEGRATIONS.map((p) => (
            <div key={p.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: '#111114',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
              transition: 'border-color 200ms',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Cinematic Feature Section wrapper ───────────────────────────────────────
interface CinematicProps {
  id?: string;
  bg: string;
  reverse: boolean;
  eyebrow: string;
  line1: string;
  line2: string;
  description: string;
  bullets: string[];
  mockup: React.ReactNode;
}
function CinematicFeature({ id, bg, reverse, eyebrow, line1, line2, description, bullets, mockup }: CinematicProps) {
  return (
    <section id={id} style={{
      background: bg,
      borderBottom: `1px solid ${T.border}`,
      padding: '120px 24px',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div className="mj-feat-grid" style={{
          display: 'grid',
          gridTemplateColumns: reverse ? '60% 40%' : '40% 60%',
          gap: 64,
          alignItems: 'center',
        }}>
          <div className={reverse ? 'mj-feat-mock' : 'mj-feat-text'} style={{
            order: reverse ? 1 : 1,
          }}>
            {reverse ? (
              <div className="mj-mockup-shadow" style={{ borderRadius: 12, overflow: 'hidden' }}>{mockup}</div>
            ) : (
              <FeatureCopy eyebrow={eyebrow} line1={line1} line2={line2} description={description} bullets={bullets} />
            )}
          </div>
          <div className={reverse ? 'mj-feat-text' : 'mj-feat-mock'} style={{
            order: reverse ? 2 : 2,
          }}>
            {reverse ? (
              <FeatureCopy eyebrow={eyebrow} line1={line1} line2={line2} description={description} bullets={bullets} />
            ) : (
              <div className="mj-mockup-shadow" style={{ borderRadius: 12, overflow: 'hidden' }}>{mockup}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeatureCopyProps { eyebrow: string; line1: string; line2: string; description: string; bullets: string[] }
function FeatureCopy({ eyebrow, line1, line2, description, bullets }: FeatureCopyProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ display: 'inline-block', width: 4, height: 32, background: T.accent, borderRadius: 2 }} />
        <span className="mj-eyebrow">{eyebrow}</span>
      </div>
      <h2 className="mj-feature-panel-header">
        {line1}<br /><span>{line2}</span>
      </h2>
      <p style={{ fontSize: 16, color: T.textMuted, lineHeight: 1.65, margin: '0 0 24px', maxWidth: 460 }}>{description}</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bullets.map((b) => (
          <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: T.text }}>
            <span style={{
              flexShrink: 0,
              width: 18,
              height: 18,
              borderRadius: 4,
              background: 'rgba(99,102,241,0.12)',
              border: `1px solid rgba(99,102,241,0.3)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.accent,
              fontFamily: mono,
              fontSize: 11,
              fontWeight: 700,
              marginTop: 2,
            }}>✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Discovery Mockup ────────────────────────────────────────────────────────
function DiscoveryProductCard({ name, score, margin, orders, image }: { name: string; score: number; margin: string; orders: string; image: React.ReactNode }) {
  return (
    <div style={{
      background: T.bgSurface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{ position: 'relative' }}>
        {image}
        <span style={{
          position: 'absolute',
          top: 10,
          right: 10,
          padding: '3px 8px',
          background: 'rgba(10,10,10,0.7)',
          border: `1px solid rgba(255,255,255,0.18)`,
          borderRadius: 4,
          fontFamily: mono,
          fontSize: 10,
          color: '#fff',
          fontWeight: 700,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}>SCORE {score}</span>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{
          fontFamily: display,
          fontWeight: 600,
          fontSize: 13,
          color: T.text,
          marginBottom: 8,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.005em',
        }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: T.green }}>{margin} margin</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: T.textDim }}>{orders}/mo</span>
        </div>
        <button style={{
          width: '100%',
          padding: '8px 12px',
          background: 'transparent',
          border: `1px solid ${T.border}`,
          borderRadius: 6,
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 600,
          color: T.textMuted,
          cursor: 'pointer',
          transition: 'border-color 150ms, color 150ms',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
        >View product →</button>
      </div>
    </div>
  );
}

const aliBadges = (
  <>
    <div style={{ position: 'absolute', bottom: 6, right: 8, background: 'rgba(255,90,0,0.9)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace' }}>AliExpress</div>
    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace' }}>AE VERIFIED</div>
  </>
);

function DiscoveryMockup() {
  return (
    <div style={{ background: T.bgPanel, padding: 24 }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mj-eyebrow" style={{ color: T.text }}>Discovery</span>
          <span style={{
            padding: '3px 8px',
            background: 'rgba(99,102,241,0.12)',
            border: `1px solid rgba(99,102,241,0.3)`,
            borderRadius: 4,
            fontFamily: mono,
            fontSize: 10,
            color: T.accent,
          }}>US · 80+</span>
        </div>
        <span style={{ fontFamily: mono, fontSize: 11, color: T.textFaint }}>4 of 2,447</span>
      </div>
      {/* Grid */}
      <div className="mj-discovery-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
      }}>
        <DiscoveryProductCard
          name="Posture Corrector Pro" score={94} margin="68%" orders="12.8k"
          image={
            <div style={{ height: 110, background: '#f0ede8', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 70, height: 50, background: 'linear-gradient(135deg,#2d2d2d,#4a4a4a)', borderRadius: 12, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <div style={{ position: 'absolute', inset: '6px 4px', background: 'linear-gradient(135deg,#1a1a1a,#333)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              {aliBadges}
            </div>
          }
        />
        <DiscoveryProductCard
          name="Cloud Memory Slippers" score={92} margin="74%" orders="11.4k"
          image={
            <div style={{ height: 110, background: '#f5f0eb', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 80, height: 40, background: 'linear-gradient(135deg,#e8c99a,#d4a96a)', borderRadius: '40px 40px 20px 20px', position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                <div style={{ position: 'absolute', top: 4, left: 8, right: 8, height: 14, background: 'rgba(255,255,255,0.4)', borderRadius: 20 }} />
              </div>
              {aliBadges}
            </div>
          }
        />
        <DiscoveryProductCard
          name="LED Strip Lights 5m" score={91} margin="72%" orders="9.2k"
          image={
            <div style={{ height: 110, background: '#0a0a12', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 80 }}>
                {[
                  'linear-gradient(90deg,#ff0080,#ff6600,#ffff00,#00ff88,#0088ff,#8800ff)',
                  'linear-gradient(90deg,#0088ff,#8800ff,#ff0080,#ff6600,#ffff00,#00ff88)',
                  'linear-gradient(90deg,#00ff88,#0088ff,#8800ff,#ff0080,#ff6600,#ffff00)',
                ].map((g, i) => (
                  <div key={i} style={{ height: 6, background: g, borderRadius: 3, boxShadow: '0 0 8px rgba(99,102,241,0.6)' }} />
                ))}
              </div>
              {aliBadges}
            </div>
          }
        />
        <DiscoveryProductCard
          name="Heated Massage Pillow" score={90} margin="70%" orders="10.3k"
          image={
            <div style={{ height: 110, background: '#f0e8e8', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 78, height: 52, background: 'linear-gradient(135deg,#8B3A3A,#C0504D)', borderRadius: '50%', position: 'relative', boxShadow: '0 4px 16px rgba(139,58,58,0.4)' }}>
                <div style={{ position: 'absolute', inset: 8, background: 'linear-gradient(135deg,rgba(255,255,255,0.15),transparent)', borderRadius: '50%' }} />
              </div>
              {aliBadges}
            </div>
          }
        />
      </div>
      {/* Provenance strip */}
      <div style={{ marginTop: 12, padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)', flexShrink: 0, display: 'inline-block' }} />
        <span style={{ fontFamily: mono, fontSize: 11, color: '#6b7280', letterSpacing: '0.02em' }}>Sourced from AliExpress Affiliate API · Real order counts · Updated every 4 hours · 2,400+ verified products</span>
      </div>
    </div>
  );
}

// ── Spy Mockup ──────────────────────────────────────────────────────────────
function SpyMockup() {
  const topProducts = [
    { name: 'Magnetic Phone Charger', rev: '$48k', path: 'M0,18 L8,15 L16,16 L24,10 L32,12 L40,8 L48,6 L56,4' },
    { name: 'Cloud Memory Slippers',  rev: '$36k', path: 'M0,16 L8,14 L16,12 L24,14 L32,9  L40,11 L48,7 L56,5' },
    { name: 'Posture Corrector Pro',  rev: '$28k', path: 'M0,12 L8,14 L16,11 L24,13 L32,8  L40,10 L48,6 L56,8' },
  ];
  return (
    <div style={{ background: T.bgPanel, padding: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 22,
      }}>
        <span className="mj-eyebrow" style={{ color: T.text }}>Store Spy</span>
        <span style={{ flex: 1 }} />
        <span style={{
          padding: '4px 10px',
          background: T.bgSurface,
          border: `1px solid ${T.border}`,
          borderRadius: 6,
          fontFamily: mono,
          fontSize: 11,
          color: T.text,
        }}>peakflowstore.com</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 10, color: T.green }}>
          <span className="mj-pulse-dot" /> scanned
        </span>
      </div>

      {/* Donut + summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        <div style={{
          width: 110,
          height: 110,
          borderRadius: '50%',
          background: `conic-gradient(${T.accent} 0% 42%, #8B5CF6 42% 64%, ${T.green} 64% 80%, ${T.amber} 80% 100%)`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            inset: 16,
            borderRadius: '50%',
            background: T.bgPanel,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontFamily: display, fontSize: 22, fontWeight: 700, color: T.text, lineHeight: 1 }}>$162k</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: T.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>est. mo. rev</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {[
            { label: 'Apparel',     pct: 42, color: T.accent },
            { label: 'Accessories', pct: 22, color: '#8B5CF6' },
            { label: 'Home',        pct: 16, color: T.green },
            { label: 'Other',       pct: 20, color: T.amber },
          ].map((row) => (
            <div key={row.label} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10, color: T.textMuted, marginBottom: 4 }}>
                <span>{row.label}</span>
                <span style={{ color: row.color }}>{row.pct}%</span>
              </div>
              <div style={{ height: 4, background: T.bgSurface, borderRadius: 2, overflow: 'hidden' }}>
                <div className="mj-bar" style={{ width: `${row.pct}%`, height: '100%', background: row.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top products with sparklines */}
      <div style={{
        fontFamily: mono,
        fontSize: 10,
        color: T.textFaint,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 10,
      }}>TOP PRODUCTS</div>
      {topProducts.map((p, i) => (
        <div key={p.name} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 0',
          borderBottom: i === topProducts.length - 1 ? 'none' : `1px solid ${T.border}`,
        }}>
          <span style={{ flex: 1, fontFamily: sans, fontSize: 13, color: T.text, fontWeight: 500 }}>{p.name}</span>
          <svg width="60" height="22" style={{ display: 'block' }}>
            <path d={p.path} fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: mono, fontSize: 12, color: T.green, fontWeight: 600, minWidth: 44, textAlign: 'right' }}>{p.rev}</span>
        </div>
      ))}
    </div>
  );
}

// ── Creative Mockup ─────────────────────────────────────────────────────────
function CreativeMockup() {
  const ads = [
    {
      platform: 'META',
      grad: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      hook: 'POV: You finally fixed the back pain you\'ve had for 6 years.',
      body: 'No chiropractor. No pills. Just 15 minutes a day with this $49 device.',
      likes: '1.2k',
      comments: '234',
      ctr: '4.1%',
    },
    {
      platform: 'TIKTOK',
      grad: 'linear-gradient(135deg, #ef4444, #f59e0b)',
      hook: 'Your posture is costing you 4cm of height.',
      body: 'Engineered for desk workers. Wear under any shirt. Free shipping.',
      likes: '3.7k',
      comments: '512',
      ctr: '5.8%',
    },
  ];
  return (
    <div style={{ background: T.bgPanel, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span className="mj-eyebrow" style={{ color: T.text }}>Ad Creative Studio</span>
        <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 11, color: T.textFaint }}>2 angles generated</span>
      </div>
      <div className="mj-creative-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
      }}>
        {ads.map((ad) => (
          <div key={ad.platform} style={{
            background: T.bgSurface,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            {/* Image area with platform pill */}
            <div style={{
              height: 88,
              background: ad.grad,
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.18), transparent 65%)' }} />
              <span style={{
                position: 'absolute',
                top: 10,
                left: 10,
                padding: '3px 8px',
                background: 'rgba(10,10,10,0.6)',
                border: `1px solid rgba(255,255,255,0.15)`,
                borderRadius: 4,
                fontFamily: mono,
                fontSize: 9,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '0.08em',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}>{ad.platform}</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{
                paddingLeft: 10,
                borderLeft: `2px solid ${T.accent}`,
                marginBottom: 12,
              }}>
                <p style={{
                  fontFamily: display,
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.text,
                  margin: 0,
                  lineHeight: 1.4,
                  letterSpacing: '-0.005em',
                }}>&ldquo;{ad.hook}&rdquo;</p>
              </div>
              <p style={{
                fontFamily: sans,
                fontSize: 12,
                color: T.textMuted,
                lineHeight: 1.5,
                margin: '0 0 14px',
              }}>{ad.body}</p>
              <div style={{
                display: 'flex',
                gap: 14,
                paddingTop: 12,
                borderTop: `1px solid ${T.border}`,
                fontFamily: mono,
                fontSize: 10,
                color: T.textDim,
              }}>
                <span><span style={{ color: T.text }}>{ad.likes}</span> likes</span>
                <span><span style={{ color: T.text }}>{ad.comments}</span> comments</span>
                <span style={{ marginLeft: 'auto', color: T.green }}>↑ {ad.ctr} CTR</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Build Mockup ────────────────────────────────────────────────────────────
function BuildMockup() {
  return (
    <div style={{ background: T.bgPanel, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <span className="mj-eyebrow" style={{ color: T.text }}>Store Builder</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 11, color: T.green }}>
          <span className="mj-pulse-dot" /> generating
        </span>
      </div>

      {/* Steps row */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 24 }}>
        {[
          { num: '01', label: 'Brand brief',   sub: 'Niche + accent', done: true },
          { num: '02', label: 'Layout',        sub: 'Theme + sections', done: true },
          { num: '03', label: 'Push live',     sub: 'Shopify connect', done: false },
        ].map((step, i, arr) => (
          <div key={step.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              flex: 1,
              padding: 14,
              background: step.done ? 'rgba(34,197,94,0.06)' : T.bgSurface,
              border: `1px solid ${step.done ? 'rgba(34,197,94,0.25)' : T.border}`,
              borderRadius: 8,
            }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: step.done ? T.green : T.textFaint, letterSpacing: '0.08em', marginBottom: 4 }}>{step.num}</div>
              <div style={{ fontFamily: display, fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 2 }}>{step.label}</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: T.textDim }}>{step.sub}</div>
            </div>
            {i < arr.length - 1 && (
              <div style={{
                width: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: T.textFaint,
                fontFamily: mono,
                fontSize: 14,
              }}>→</div>
            )}
          </div>
        ))}
      </div>

      {/* Store preview */}
      <div style={{
        background: T.bgSurface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {/* mini chrome */}
        <div style={{
          height: 24,
          background: T.bgChrome,
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          gap: 5,
          borderBottom: `1px solid ${T.borderFaint}`,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#28C840' }} />
          <span style={{ flex: 1, textAlign: 'center', fontFamily: mono, fontSize: 9, color: T.textFaint }}>peakflowco.myshopify.com</span>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{
            fontFamily: display,
            fontSize: 22,
            fontWeight: 700,
            color: T.text,
            letterSpacing: '-0.025em',
            marginBottom: 6,
          }}>PeakFlow Co.</div>
          <div style={{ fontFamily: sans, fontSize: 11, color: T.textDim, marginBottom: 14 }}>The posture device built for desk warriors.</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 14,
          }}>
            {['linear-gradient(135deg,#6366F1,#8B5CF6)', 'linear-gradient(135deg,#22c55e,#10b981)', 'linear-gradient(135deg,#f59e0b,#ef4444)'].map((g, i) => (
              <div key={i} style={{ height: 50, background: g, borderRadius: 6, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 60%)', borderRadius: 6 }} />
              </div>
            ))}
          </div>
          <button className="mj-btn-primary" style={{ width: '100%', height: 38, fontSize: 13 }}>
            Push to Shopify →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Comparison ─────────────────────────────────────────────────────────────
const COMPARISON_ROWS: { feature: string; m: string; minea: string; auto: string; ecom: string }[] = [
  { feature: 'Product Research',         m: '✓', minea: '✓', auto: '✓', ecom: '✓' },
  { feature: 'Margin Calculator',        m: '✓', minea: '—', auto: '✓', ecom: '—' },
  { feature: 'Ad Creative Generator',    m: '✓', minea: '—', auto: '—', ecom: '—' },
  { feature: 'Competitor Store Spy',     m: '✓', minea: '✓', auto: '—', ecom: '—' },
  { feature: 'Store Builder',            m: '✓', minea: '—', auto: '✓', ecom: '—' },
  { feature: 'Multi-Market Support (7)', m: '✓', minea: '—', auto: '—', ecom: '—' },
  { feature: 'TikTok + Meta Ad Spy',     m: '✓', minea: '✓', auto: '—', ecom: '—' },
  { feature: 'Profit Calculator',        m: '✓', minea: '—', auto: '✓', ecom: '—' },
];

function Comparison() {
  return (
    <section id="compare" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Comparison"
          line1="One platform."
          line2="Everything included."
          description="Six tools and a spreadsheet — replaced. Side by side with the alternatives."
        />
        <div className="mj-comparison" style={{
          background: T.bgSurface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          overflowX: 'auto',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: sans,
            fontSize: 14,
            minWidth: 720,
          }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '20px 24px',
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: T.textFaint,
                  borderBottom: `1px solid ${T.border}`,
                }}>Feature</th>
                <th style={{
                  textAlign: 'center',
                  padding: '20px 16px',
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  background: T.accent,
                  borderBottom: `1px solid ${T.accent}`,
                  boxShadow: '0 0 0 2px #6366F1',
                  position: 'relative',
                }}>Majorka</th>
                {['Minea', 'AutoDS', 'Ecomhunt'].map((label) => (
                  <th key={label} style={{
                    textAlign: 'center',
                    padding: '20px 16px',
                    fontFamily: mono,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: T.textFaint,
                    borderBottom: `1px solid ${T.border}`,
                  }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => {
                const isLast = i === COMPARISON_ROWS.length - 1;
                const renderCell = (val: string, accent: boolean) => {
                  const isCheck = val === '✓';
                  const isDash = val === '—';
                  return (
                    <td style={{
                      textAlign: 'center',
                      padding: '18px 16px',
                      fontFamily: mono,
                      fontSize: 14,
                      fontWeight: isCheck ? 700 : 500,
                      color: isCheck ? T.green : isDash ? T.textGhost : accent ? T.text : T.textMuted,
                      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                      background: accent ? 'rgba(99,102,241,0.08)' : 'transparent',
                      boxShadow: accent ? 'inset 2px 0 0 #6366F1, inset -2px 0 0 #6366F1' : 'none',
                    }}>{val}</td>
                  );
                };
                return (
                  <tr key={row.feature}>
                    <td style={{
                      padding: '18px 24px',
                      color: T.text,
                      fontWeight: 500,
                      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                    }}>{row.feature}</td>
                    {renderCell(row.m, true)}
                    {renderCell(row.minea, false)}
                    {renderCell(row.auto, false)}
                    {renderCell(row.ecom, false)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── Markets ────────────────────────────────────────────────────────────────
const MARKETS: { code: string; flag: string; name: string; value: string }[] = [
  { code: 'AU', flag: '🇦🇺', name: 'Australia',     value: 'Afterpay-native pricing, local AliExpress suppliers' },
  { code: 'US', flag: '🇺🇸', name: 'United States', value: 'Domestic Shopify supply, FB ad benchmarks' },
  { code: 'UK', flag: '🇬🇧', name: 'United Kingdom', value: 'VAT-aware margins, Klarna and HMRC compliance' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada',        value: 'CAD pricing, GST tracking, cross-border duties' },
  { code: 'NZ', flag: '🇳🇿', name: 'New Zealand',   value: 'NZ Post rates, local supplier network mapped' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany',       value: 'EUR pricing, EU VAT, GDPR-first onboarding' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore',     value: 'Asia-Pacific shipping, SGD margins, GST ready' },
];

function Markets() {
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Global Coverage"
          line1="Built for your market."
          line2="Not just the US."
          description="Localised pricing, suppliers, taxes, and benchmarks for seven regions — pick yours."
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {MARKETS.map((m) => (
            <div key={m.code} className="mj-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>{m.flag}</span>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: T.accent, letterSpacing: '0.08em', marginBottom: 2 }}>{m.code}</div>
                  <div style={{ fontFamily: display, fontWeight: 600, fontSize: 16, color: T.text, letterSpacing: '-0.01em' }}>{m.name}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: T.textMuted, margin: 0 }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Workflow ────────────────────────────────────────────────────────────────
function Workflow() {
  return (
    <section id="workflow" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px', background: T.bgAlt }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Workflow"
          line1="From signal to store"
          line2="in three steps."
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
        }}>
          {STEPS.map((s) => (
            <div key={s.num} style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24 }}>
              <div style={{ fontFamily: mono, fontSize: 12, color: T.accent, marginBottom: 16, fontWeight: 500 }}>STEP {s.num}</div>
              <h3 style={{
                fontFamily: display,
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: '-0.015em',
                color: T.text,
                margin: '0 0 12px',
                lineHeight: 1.25,
              }}>{s.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: T.textMuted, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials (masonry) ─────────────────────────────────────────────────
const TESTIMONIALS: { initials: string; name: string; flag: string; market: string; stat: string; quote: string; from: string; to: string }[] = [
  {
    initials: 'AM', name: 'Alex M.', flag: '🇦🇺', market: 'Sydney',
    stat: '$47k/mo store', quote: "Found a $12k/mo product in 20 minutes using Majorka's discovery tool. Switched from Minea and never looked back. The margin calculator alone is worth the subscription.",
    from: '#6366F1', to: '#8B5CF6',
  },
  {
    initials: 'JT', name: 'James T.', flag: '🇺🇸', market: 'Austin',
    stat: '$120k/mo agency', quote: "Saved me from a $4k ad spend mistake on a low-margin product. Majorka caught what I missed.",
    from: '#22c55e', to: '#10b981',
  },
  {
    initials: 'PK', name: 'Priya K.', flag: '🇬🇧', market: 'London',
    stat: '6 stores live', quote: "Built and launched a Shopify store in under an hour. Competitors couldn't match the UK supplier data and the AI brand brief was on point.",
    from: '#06b6d4', to: '#3b82f6',
  },
  {
    initials: 'RC', name: 'Ryan C.', flag: '🇨🇦', market: 'Toronto',
    stat: '$28k/mo store', quote: "The competitor spy paid for itself in week one. I now know exactly which SKUs to test before spending a dollar on ads.",
    from: '#f59e0b', to: '#ef4444',
  },
  {
    initials: 'ML', name: 'Mei L.', flag: '🇸🇬', market: 'Singapore',
    stat: '$85k/mo store', quote: "Finally a tool that understands the APAC market. SGD margins, regional shipping rates, GST — all built in.",
    from: '#ec4899', to: '#8B5CF6',
  },
  {
    initials: 'HW', name: 'Hannes W.', flag: '🇩🇪', market: 'Berlin',
    stat: '$60k/mo store', quote: "GDPR-first onboarding and EUR pricing out of the box. The store builder pushed to Shopify in one click.",
    from: '#06b6d4', to: '#22c55e',
  },
];

function Testimonials() {
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Operators"
          line1="Used by serious"
          line2="sellers."
          description="Real operators across seven markets running real revenue on Majorka."
        />
        <div style={{
          columnCount: 3,
          columnGap: 24,
        }}>
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="mj-card"
              style={{
                padding: 24,
                marginBottom: 24,
                breakInside: 'avoid',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = T.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <p style={{
                fontFamily: display,
                fontSize: 16,
                lineHeight: 1.55,
                color: T.text,
                margin: '0 0 22px',
                letterSpacing: '-0.005em',
              }}>&ldquo;{t.quote}&rdquo;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                  border: `1px solid rgba(255,255,255,0.1)`,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: display, fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
                  flexShrink: 0,
                }}>{t.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.name}</span>
                    <span style={{ fontSize: 12 }}>{t.flag}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: mono,
                    fontSize: 11,
                    color: T.textDim,
                    marginTop: 2,
                  }}>
                    <span>{t.market}</span>
                    <span style={{ color: T.textGhost }}>·</span>
                    <span style={{ color: T.green }}>{t.stat}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────
interface PricingProps { annual: boolean; setAnnual: (v: boolean) => void }
function Pricing({ annual, setAnnual }: PricingProps) {
  const builderPrice = annual ? 79 : 99;
  const scalePrice = annual ? 159 : 199;
  return (
    <section id="pricing" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Pricing"
          line1="Simple pricing."
          line2="No surprises."
          description="One platform replacing six tools. No contracts, cancel anytime."
          align="center"
        />

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex',
            background: T.bgSurface,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: 4,
          }}>
            <button onClick={() => setAnnual(false)} style={{
              padding: '8px 18px', border: 'none',
              background: !annual ? T.accent : 'transparent',
              color: !annual ? '#fff' : T.textMuted,
              fontSize: 13, fontWeight: 600, fontFamily: sans, borderRadius: 4, cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
            }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{
              padding: '8px 18px', border: 'none',
              background: annual ? T.accent : 'transparent',
              color: annual ? '#fff' : T.textMuted,
              fontSize: 13, fontWeight: 600, fontFamily: sans, borderRadius: 4, cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              Annual
              <span style={{ fontFamily: mono, fontSize: 10, color: annual ? '#fff' : T.green }}>−20%</span>
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, maxWidth: 520, margin: '0 auto 32px' }}>
          <span style={{ fontFamily: mono, fontSize: 12, color: '#f59e0b', letterSpacing: '0.03em' }}>⚡ Early access pricing — locked in for existing subscribers when we raise prices</span>
        </div>

        <div className="mj-pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <PricingCard
            tag="Builder" price={builderPrice} annual={annual}
            tagline="Everything you need to find and validate winners."
            features={[
              '50 product searches / month',
              '50 video intelligence searches',
              '50 ad creative generations',
              '5 competitor shop scans',
              '3 stores in Store Builder',
              'All 7 markets supported',
            ]}
            cta="Start with Builder" href="/sign-up?plan=builder" highlight={false}
          />
          <PricingCard
            tag="Scale" price={scalePrice} annual={annual}
            tagline="For operators running real volume."
            features={[
              'Everything in Builder',
              'Unlimited searches across all tools',
              'Unlimited competitor shop spy',
              'Unlimited Store Builder',
              'Niche signal tracking',
              'API access + priority support',
            ]}
            cta="Start with Scale" href="/sign-up?plan=scale" highlight={true}
          />
        </div>
      </div>
    </section>
  );
}

interface PricingCardProps {
  tag: string; price: number; annual: boolean; tagline: string;
  features: string[]; cta: string; href: string; highlight: boolean;
}
function PricingCard({ tag, price, annual, tagline, features, cta, href, highlight }: PricingCardProps) {
  const [hover, setHover] = useState(false);
  const baseStyle: React.CSSProperties = {
    background: highlight
      ? `linear-gradient(135deg, rgba(99,102,241,0.08), transparent), ${T.bgSurface}`
      : T.bgSurface,
    border: highlight ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 32,
    position: 'relative',
    transition: 'all 250ms ease',
    transform: hover ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: highlight
      ? '0 0 40px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.4)'
      : 'none',
  };
  return (
    <div style={baseStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {highlight && (
        <div style={{
          position: 'absolute',
          top: -10,
          right: 24,
          background: T.accent,
          color: '#fff',
          fontFamily: mono,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: 4,
        }}>Recommended</div>
      )}
      <div style={{
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.textFaint,
        marginBottom: 16,
      }}>{tag}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontFamily: display, fontSize: 48, fontWeight: 700, color: T.text, letterSpacing: '-0.025em', lineHeight: 1 }}>${price}</span>
        <span style={{ fontSize: 14, color: T.textDim }}>/ month</span>
      </div>
      <div style={{ fontSize: 12, color: T.textFaint, fontFamily: mono, marginBottom: 16, height: 14 }}>
        {annual ? `billed $${price * 12} annually` : ''}
      </div>
      <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 24px', lineHeight: 1.5 }}>{tagline}</p>
      <div style={{ height: 1, background: T.border, marginBottom: 24 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {features.map((f) => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: T.textMuted }}>
            <span style={{ color: T.accent, fontSize: 12 }}>✓</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
      <Link href={href} className={highlight ? 'mj-btn-primary' : 'mj-btn-secondary'} style={{ width: '100%' }}>
        {cta} →
      </Link>
    </div>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="FAQ"
          line1="Common"
          line2="questions."
        />
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          {FAQ_DATA.map((item, i) => (
            <div key={item.q} style={{ borderBottom: `1px solid ${T.border}` }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '24px 0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  color: T.text,
                  fontFamily: display,
                  fontWeight: 600,
                  fontSize: 17,
                  letterSpacing: '-0.01em',
                }}
              >
                {item.q}
                <span style={{
                  fontFamily: mono,
                  fontSize: 18,
                  color: T.textDim,
                  transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                  transition: 'transform 200ms',
                }}>+</span>
              </button>
              {open === i && (
                <p style={{
                  fontSize: 15,
                  color: T.textMuted,
                  lineHeight: 1.65,
                  margin: '0 0 24px',
                  maxWidth: 640,
                }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{
      position: 'relative',
      borderBottom: `1px solid ${T.border}`,
      padding: '120px 24px',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      isolation: 'isolate',
    }}>
      <div className="mj-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 90%, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.05) 45%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 40% 30% at 20% 80%, rgba(99,102,241,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', textAlign: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, justifyContent: 'center' }}>
          <span style={{ display: 'inline-block', width: 4, height: 32, background: T.accent, borderRadius: 2 }} />
          <span className="mj-eyebrow">Ready when you are</span>
        </div>
        <h2 className="mj-cta-h2" style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 80,
          lineHeight: 1.0,
          letterSpacing: '-0.04em',
          color: T.text,
          margin: '0 0 28px',
        }}>
          Stop guessing.<br />
          <span style={{ color: T.accent }}>Start operating.</span>
        </h2>
        <p style={{ fontSize: 18, color: T.textMuted, margin: '0 0 44px', lineHeight: 1.6 }}>
          Find your first winning product in 20 minutes. Or your money back.
        </p>
        <div className="mj-hero-cta" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 18 }}>
          <Link href="/sign-up" className="mj-btn-primary mj-shimmer-btn" style={{ height: 56, padding: '0 32px', fontSize: 16 }}>
            Find my first winning product →
          </Link>
          <a href="#pricing" className="mj-btn-secondary" style={{ height: 56, padding: '0 28px', fontSize: 15 }}>
            See pricing
          </a>
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', fontFamily: mono }}>
          14-day free trial · No credit card · Cancel anytime
        </div>
        <p style={{ marginTop: 16, fontFamily: mono, fontSize: 12, color: '#6b7280', letterSpacing: '0.02em', textAlign: 'center' }}>
          Join 500+ operators who found their first winning product within 48 hours of signing up.
        </p>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: T.bg, padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="mj-footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 48,
          marginBottom: 48,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <img src="/majorka-logo.jpg" alt="Majorka" style={{ height: 28, width: 'auto', display: 'block', borderRadius: 6 }} />
              <span style={{ fontFamily: display, fontWeight: 700, fontSize: 16, color: T.text, letterSpacing: '-0.02em' }}>Majorka</span>
            </div>
            <p style={{ fontSize: 13, color: T.textDim, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
              The ecommerce operating system. Product research, store building, and ad intelligence in one platform.
            </p>
          </div>
          <FooterCol title="Product" links={[
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Compare', href: '#compare' },
            { label: 'Workflow', href: '#workflow' },
          ]} />
          <FooterCol title="Company" links={[
            { label: 'Blog', href: '/blog' },
            { label: 'About', href: '/about' },
            { label: 'Contact', href: 'mailto:hello@majorka.io' },
            { label: 'Support', href: 'mailto:support@majorka.io' },
          ]} />
          <FooterCol title="Legal" links={[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Cookies', href: '/cookies' },
            { label: 'Refunds', href: '/refund-policy' },
          ]} />
        </div>
        <div style={{
          paddingTop: 24,
          borderTop: `1px solid ${T.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontFamily: mono,
          fontSize: 12,
          color: T.textFaint,
        }}>
          <span>© 2026 Majorka Pty Ltd</span>
          <span>7 markets · global platform</span>
        </div>
      </div>
    </footer>
  );
}

interface FooterColProps { title: string; links: { label: string; href: string }[] }
function FooterCol({ title, links }: FooterColProps) {
  return (
    <div>
      <div style={{
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.textFaint,
        marginBottom: 16,
      }}>{title}</div>
      {links.map((l) => (
        <a key={l.label} href={l.href} style={{
          display: 'block',
          fontSize: 13,
          color: T.textDim,
          textDecoration: 'none',
          marginBottom: 10,
          transition: 'color 150ms',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.textDim)}
        >{l.label}</a>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Home() {
  const isMobile = useIsMobile();
  void isMobile;
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{
      background: T.bg,
      color: T.text,
      fontFamily: sans,
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      <SEO
        title="Majorka — The Ecommerce Operating System"
        description="Find winning products, build Shopify stores, and run ad campaigns from one platform. Built for serious dropshipping operators across 7 global markets."
        path="/"
        ogImage="/og-image.svg"
      />
      <style>{STYLES}</style>
      <Nav />
      <div style={{ animation: 'mj-fade-up 600ms ease both', animationDelay: '0ms' }}>
        <Hero />
      </div>
      <div style={{ animation: 'mj-fade-up 600ms ease both', animationDelay: '100ms' }}>
        <LiveTicker />
      </div>
      <div style={{ animation: 'mj-fade-up 600ms ease both', animationDelay: '200ms' }}>
        <Stats />
      </div>
      <div style={{ animation: 'mj-fade-up 600ms ease both', animationDelay: '300ms' }}>
        <PartnerBar />
      </div>

      <div id="features">
        <CinematicFeature
          bg={T.bg}
          reverse={false}
          eyebrow="01 · Discovery"
          line1="Find winners"
          line2="in seconds."
          description="AI-scored product opportunities from global marketplaces. Margin, demand, and supplier match — all in one card."
          bullets={[
            '2,400+ live products tracked across 7 markets',
            'AI demand signals refreshed continuously',
            'Real AliExpress supplier match per product',
          ]}
          mockup={<DiscoveryMockup />}
        />
        <CinematicFeature
          bg={T.bgAlt}
          reverse={true}
          eyebrow="02 · Spy"
          line1="Decode any"
          line2="competitor store."
          description="Enter a domain. Get the full playbook — revenue estimates, top SKUs, ad spend signals, and tech stack."
          bullets={[
            'Estimated monthly revenue and ad spend',
            'Top product SKUs with revenue split',
            'Tech stack and price-change history',
          ]}
          mockup={<SpyMockup />}
        />
        <CinematicFeature
          bg={T.bg}
          reverse={false}
          eyebrow="03 · Creative"
          line1="Ad copy that"
          line2="actually converts."
          description="Five Meta and TikTok ad angles per product — hooks, body, and CTA — written in your market's voice."
          bullets={[
            'Multi-angle Meta and TikTok ad creative',
            'Localised hook and body copy per market',
            'Built-in engagement and CTR benchmarks',
          ]}
          mockup={<CreativeMockup />}
        />
        <CinematicFeature
          bg={T.bgAlt}
          reverse={true}
          eyebrow="04 · Build"
          line1="Launch a store"
          line2="in minutes."
          description="AI brand brief, theme, copy, and product import. Push live to Shopify with one click."
          bullets={[
            'AI brand brief and theme generation',
            'Auto product import from any AliExpress URL',
            'One-click push to your Shopify store',
          ]}
          mockup={<BuildMockup />}
        />
      </div>

      <Comparison />
      <DatabaseSection />
      <Markets />
      <Workflow />
      <Testimonials />
      <Pricing annual={annual} setAnnual={setAnnual} />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
