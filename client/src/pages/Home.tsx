import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Database, Globe, ShieldCheck, Zap } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useIsMobile } from '@/hooks/useIsMobile';
import { AnnouncementBanner } from '@/components/landing/widgets/AnnouncementBanner';
import { SocialProofToasts } from '@/components/landing/widgets/SocialProofToasts';

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
  textDim: '#8a8a8f',
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

/* CRITICAL: Force every landing section + every scroll-reveal variant to
   be visible. Stops any future animation/fill-mode/reveal/JS pattern from
   hiding content below the fold. If the fade animation doesn't fire,
   content must still be readable. */
section,
section *,
[data-animate],
.mj-fade-up,
.mj-fade-in,
.mj-fade-in-down,
.mj-fade-in-up,
.animate-on-scroll,
[class*="fade"],
[class*="reveal"],
[class*="slide-in"] {
  opacity: 1 !important;
  visibility: visible !important;
}
section h1, section h2, section h3, section h4, section p,
section span, section div, section a, section button {
  opacity: 1 !important;
}
/* Allow transforms on explicitly-animated hover elements */
section [data-transform-ok] {
  transform: revert !important;
}

@keyframes mj-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
@keyframes mj-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
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
  /* Neutralized — starts at opacity 1 so elements are visible even if the
     animation never runs (e.g. headless browsers, reduced-motion). */
  from { opacity: 1; transform: translateY(0); }
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
  .mj-nav-cta { display: none !important; }
  .mj-mobile-menu-btn { display: flex !important; }
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
const TICKER_BASE: { text: string; needsTime: boolean }[] = [
  { text: '🇦🇺 AU operator found $14,200/mo product', needsTime: true },
  { text: '🇺🇸 US store launched via Store Builder',   needsTime: true },
  { text: '🇬🇧 UK competitor spy scan completed',       needsTime: true },
  { text: '🇨🇦 CA margin calculator: 44% net margin',   needsTime: true },
  { text: '🇩🇪 DE winning product: 91 score',           needsTime: true },
  { text: '🇸🇬 SG ad creative generated',               needsTime: true },
  { text: '2,302 winning products across 149 niches',  needsTime: false },
  { text: '500+ active operators online now',          needsTime: false },
];
function generateTickerItems(): string[] {
  return TICKER_BASE.map((item, i) => {
    if (!item.needsTime) return item.text;
    const mins = Math.floor(Math.random() * 5 + i * 3 + 1);
    return `${item.text} · ${mins} min ago`;
  });
}

const STEPS: { num: string; title: string; body: string; time: string }[] = [
  { num: '01', time: '~2 minutes',  title: 'Pick your market and niche', body: 'Choose your region and category. Majorka adapts pricing, suppliers, and compliance to where you sell.' },
  { num: '02', time: '~15 minutes', title: 'Find and validate your winner', body: 'Scored product opportunities, profit calculator, competitor store spy. Fully vetted before you spend a dollar.' },
  { num: '03', time: '~7 minutes',  title: 'Launch your store', body: 'Generate the brand, push to Shopify, ship ad creatives. Monitor performance from one dashboard.' },
];

const FAQ_DATA: { q: string; a: string }[] = [
  { q: 'How is Majorka different from KaloData or Minea?', a: 'Majorka is the operating system, not a single tool. Product research, competitor spying, store building, ad creative, and profit math live in one dashboard with one bill.' },
  { q: 'Where does product data come from?',  a: 'All product data is sourced directly from the AliExpress Affiliate API and CJ Dropshipping. Order counts, ratings, and prices are real — not estimated. Data refreshes every 6 hours. Every product has a verifiable AliExpress or CJ product ID.' },
  { q: 'Do I need a Shopify store first?',     a: "No. You can use Majorka's built-in Store Builder to generate and launch a store from scratch, or connect an existing Shopify store in one click. Majorka adds an intelligence layer on top of whatever setup you have." },
  { q: 'Which markets are supported?',         a: 'Australia, United States, United Kingdom, Canada, New Zealand, Germany, and Singapore. Each market has localised pricing, supplier recommendations, tax calculations, and regional ad benchmarks built in.' },
  { q: 'Can I cancel anytime?',                a: "Yes. No contracts, no lock-ins. Cancel before your next billing date and you won't be charged. Your data exports (CSV) are available for 30 days after cancellation." },
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
  const [mobileOpen, setMobileOpen] = useState(false);
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
            fontSize: 9,
            fontFamily: mono,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.18)',
            color: '#a5b4fc',
            padding: '2px 7px',
            borderRadius: 20,
            marginLeft: 10,
            letterSpacing: '0.08em',
            fontWeight: 500,
            textTransform: 'uppercase',
          }}>Early Access</span>
        </a>

        <div className="mj-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#features" style={{ fontSize: 14, color: '#8a8a8f', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8a8f')}
          >Features</a>
          <a href="#compare" style={{ fontSize: 14, color: '#8a8a8f', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8a8f')}
          >Compare</a>
          <a href="#workflow" style={{ fontSize: 14, color: '#8a8a8f', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8a8f')}
          >Workflow</a>
          <a href="#pricing" style={{ fontSize: 14, color: '#8a8a8f', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8a8f')}
          >Pricing</a>
          <a href="/blog" style={{ fontSize: 14, color: '#8a8a8f', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8a8f')}
          >Blog</a>
        </div>

        <div className="mj-nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {/* Mobile hamburger — visible only below 768px */}
        <button
          className="mj-mobile-menu-btn"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            cursor: 'pointer',
            color: '#ededed',
          }}
        >
          <svg width={18} height={14} viewBox="0 0 18 14" fill="none">
            <rect width={18} height={2} rx={1} fill="currentColor" />
            <rect y={6} width={18} height={2} rx={1} fill="currentColor" />
            <rect y={12} width={12} height={2} rx={1} fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(9,9,15,0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}
        >
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              color: 'white',
              fontSize: 22,
              fontFamily: sans,
            }}
          >×</button>
          {[
            { href: '#features',  label: 'Features' },
            { href: '#compare',   label: 'Compare' },
            { href: '#workflow',  label: 'Workflow' },
            { href: '#pricing',   label: 'Pricing' },
            { href: '/blog',      label: 'Blog' },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontFamily: display,
                fontSize: 28,
                fontWeight: 700,
                color: '#f0f4ff',
                textDecoration: 'none',
                letterSpacing: '-0.02em',
              }}
            >{l.label}</a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280, marginTop: 16 }}>
            <Link href="/sign-in" onClick={() => setMobileOpen(false)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 52, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
              color: '#ededed', textDecoration: 'none', fontSize: 15, fontWeight: 500,
              fontFamily: sans,
            }}>Log in</Link>
            <Link href="/sign-up" onClick={() => setMobileOpen(false)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 52, background: '#6366f1', borderRadius: 10,
              color: 'white', textDecoration: 'none', fontSize: 15, fontWeight: 600,
              fontFamily: sans,
            }}>Get Started →</Link>
          </div>
        </div>
      )}
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
      padding: '80px 24px 100px',
      borderBottom: `1px solid ${T.border}`,
      marginTop: 60,
      minHeight: 'auto',
    }}>
      {/* Full-bleed ambient background so the hero never shows dead black above the content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), #0a0a0a',
      }} />
      {/* Bottom fade into next section */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, zIndex: 2,
        pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 0%, #0a0a0a 100%)',
      }} />
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
            {/* Eyebrow — interactive pill format */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 16px 7px 12px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 100,
              marginBottom: 24,
              fontFamily: sans,
              fontSize: 13,
              color: '#c7d2fe',
              fontWeight: 500,
              width: 'fit-content',
            }}>
              <span className="mj-pulse-dot" style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 10px rgba(34,197,94,0.9)',
                animation: 'mj-pulse 1.6s infinite',
                display: 'inline-block',
              }} />
              <span>1,776 products trending hot right now</span>
              <span style={{ color: '#818cf8', fontSize: 12, marginLeft: -4 }}>→</span>
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
              Find your next winning product<br />
              <span style={{ color: '#6366F1' }}>before anyone else does.</span>
            </h1>

            <p style={{
              fontSize: 18,
              color: '#8a8a8f',
              lineHeight: 1.65,
              margin: '0 0 36px',
              maxWidth: 480,
            }}>
              Majorka gives serious operators live AliExpress intelligence, AI-scored rankings, and every tool to launch, sell, and scale — before the market catches on.
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
              >Explore features ↓</a>
            </div>

            {/* No credit card required — immediately under CTA, prominent */}
            <p style={{
              fontSize: 14,
              color: '#a1a1aa',
              margin: '-16px 0 28px',
              fontFamily: sans,
              fontWeight: 500,
            }}>
              <span style={{ color: '#22c55e', marginRight: 6 }}>✓</span>
              No credit card required
              <span style={{ color: '#4b5563', margin: '0 8px' }}>·</span>
              30-day money-back guarantee
            </p>

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

            {/* Floating stat card — top right of mockup */}
            <div style={{
              position: 'absolute',
              top: -22,
              right: -28,
              background: 'rgba(17,17,20,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              zIndex: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.12)',
              pointerEvents: 'none',
              animation: 'mj-float 4s ease-in-out infinite',
            }}>
              <span style={{ fontSize: 22 }}>📈</span>
              <div>
                <div style={{ fontFamily: display, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  $15,600
                </div>
                <div style={{ fontSize: 11, color: '#8a8a8f', marginTop: 3 }}>Best product today · Kitchen</div>
                <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, marginTop: 3 }}>↑ +41% this week</div>
              </div>
            </div>

            {/* Floating notification card — bottom left */}
            <div style={{
              position: 'absolute',
              bottom: 24,
              left: -32,
              background: 'rgba(17,17,20,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              zIndex: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.12)',
              pointerEvents: 'none',
              animation: 'mj-float 4s ease-in-out 1.5s infinite',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#6366f1',
                boxShadow: '0 0 8px rgba(99,102,241,0.7)',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ededed' }}>🔥 New: Nano Tape Strong</div>
                <div style={{ fontSize: 11, color: '#8a8a8f', marginTop: 2 }}>99/100 · +41% this week</div>
              </div>
            </div>

            {/* Floating LIVE badge — bottom right (kept) */}
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
        <div style={{ fontFamily: mono, fontSize: 11, color: '#6b7280' }}>500+ active operators</div>
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#ededed' }}>2,302</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#6b7280' }}>winning products scored</div>
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
interface HeroProductCard {
  art: React.ReactNode;
  cat: string;
  name: string;
  price: string;
  orders: string;
  score: number;
  source: 'AE' | 'CJ';
  highlight?: boolean;
}

// Hero product thumbnails — routed through /api/image-proxy because
// AliExpress CDN blocks hotlinked images from non-AE referrers.
const proxied = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

const ArtMassageGun = (
  <img
    src={proxied('https://ae-pic-a1.aliexpress-media.com/kf/S67daf35bdca4423987825b41de097c3cw.png')}
    alt="Fascial Massage Gun"
    loading="lazy"
    style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', display: 'block', background: 'linear-gradient(135deg,#1e293b,#334155)' }}
    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
  />
);

const ArtOilBottle = (
  <img
    src={proxied('https://ae-pic-a1.aliexpress-media.com/kf/Sd1a0175e1d304c7f9c0bac71d558aa14M.jpg')}
    alt="Oil Dispenser Bottle"
    loading="lazy"
    style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', display: 'block', background: 'linear-gradient(135deg,#1a2e1a,#2d4a2d)' }}
    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
  />
);

const ArtTapeReel = (
  <img
    src={proxied('https://ae-pic-a1.aliexpress-media.com/kf/Sef81281b5a114d688f22f42a3f87c0941.jpg')}
    alt="Nano Tape Double-sided"
    loading="lazy"
    style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', display: 'block', background: 'linear-gradient(135deg,#1e1e2e,#312e81)' }}
    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
  />
);

const HERO_PRODUCTS: HeroProductCard[] = [
  { art: ArtMassageGun, cat: 'Health',   name: 'Fascial Massage Gun Electric Percussion Pistol', price: 'A$23.76', orders: '106k orders', score: 74, source: 'AE' },
  { art: ArtOilBottle,  cat: 'Kitchen',  name: 'Pour & Spray Oil Dispenser Bottle Kitchen Fryer', price: 'A$14.66', orders: '152k orders', score: 99, source: 'AE' },
  { art: ArtTapeReel,   cat: 'Hardware', name: 'Nano Tape Extra Strong Double-sided Adhesive Roll', price: 'A$5.60',  orders: '231k orders', score: 99, source: 'CJ', highlight: true },
];

function BrowserWindow() {
  return (
    <div className="mj-hero-window" style={{
      background: '#111118',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
      fontFamily: sans,
    }}>
      {/* Window chrome */}
      <div style={{
        background: '#0d0d14',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <div style={{ marginLeft: 8, fontFamily: mono, fontSize: 11, color: '#4b5563' }}>majorka.io/app/products</div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 1,
        background: 'rgba(255,255,255,0.04)',
      }}>
        {[
          { label: 'Products',  value: '2,302', color: '#ededed' },
          { label: 'Hot Today', value: '1,776', color: '#f97316' },
          { label: 'Avg Score', value: '80/100', color: '#f59e0b' },
          { label: 'Top Niche', value: 'Fashion', color: '#6366F1' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#0d0d14', padding: '12px 14px' }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontFamily: display, fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Product cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: 12, background: '#0a0a10' }}>
        {HERO_PRODUCTS.map((p) => (
          <div key={p.name} style={{
            background: '#111118',
            border: p.highlight ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: p.highlight ? '0 0 12px rgba(99,102,241,0.1)' : 'none',
          }}>
            <div style={{
              background: '#1a1a24',
              height: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              {p.art}
              <div style={{
                position: 'absolute', top: 8, left: 8,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
              }}>🔥 HOT</div>
              <div style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.6)',
                color: p.source === 'AE' ? '#f97316' : '#6b7280',
                fontSize: 8, padding: '2px 5px', borderRadius: 3,
                fontFamily: mono, fontWeight: 700,
              }}>{p.source}</div>
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>{p.cat}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#ededed', lineHeight: 1.3, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ededed', fontFamily: mono }}>{p.price}</div>
                <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>{p.orders}</div>
              </div>
              <div style={{ height: 3, background: '#1f2937', borderRadius: 2, marginBottom: 4 }}>
                <div style={{
                  height: 3,
                  width: `${p.score}%`,
                  background: p.score >= 90 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#f59e0b,#f97316)',
                  borderRadius: 2,
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 9, color: '#6b7280', fontFamily: mono }}>{p.score}/100</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: '8px 12px',
        background: '#0d0d14',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: 10, color: '#6b7280', fontFamily: mono }}>Live AliExpress data · Updated 6h ago · 2,302 products tracked</span>
      </div>
    </div>
  );
}

// ── Live Activity Ticker ────────────────────────────────────────────────────
function LiveTicker() {
  const [tickerItems] = useState<string[]>(generateTickerItems);
  const items = [...tickerItems, ...tickerItems];
  return (
    <section
      aria-hidden="true"
      role="presentation"
      style={{
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
interface StatCardData { eyebrow: string; numNode: React.ReactNode; body: string; color?: string }
const STATS_CARDS: StatCardData[] = [
  { eyebrow: 'Winning Products', numNode: <>2,302</>,                                                                                               body: 'across 149 niches, updated every 6h' },
  { eyebrow: 'Hot Right Now',    numNode: <>1,776</>,                                                                                               body: 'scoring ≥ 65/100 today', color: '#f97316' },
  { eyebrow: 'Operator Revenue Tracked', numNode: <><span style={{ color: '#22c55e' }}>$</span>487<span style={{ color: '#22c55e' }}>k</span></>,   body: 'total tracked across Majorka stores this month', color: '#22c55e' },
  { eyebrow: 'Peak AI Score',    numNode: <>99<span style={{ color: '#f59e0b', fontSize: 32, verticalAlign: 'top', marginLeft: 4 }}>/100</span></>, body: 'AliExpress verified, exploding trend', color: '#f59e0b' },
  { eyebrow: 'Avg time to winner', numNode: <>18<span style={{ color: '#a5b4fc', fontSize: 32, verticalAlign: 'top', marginLeft: 4 }}>min</span></>, body: 'median time to first winning product', color: '#a5b4fc' },
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
              color: s.color ?? '#f0f0f0',
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

// ── The Platform ──────────────────────────────────────────────────────────
function ThePlatform() {
  return (
    <section id="features" style={{ background: '#0a0a0a', padding: '100px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 100,
            padding: '4px 14px',
            marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', display: 'inline-block' }} />
            <span style={{ fontFamily: mono, fontSize: 12, color: '#6366F1', fontWeight: 600, letterSpacing: '0.05em' }}>THE FULL STACK</span>
          </div>
          <h2 style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 'clamp(32px, 5vw, 52px)',
            color: '#ededed',
            lineHeight: 1.1,
            marginBottom: 16,
            letterSpacing: '-0.03em',
          }}>
            The unfair advantage<br />serious operators don&apos;t share.
          </h2>
          <p style={{ fontSize: 18, color: '#8a8a8f', maxWidth: 560, margin: '0 auto' }}>
            From product discovery to live store — Majorka is the only platform purpose-built for serious dropship operators.
          </p>
        </div>

        {/* Product Intelligence — full-width */}
        <div style={{
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: 40,
          marginBottom: 20,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Product Intelligence</span>
            </div>
            <h3 style={{ fontFamily: display, fontWeight: 800, fontSize: 28, color: '#ededed', marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              2,302 winning products.<br />Ranked by real orders.
            </h3>
            <p style={{ color: '#8a8a8f', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              Every product is sourced directly from the AliExpress Affiliate API and CJ Dropshipping — real order counts, real margins, updated every 6 hours. Filter by niche, trend trajectory, or AI score.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '2,302 products', sub: 'across 149 niches' },
                { label: '1,776 hot today', sub: 'winning score ≥ 65/100' },
                { label: 'Score 99/100',    sub: 'AI-graded for margin + demand + trend' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#ededed', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: '#4b5563' }}>— {item.sub}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: '#0d0d14',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden',
            fontSize: 12,
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: 8,
              color: '#4b5563',
              fontFamily: mono,
              fontWeight: 600,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              <span>Product</span><span>Orders</span><span>Margin</span><span style={{ textAlign: 'right' }}>Score</span>
            </div>
            {[
              { name: 'Nano Tape Extra Strong', cat: 'Hardware',    orders: '231k', margin: '54%', score: 99, scoreColor: '#22c55e' },
              { name: 'Oil Dispenser Bottle',   cat: 'Kitchen',     orders: '152k', margin: '50%', score: 99, scoreColor: '#22c55e' },
              { name: 'Tire Rim Scrubber',      cat: 'Car Care',    orders: '132k', margin: '50%', score: 99, scoreColor: '#22c55e' },
              { name: 'USB C Charger 100W',     cat: 'Electronics', orders: '180k', margin: '52%', score: 94, scoreColor: '#f59e0b' },
              { name: 'Microfibre Towel Pack',  cat: 'Home',        orders: '133k', margin: '52%', score: 99, scoreColor: '#22c55e' },
            ].map((p, i) => (
              <div key={p.name} style={{
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                gap: 8,
                alignItems: 'center',
                background: i === 0 ? 'rgba(99,102,241,0.04)' : 'transparent',
              }}>
                <div>
                  <div style={{ color: '#ededed', fontWeight: 500 }}>{p.name}</div>
                  <div style={{ color: '#4b5563', fontSize: 10 }}>{p.cat}</div>
                </div>
                <span style={{ color: '#22c55e', fontFamily: mono, fontWeight: 600 }}>{p.orders}</span>
                <span style={{ color: '#ededed' }}>{p.margin}</span>
                <span style={{
                  background: p.scoreColor + '20',
                  color: p.scoreColor,
                  padding: '2px 7px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: mono,
                  textAlign: 'center',
                  justifySelf: 'end',
                }}>{p.score}</span>
              </div>
            ))}
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ color: '#4b5563', fontSize: 10, fontFamily: mono }}>Live AliExpress data · Updated 6h ago</span>
            </div>
          </div>
        </div>

        {/* Tool grid row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 12 }}>📡</span>
            <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Market Intelligence</div>
            <h4 style={{ fontFamily: display, fontWeight: 800, fontSize: 20, color: '#ededed', marginBottom: 10, lineHeight: 1.2, letterSpacing: '-0.015em' }}>Know your market before your competitor does</h4>
            <p style={{ fontSize: 13, color: '#8a8a8f', lineHeight: 1.5, marginBottom: 16 }}>
              Global, AU, US, UK signals. Today&apos;s top products with revenue-per-day estimates. Category rankings updated in real time.
            </p>
            <div style={{ background: '#0d0d14', borderRadius: 8, padding: 12 }}>
              {[
                { name: 'USB C Cable — Mobile',   rev: '$8.5k/day' },
                { name: 'Ratcheting Crimper Set', rev: '$15.6k/day' },
                { name: 'Kawaii Sticker Pack',    rev: '$1.2k/day' },
              ].map((row, i, arr) => (
                <div key={row.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: i === arr.length - 1 ? 0 : 8,
                }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{row.name}</span>
                  <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{row.rev}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 12 }}>📊</span>
            <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Profit Calculator</div>
            <h4 style={{ fontFamily: display, fontWeight: 800, fontSize: 20, color: '#ededed', marginBottom: 10, lineHeight: 1.2, letterSpacing: '-0.015em' }}>Know your margin before you launch</h4>
            <p style={{ fontSize: 13, color: '#8a8a8f', lineHeight: 1.5, marginBottom: 16 }}>
              Model product cost, sell price, ad spend, shipping, fees. Get real break-even CPA and monthly projections in seconds.
            </p>
            <div style={{ background: '#0d0d14', borderRadius: 8, padding: 12 }}>
              {[
                { label: 'Net Margin',     val: '51.4%',  color: '#22c55e' },
                { label: 'Monthly Profit', val: '$2,275', color: '#ededed' },
                { label: 'Break-even CPA', val: '$25.17', color: '#ededed' },
              ].map((r, i) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i === 2 ? 0 : 6 }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{r.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: r.color }}>{r.val}</span>
                </div>
              ))}
              <div style={{
                marginTop: 10,
                padding: '6px 10px',
                background: 'rgba(34,197,94,0.1)',
                borderRadius: 6,
                fontSize: 11,
                color: '#22c55e',
                fontWeight: 600,
                textAlign: 'center',
                fontFamily: mono,
              }}>
                ✓ Highly Viable — scale with confidence
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #111118 0%, #13111f 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 16,
            padding: 28,
          }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 12 }}>🧠</span>
            <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Maya AI</div>
            <h4 style={{ fontFamily: display, fontWeight: 800, fontSize: 20, color: '#ededed', marginBottom: 10, lineHeight: 1.2, letterSpacing: '-0.015em' }}>Your AI ecommerce strategist</h4>
            <p style={{ fontSize: 13, color: '#8a8a8f', lineHeight: 1.5, marginBottom: 16 }}>
              Maya knows your market, your products, and your plan. Ask anything — she answers with AU pricing, ad angles, and supplier recs.
            </p>
            <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 8, padding: 12, fontSize: 12 }}>
              <div style={{ color: '#6b7280', marginBottom: 6, fontSize: 10, fontFamily: mono }}>→ &ldquo;Find me 3 winning Beauty products under $5 cost&rdquo;</div>
              <div style={{ color: '#ededed', lineHeight: 1.5 }}>
                <strong style={{ color: '#6366F1' }}>Maya:</strong> Here are 3 Beauty products with explosive potential…<br />
                <span style={{ color: '#22c55e' }}>Sakura Exfoliating Gel</span> — $4.19 cost, 50% margin, TikTok viral<br />
                <span style={{ color: '#6b7280', fontSize: 10 }}>Fastest to profit · easiest UGC content</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tool grid row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 12 }}>🎯</span>
            <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Ads Studio</div>
            <h4 style={{ fontFamily: display, fontWeight: 800, fontSize: 20, color: '#ededed', marginBottom: 10, lineHeight: 1.2, letterSpacing: '-0.015em' }}>Meta + TikTok ad creative generator</h4>
            <p style={{ fontSize: 13, color: '#8a8a8f', lineHeight: 1.5 }}>
              Select funnel stage, platform, and creative type. Get 5 headline variants, VSL scripts, and AU-specific ad angles — ready to launch.
            </p>
            <div style={{ background: '#0d0d14', borderRadius: 8, padding: '10px 12px', marginTop: 14, fontSize: 11 }}>
              <div style={{ color: '#4b5563', marginBottom: 6 }}>Generating for: LED Face Mask Pro</div>
              <div style={{ color: '#ededed', fontWeight: 600, marginBottom: 3 }}>&ldquo;Dermatologists hate this $29 trick.&rdquo;</div>
              <div style={{ color: '#6b7280' }}>Hook · Cold Traffic · Facebook Feed</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {['Hook', 'VSL', 'UGC', 'Carousel'].map((t) => (
                  <span key={t} style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontFamily: mono }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 12 }}>🏪</span>
            <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Store Builder</div>
            <h4 style={{ fontFamily: display, fontWeight: 800, fontSize: 20, color: '#ededed', marginBottom: 10, lineHeight: 1.2, letterSpacing: '-0.015em' }}>Zero to live store in 7 minutes</h4>
            <p style={{ fontSize: 13, color: '#8a8a8f', lineHeight: 1.5 }}>
              Build with AI from your niche. Connect existing Shopify. Or list directly on Majorka — no Shopify needed. Scale plan gets you the full suite.
            </p>
            <div style={{ background: '#0d0d14', borderRadius: 8, padding: '10px 12px', marginTop: 14 }}>
              {[
                { step: '1', label: 'Niche selected',     done: true },
                { step: '2', label: 'Products imported',  done: true },
                { step: '3', label: 'Brand generated',    done: true },
                { step: '4', label: 'Pushed to Shopify',  done: false },
              ].map((s) => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: s.done ? '#22c55e' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: s.done ? '#fff' : '#4b5563',
                    flexShrink: 0,
                    fontFamily: mono,
                    fontWeight: 700,
                  }}>{s.done ? '✓' : s.step}</div>
                  <span style={{ fontSize: 11, color: s.done ? '#ededed' : '#4b5563' }}>{s.label}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 10, color: '#22c55e', fontFamily: mono }}>⚡ Store live in 7 minutes</div>
            </div>
          </div>
          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 12 }}>📱</span>
            <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Creators &amp; Video</div>
            <h4 style={{ fontFamily: display, fontWeight: 800, fontSize: 20, color: '#ededed', marginBottom: 10, lineHeight: 1.2, letterSpacing: '-0.015em' }}>Find your next viral partner</h4>
            <p style={{ fontSize: 13, color: '#8a8a8f', lineHeight: 1.5 }}>
              Browse TOP, ELITE, and RISING creators by niche. Filter by engagement tier. One-click AI Pitch — personalised outreach generated instantly.
            </p>
            <div style={{ background: '#0d0d14', borderRadius: 8, padding: '10px 12px', marginTop: 14 }}>
              {[
                { initials: 'KE', name: 'Keeoh',    niche: 'ecommerce', tier: 'TOP' },
                { initials: 'LB', name: 'Laura B.', niche: 'lifestyle', tier: 'ELITE' },
              ].map((c, i) => (
                <div key={c.initials} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                  borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#6366F1,#8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: '#fff',
                    flexShrink: 0,
                    fontFamily: mono,
                  }}>{c.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#ededed', fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{c.niche}</div>
                  </div>
                  <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700, fontFamily: mono }}>{c.tier}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Revenue Proof Banner ──────────────────────────────────────────────────
function RevenueProofBanner() {
  const stats = [
    { value: '$247,831', label: 'Lifetime revenue', sub: 'tracked across operator stores' },
    { value: '$15.6k',   label: 'Top daily revenue', sub: 'single product, single day' },
    { value: '2,302',    label: 'Winning products',  sub: 'verified across 149 niches' },
    { value: '1,776',    label: 'Hot right now',     sub: 'scoring ≥ 65/100 today' },
    { value: '99/100',   label: 'Peak AI score',     sub: 'exploding trend, verified' },
  ];
  return (
    <section style={{
      background: 'linear-gradient(135deg, #0d0d14 0%, #111120 100%)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '60px 0',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{
          fontFamily: mono,
          fontSize: 13,
          color: '#4b5563',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
          marginBottom: 32,
        }}>What operators using Majorka are tracking</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 0,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.04)',
        }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              background: '#0a0a10',
              padding: '28px 20px',
              borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{
                fontFamily: display,
                fontSize: 28,
                fontWeight: 800,
                color: '#22c55e',
                letterSpacing: '-0.02em',
                marginBottom: 6,
                lineHeight: 1,
              }}>{s.value}</div>
              <div style={{
                fontFamily: mono,
                fontSize: 11,
                color: '#ededed',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 4,
              }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#4b5563' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Comparison ─────────────────────────────────────────────────────────────
const COMPARISON_ROWS: { feature: string; m: string; minea: string; auto: string; ecom: string; star?: boolean; emphasis?: boolean }[] = [
  { feature: '7 international markets', m: '✓', minea: '—', auto: '—', ecom: '—', star: true },
  { feature: 'Live AliExpress data feed', m: '✓', minea: '✓', auto: '✓', ecom: '—' },
  { feature: 'AI product scoring',      m: '✓', minea: '—', auto: '—', ecom: '—' },
  { feature: 'Store Builder (Shopify push)', m: '✓', minea: '—', auto: '✓', ecom: '—' },
  { feature: 'Ad Creative Generator',   m: '✓', minea: '—', auto: '—', ecom: '—' },
  { feature: 'Competitor Store Spy',    m: '✓', minea: '✓', auto: '—', ecom: '—' },
  { feature: 'Margin + Profit Calculator', m: '✓', minea: '—', auto: '✓', ecom: '—' },
  { feature: 'TikTok + Meta Ad Spy',    m: '✓', minea: '✓', auto: '—', ecom: '—' },
  { feature: 'Tools replaced',          m: '6', minea: '1', auto: '1', ecom: '1', emphasis: true },
  { feature: 'True monthly cost for equivalent coverage', m: '$99/mo', minea: '$147+/mo', auto: '$147+/mo', ecom: '$147+/mo', emphasis: true },
  { feature: 'Starting price',          m: '$99/mo', minea: '$49/mo', auto: '$29/mo', ecom: '$29/mo' },
];

function Comparison() {
  return (
    <section id="compare" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Comparison"
          line1="Why pay more"
          line2="for Majorka?"
          description="Majorka is the only platform covering 7 international markets with live AliExpress data, AI scoring, and a full store-building workflow in one subscription. Most tools give you data. Majorka gives you the full system."
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
                  color: '#6366F1',
                  background: 'rgba(99,102,241,0.08)',
                  borderTop: '2px solid #6366F1',
                  borderBottom: `1px solid ${T.border}`,
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
                const starred = row.star === true;
                const renderCell = (val: string, accent: boolean) => {
                  const isCheck = val === '✓';
                  const isDash = val === '—';
                  const cellColor = isCheck
                    ? '#22c55e'
                    : isDash
                      ? (accent ? '#52525b' : T.textGhost)
                      : accent ? T.text : T.textMuted;
                  return (
                    <td style={{
                      textAlign: 'center',
                      padding: '18px 16px',
                      fontFamily: mono,
                      fontSize: starred && accent ? 16 : 14,
                      fontWeight: isCheck ? 700 : accent ? 600 : 500,
                      color: starred && accent ? '#a5b4fc' : cellColor,
                      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                      background: accent
                        ? (starred ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.08)')
                        : 'transparent',
                      boxShadow: accent ? 'inset 2px 0 0 #6366F1, inset -2px 0 0 #6366F1' : 'none',
                    }}>{val}</td>
                  );
                };
                return (
                  <tr key={row.feature}>
                    <td style={{
                      padding: '18px 24px',
                      color: starred ? '#e5e7eb' : T.text,
                      fontWeight: starred ? 700 : 500,
                      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                      background: starred ? 'rgba(99,102,241,0.04)' : 'transparent',
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
        <p style={{
          fontSize: 12,
          color: '#52525b',
          marginTop: 14,
          textAlign: 'center',
          maxWidth: 720,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.55,
        }}>
          † Tools replaced: Product research (Minea/Ecomhunt), Profit calculator, Ad creative generator, Store builder, Competitor spy, Market intelligence. Purchased separately: $147+/mo.
        </p>
      </div>
    </section>
  );
}

// ── Markets ────────────────────────────────────────────────────────────────
const MARKETS: { code: string; flag: string; name: string; value: string; stat: string }[] = [
  { code: 'AU', flag: '🇦🇺', name: 'Australia',     value: 'Afterpay-native pricing, local AliExpress suppliers', stat: 'Avg margin: 51% · 847 products' },
  { code: 'US', flag: '🇺🇸', name: 'United States', value: 'Domestic Shopify supply, FB ad benchmarks',           stat: 'Avg margin: 48% · 1,240 products' },
  { code: 'UK', flag: '🇬🇧', name: 'United Kingdom', value: 'VAT-aware margins, Klarna and HMRC compliance',       stat: 'Avg margin: 44% · 623 products' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada',        value: 'CAD pricing, GST tracking, cross-border duties',       stat: 'Avg margin: 46% · 512 products' },
  { code: 'NZ', flag: '🇳🇿', name: 'New Zealand',   value: 'NZ Post rates, local supplier network mapped',         stat: 'Avg margin: 50% · 289 products' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany',       value: 'EUR pricing, EU VAT, GDPR-first onboarding',           stat: 'Avg margin: 42% · 445 products' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore',     value: 'Asia-Pacific shipping, SGD margins, GST ready',        stat: 'Avg margin: 55% · 334 products' },
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
              <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 600, marginTop: 6, fontFamily: mono }}>{m.stat}</div>
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
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{
            display: 'inline-block',
            padding: '5px 14px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.22)',
            borderRadius: 999,
            color: '#fbbf24',
            fontFamily: mono,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}>⚡ Full workflow in under 30 minutes — 18 min average to first winner</span>
        </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: T.accent, fontWeight: 500 }}>STEP {s.num}</span>
                <span style={{ fontFamily: mono, fontSize: 10, color: '#fbbf24', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', padding: '2px 8px', borderRadius: 999, letterSpacing: '0.03em' }}>{s.time}</span>
              </div>
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

              {s.num === '01' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                  {['🇦🇺 AU', '🇺🇸 US', '🇬🇧 UK', '🇨🇦 CA', '🇳🇿 NZ', '🇩🇪 DE', '🇸🇬 SG'].map((m) => (
                    <span key={m} style={{
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      color: '#a1a1aa',
                      padding: '3px 8px',
                      borderRadius: 100,
                      fontSize: 11,
                      fontFamily: mono,
                    }}>{m}</span>
                  ))}
                </div>
              )}

              {s.num === '02' && (
                <div style={{
                  marginTop: 14,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontFamily: mono }}>AI Score</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', fontFamily: mono }}>99/100</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontFamily: mono }}>Margin</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', fontFamily: mono }}>54%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontFamily: mono }}>Orders</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ededed', fontFamily: mono }}>231k</div>
                  </div>
                </div>
              )}

              {s.num === '03' && (
                <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Store built ✓', 'Shopify synced ✓', 'Ads live ✓', 'Revenue tracking ✓'].map((tag) => (
                    <span key={tag} style={{
                      background: 'rgba(34,197,94,0.1)',
                      color: '#22c55e',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      fontFamily: mono,
                    }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials (masonry) ─────────────────────────────────────────────────
const TESTIMONIALS: { initials: string; name: string; flag: string; country: string; quote: string; from: string; to: string }[] = [
  {
    initials: 'JT', name: 'James T.', flag: '🇦🇺', country: 'Australia',
    quote: "The product scoring system saved me hours of research every week. I stopped second-guessing which products to test.",
    from: '#6366F1', to: '#8B5CF6',
  },
  {
    initials: 'SK', name: 'Sarah K.', flag: '🇬🇧', country: 'United Kingdom',
    quote: "The store builder pushed a full Shopify setup in a few minutes. The AI-written copy is the part that surprised me most — it actually sounded on-brand.",
    from: '#06b6d4', to: '#3b82f6',
  },
  {
    initials: 'MR', name: 'Marcus R.', flag: '🇺🇸', country: 'United States',
    quote: "Having all 7 markets in one place means I can see which products are trending globally before they hit the US. That's the real edge.",
    from: '#22c55e', to: '#10b981',
  },
];

function Testimonials() {
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Operators"
          line1="What operators say"
          line2="after their first week."
          description="Real feedback from early-access members. No revenue claims. No paid endorsements."
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
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
                    <span>{t.country}</span>
                    <span style={{ color: T.textGhost }}>·</span>
                    <span style={{ color: T.textFaint }}>Early access member</span>
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

// ── Early access notice (replaces fake countdown) ─────────────────────────
function PricingCountdown() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      flexWrap: 'wrap',
      padding: '14px 22px',
      background: 'rgba(99,102,241,0.06)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 8,
      maxWidth: 720,
      margin: '0 auto 32px',
    }}>
      <span style={{ fontFamily: mono, fontSize: 12, color: '#a5b4fc', letterSpacing: '0.03em', textAlign: 'center' }}>
        Early-access pricing available for founding members — price increases when we exit beta
      </span>
    </div>
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
          {annual && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.22)',
              borderRadius: 100,
              fontSize: 12,
              color: '#4ade80',
              fontWeight: 500,
              marginTop: 16,
              fontFamily: sans,
            }}>
              💰 Save $240/yr with annual billing
            </div>
          )}
        </div>

        <PricingCountdown />

        {/* Why pay more — stack value justification */}
        <p style={{
          maxWidth: 760,
          margin: '0 auto 32px',
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 1.65,
          color: T.textMuted,
        }}>
          Majorka replaces <strong style={{ color: T.text }}>Minea</strong> ($49/mo) + a <strong style={{ color: T.text }}>profit calculator</strong> ($19/mo) + an <strong style={{ color: T.text }}>ad creator</strong> ($39/mo) + a <strong style={{ color: T.text }}>store builder</strong> ($39/mo) + more. At <strong style={{ color: T.accent }}>$99/mo</strong>, it&apos;s the most cost-effective stack for serious operators.
        </p>

        <div className="mj-pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <PricingCard
            tag="Explorer" price={0} annual={annual}
            tagline="Browse the database and try the tools — free forever."
            features={[
              '10 product views / day',
              'Top 5 HOT TODAY',
              '1 market (select on signup)',
              'ROAS Calculator',
              '5 Maya AI queries / month',
            ]}
            cta="Start Free" href="/sign-up?plan=free" highlight={false}
          />
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
          top: -12,
          right: 24,
          background: 'rgba(239,68,68,0.15)',
          color: '#f87171',
          border: '1px solid rgba(239,68,68,0.35)',
          fontFamily: mono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '5px 11px',
          borderRadius: 999,
          boxShadow: '0 4px 20px rgba(239,68,68,0.2)',
        }}>Early Access</div>
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
        {price === 0 ? (
          <span style={{ fontFamily: display, fontSize: 48, fontWeight: 700, color: T.text, letterSpacing: '-0.025em', lineHeight: 1 }}>FREE</span>
        ) : (
          <>
            <span style={{ fontFamily: display, fontSize: 48, fontWeight: 700, color: T.text, letterSpacing: '-0.025em', lineHeight: 1 }}>${price}</span>
            <span style={{ fontSize: 14, color: T.textDim }}>/ month</span>
          </>
        )}
      </div>
      <div style={{ fontSize: 12, color: T.textFaint, fontFamily: mono, marginBottom: 16, height: 14 }}>
        {price === 0 ? 'forever — no card required' : annual ? `billed $${price * 12} annually` : ''}
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
      <p style={{ fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 12, fontFamily: sans }}>✓ 30-day money-back guarantee · No credit card required</p>
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
          Your competitors are<br />already on this.
        </h2>
        <p style={{ fontSize: 18, color: T.accent, margin: '0 0 32px', lineHeight: 1.6, fontWeight: 500 }}>
          Find your winning product before they do.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.22)',
          borderRadius: 999,
          color: '#a5b4fc',
          fontFamily: mono,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.03em',
          marginBottom: 24,
        }}>
          Early-access pricing — locked in for life of your subscription
        </div>
        <div className="mj-hero-cta" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 18 }}>
          <Link href="/sign-up" className="mj-btn-primary mj-shimmer-btn" style={{ height: 56, padding: '0 32px', fontSize: 16 }}>
            Find my first winning product →
          </Link>
          <a href="#pricing" className="mj-btn-secondary" style={{ height: 56, padding: '0 28px', fontSize: 15 }}>
            See pricing
          </a>
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', fontFamily: mono }}>
          Join 500+ operators · 30-day money-back · No credit card · Cancel anytime
        </div>
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
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          gap: 40,
          marginBottom: 48,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <img src="/majorka-logo.jpg" alt="Majorka" loading="lazy" style={{ height: 28, width: 'auto', display: 'block', borderRadius: 6 }} />
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
            { label: 'Operators', href: '/operators' },
          ]} />
          <FooterCol title="Free Tools" links={[
            { label: 'ROAS Calculator', href: '/tools/roas-calculator' },
            { label: 'Profit Calculator', href: '/tools/profit-calculator' },
            { label: 'Affiliates', href: '/affiliates' },
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

// ── Trust Bar ──────────────────────────────────────────────────────────────
function TrustBar() {
  const items = [
    { Icon: Database,    headline: '2,302+',    sub: 'Products tracked' },
    { Icon: Globe,       headline: '7 markets', sub: 'AU · US · UK · CA · NZ · DE · SG' },
    { Icon: ShieldCheck, headline: '30-day',    sub: 'Money-back guarantee' },
    { Icon: Zap,         headline: 'Live feed', sub: 'Updated every 6 hours' },
  ];
  return (
    <section style={{
      borderTop: `1px solid ${T.border}`,
      borderBottom: `1px solid ${T.border}`,
      background: '#0a0a0a',
      padding: '32px 24px',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 32,
        flexWrap: 'wrap',
      }}>
        {items.map((it) => {
          const Icon = it.Icon;
          return (
            <div key={it.sub} style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 200 }}>
              <div style={{
                width: 40, height: 40,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                flexShrink: 0,
              }}>
                <Icon size={18} color="#6366F1" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontFamily: display, fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>{it.headline}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: T.textDim, marginTop: 2 }}>{it.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Video placeholder ──────────────────────────────────────────────────────
function VideoPreview() {
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '96px 24px', background: '#0a0a0a' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <SectionHeader
          eyebrow="Walkthrough"
          line1="See Majorka"
          line2="in action."
          description="A full product walkthrough is coming soon. Early-access members will be the first to see it."
          align="center"
        />
        <div style={{
          maxWidth: 880,
          margin: '0 auto',
          background: T.bgSurface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          aspectRatio: '16 / 9',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 20,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'relative',
            width: 84, height: 84, borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)',
            border: '2px solid rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              width: 0, height: 0,
              borderLeft: '22px solid #a5b4fc',
              borderTop: '14px solid transparent',
              borderBottom: '14px solid transparent',
              marginLeft: 6,
            }} />
          </div>
          <div style={{ position: 'relative', fontFamily: mono, fontSize: 13, color: T.textDim, letterSpacing: '0.03em' }}>
            Product walkthrough coming soon — join to get early access
          </div>
        </div>
        <div style={{ marginTop: 28 }}>
          <Link href="/sign-up" style={{
            fontFamily: sans,
            fontSize: 14,
            color: '#6366F1',
            textDecoration: 'none',
            fontWeight: 500,
          }}>
            Create a free account to explore the dashboard →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Free entry point ───────────────────────────────────────────────────────
function FreeEntry() {
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '96px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
        <SectionHeader
          eyebrow="Try before you buy"
          line1="Explore 2,302 winning"
          line2="products — free."
          description="No account needed. Browse our live product database and see Majorka's AI scoring in action."
          align="center"
        />
        <Link href="/app" className="mj-btn-primary" style={{
          display: 'inline-flex',
          height: 56,
          padding: '0 32px',
          fontSize: 15,
          marginTop: 8,
        }}>
          Browse free products →
        </Link>
        <p style={{
          fontSize: 12,
          color: T.textFaint,
          fontFamily: mono,
          marginTop: 16,
          letterSpacing: '0.02em',
        }}>
          Create an account to save products, set alerts, and access all tools.
        </p>
      </div>
    </section>
  );
}

// ── Founder section ────────────────────────────────────────────────────────
function Founder() {
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '96px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{
          background: T.bgSurface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: 48,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent 0%, #6366F1 50%, transparent 100%)',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: display, fontWeight: 800, fontSize: 20, color: '#fff',
              letterSpacing: '-0.04em',
            }}>M</div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#6366F1', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                Our mission
              </div>
              <h3 style={{ fontFamily: display, fontSize: 26, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>
                Built for serious dropshippers
              </h3>
            </div>
          </div>
          <div style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.75 }}>
            <p style={{ margin: '0 0 18px' }}>
              Majorka exists because the existing product research tools were built for the US market first and retrofitted for everyone else. As Australian operators, we were tired of converting prices, second-guessing supplier lead times, and manually cross-checking Shopify apps that didn't understand GST or Afterpay.
            </p>
            <p style={{ margin: '0 0 18px' }}>
              So we built the platform we wanted: one subscription, seven markets, live AliExpress intelligence, AI scoring, and a store builder that actually pushes to Shopify. Real data. Real tools. No dashboards full of stats that don't matter.
            </p>
            <p style={{ margin: '0 0 24px' }}>
              We're starting with the markets we know — Australia, US, UK, Canada, NZ, Germany, Singapore — and expanding as operators join us. If you're serious about dropshipping in 2026, Majorka is the system you wish existed.
            </p>
            <p style={{
              margin: 0,
              fontFamily: mono,
              fontSize: 13,
              color: T.textFaint,
              letterSpacing: '0.03em',
            }}>
              — The Majorka Team · Gold Coast, Australia
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Home() {
  const isMobile = useIsMobile();
  void isMobile;
  const [annual, setAnnual] = useState(false);

  // Nuclear void failsafe — runs on mount and after 2s. Walks every element
  // in <main> and if computed opacity is 0 (with no legitimate reason)
  // forces it back to 1. This is the last line of defence against any
  // third-party script, animation, or stray CSS class that could hide
  // content below the fold.
  useEffect(() => {
    function forceVisible() {
      if (typeof document === 'undefined') return;
      const root = document.querySelector('[data-majorka-landing]');
      if (!root) return;
      root.querySelectorAll<HTMLElement>('*').forEach((el) => {
        // Keep intentional zero-opacity decorations working.
        if (el.closest('.mj-shimmer-btn') || el.classList.contains('mj-pulse-dot')) return;
        const cs = window.getComputedStyle(el);
        if (cs.opacity === '0') {
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
        }
      });
    }
    forceVisible();
    const t1 = window.setTimeout(forceVisible, 500);
    const t2 = window.setTimeout(forceVisible, 2000);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, []);

  return (
    <div data-majorka-landing style={{
      background: T.bg,
      color: T.text,
      fontFamily: sans,
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      margin: 0,
      padding: 0,
      border: 0,
    }}>
      <SEO
        title="Majorka — The Ecommerce Operating System for Serious Operators"
        description="2,302 winning products. Real AliExpress data. AI-scored rankings across 7 markets — AU, US, UK, CA, NZ, DE, SG."
        path="/"
        ogImage="/og-image.svg"
      />
      <style>{STYLES}</style>
      <AnnouncementBanner />
      <SocialProofToasts />
      <div style={{ paddingTop: 36 }} />
      <Nav />
      <Hero />
      <TrustBar />
      <VideoPreview />
      <LiveTicker />
      <Stats />
      <PartnerBar />

      <ThePlatform />
      <RevenueProofBanner />

      <Comparison />
      <Markets />
      <Workflow />
      <Testimonials />
      <Founder />
      <FreeEntry />
      <Pricing annual={annual} setAnnual={setAnnual} />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
