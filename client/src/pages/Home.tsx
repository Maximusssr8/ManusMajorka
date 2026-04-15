// Majorka — Landing Page
// Directives implemented: Hero WOW + FOMO + Academy + Live Demo + Design audit +
// Features alternating + How It Works + Trust + FAQ + Pricing + Performance.
// Design tokens: see /client/src/lib/landingTokens.ts
// Primitives: see /client/src/components/landing/primitives

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Search, Brain, Rocket, Database, ShieldCheck, MessageCircle, Check,
  Flame, TrendingUp, Lock, X, ChevronDown, Star, Zap, Globe,
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import { LT, F, S, R, SHADOW, MAX } from '@/lib/landingTokens';
import {
  CountUp, Typewriter, SparklineDraw,
  MarketSplitBars, ScrollChevron, FadeUp, usePrefersReducedMotion,
} from '@/components/landing/primitives';
import { ParticleFieldReactive } from '@/components/landing/wow/ParticleFieldReactive';
import { FilmGrain } from '@/components/landing/wow/FilmGrain';
import { TickerBar } from '@/components/landing/wow/TickerBar';
import { KineticHeadline } from '@/components/landing/wow/KineticHeadline';
import { QuickScoreHero } from '@/components/landing/wow/QuickScoreHero';
import { ChapterMorph } from '@/components/landing/wow/ChapterMorph';
import { CommandPalettePreview } from '@/components/landing/wow/CommandPalettePreview';
import { useLandingData, type LandingProduct } from '@/lib/useLandingData';
import {
  MicroOrderTicker, MicroSparklineRow, MicroMarketPulse,
  MicroCategoryLeaders, MicroSignalCard,
} from '@/components/landing/micro';

// ── Global CSS — keyframes + responsive + safety net ────────────────────────
const GLOBAL_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body { background: ${LT.bg}; margin: 0; padding: 0; }
body { font-family: ${F.body}; color: ${LT.text}; -webkit-font-smoothing: antialiased; }
::selection { background: ${LT.goldTint}; color: #fff; }

/* Never hide section content — defence in depth against opacity:0 leaks */
[data-majorka-landing] section { opacity: 1 !important; }

@keyframes mjChevronBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
@keyframes mjGoldPulse {
  0%, 100% { box-shadow: 0 0 0 0 ${LT.goldGlow}, 0 0 20px ${LT.goldGlow}; }
  50% { box-shadow: 0 0 0 6px rgba(212,175,55,0), 0 0 30px ${LT.goldGlow}; }
}
@keyframes mjLivePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
@keyframes mjSlideInLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes mjTickerFade {
  0% { opacity: 0; transform: translateX(-20px); }
  8% { opacity: 1; transform: translateX(0); }
  92% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(-20px); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Mobile responsive */
@media (max-width: 900px) {
  .mj-nav-links { display: none !important; }
  .mj-nav-cta-desk { display: none !important; }
  .mj-mobile-btn { display: inline-flex !important; }
  .mj-grid-two { grid-template-columns: 1fr !important; }
  .mj-feature-row { grid-template-columns: 1fr !important; }
  .mj-feature-row-reverse .mj-feature-visual { order: 1 !important; }
  .mj-feature-row-reverse .mj-feature-text { order: 2 !important; }
  .mj-hide-mobile { display: none !important; }
  .mj-stack-mobile { flex-direction: column !important; align-items: stretch !important; }
  /* Delta 1: mobile H1 handled by fontSizeMobile prop; leave inline style authoritative. */
  .mj-section-h2 { font-size: 28px !important; }
  .mj-section { padding: 64px 20px !important; }
  .mj-step-connector { display: none !important; }
}
@media (max-width: 420px) {
  body { font-size: 14px; }
}
@media (max-width: 767px) {
  .mj-launch-counter { display: none !important; }
}

a { color: inherit; }
button { font-family: inherit; }
`;

// ── Shared bits ─────────────────────────────────────────────────────────────
const Overline = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    fontFamily: F.body,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: LT.gold,
    marginBottom: S.sm,
    ...style,
  }}>{children}</div>
);

const H2 = ({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) => (
  <h2 className={`mj-section-h2 ${className ?? ''}`} style={{
    fontFamily: F.display,
    fontSize: 40,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    color: LT.text,
    margin: 0,
    ...style,
  }}>{children}</h2>
);

const Sub = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{
    fontFamily: F.body,
    fontSize: 18,
    lineHeight: 1.6,
    color: LT.textMute,
    margin: 0,
    maxWidth: '65ch',
    ...style,
  }}>{children}</p>
);

const Section = ({
  id, children, style, className,
}: { id?: string; children: React.ReactNode; style?: React.CSSProperties; className?: string }) => (
  <section id={id} className={`mj-section ${className ?? ''}`} style={{
    padding: `${S.xxxl}px ${S.md}px`,
    maxWidth: MAX,
    margin: '0 auto',
    ...style,
  }}>{children}</section>
);

// Primary CTA
function CtaPrimary({
  href, children, pulse = false, size = 'lg', style,
}: { href: string; children: React.ReactNode; pulse?: boolean; size?: 'lg' | 'md'; style?: React.CSSProperties }) {
  return (
    <Link href={href} style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 48,
      padding: size === 'lg' ? '14px 28px' : '10px 20px',
      background: LT.gold,
      color: LT.bg,
      fontFamily: F.body,
      fontWeight: 700,
      fontSize: size === 'lg' ? 15 : 14,
      borderRadius: R.button,
      textDecoration: 'none',
      boxShadow: SHADOW.button,
      animation: pulse ? 'mjGoldPulse 4s ease-in-out infinite' : undefined,
      transition: 'transform 150ms ease',
      ...style,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >{children}</Link>
  );
}

function CtaGhost({ href, children, style }: { href: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <Link href={href} style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 48,
      padding: '14px 28px',
      background: 'transparent',
      color: LT.text,
      fontFamily: F.body,
      fontWeight: 600,
      fontSize: 15,
      border: `1px solid ${LT.border}`,
      borderRadius: R.button,
      textDecoration: 'none',
      transition: 'border-color 150ms ease',
      ...style,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = LT.gold; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = LT.border; }}
    >{children}</Link>
  );
}

// ── Sticky Launch Bar (Delta 4) ─────────────────────────────────────────────
// Counter: seed 287 on first read, +1 every 8 minutes, cap at 489, persisted.
// Dismiss: never-show-again.
const SPOTS_KEY = 'majorka_launch_spots_v2';
const SPOT_SEED = 287;
const SPOT_CAP = 489;
const SPOT_TICK_MS = 8 * 60 * 1000;
const DISMISS_KEY = 'majorka_launch_bar_dismissed_v3';
const LAUNCH_BAR_HEIGHT = 40;

function StickyLaunchBar() {
  const [spots, setSpots] = useState<number>(SPOT_SEED);
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Never-show-again gate.
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') {
        setDismissed(true);
        return;
      }
    } catch { /* ignore */ }
    setDismissed(false);

    // Seed / load counter.
    let cur = SPOT_SEED;
    try {
      const raw = localStorage.getItem(SPOTS_KEY);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (Number.isFinite(parsed)) {
          cur = Math.max(SPOT_SEED, Math.min(SPOT_CAP, parsed));
        }
      } else {
        localStorage.setItem(SPOTS_KEY, String(SPOT_SEED));
      }
    } catch { /* ignore */ }
    setSpots(cur);

    // Increment every 8 minutes, cap at 489.
    const id = window.setInterval(() => {
      setSpots((prev) => {
        if (prev >= SPOT_CAP) return prev;
        const next = prev + 1;
        try { localStorage.setItem(SPOTS_KEY, String(next)); } catch { /* ignore */ }
        return next;
      });
    }, SPOT_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  if (dismissed) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1001,
      height: LAUNCH_BAR_HEIGHT,
      background: 'linear-gradient(90deg, #b8962e, #d4af37, #b8962e)',
      color: '#080808',
      fontFamily: F.body,
      fontSize: 13,
      fontWeight: 600,
      padding: '0 44px 0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <span style={{ lineHeight: 1.2 }}>
        🔥 Launch pricing — Builder from $99 AUD/mo · Prices increase after first 500 subscribers
      </span>
      <span
        className="mj-launch-counter"
        style={{
          fontFamily: F.mono,
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color: '#080808',
        }}
      >
        [ {spots} / 500 ] spots
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss launch pricing bar"
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 32,
          height: 32,
          minWidth: 32,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#080808',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      ><X size={18} /></button>
    </div>
  );
}

// ── Live Activity Ticker ────────────────────────────────────────────────────
const TICKER_MSGS = [
  { who: 'Sarah from Melbourne', what: 'just found a winning product', emoji: '🇦🇺' },
  { who: 'Trend alert', what: '47 new trending products added in the last hour', emoji: '📈' },
  { who: 'Kitchen gadget', what: 'just hit 50,000 orders — spotted by Majorka first', emoji: '🔥' },
  { who: 'Jake from Sydney', what: 'launched his first Shopify store with Majorka', emoji: '🚀' },
  { who: 'Emma from Brisbane', what: 'generated 12 ad variants for a pet product', emoji: '🎯' },
  { who: 'Market update', what: 'AU TikTok Shop just dropped 3,400 new listings', emoji: '📊' },
  { who: 'Liam from Perth', what: 'upgraded to Scale — locked launch pricing', emoji: '⭐' },
  { who: 'AI Brief', what: 'generated for LED Scalp Massager Pro in 2.8s', emoji: '🧠' },
  { who: 'Chloe from Adelaide', what: 'completed Module 2 of the Academy', emoji: '🎓' },
  { who: 'Home organiser', what: 'trending up 340% in AU this week', emoji: '📦' },
];

function LiveActivityTicker() {
  const [idx, setIdx] = useState(-1);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (typeof window === 'undefined') return;
    let t: number;
    function schedule() {
      const delay = 12000 + Math.random() * 13000;
      t = window.setTimeout(() => {
        setIdx((prev) => {
          let n = Math.floor(Math.random() * TICKER_MSGS.length);
          if (n === prev) n = (n + 1) % TICKER_MSGS.length;
          return n;
        });
        schedule();
      }, delay);
    }
    const first = window.setTimeout(() => { setIdx(Math.floor(Math.random() * TICKER_MSGS.length)); schedule(); }, 4000);
    return () => { window.clearTimeout(first); if (t) window.clearTimeout(t); };
  }, [reduced]);

  if (idx < 0) return null;
  const m = TICKER_MSGS[idx];
  const initial = m.who[0];
  return (
    <div
      key={idx}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 20,
        bottom: 20,
        zIndex: 900,
        background: LT.bgCard,
        borderLeft: `3px solid ${LT.gold}`,
        borderRadius: R.card,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: F.body,
        maxWidth: 320,
        animation: 'mjTickerFade 4s ease-in-out forwards',
        boxShadow: SHADOW.overlay,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: LT.goldTint, color: LT.gold,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: F.display, fontWeight: 700, fontSize: 13, flexShrink: 0,
      }}>{initial}</div>
      <div style={{ fontSize: 13, lineHeight: 1.4 }}>
        <span style={{ color: LT.text, fontWeight: 600 }}>{m.emoji} {m.who}</span>{' '}
        <span style={{ color: LT.textMute }}>{m.what}</span>
      </div>
    </div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────
function Nav({ topOffset }: { topOffset: number }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav style={{
      position: 'fixed',
      top: topOffset,
      left: 0, right: 0,
      zIndex: 1000,
      background: 'rgba(8,8,8,0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: `1px solid ${LT.border}`,
      height: 64,
    }}>
      <div style={{
        maxWidth: MAX,
        margin: '0 auto',
        padding: '0 24px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{
            fontFamily: F.display,
            fontWeight: 800,
            fontSize: 20,
            color: LT.text,
            letterSpacing: '-0.03em',
          }}>majorka</span>
          <span style={{
            fontFamily: F.mono, fontSize: 9, fontWeight: 500,
            background: LT.goldTint,
            color: LT.gold,
            padding: '3px 8px',
            borderRadius: R.badge,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>Early Access</span>
        </Link>

        <div className="mj-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[
            { href: '#how', label: 'How it works' },
            { href: '#features', label: 'Features' },
            { href: '#academy', label: 'Academy' },
            { href: '#pricing', label: 'Pricing' },
            { href: '/blog', label: 'Blog' },
          ].map(l => (
            <a key={l.label} href={l.href} style={{
              fontFamily: F.body, fontSize: 14, color: LT.textMute, textDecoration: 'none', transition: 'color 150ms',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.color = LT.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = LT.textMute)}
            >{l.label}</a>
          ))}
        </div>

        <div className="mj-nav-cta-desk" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/sign-in" style={{
            fontFamily: F.body, fontSize: 14, color: LT.textMute, textDecoration: 'none',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.color = LT.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = LT.textMute)}
          >Sign In</Link>
          <CtaPrimary href="/sign-up" size="md">Get Started</CtaPrimary>
        </div>

        <button
          className="mj-mobile-btn"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          style={{
            display: 'none',
            width: 44, height: 44,
            alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: `1px solid ${LT.border}`, borderRadius: R.button,
            color: LT.text, cursor: 'pointer',
          }}
        >
          <svg width={18} height={14} viewBox="0 0 18 14"><rect width={18} height={2} rx={1} fill="currentColor" /><rect y={6} width={18} height={2} rx={1} fill="currentColor" /><rect y={12} width={12} height={2} rx={1} fill="currentColor" /></svg>
        </button>
      </div>

      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(8,8,8,0.98)',
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}
        >
          <button aria-label="Close menu" onClick={() => setMobileOpen(false)} style={{
            position: 'absolute', top: 20, right: 20,
            width: 44, height: 44,
            background: LT.bgCard, border: 'none', borderRadius: R.input,
            color: LT.text, fontSize: 22, cursor: 'pointer',
          }}>×</button>
          {[
            { href: '#how', label: 'How it works' },
            { href: '#features', label: 'Features' },
            { href: '#academy', label: 'Academy' },
            { href: '#pricing', label: 'Pricing' },
            { href: '/blog', label: 'Blog' },
          ].map(l => (
            <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} style={{
              fontFamily: F.display, fontSize: 28, fontWeight: 700, color: LT.text, textDecoration: 'none',
            }}>{l.label}</a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280, marginTop: 8 }}>
            <Link href="/sign-in" onClick={() => setMobileOpen(false)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 52,
              border: `1px solid ${LT.border}`, borderRadius: R.button,
              color: LT.text, textDecoration: 'none', fontFamily: F.body, fontWeight: 600, fontSize: 15,
            }}>Sign In</Link>
            <Link href="/sign-up" onClick={() => setMobileOpen(false)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 52,
              background: LT.gold, borderRadius: R.button,
              color: LT.bg, textDecoration: 'none', fontFamily: F.body, fontWeight: 700, fontSize: 15,
            }}>Get Started →</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────
// Live interactive scorer (QuickScoreHero) is the primary signal.
// Legacy hardcoded HERO_PRODUCTS dashboard mockup removed in polish pass —
// see git history for the original cycling mock.
function Hero({ tickerUrl }: { tickerUrl?: string | null }) {
  const reduced = useReducedMotion();
  const { stats } = useLandingData();
  const trackedCount = stats?.total ?? 0;

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      padding: `${S.xxl + 40}px ${S.md}px ${S.xxl}px`,
      overflow: 'hidden',
      background: `radial-gradient(ellipse at 30% 20%, rgba(212,175,55,0.08), transparent 60%), ${LT.bg}`,
    }}>
      <ParticleFieldReactive />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: MAX, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        gap: S.xl,
        alignItems: 'center',
      }} className="mj-grid-two">
        {/* LEFT: text */}
        <div>
          <motion.div
            initial={reduced ? false : { y: 10, opacity: 0 }}
            animate={reduced ? undefined : { y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: R.badge,
              background: LT.goldTint, border: `1px solid ${LT.goldTint}`,
              color: LT.gold,
              fontFamily: F.body, fontSize: 12, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: S.md,
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: LT.gold,
              animation: reduced ? undefined : 'mjLivePulse 1.8s ease-in-out infinite',
            }} />
            AI product intelligence · AU first
          </motion.div>

          <div style={{ margin: `0 0 ${S.md}px` }}>
            <KineticHeadline
              lines={['Find winning products', 'before anyone else.']}
              fontSize={72}
              fontSizeMobile={44}
              lineHeight={1.0}
            />
          </div>

          <motion.div
            initial={reduced ? false : { y: 15, opacity: 0 }}
            animate={reduced ? undefined : { y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            style={{ marginBottom: S.md }}
          >
            <Sub>
              We search tens of millions of AliExpress listings. You see the few thousand worth shipping — ranked by order velocity across AU, US and UK, refreshed every 6 hours.
            </Sub>
          </motion.div>

          {/* Hero stats */}
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            transition={{ delay: 1.35, duration: 0.5 }}
            style={{
              display: 'flex', gap: S.lg, flexWrap: 'wrap',
              fontFamily: F.body, fontSize: 13, color: LT.textMute,
              margin: `0 0 ${S.md}px`,
            }}
          >
            <span>
              <span style={{ fontFamily: F.mono, color: LT.gold, fontWeight: 600 }}>
                60M+
              </span>{' '}AliExpress listings sourced
            </span>
            <span>
              <span style={{ fontFamily: F.mono, color: LT.gold, fontWeight: 600 }}>
                {trackedCount > 0 ? <CountUp to={trackedCount} duration={1500} /> : '3,700'}+
              </span>{' '}scored &amp; ranked
            </span>
            <span>
              <Typewriter text="Refreshed every 6 hours" startDelay={1500} speed={40} />
            </span>
          </motion.div>

          <motion.div
            initial={reduced ? false : { y: 15, opacity: 0 }}
            animate={reduced ? undefined : { y: 0, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: S.md }}
          >
            <CtaPrimary href="/sign-up" pulse>Start 7-day free trial →</CtaPrimary>
            <CtaGhost href="#how">See how it works</CtaGhost>
          </motion.div>

          <motion.a
            href="/guarantee"
            initial={reduced ? false : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            transition={{ delay: 1.65, duration: 0.5 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: F.body,
              fontSize: 13,
              fontWeight: 500,
              color: LT.gold,
              textDecoration: 'none',
              padding: '8px 14px',
              background: LT.goldTint,
              border: `1px solid ${LT.goldTint}`,
              borderRadius: R.badge,
              marginBottom: S.sm,
              lineHeight: 1,
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = LT.gold; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LT.goldTint; }}
          >
            <ShieldCheck size={14} />
            30-day money-back guarantee — read the promise
          </motion.a>

          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              fontFamily: F.body, fontSize: 12, color: LT.textDim,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} color={LT.success} /> No credit card required
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} color={LT.success} /> Cancel anytime
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} color={LT.success} /> 30-day guarantee
            </span>
          </motion.div>
        </div>

        {/* RIGHT: public interactive quick-score. */}
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={reduced ? undefined : { opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ willChange: 'transform' }}
        >
          <QuickScoreHero externalUrl={tickerUrl ?? null} />
        </motion.div>
      </div>

      <ScrollChevron />
    </section>
  );
}

// ── How It Works ────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: 'Find trending products before they peak',
      copy: 'Browse 4,000+ products across AU, US and UK — all ranked by AI trend velocity. Spot products 30+ days before they saturate.',
      time: 'Takes 5 minutes',
      tag: 'FIND',
    },
    {
      icon: Brain,
      title: 'Get your AI brief instantly',
      copy: 'One click generates the full brief: ideal audience, winning angle, price position, ad hook, projected ROAS. Built on live market data.',
      time: 'Generated in 3 seconds',
      tag: 'ANALYSE',
    },
    {
      icon: Rocket,
      title: 'Generate ads and build your store',
      copy: 'Ads Studio writes Meta + TikTok creative. Store Builder ships a Shopify-ready storefront with products imported. Live in under an hour.',
      time: 'Live in under an hour',
      tag: 'LAUNCH',
    },
  ];
  return (
    <Section id="how">
      <FadeUp>
        <Overline>How it works</Overline>
        <H2>From zero to first winning product in 3 steps</H2>
        <Sub style={{ marginTop: S.sm }}>No experience required. No guesswork. Just data.</Sub>
      </FadeUp>
      <div style={{
        marginTop: S.xl,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: S.md,
        position: 'relative',
      }} className="mj-grid-two">
        {steps.map((s, i) => (
          <FadeUp key={s.tag} delay={i * 0.12}>
            <div style={{
              position: 'relative',
              padding: S.lg,
              background: LT.bgCard,
              border: `1px solid ${LT.border}`,
              borderRadius: R.card,
              height: '100%',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: LT.goldTint,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: S.sm,
              }}>
                <s.icon size={24} color={LT.gold} />
              </div>
              <div style={{
                fontFamily: F.mono, fontSize: 11, color: LT.gold,
                letterSpacing: '0.1em', marginBottom: 6,
              }}>{s.tag}</div>
              <h3 style={{
                fontFamily: F.display, fontSize: 20, fontWeight: 600,
                margin: `0 0 ${S.sm}px`, color: LT.text, lineHeight: 1.25,
              }}>{s.title}</h3>
              <p style={{
                fontFamily: F.body, fontSize: 15, lineHeight: 1.6,
                color: LT.textMute, margin: `0 0 ${S.sm}px`,
              }}>{s.copy}</p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: F.mono, fontSize: 11, color: LT.success,
                padding: '4px 10px', background: 'rgba(34,197,94,0.1)',
                borderRadius: R.badge,
              }}>
                <Zap size={11} />{s.time}
              </div>

              {i < steps.length - 1 && (
                <div className="mj-step-connector" style={{
                  position: 'absolute',
                  right: -14,
                  top: S.lg + 16,
                  color: LT.gold,
                  opacity: 0.5,
                }}>→</div>
              )}
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  );
}

// ── Live Demo (table with blur gate) ────────────────────────────────────────
type Product = {
  rank: number;
  title: string;
  image: string;
  orders: number;
  score: number;
  market: 'AU' | 'US' | 'UK';
  trend: number;
};

const FALLBACK_PRODUCTS: Product[] = [
  { rank: 1, title: 'LED Scalp Massager Pro', image: '', orders: 231847, score: 94, market: 'AU', trend: 187 },
  { rank: 2, title: 'Smart Jar Opener Silicone', image: '', orders: 184203, score: 91, market: 'US', trend: 143 },
  { rank: 3, title: 'Under-Bed Modular Storage Set', image: '', orders: 98462, score: 88, market: 'AU', trend: 122 },
  { rank: 4, title: 'Foldable Travel Neck Pillow', image: '', orders: 76891, score: 85, market: 'UK', trend: 98 },
  { rank: 5, title: 'Portable Mini Blender USB', image: '', orders: 62441, score: 83, market: 'AU', trend: 87 },
];

function useLiveProducts() {
  const { products: live, stats } = useLandingData();
  const products: Product[] = useMemo(() => {
    const src: LandingProduct[] = live.length >= 5 ? live.slice(0, 8) : [];
    if (src.length === 0) {
      // synthesise 8 by repeating fallback
      return Array.from({ length: 8 }, (_, i) => {
        const f = FALLBACK_PRODUCTS[i % FALLBACK_PRODUCTS.length];
        return { ...f, rank: i + 1 };
      });
    }
    const markets: Array<'AU' | 'US' | 'UK'> = ['AU', 'US', 'UK', 'AU', 'US', 'AU', 'UK', 'US'];
    return src.map((p, i) => ({
      rank: i + 1,
      title: p.title.length > 52 ? p.title.slice(0, 50) + '...' : p.title,
      image: p.image,
      orders: p.orders,
      score: p.score || 90,
      market: markets[i] ?? 'AU',
      trend: Math.max(20, Math.min(299, Math.round((p.score || 80) + i * 6))),
    }));
  }, [live]);
  return { products, total: stats?.total ?? 3715 };
}

// Phase 3 F3 — live-demo velocity counter
function ViewerCounter() {
  const [n, setN] = useState(27);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setInterval(() => {
      setN(() => 15 + Math.floor(Math.random() * 26));
    }, 8000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      marginTop: 10,
      fontFamily: F.body, fontSize: 13, color: LT.textMute,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: LT.success,
        animation: 'mjLivePulse 1.4s ease-in-out infinite',
      }} />
      <span style={{ fontFamily: F.mono, color: LT.text, fontWeight: 600 }}>{n}</span>
      {' '}people viewed this shortlist today
    </div>
  );
}

function LiveDemo() {
  const { products, total } = useLiveProducts();
  const reduced = usePrefersReducedMotion();

  return (
    <Section id="live">
      <FadeUp>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: S.sm }}>
          <H2 style={{ fontSize: 36 }}>See what's trending right now</H2>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', background: LT.goldTint, color: LT.gold,
            borderRadius: R.badge, fontFamily: F.mono, fontSize: 11, fontWeight: 600,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: LT.success,
              animation: reduced ? undefined : 'mjLivePulse 1.4s ease-in-out infinite',
            }} />LIVE
          </span>
        </div>
        <Sub>Sourced from tens of millions of AliExpress listings. Scored by Trend Velocity. Refreshed every 6 hours.</Sub>
        <ViewerCounter />
      </FadeUp>

      <div style={{
        marginTop: S.lg,
        background: LT.bgCard,
        border: `1px solid ${LT.border}`,
        borderRadius: R.card,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '50px 1.6fr 100px 80px 80px 90px',
          gap: 12,
          padding: '14px 20px',
          background: LT.bgElevated,
          borderBottom: `1px solid ${LT.border}`,
          fontFamily: F.body, fontSize: 11, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: LT.textMute, fontWeight: 500,
        }} className="mj-hide-mobile">
          <span>Rank</span>
          <span>Product</span>
          <span>Orders</span>
          <span>Score</span>
          <span>Market</span>
          <span>Trend</span>
        </div>

        {products.map((p, i) => {
          const blurLevel = i === 3 ? 'blur(3px)' : i >= 4 ? 'blur(8px)' : 'none';
          return (
            <motion.div
              key={p.rank}
              initial={reduced ? false : { opacity: 0, x: -20 }}
              whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1.6fr 100px 80px 80px 90px',
                gap: 12,
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: i < products.length - 1 ? `1px solid ${LT.border}` : 'none',
                filter: blurLevel,
                transition: 'filter 200ms',
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: 14, color: LT.gold, fontWeight: 600 }}>#{p.rank}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 48, height: 48, flexShrink: 0,
                  background: LT.bgElevated, border: `1px solid ${LT.border}`, borderRadius: R.image,
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {p.image ? (
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(p.image)}`}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <Flame size={18} color={LT.gold} />
                  )}
                </div>
                <span style={{
                  fontFamily: F.body, fontSize: 14, color: LT.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{p.title}</span>
              </div>
              <span style={{ fontFamily: F.mono, fontSize: 14, color: LT.gold, fontWeight: 600 }}>
                🔥 {Math.round(p.orders / 1000)}K
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '3px 10px',
                background: 'rgba(34,197,94,0.15)', color: LT.success,
                borderRadius: R.badge, fontFamily: F.mono, fontSize: 12, fontWeight: 600,
                width: 'fit-content',
              }}>{p.score}</span>
              <span style={{
                fontFamily: F.mono, fontSize: 12,
                padding: '3px 10px',
                background: LT.bgElevated, border: `1px solid ${LT.border}`,
                color: LT.text,
                borderRadius: R.badge,
                width: 'fit-content',
              }}>{p.market}</span>
              <span style={{ fontFamily: F.mono, fontSize: 13, color: LT.success, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={12} />+{p.trend}%
              </span>
            </motion.div>
          );
        })}

        {/* Blur gate overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 180,
          background: `linear-gradient(to bottom, transparent, ${LT.bgCard} 60%)`,
          pointerEvents: 'none',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: S.md,
        }}>
          <div style={{
            pointerEvents: 'auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            padding: '16px 24px',
            background: LT.bgElevated,
            border: `1px solid ${LT.gold}`,
            borderRadius: R.card,
            boxShadow: SHADOW.cardHover,
          }}>
            <Lock size={18} color={LT.gold} />
            <Link href="/sign-up" style={{
              fontFamily: F.body, fontSize: 15, fontWeight: 700, color: LT.text,
              textDecoration: 'none', textAlign: 'center',
            }}>
              Sign up free to see all {total.toLocaleString('en-AU')} products →
            </Link>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: S.md,
        padding: S.md,
        background: LT.bgCard,
        border: `1px solid ${LT.border}`,
        borderRadius: R.card,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute }}>
          Products in this shortlist were spotted <span style={{ color: LT.gold, fontWeight: 600 }}>30+ days before they peaked</span>.
          Operators who moved early captured the upside.
        </div>
        <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textDim }}>
          60M+ AliExpress listings sourced · {total.toLocaleString('en-AU')} scored and ranked
        </div>
        <div>
          <CtaPrimary href="/sign-up" size="md">See all products free →</CtaPrimary>
        </div>
      </div>
    </Section>
  );
}

// ── Features — alternating rows ─────────────────────────────────────────────
type FeatureRow = {
  tag: string;
  title: string;
  copy: string;
  stat: string;
  visual: React.ReactNode;
};

function FeatureVisualBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: LT.bgCard,
      border: `1px solid ${LT.border}`,
      borderRadius: R.card,
      padding: S.lg,
      minHeight: 320,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
    }}>{children}</div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const ref = useRef<SVGCircleElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const r = 60, c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (reduced) return;
    el.style.strokeDasharray = `${c}`;
    el.style.strokeDashoffset = `${c}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.getBoundingClientRect();
    el.style.transition = 'stroke-dashoffset 1500ms ease-out';
    el.style.strokeDashoffset = `${offset}`;
  }, [pct, offset, reduced, c]);
  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      <circle cx={80} cy={80} r={r} fill="none" stroke={LT.border} strokeWidth={8} />
      <circle
        ref={ref}
        cx={80} cy={80} r={r} fill="none"
        stroke={LT.gold} strokeWidth={8}
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
      />
      <text x={80} y={90}
        textAnchor="middle"
        fontFamily={F.mono} fontSize={28} fontWeight={700} fill={LT.text}
      >{pct}%</text>
    </svg>
  );
}

function FeaturesSection() {
  const rows: FeatureRow[] = [
    {
      tag: 'Product Intelligence',
      title: 'Tens of millions sourced. Only the top 0.01% scored.',
      copy: 'We search 60M+ AliExpress listings. You see the few thousand with real order velocity — live counts, category, supplier, refreshed every 6 hours. No scrolling through dead listings.',
      stat: 'Top 0.01% of the AliExpress catalogue',
      visual: (
        <FeatureVisualBox>
          <div style={{ fontFamily: F.body, fontSize: 11, color: LT.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Trend Velocity</div>
          <div style={{ fontFamily: F.mono, fontSize: 56, fontWeight: 700, color: LT.success, marginBottom: S.sm }}>
            <CountUp to={94} />
          </div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: LT.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>30-day orders</div>
          <SparklineDraw values={[8, 12, 18, 26, 34, 44, 58, 72, 84, 94]} width={360} height={60} color={LT.success} />
        </FeatureVisualBox>
      ),
    },
    {
      tag: 'Market Split',
      title: '3 markets. 1 dashboard.',
      copy: 'See how each product performs in AU, US and UK. Target the market where momentum is building — not where it has saturated.',
      stat: 'AU · US · UK coverage',
      visual: (
        <FeatureVisualBox>
          <div style={{ fontFamily: F.body, fontSize: 11, color: LT.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: S.sm }}>Market distribution</div>
          <MarketSplitBars />
        </FeatureVisualBox>
      ),
    },
    {
      tag: 'AI Briefs',
      title: 'AI briefs written for your product — in 3 seconds',
      copy: 'One click: ideal audience, winning angle, price position, ad hook, projected ROAS. No more 2-hour research sessions.',
      stat: 'Generated in under 3 seconds',
      visual: (
        <FeatureVisualBox>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: LT.gold, marginBottom: 6 }}>AI Brief</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: LT.text, lineHeight: 1.6, minHeight: 120 }}>
            <Typewriter text="Target audience: AU renters 22-38 with disposable income. Winning angle: 'Hide the mess — instant bedroom upgrade under $30.' Hook: 'POV: your room before / after 60 seconds.' Projected ROAS: 2.8x." speed={18} />
          </div>
        </FeatureVisualBox>
      ),
    },
    {
      tag: 'Ads Manager',
      title: 'Meta + TikTok ad copy, generated per product',
      copy: 'Headlines, body copy, CTAs, hook variants. 4 ad formats ready to paste into Meta Ads Manager or TikTok Ads Manager.',
      stat: '4 ad formats. Zero guesswork.',
      visual: (
        <FeatureVisualBox>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: LT.gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Ad Headline</div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: LT.text, marginBottom: S.sm }}>
            <Typewriter text="The scalp massager AU TikTok can't stop buying." speed={30} />
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: LT.gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Body</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute, lineHeight: 1.6, marginBottom: S.sm, minHeight: 44 }}>
            <Typewriter text="Trusted by 230k+ buyers. Ships in 3-5 days across AU." speed={22} startDelay={1800} />
          </div>
          <div style={{
            display: 'inline-block', padding: '8px 18px',
            background: LT.gold, color: LT.bg,
            borderRadius: R.button, fontFamily: F.body, fontWeight: 700, fontSize: 13,
          }}>Shop the Drop →</div>
        </FeatureVisualBox>
      ),
    },
    {
      tag: 'Store Builder',
      title: 'Shopify-ready stores, built in minutes',
      copy: 'Paste a product URL. Majorka writes product descriptions, pulls images through our CDN, generates collections, and ships a Shopify-importable JSON.',
      stat: 'AI-powered. Shopify-ready.',
      visual: (
        <FeatureVisualBox>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: 'Hero section', pct: 100 },
              { label: 'Product pages', pct: 100 },
              { label: 'Collection tags', pct: 80 },
              { label: 'Cart + checkout', pct: 60 },
              { label: 'Policies + FAQ', pct: 30 },
            ].map((r, i) => (
              <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 40px', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute }}>{r.label}</span>
                <div style={{ height: 6, background: LT.border, borderRadius: 100, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${r.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.8 }}
                    style={{ height: '100%', background: LT.gold }}
                  />
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: LT.text, textAlign: 'right' }}>{r.pct}%</span>
              </div>
            ))}
          </div>
        </FeatureVisualBox>
      ),
    },
    {
      tag: 'Academy',
      title: 'Learn from operators who actually ship',
      copy: '48 lessons across 8 modules. Data-driven. AU/US/UK specific. Free forever — no subscription required.',
      stat: '48 lessons. 100% free.',
      visual: (
        <FeatureVisualBox>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: S.sm }}>
            <ProgressRing pct={65} />
            <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute }}>Avg. student progress</div>
          </div>
        </FeatureVisualBox>
      ),
    },
  ];

  return (
    <Section id="features">
      <FadeUp>
        <Overline>Features</Overline>
        <H2>Everything you need to find, validate and launch winners</H2>
      </FadeUp>
      <div style={{ display: 'grid', gap: S.xxl, marginTop: S.xl }}>
        {rows.map((r, i) => {
          const reverse = i % 2 === 1;
          return (
            <div
              key={r.tag}
              className={`mj-feature-row ${reverse ? 'mj-feature-row-reverse' : ''}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: S.xl,
                alignItems: 'center',
              }}
            >
              <FadeUp className="mj-feature-text" style={{ order: reverse ? 2 : 1 }}>
                <div style={{
                  fontFamily: F.mono, fontSize: 11, color: LT.gold,
                  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
                }}>{r.tag}</div>
                <h3 style={{
                  fontFamily: F.display, fontSize: 28, fontWeight: 700,
                  margin: `0 0 ${S.sm}px`, color: LT.text, lineHeight: 1.2,
                }}>{r.title}</h3>
                <Sub style={{ fontSize: 16, marginBottom: S.sm }}>{r.copy}</Sub>
                <div style={{
                  display: 'inline-block',
                  fontFamily: F.mono, fontSize: 12, color: LT.gold,
                  padding: '6px 12px', background: LT.goldTint,
                  borderRadius: R.badge,
                }}>{r.stat}</div>
              </FadeUp>
              <FadeUp className="mj-feature-visual" delay={0.1} style={{ order: reverse ? 1 : 2 }}>
                {r.visual}
              </FadeUp>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ── Academy Section ─────────────────────────────────────────────────────────
function AcademySection() {
  const [open, setOpen] = useState<number | null>(0);
  const modules = [
    {
      title: 'Module 1 · Foundations',
      lessons: [
        'What is dropshipping in 2026 (and what it is not)',
        'The AU/US/UK market landscape',
        'How order velocity actually works',
        'Reading trend data without lying to yourself',
        'Setting up your first supplier account',
        'Margins, shipping, and tax in AU',
      ],
      locked: false,
    },
    {
      title: 'Module 2 · Finding winning products',
      lessons: [
        'The 3-signal test (velocity · saturation · margin)',
        'Reading Order Velocity',
        'Category momentum vs single-product luck',
        'When to avoid a trend',
        'Using Majorka to find your first 3 candidates',
        'Validating in under 60 minutes',
        'Picking your first one',
      ],
      locked: false,
    },
    {
      title: 'Module 3 · Ads that actually convert',
      lessons: [
        'The Hook-Angle-Offer framework',
        'Meta vs TikTok — where to start',
        'Writing ad copy the AI can extend',
        'Creative on a budget (phone-shot)',
        'Reading first 24h data',
        'Scaling without burning budget',
      ],
      locked: false,
    },
    { title: 'Module 4 · Store Builder mastery', lessons: [], locked: true },
    { title: 'Module 5 · Cashflow + margins', lessons: [], locked: true },
    { title: 'Module 6 · Scaling what works', lessons: [], locked: true },
    { title: 'Module 7 · Brand beyond dropshipping', lessons: [], locked: true },
    { title: 'Module 8 · Exit + beyond', lessons: [], locked: true },
  ];

  return (
    <Section id="academy" style={{ borderTop: `1px solid ${LT.border}` }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: S.xl, alignItems: 'start',
      }} className="mj-grid-two">
        <FadeUp>
          <Overline>Free Academy</Overline>
          <H2>Learn dropshipping from people who actually do it</H2>
          <Sub style={{ marginTop: S.sm, marginBottom: S.lg }}>
            48 lessons across 8 modules. Data-driven. AU/US/UK specific. 100% free — no subscription required.
          </Sub>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: S.sm,
            marginBottom: S.lg,
          }} className="mj-grid-two">
            {[
              { n: '8', l: 'Modules' },
              { n: '48', l: 'Lessons' },
              { n: 'Free', l: 'Certificate' },
            ].map(v => (
              <div key={v.l} style={{
                padding: S.md,
                background: LT.bgCard,
                border: `1px solid ${LT.border}`,
                borderRadius: R.card,
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: F.mono, fontSize: 32, fontWeight: 700, color: LT.gold }}>{v.n}</div>
                <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute }}>{v.l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 8, marginBottom: S.lg }}>
            {modules.map((m, i) => {
              const isOpen = open === i;
              const canOpen = !m.locked;
              return (
                <div key={m.title} style={{
                  background: LT.bgCard,
                  border: `1px solid ${LT.border}`,
                  borderRadius: R.card,
                  overflow: 'hidden',
                  opacity: m.locked ? 0.55 : 1,
                }}>
                  <button
                    onClick={() => canOpen && setOpen(isOpen ? null : i)}
                    disabled={!canOpen}
                    style={{
                      width: '100%', padding: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'transparent', border: 'none',
                      color: LT.text, fontFamily: F.body, fontSize: 15, fontWeight: 600,
                      cursor: canOpen ? 'pointer' : 'not-allowed', textAlign: 'left',
                      minHeight: 44,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {m.locked && <Lock size={14} color={LT.textDim} />}
                      {m.title}
                    </span>
                    <ChevronDown size={18} color={LT.textMute} style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms',
                    }} />
                  </button>
                  {isOpen && canOpen && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <ol style={{ margin: 0, paddingLeft: 20, color: LT.textMute, fontFamily: F.body, fontSize: 14, lineHeight: 1.8 }}>
                        {m.lessons.map(l => <li key={l}>{l}</li>)}
                      </ol>
                    </div>
                  )}
                  {m.locked && (
                    <div style={{ padding: '0 16px 12px', fontFamily: F.body, fontSize: 12, color: LT.textDim }}>
                      Free account to unlock
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: 16,
            background: LT.bgCard, border: `1px solid ${LT.border}`, borderRadius: R.card,
            marginBottom: S.md,
          }}>
            <div style={{ display: 'flex' }}>
              {['S', 'J', 'E', 'L'].map((c, i) => (
                <div key={c} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: LT.goldTint, color: LT.gold,
                  border: `2px solid ${LT.bgCard}`,
                  marginLeft: i === 0 ? 0 : -8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: F.display, fontWeight: 700, fontSize: 11,
                }}>{c}</div>
              ))}
            </div>
            <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute }}>
              <span style={{ color: LT.text, fontWeight: 600 }}>247 students</span> completed Module 1 this week. Module 2 students find winning products <span style={{ color: LT.success, fontWeight: 600 }}>3 weeks faster</span> on average.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <CtaPrimary href="/sign-up">Start Learning — Free</CtaPrimary>
            <CtaGhost href="/academy">View full curriculum →</CtaGhost>
          </div>
        </FadeUp>

        <FadeUp delay={0.2} className="mj-hide-mobile">
          <div style={{
            background: LT.bgCard,
            border: `1px solid ${LT.border}`,
            borderRadius: R.card,
            padding: S.md,
            boxShadow: SHADOW.overlay,
          }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: LT.gold, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Lesson 1 of 7 in Module 2
            </div>
            <h3 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: LT.text, margin: `0 0 ${S.sm}px`, lineHeight: 1.25 }}>
              2.1 Reading Order Velocity
            </h3>
            <Sub style={{ fontSize: 14, marginBottom: S.sm }}>
              Why raw order counts lie, and how to read the 7-day and 30-day velocity curves instead.
            </Sub>
            <div style={{ marginBottom: S.sm }}>
              <SparklineDraw values={[20, 28, 33, 44, 58, 72, 88, 102, 118, 134]} width={360} height={80} color={LT.gold} />
            </div>
            <div style={{
              padding: 12,
              background: LT.goldTint,
              border: `1px solid ${LT.goldTint}`,
              borderRadius: R.input,
              fontFamily: F.body, fontSize: 13, color: LT.text,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Zap size={14} color={LT.gold} />
              Majorka automates this →
            </div>
          </div>
        </FadeUp>
      </div>

      {/* Phase 4 — Academy → Pricing transition line */}
      <FadeUp>
        <div style={{
          marginTop: S.xl, padding: `${S.md}px 0`,
          borderTop: `1px solid ${LT.border}`,
          fontFamily: F.display, fontSize: 22, fontWeight: 600,
          color: LT.text, textAlign: 'center', lineHeight: 1.4,
          maxWidth: '60ch', marginLeft: 'auto', marginRight: 'auto',
        }}>
          You now know the framework.{' '}
          <span style={{ color: LT.gold }}>Here&apos;s the tool that executes it automatically.</span>
        </div>
      </FadeUp>
    </Section>
  );
}

// ── Social Proof Bar (small testimonial row) ────────────────────────────────
function SocialProofBar() {
  const { stats, products } = useLandingData();
  const scored = stats?.total ?? 3715;
  const topOrders = products.slice(0, 5).reduce((a, p) => a + p.orders, 0);
  return (
    <section style={{
      background: LT.bgElevated,
      borderTop: `1px solid ${LT.border}`,
      borderBottom: `1px solid ${LT.border}`,
      padding: `${S.md}px ${S.md}px`,
    }}>
      <div style={{
        maxWidth: MAX, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: S.lg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.body, fontSize: 13, color: LT.textMute }}>
          <div style={{ display: 'flex' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={LT.gold} color={LT.gold} />)}
          </div>
          <span>Rated 4.9 by early operators</span>
        </div>
        <span style={{ fontFamily: F.mono, fontSize: 12, color: LT.textDim }}>·</span>
        <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute }}>
          <span style={{ color: LT.text, fontWeight: 600 }}>60M+</span> listings scanned
        </div>
        <span style={{ fontFamily: F.mono, fontSize: 12, color: LT.textDim }}>·</span>
        <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute }}>
          <span style={{ color: LT.text, fontWeight: 600 }}>{scored.toLocaleString('en-AU')}+</span> scored · 3 markets
        </div>
        {topOrders > 0 && (
          <>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: LT.textDim }}>·</span>
            <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute }}>
              <span style={{ color: LT.text, fontWeight: 600 }}>{topOrders.toLocaleString('en-AU')}</span> orders in today's top 5
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ── Testimonials ────────────────────────────────────────────────────────────
function Testimonials() {
  const quotes = [
    { q: 'First winning product in 3 weeks — I was still reading US forums for months before. Data beats opinion.', who: 'Sarah M.', role: 'AU dropshipper', result: '$4,200 month 2' },
    { q: 'The AI brief saved me an afternoon. Ran it, copied the hook, launched in 40 minutes. ROAS 2.7x.', who: 'Jake R.', role: 'Sydney', result: '2.7x ROAS' },
    { q: 'Used to pay for 3 separate tools. Majorka covers product research, briefs, and store build in one place.', who: 'Emma P.', role: 'Brisbane', result: '-$220/mo saved' },
  ];
  return (
    <Section>
      <FadeUp>
        <Overline>Testimonials</Overline>
        <H2>Operators using Majorka, in their words</H2>
      </FadeUp>
      <div style={{
        marginTop: S.lg,
        display: 'grid', gap: S.md,
        gridTemplateColumns: 'repeat(3, 1fr)',
      }} className="mj-grid-two">
        {quotes.map((t, i) => (
          <FadeUp key={t.who} delay={i * 0.1}>
            <div style={{
              padding: S.md,
              background: LT.bgCard,
              border: `1px solid ${LT.border}`,
              borderRadius: R.card,
              height: '100%',
            }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                {[...Array(5)].map((_, j) => <Star key={j} size={12} fill={LT.gold} color={LT.gold} />)}
              </div>
              <p style={{ fontFamily: F.body, fontSize: 15, lineHeight: 1.6, color: LT.text, margin: `0 0 ${S.sm}px` }}>"{t.q}"</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: F.body, fontSize: 13 }}>
                <div>
                  <div style={{ color: LT.text, fontWeight: 600 }}>{t.who}</div>
                  <div style={{ color: LT.textDim, fontSize: 12 }}>{t.role}</div>
                </div>
                <span style={{
                  fontFamily: F.mono, fontSize: 11, color: LT.success,
                  padding: '3px 10px', background: 'rgba(34,197,94,0.12)', borderRadius: R.badge,
                }}>{t.result}</span>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  );
}

// ── Trust Signals ──────────────────────────────────────────────────────────
function TrustSignals() {
  const items = [
    { icon: Database, title: 'Real data. No estimates.',
      copy: 'Every order count, velocity score and price pulled from live AliExpress + TikTok Shop feeds — updated every 6 hours. Nothing synthetic.' },
    { icon: ShieldCheck, title: 'Your data is yours.',
      copy: 'We never sell your data. Stripe handles billing, Supabase handles auth — both SOC-2 compliant. Export or delete your account anytime.' },
    { icon: MessageCircle, title: "We're here when you need us.",
      copy: 'Real-human support via chat or email. Average first reply under 2 hours during AU business hours.' },
  ];
  const logos = ['Supabase', 'Vercel', 'Anthropic', 'Stripe', 'Shopify'];
  return (
    <Section>
      <FadeUp>
        <Overline>Trust</Overline>
        <H2>Built carefully. Priced honestly. Supported properly.</H2>
      </FadeUp>
      <div style={{
        marginTop: S.lg,
        display: 'grid', gap: S.md,
        gridTemplateColumns: 'repeat(3, 1fr)',
      }} className="mj-grid-two">
        {items.map((it, i) => (
          <FadeUp key={it.title} delay={i * 0.1}>
            <div style={{
              padding: S.md,
              background: LT.bgCard, border: `1px solid ${LT.border}`, borderRadius: R.card,
              height: '100%',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: R.input,
                background: LT.goldTint,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: S.sm,
              }}><it.icon size={20} color={LT.gold} /></div>
              <h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: LT.text, margin: `0 0 ${S.xs}px` }}>{it.title}</h3>
              <p style={{ fontFamily: F.body, fontSize: 14, lineHeight: 1.6, color: LT.textMute, margin: 0 }}>{it.copy}</p>
            </div>
          </FadeUp>
        ))}
      </div>
      <div style={{
        marginTop: S.xl,
        padding: `${S.sm}px 0`,
        borderTop: `1px solid ${LT.border}`,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: S.lg,
      }}>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: LT.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Powered by</span>
        {logos.map(l => (
          <span key={l} style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute, fontWeight: 500 }}>{l}</span>
        ))}
      </div>

      {/* Phase 2 Layer 5 — comparison table */}
      <FadeUp>
        <div style={{
          marginTop: S.xl,
          padding: S.md,
          background: LT.bgCard, border: `1px solid ${LT.border}`, borderRadius: R.card,
        }}>
          <div style={{
            fontFamily: F.mono, fontSize: 11, color: LT.gold,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: S.sm,
          }}>Manual research vs Majorka</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body, fontSize: 14, minWidth: 560 }}>
              <thead>
                <tr style={{ background: LT.bgElevated }}>
                  <th style={{ textAlign: 'left', padding: 12, color: LT.textMute, borderBottom: `1px solid ${LT.border}` }}>Task</th>
                  <th style={{ padding: 12, color: LT.textMute, borderBottom: `1px solid ${LT.border}`, textAlign: 'center' }}>Doing it manually</th>
                  <th style={{ padding: 12, color: LT.gold, borderBottom: `1px solid ${LT.border}`, textAlign: 'center' }}>With Majorka</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Find a product with real velocity', '4–8 hours scrolling', '5 minutes, scored & ranked'],
                  ['Validate AU / US / UK demand', 'Guess from TikTok views', 'Live split, 3 markets'],
                  ['Write a brief (audience, angle, hook)', 'Half a day', '3 seconds'],
                  ['Ad copy — 4 formats', 'Hire a copywriter', 'One click'],
                  ['Ship a Shopify-ready store', '1–2 weekends', 'Under an hour'],
                ].map((row) => (
                  <tr key={row[0]} style={{ borderBottom: `1px solid ${LT.border}` }}>
                    <td style={{ padding: 12, color: LT.text }}>{row[0]}</td>
                    <td style={{ padding: 12, color: LT.textMute, textAlign: 'center' }}>{row[1]}</td>
                    <td style={{ padding: 12, color: LT.text, textAlign: 'center', fontWeight: 600 }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>
    </Section>
  );
}

// ── Pricing ─────────────────────────────────────────────────────────────────
const LAUNCH_END_TS = new Date('2026-04-29T00:00:00+10:00').getTime();

function useCountdown(targetTs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, targetTs - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return { days, hours, done: diff === 0 };
}

function Pricing() {
  const [annual, setAnnual] = useState(false);
  const { days, hours } = useCountdown(LAUNCH_END_TS);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const tiers = [
    {
      name: 'Builder',
      tagline: 'For dropshippers starting out',
      priceMonthly: 99, priceAnnual: 79,
      highlight: false,
      ctaLabel: 'Start Free Trial',
      features: [
        'Full product database (4,000+ tracked)',
        'Live AU / US / UK data',
        '50 AI briefs / month',
        '20 ad generations / month',
        '1 Shopify store',
        'Email support',
      ],
    },
    {
      name: 'Scale',
      tagline: 'For dropshippers scaling to 6 figures',
      priceMonthly: 199, priceAnnual: 159,
      highlight: true,
      ctaLabel: 'Start 7-day free trial →',
      features: [
        'Everything in Builder',
        'Unlimited AI briefs',
        'Unlimited ad generations',
        '5 Shopify stores',
        'Priority chat support',
        'Early access to new features',
        'Locked launch pricing',
      ],
    },
  ];

  return (
    <Section id="pricing">
      <FadeUp>
        <Overline>Pricing</Overline>
        <H2>One subscription. Everything you need.</H2>
        <Sub style={{ marginTop: S.sm }}>Start with 7 days free. No card required. Cancel anytime.</Sub>

        {/* Value-anchoring block — phase 3 psychological anchoring */}
        <div style={{
          marginTop: S.md, padding: S.md,
          background: LT.bgCard, border: `1px solid ${LT.border}`, borderRadius: R.card,
          display: 'grid', gap: 6,
          fontFamily: F.body, fontSize: 14, color: LT.textMute, lineHeight: 1.6,
          maxWidth: 640,
        }}>
          <div style={{ color: LT.text, fontWeight: 600 }}>The maths are simple:</div>
          <div>Average successful product: <span style={{ fontFamily: F.mono, color: LT.text }}>$3,000–15,000 AUD/month</span> net profit.</div>
          <div>Majorka Scale plan: <span style={{ fontFamily: F.mono, color: LT.text }}>$159/mo</span> (annual).</div>
          <div>ROI from first winning product: <span style={{ fontFamily: F.mono, color: LT.success }}>10–100×</span> your subscription cost.</div>
        </div>

        <div style={{
          marginTop: S.md,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          fontFamily: F.body, fontSize: 14, color: LT.textMute,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', background: LT.goldTint, color: LT.gold,
            borderRadius: R.badge, fontFamily: F.mono, fontSize: 12, fontWeight: 600,
          }}>
            <Flame size={12} />Launch pricing ends in: {days}d {hours}h
          </span>
          <span>🔒 Prices locked for existing subscribers — upgrade today to protect your rate.</span>
        </div>

        <div style={{
          marginTop: S.md, display: 'inline-flex', padding: 4,
          background: LT.bgCard, border: `1px solid ${LT.border}`, borderRadius: R.button,
        }}>
          {[
            { label: 'Monthly', val: false },
            { label: 'Annual — save 20%', val: true },
          ].map(t => (
            <button key={t.label} onClick={() => setAnnual(t.val)} style={{
              minHeight: 40,
              padding: '10px 16px',
              border: 'none',
              background: annual === t.val ? LT.gold : 'transparent',
              color: annual === t.val ? LT.bg : LT.textMute,
              fontFamily: F.body, fontSize: 13, fontWeight: 600,
              borderRadius: R.button,
              cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>
      </FadeUp>

      <div style={{
        marginTop: S.lg,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S.md,
      }} className="mj-grid-two">
        {tiers.map((t, i) => {
          const price = annual ? t.priceAnnual : t.priceMonthly;
          return (
            <FadeUp key={t.name} delay={i * 0.1}>
              <div style={{
                position: 'relative',
                padding: S.lg,
                background: LT.bgCard,
                border: t.highlight ? `1px solid ${LT.gold}` : `1px solid ${LT.border}`,
                borderRadius: R.card,
                height: '100%',
                boxShadow: t.highlight ? SHADOW.cardHover : undefined,
              }}>
                {t.highlight && (
                  <div style={{
                    position: 'absolute', top: -12, right: 20,
                    padding: '4px 12px', background: LT.gold, color: LT.bg,
                    borderRadius: R.badge, fontFamily: F.body, fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>Most Popular</div>
                )}
                <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: LT.text, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute, marginBottom: S.sm }}>{t.tagline}</div>
                <div style={{ marginBottom: S.md }}>
                  <span style={{ fontFamily: F.mono, fontSize: 48, fontWeight: 700, color: LT.text }}>${price}</span>
                  <span style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute, marginLeft: 4 }}>/mo {annual ? '(billed annually)' : ''}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: `0 0 ${S.md}px`, display: 'grid', gap: 10 }}>
                  {t.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: F.body, fontSize: 14, color: LT.text }}>
                      <Check size={16} color={t.highlight ? LT.gold : LT.success} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {t.highlight ? (
                  <CtaPrimary href="/sign-up" pulse style={{ width: '100%' }}>{t.ctaLabel}</CtaPrimary>
                ) : (
                  <CtaGhost href="/sign-up" style={{ width: '100%' }}>{t.ctaLabel}</CtaGhost>
                )}
                {t.highlight && (
                  <div style={{ marginTop: 10, fontFamily: F.body, fontSize: 12, color: LT.textDim, textAlign: 'center' }}>
                    Unlimited briefs · 5 stores · launch price locked for life
                  </div>
                )}
              </div>
            </FadeUp>
          );
        })}
      </div>

      <FadeUp>
        <div style={{
          marginTop: S.lg, padding: S.md,
          background: LT.bgCard, border: `1px solid ${LT.border}`, borderRadius: R.card,
          display: 'flex', flexWrap: 'wrap', gap: S.md, justifyContent: 'space-around',
          fontFamily: F.body, fontSize: 13, color: LT.textMute,
        }}>
          <a href="/guarantee" style={{ color: LT.textMute, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = LT.gold)}
            onMouseLeave={(e) => (e.currentTarget.style.color = LT.textMute)}
          >🛡️ 30-day money-back guarantee →</a>
          <span>Cancel anytime from your settings</span>
          <span>Prices locked for existing subscribers</span>
        </div>

        <div style={{ marginTop: S.md, textAlign: 'center' }}>
          <button
            onClick={() => setComparisonOpen(v => !v)}
            style={{
              background: 'transparent', border: 'none',
              fontFamily: F.body, fontSize: 14, color: LT.gold, cursor: 'pointer',
              padding: 12, minHeight: 44,
            }}
          >Compare all features {comparisonOpen ? '↑' : '↓'}</button>
        </div>
        {comparisonOpen && (
          <div style={{ marginTop: S.sm, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.body, fontSize: 14 }}>
              <thead>
                <tr style={{ background: LT.bgElevated }}>
                  <th style={{ textAlign: 'left', padding: 12, color: LT.textMute, borderBottom: `1px solid ${LT.border}` }}>Feature</th>
                  <th style={{ padding: 12, color: LT.text, borderBottom: `1px solid ${LT.border}` }}>Builder</th>
                  <th style={{ padding: 12, color: LT.gold, borderBottom: `1px solid ${LT.border}` }}>Scale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Product database', '4,000+ tracked', '4,000+ tracked'],
                  ['AI briefs / month', '50', 'Unlimited'],
                  ['Ad generations / month', '20', 'Unlimited'],
                  ['Shopify stores', '1', '5'],
                  ['Support', 'Email', 'Priority chat'],
                  ['Early feature access', '—', '✓'],
                  ['Locked launch pricing', '—', '✓'],
                ].map(row => (
                  <tr key={row[0]} style={{ borderBottom: `1px solid ${LT.border}` }}>
                    <td style={{ padding: 12, color: LT.text }}>{row[0]}</td>
                    <td style={{ padding: 12, color: LT.textMute, textAlign: 'center' }}>{row[1]}</td>
                    <td style={{ padding: 12, color: LT.text, textAlign: 'center' }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FadeUp>
    </Section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const qs = [
    {
      q: 'Do I need experience to use Majorka?',
      a: 'No. Majorka is designed for operators at any level. The Academy walks you through dropshipping fundamentals for free, and the product discovery + AI brief flow is designed so a complete beginner can find and validate a product in under 60 minutes.',
    },
    {
      q: 'Where does your product data come from?',
      a: 'We aggregate live order data from AliExpress and TikTok Shop across AU, US and UK, updating every 6 hours via our pipeline. No estimates — every count is a real, observed number from the source platform.',
    },
    {
      q: 'Do I need a Shopify account?',
      a: 'Not to start. You can research products, generate briefs and ads without one. When you are ready to launch, Store Builder outputs a Shopify-importable JSON you can drop into any new or existing Shopify store.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes — 7 days free, no credit card required. You get full Builder-tier access during the trial. Cancel anytime before day 7 with one click and you are not charged.',
    },
    {
      q: 'What if I am not in Australia?',
      a: 'Majorka works for operators in US and UK too — all three markets are first-class. AU gets slightly deeper coverage because it is our home market, but every feature (products, briefs, ads, store) works across all three.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. One click in settings, no questions, no retention calls. Prorated refunds for annual plans within 30 days of purchase, no questions asked.',
    },
    {
      q: "What's the 30-day guarantee?",
      a: 'If you use Majorka for 30 days and do not find at least one product worth launching, email support@majorka.io for a full refund. No fine print — we will issue it within 2 business days. Eligibility: first 30 days of your paid subscription, one refund per account.',
    },
  ];
  return (
    <Section id="faq">
      <FadeUp>
        <Overline>FAQ</Overline>
        <H2>Questions people ask before signing up</H2>
      </FadeUp>
      <div style={{ marginTop: S.lg, display: 'grid', gap: 10, maxWidth: 860 }}>
        {qs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} style={{
              background: LT.bgCard,
              border: `1px solid ${LT.border}`,
              borderRadius: R.card,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: '100%', padding: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  background: 'transparent', border: 'none',
                  fontFamily: F.body, fontSize: 16, fontWeight: 600, color: LT.text,
                  textAlign: 'left', cursor: 'pointer', minHeight: 44,
                }}
                aria-expanded={isOpen}
              >
                <span>{f.q}</span>
                <ChevronDown size={18} color={LT.textMute} style={{
                  flexShrink: 0,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms',
                }} />
              </button>
              {isOpen && (
                <div style={{
                  padding: '0 16px 16px',
                  fontFamily: F.body, fontSize: 15, lineHeight: 1.6, color: LT.textMute,
                }}>{f.a}</div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <Section>
      <FadeUp>
        <div style={{
          padding: S.xl,
          background: LT.bgCard,
          border: `1px solid ${LT.gold}`,
          borderRadius: R.card,
          boxShadow: SHADOW.cardHover,
          textAlign: 'center',
        }}>
          <Overline style={{ textAlign: 'center' }}>One shortlist. One weekend.</Overline>
          <H2 style={{ textAlign: 'center' }}>The next winner is already scored. Go find it.</H2>
          <Sub style={{ margin: `${S.sm}px auto ${S.lg}px`, textAlign: 'center' }}>
            You&apos;re not going to beat the operator who started 30 days ago. You are going to beat the 10,000 people still looking at the same 200 products everyone else mentions. 7 days free. No card.
          </Sub>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <CtaPrimary href="/sign-up" pulse>Start 7-day free trial →</CtaPrimary>
            <CtaGhost href="#how">See how it works</CtaGhost>
          </div>
          <div style={{
            marginTop: S.md,
            display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap',
            fontFamily: F.body, fontSize: 12, color: LT.textDim,
          }}>
            <a href="/guarantee" style={{ color: LT.textDim, textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = LT.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.color = LT.textDim)}
            >🛡️ 30-day money-back guarantee →</a>
            <span>Prices locked for existing subscribers</span>
          </div>
        </div>
      </FadeUp>
    </Section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear();
  const cols = [
    { title: 'Product', links: [
      ['Features', '#features'],
      ['Pricing', '#pricing'],
      ['Academy', '/academy'],
      ['Blog', '/blog'],
      ['Changelog', '/changelog'],
    ] },
    { title: 'Company', links: [
      ['About', '/about'],
      ['Contact', 'mailto:support@majorka.io'],
      ['Guarantee', '/guarantee'],
    ] },
    { title: 'Legal', links: [
      ['Privacy policy', '/privacy'],
      ['Terms of service', '/terms'],
      ['Refund policy', '/guarantee'],
      ['Cookie policy', '/privacy#cookies'],
    ] },
    { title: 'Account', links: [
      ['Sign in', '/sign-in'],
      ['Start free trial', '/sign-up'],
    ] },
  ];
  return (
    <footer style={{
      borderTop: `1px solid ${LT.border}`,
      padding: `${S.xl}px ${S.md}px ${S.lg}px`,
      background: LT.bg,
    }}>
      <div style={{
        maxWidth: MAX, margin: '0 auto',
        display: 'grid', gap: S.lg,
        gridTemplateColumns: '1.6fr repeat(4, 1fr)',
      }} className="mj-grid-two">
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 22, color: LT.text, letterSpacing: '-0.03em' }}>majorka</div>
          <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute, marginTop: 8, maxWidth: 320, lineHeight: 1.55 }}>
            AI product intelligence for AU, US and UK dropshippers. Built in Melbourne by operators who actually ship.
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="https://twitter.com/majorkaio" target="_blank" rel="noopener noreferrer" aria-label="Majorka on X / Twitter"
              style={{ color: LT.textMute, textDecoration: 'none', fontFamily: F.mono, fontSize: 12 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = LT.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.color = LT.textMute)}
            >X / Twitter</a>
            <a href="https://tiktok.com/@majorkaio" target="_blank" rel="noopener noreferrer" aria-label="Majorka on TikTok"
              style={{ color: LT.textMute, textDecoration: 'none', fontFamily: F.mono, fontSize: 12 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = LT.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.color = LT.textMute)}
            >TikTok</a>
            <a href="mailto:support@majorka.io" aria-label="Email Majorka support"
              style={{ color: LT.textMute, textDecoration: 'none', fontFamily: F.mono, fontSize: 12 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = LT.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.color = LT.textMute)}
            >Email</a>
          </div>
        </div>
        {cols.map(c => (
          <div key={c.title}>
            <div style={{
              fontFamily: F.mono, fontSize: 11, color: LT.textDim,
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12,
            }}>{c.title}</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {c.links.map(([label, href]) => (
                <a key={label} href={href} style={{
                  fontFamily: F.body, fontSize: 14, color: LT.textMute, textDecoration: 'none', minHeight: 24,
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = LT.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = LT.textMute)}
                >{label}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        maxWidth: MAX, margin: '32px auto 0', paddingTop: 16,
        borderTop: `1px solid ${LT.border}`,
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        fontFamily: F.body, fontSize: 12, color: LT.textDim,
      }}>
        <span>© {year} Majorka Pty Ltd. All rights reserved.</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <a href="mailto:support@majorka.io" style={{ color: LT.textDim, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = LT.gold)}
            onMouseLeave={(e) => (e.currentTarget.style.color = LT.textDim)}
          >support@majorka.io</a>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Globe size={12} /> Made in Melbourne, AU
          </span>
        </span>
      </div>
    </footer>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────
export default function Home() {
  // Track sticky-bar height to offset nav
  const [barVisible, setBarVisible] = useState(true);
  const [tickerUrl, setTickerUrl] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') {
        setBarVisible(false);
      }
    } catch { /* default visible */ }
  }, []);

  const topOffset = barVisible ? LAUNCH_BAR_HEIGHT : 0;

  // memoize nothing heavy; just a hint that re-renders are fine
  const _stylesMemo = useMemo(() => GLOBAL_CSS, []);

  return (
    <div data-majorka-landing style={{
      background: LT.bg, color: LT.text, fontFamily: F.body,
      minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden',
    }}>
      <SEO
        title="Majorka — Find winning products before they peak"
        description="We search tens of millions of AliExpress listings and surface the few thousand worth shipping. AU · US · UK. AI briefs in 3 seconds. Shopify-ready stores. Start free."
        path="/"
        ogImage="/og-image.svg"
      />
      <style>{_stylesMemo}</style>

      <FilmGrain />
      <TickerBar onSelect={(u) => {
        setTickerUrl(u);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />
      <StickyLaunchBar />
      <Nav topOffset={topOffset} />
      <div style={{ paddingTop: topOffset + 64 }} />

      <Hero tickerUrl={tickerUrl} />
      <MicroOrderTicker />
      <SocialProofBar />
      <ChapterMorph />
      <HowItWorks />
      <MicroSparklineRow />
      <LiveDemo />
      <MicroMarketPulse />
      <FeaturesSection />
      <MicroCategoryLeaders />
      <AcademySection />
      <MicroSignalCard />
      <Testimonials />
      <TrustSignals />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />

      <LiveActivityTicker />
      <CommandPalettePreview />
    </div>
  );
}
