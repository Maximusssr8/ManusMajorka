/**
 * BRAINSTORM:
 * The single most powerful moment: **finding a product scoring 99 with 48K orders
 * that nobody in AU is selling yet.** That's the "I found it first" adrenaline.
 * The brief generation is the cherry on top — "now I know exactly how to sell it."
 * The alert setup is the lock — "nobody else will know before me."
 */

import { useEffect, useState, useRef, useCallback } from 'react';

/* ── types ──────────────────────────────────────────────────── */

interface DemoProduct {
  title: string;
  score: number;
  orders: number;
  category: string;
}

const FALLBACK_PRODUCT: DemoProduct = {
  title: 'LED Scalp Massager Pro',
  score: 99,
  orders: 48210,
  category: 'Health & Beauty',
};

/* ── fonts ─────────────────────────────────────────────────── */

const F = {
  display: "'Syne', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ── format helpers ────────────────────────────────────────── */

function formatOrders(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n).toLocaleString()}`;
  return String(n);
}

/* ── fetch one demo product ────────────────────────────────── */

async function fetchDemoProduct(): Promise<DemoProduct> {
  try {
    const res = await fetch('/api/demo/quick-score?category=Pet&seed=0');
    if (!res.ok) return FALLBACK_PRODUCT;
    const json = await res.json();
    if (!json.ok || !json.product) return FALLBACK_PRODUCT;
    const p = json.product;
    return {
      title: String(p.title || FALLBACK_PRODUCT.title),
      score: Math.min(Number(p.score) || 99, 99),
      orders: Number(p.orders) || FALLBACK_PRODUCT.orders,
      category: String(p.category || FALLBACK_PRODUCT.category),
    };
  } catch {
    return FALLBACK_PRODUCT;
  }
}

/* ── CSS ────────────────────────────────────────────────────── */

const HERO_CSS = `
.mj-hero-cta:hover {
  background-color: #6ba3ff !important;
  transform: scale(1.02);
  box-shadow: 0 10px 40px -8px rgba(79,142,247,0.55);
}
@keyframes mjPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes mjSlideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes mjSlideInBounce {
  0% { opacity: 0; transform: translateX(20px); }
  60% { opacity: 1; transform: translateX(-3px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes mjScaleBounce {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes mjCountGlow {
  0% { text-shadow: 0 0 0 transparent; }
  50% { text-shadow: 0 0 16px rgba(79,142,247,0.6); }
  100% { text-shadow: 0 0 0 transparent; }
}
@keyframes mjRipple {
  from { transform: scale(0); opacity: 0.4; }
  to { transform: scale(3); opacity: 0; }
}
@keyframes mjScanLine {
  0% { top: 0; opacity: 0.6; }
  100% { top: 100%; opacity: 0; }
}
@keyframes mjCardGlow {
  0% { box-shadow: 0 0 80px rgba(79,142,247,0.06); }
  50% { box-shadow: 0 0 80px rgba(79,142,247,0.15), 0 0 160px rgba(79,142,247,0.05); }
  100% { box-shadow: 0 0 80px rgba(79,142,247,0.06); }
}
@keyframes mjBriefUnderline {
  from { width: 0; }
  to { width: 100%; }
}
.mj-demo-cursor {
  position: absolute;
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s ease;
  z-index: 50;
  pointer-events: none;
}
.mj-demo-card-glow {
  animation: mjCardGlow 1.2s ease forwards;
}
.mj-ripple-effect {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(79,142,247,0.5);
  animation: mjRipple 0.6s ease-out forwards;
  pointer-events: none;
}
.mj-scan-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, transparent, #4f8ef7, transparent);
  animation: mjScanLine 1.5s ease-out forwards;
  pointer-events: none;
  z-index: 40;
}
.mj-corner-accent {
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
  z-index: 30;
}
.mj-corner-tl { top: -1px; left: -1px; border-top: 2px solid rgba(79,142,247,0.3); border-left: 2px solid rgba(79,142,247,0.3); }
.mj-corner-tr { top: -1px; right: -1px; border-top: 2px solid rgba(79,142,247,0.3); border-right: 2px solid rgba(79,142,247,0.3); }
.mj-corner-bl { bottom: -1px; left: -1px; border-bottom: 2px solid rgba(79,142,247,0.3); border-left: 2px solid rgba(79,142,247,0.3); }
.mj-corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid rgba(79,142,247,0.3); border-right: 2px solid rgba(79,142,247,0.3); }
@media (max-width: 768px) {
  .mj-hero-minimal {
    grid-template-columns: 1fr !important;
    height: auto !important;
    min-height: 100vh;
    padding: 100px 20px 60px !important;
  }
  .mj-hero-minimal-left {
    text-align: center !important;
    align-items: center !important;
    margin-bottom: 32px !important;
  }
  .mj-hero-demo-wrap {
    display: none !important;
  }
  .mj-hero-mobile-card {
    display: flex !important;
  }
  .mj-corner-accent, .mj-scan-line {
    display: none !important;
  }
}
@media (min-width: 769px) {
  .mj-hero-mobile-card {
    display: none !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mj-demo-cursor { display: none !important; }
  .mj-demo-reduced-show { opacity: 1 !important; }
  .mj-scan-line { display: none !important; }
}
`;

/* ── Cursor SVG ─────────────────────────────────────────────── */

function CursorSVG({ clicking }: { clicking: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      style={{
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
        transform: clicking ? 'scale(0.85)' : 'scale(1)',
        transition: 'transform 0.15s ease',
      }}
    >
      <path
        d="M0 0 L0 14 L4 10 L7 16 L9 15 L6 9 L12 9 Z"
        fill="white"
        stroke="#161b22"
        strokeWidth="0.5"
      />
    </svg>
  );
}

/* ── Animated Demo ──────────────────────────────────────────── */

// Timeline durations per phase (ms) — snappier score (1.0s), faster brief (25ms/char), longer pause (3s)
const TIMELINE = [800, 700, 500, 500, 1000, 300, 1400, 1000, 300, 700, 1000, 3000];

// Cursor positions for each phase (adjusted for larger 520x380 card)
const CURSOR_POS: Record<number, { left: number; top: number }> = {
  0: { left: 100, top: 58 },
  1: { left: 240, top: 98 },
  2: { left: 310, top: 105 },
  3: { left: 220, top: 140 },
  4: { left: 170, top: 200 },
  5: { left: 170, top: 200 },
  6: { left: 240, top: 265 },
  7: { left: 370, top: 200 },
  8: { left: 370, top: 200 },
  9: { left: 340, top: 320 },
  10: { left: 180, top: 45 },
  11: { left: 90, top: 25 },
};

const BRIEF_LINES = [
  'TARGET: Pet owners 25-44, AU',
  'HOOK: Your dog needs this',
  'PLATFORM: TikTok + Meta',
];

function AnimatedDemo({ product }: { product: DemoProduct }) {
  const [phase, setPhase] = useState(-1);
  const [score, setScore] = useState(0);
  const [ordersText, setOrdersText] = useState('');
  const [briefText, setBriefText] = useState('');
  const [showHot, setShowHot] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [cardGlow, setCardGlow] = useState(false);
  const [showRipple, setShowRipple] = useState<{ x: number; y: number } | null>(null);
  const [showScanLine, setShowScanLine] = useState(false);
  const [briefLineCount, setBriefLineCount] = useState(0);
  const timerRef = useRef<number>(0);
  const scoreRafRef = useRef<number>(0);
  const typeIntervalRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const phaseRef = useRef(-1);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Reset all animation state
  const resetState = useCallback(() => {
    setScore(0);
    setOrdersText('');
    setBriefText('');
    setShowHot(false);
    setShowNotif(false);
    setClicking(false);
    setFadeOut(false);
    setCardGlow(false);
    setShowRipple(null);
    setShowScanLine(false);
    setBriefLineCount(0);
    cancelAnimationFrame(scoreRafRef.current);
    clearInterval(typeIntervalRef.current);
  }, []);

  // Score counter animation — snappier at 600ms
  const animateScore = useCallback((target: number) => {
    const start = performance.now();
    const duration = 600;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const val = Math.round(eased * target);
      setScore(val);
      // Trigger glow when score reaches target
      if (val >= target) {
        setCardGlow(true);
        setTimeout(() => setCardGlow(false), 1200);
      }
      if (t < 1) {
        scoreRafRef.current = requestAnimationFrame(tick);
      }
    }
    scoreRafRef.current = requestAnimationFrame(tick);
  }, []);

  // Orders type-in
  const animateOrders = useCallback((target: number) => {
    const str = formatOrders(target);
    let i = 0;
    typeIntervalRef.current = window.setInterval(() => {
      i++;
      setOrdersText(str.slice(0, i));
      if (i >= str.length) clearInterval(typeIntervalRef.current);
    }, 40);
  }, []);

  // Brief type-in — faster at 25ms per char
  const animateBrief = useCallback(() => {
    const fullText = BRIEF_LINES.join('\n');
    let i = 0;
    typeIntervalRef.current = window.setInterval(() => {
      i++;
      const slice = fullText.slice(0, i);
      setBriefText(slice);
      setBriefLineCount(slice.split('\n').length);
      if (i >= fullText.length) clearInterval(typeIntervalRef.current);
    }, 25);
  }, []);

  // Click flash with ripple effect
  const doClick = useCallback((ripplePos?: { x: number; y: number }) => {
    setClicking(true);
    if (ripplePos) {
      setShowRipple(ripplePos);
      setTimeout(() => setShowRipple(null), 600);
    }
    setTimeout(() => setClicking(false), 150);
  }, []);

  // Main timeline loop
  useEffect(() => {
    if (reducedMotion.current) return;

    let idx = 0;
    let cancelled = false;

    function runPhase() {
      if (cancelled || pausedRef.current) return;

      const currentPhase = idx;
      phaseRef.current = currentPhase;
      setPhase(currentPhase);

      // Phase-specific side effects
      switch (currentPhase) {
        case 0:
          // Trigger scan line at start of each loop
          setShowScanLine(true);
          setTimeout(() => setShowScanLine(false), 1500);
          break;
        case 1:
          animateScore(product.score);
          break;
        case 2:
          setShowHot(true);
          break;
        case 3:
          animateOrders(product.orders);
          break;
        case 5:
          doClick({ x: 170, y: 200 }); // ripple on Generate Brief
          break;
        case 6:
          animateBrief();
          break;
        case 8:
          doClick({ x: 370, y: 200 }); // ripple on Set Alert
          break;
        case 9:
          setShowNotif(true);
          break;
        case 10:
          setFadeOut(true);
          break;
        case 11:
          // Reset and loop
          resetState();
          idx = -1; // will be incremented to 0
          break;
      }

      idx++;
      const delay = TIMELINE[currentPhase] ?? 800;
      timerRef.current = window.setTimeout(runPhase, delay);
    }

    // Start after a short delay
    timerRef.current = window.setTimeout(() => {
      resetState();
      runPhase();
    }, 500);

    // Visibility change handler
    function onVisChange() {
      if (document.hidden) {
        pausedRef.current = true;
        clearTimeout(timerRef.current);
      } else {
        pausedRef.current = false;
        timerRef.current = window.setTimeout(runPhase, 300);
      }
    }
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
      cancelAnimationFrame(scoreRafRef.current);
      clearInterval(typeIntervalRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [product, animateScore, animateOrders, animateBrief, doClick, resetState]);

  const cursorPos = CURSOR_POS[phase] ?? CURSOR_POS[0];
  const isReduced = reducedMotion.current;

  return (
    <div
      className={cardGlow && !isReduced ? 'mj-demo-card-glow' : ''}
      style={{
        position: 'relative',
        width: 520,
        maxWidth: '100%',
        minHeight: 380,
        background: '#0a0d14',
        border: '1px solid #161b22',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 0 80px rgba(79,142,247,0.06)',
        opacity: fadeOut && !isReduced ? 0.3 : 1,
        transition: 'opacity 1s ease, box-shadow 0.4s ease',
        fontFamily: F.body,
      }}
    >
      {/* Corner accents — targeting reticle frame */}
      <div className="mj-corner-accent mj-corner-tl" />
      <div className="mj-corner-accent mj-corner-tr" />
      <div className="mj-corner-accent mj-corner-bl" />
      <div className="mj-corner-accent mj-corner-br" />

      {/* Scanning line — sweeps once at start of each loop */}
      {showScanLine && !isReduced && (
        <div className="mj-scan-line" />
      )}

      {/* Ripple effect on button clicks */}
      {showRipple && !isReduced && (
        <div
          className="mj-ripple-effect"
          style={{ left: showRipple.x - 6, top: showRipple.y - 6 }}
        />
      )}

      {/* Mini sidebar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 52,
          background: '#080c14',
          borderRight: '1px solid #161b22',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          gap: 14,
        }}
      >
        {/* Nav dots */}
        {['Products', 'Alerts', 'Maya AI', 'Store'].map((label, i) => (
          <div
            key={label}
            title={label}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: i === 0 ? 'rgba(79,142,247,0.12)' : 'transparent',
              borderLeft: i === 0 ? '2px solid #4f8ef7' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === 0 ? '#4f8ef7' : '#2a2f3a',
              }}
            />
          </div>
        ))}

        {/* Sidebar stats */}
        <div style={{ marginTop: 'auto', padding: '0 4px', marginBottom: 12 }}>
          <div style={{ borderTop: '1px solid #161b22', paddingTop: 10, textAlign: 'center' }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>4,155</div>
            <div style={{ fontSize: 8, color: '#4b5563', lineHeight: 1.3, marginBottom: 8 }}>products<br />scored</div>
            <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>6hr</div>
            <div style={{ fontSize: 8, color: '#4b5563', lineHeight: 1.3 }}>refresh<br />cycle</div>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', margin: '10px auto 0', animation: 'mjPulse 2s infinite' }} />
        </div>
      </div>

      {/* Main content area */}
      <div style={{ marginLeft: 52, padding: '14px 16px', position: 'relative', height: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
            Product Intelligence
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'mjPulse 2s infinite' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', letterSpacing: '0.05em' }}>LIVE</span>
          </span>
        </div>

        {/* Product card */}
        <div
          style={{
            background: phase >= 0 || isReduced ? 'rgba(79,142,247,0.04)' : 'transparent',
            border: `1px solid ${phase >= 0 || isReduced ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.04)'}`,
            borderRadius: 10,
            padding: '10px 12px',
            transition: 'all 0.4s ease',
            marginBottom: 10,
          }}
        >
          {/* Product name */}
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 2, lineHeight: 1.3 }}>
            {product.title}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
            {product.category}
          </div>

          {/* Score + Orders row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>Score</span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#4f8ef7',
                  background: (phase >= 1 || isReduced) ? '#1e3a5f' : 'transparent',
                  padding: '2px 8px',
                  borderRadius: 6,
                  minWidth: 36,
                  textAlign: 'center' as const,
                  transition: 'background 0.3s ease',
                  animation: phase === 1 ? 'mjCountGlow 0.7s ease' : 'none',
                }}
              >
                {isReduced ? product.score : (score || '\u00A0')}
              </span>
              {/* HOT label */}
              {(showHot || isReduced) && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#ef4444',
                    background: 'rgba(239,68,68,0.1)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    animation: isReduced ? 'none' : 'mjScaleBounce 0.4s ease forwards',
                  }}
                >
                  HOT {'\uD83D\uDD25'}
                </span>
              )}
            </div>

            {/* Orders */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>Orders</span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#4f8ef7',
                  minWidth: 50,
                }}
              >
                {isReduced ? formatOrders(product.orders) : ordersText}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            style={{
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 600,
              color: phase === 5 ? '#ffffff' : '#4f8ef7',
              background: phase === 5 ? 'rgba(79,142,247,0.3)' : 'transparent',
              border: `1px solid ${(phase === 4 || phase === 5) && !isReduced ? '#4f8ef7' : 'rgba(79,142,247,0.25)'}`,
              borderRadius: 7,
              padding: '7px 14px',
              cursor: 'default',
              transition: 'all 0.3s ease',
              boxShadow: phase === 4 && !isReduced ? '0 0 12px rgba(79,142,247,0.3)' : 'none',
            }}
          >
            Generate Brief
          </button>
          <button
            style={{
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 600,
              color: phase === 8 ? '#ffffff' : '#4f8ef7',
              background: phase === 8 ? 'rgba(79,142,247,0.3)' : 'transparent',
              border: `1px solid ${(phase === 7 || phase === 8) && !isReduced ? '#4f8ef7' : 'rgba(79,142,247,0.25)'}`,
              borderRadius: 7,
              padding: '7px 14px',
              cursor: 'default',
              transition: 'all 0.3s ease',
              boxShadow: phase === 7 && !isReduced ? '0 0 12px rgba(79,142,247,0.3)' : 'none',
            }}
          >
            Set Alert
          </button>
        </div>

        {/* Brief output area */}
        <div
          style={{
            background: '#080c14',
            border: '1px solid #161b22',
            borderRadius: 8,
            padding: '8px 10px',
            minHeight: 56,
            marginBottom: 10,
          }}
        >
          {(briefText || isReduced) && (
            <pre
              style={{
                fontFamily: F.mono,
                fontSize: 11,
                color: '#a3a3a3',
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {isReduced ? BRIEF_LINES.join('\n') : briefText}
              {!isReduced && phase === 6 && (
                <span style={{ opacity: 0.6, animation: 'mjPulse 0.8s infinite' }}>|</span>
              )}
            </pre>
          )}
        </div>

        {/* Notification */}
        {(showNotif || isReduced) && (
          <div
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              animation: isReduced ? 'none' : 'mjSlideIn 0.4s ease forwards',
            }}
          >
            <span style={{ fontSize: 14 }}>{'\u2713'}</span>
            <span style={{ fontFamily: F.body, fontSize: 11, color: '#10b981', fontWeight: 500 }}>
              Price alert set {'\u2014'} you{'\u2019'}ll know first
            </span>
          </div>
        )}
      </div>

      {/* Animated cursor (hidden on reduced motion) */}
      {!isReduced && phase >= 0 && (
        <div
          className="mj-demo-cursor"
          style={{
            left: cursorPos.left,
            top: cursorPos.top,
          }}
        >
          <CursorSVG clicking={clicking} />
        </div>
      )}
    </div>
  );
}

/* ── Mobile static card ─────────────────────────────────────── */

function MobileStaticCard({ product }: { product: DemoProduct }) {
  return (
    <div
      className="mj-hero-mobile-card"
      style={{
        display: 'none',
        flexDirection: 'column',
        gap: 12,
        background: '#0a0d14',
        border: '1px solid #161b22',
        borderRadius: 14,
        padding: '16px 20px',
        maxWidth: 360,
        width: '100%',
        margin: '24px auto 0',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', fontFamily: F.body }}>
        {product.title}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 700, color: '#4f8ef7', background: '#1e3a5f', padding: '2px 8px', borderRadius: 6 }}>
          {product.score}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>HOT {'\uD83D\uDD25'}</span>
        <span style={{ fontFamily: F.mono, fontSize: 14, color: '#8b949e' }}>
          {formatOrders(product.orders)} orders
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', fontFamily: F.body }}>{product.category}</div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────────── */

export function Hero() {
  const [product, setProduct] = useState<DemoProduct>(FALLBACK_PRODUCT);
  const [liveCount, setLiveCount] = useState(12);

  // Fetch demo product
  useEffect(() => {
    let cancelled = false;
    fetchDemoProduct().then((p) => {
      if (!cancelled) setProduct(p);
    });
    return () => { cancelled = true; };
  }, []);

  // Live count ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((prev) => {
        if (prev >= 99) return 8 + Math.floor(Math.random() * 8);
        return prev + 8 + Math.floor(Math.random() * 11);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="mj-hero-minimal"
      style={{
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '55% 45%',
        alignItems: 'center',
      }}
    >
      <style>{HERO_CSS}</style>

      {/* Background layers */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: '#04060f', zIndex: 0 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 400px at 60% 50%, rgba(79,142,247,0.05), transparent)', zIndex: 1 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', zIndex: 2 }} />

      {/* Left: headline + CTA */}
      <div
        className="mj-hero-minimal-left"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '0 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Headline */}
        <h1 style={{
          fontFamily: F.display,
          fontSize: 'clamp(44px, 6vw, 72px)',
          fontWeight: 900,
          lineHeight: 1.05,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          margin: '0 0 16px',
        }}>
          Know what sells.<br />
          Before anyone else does.
        </h1>
        <p style={{
          fontFamily: F.body,
          fontSize: 19,
          color: '#6b7280',
          lineHeight: 1.6,
          margin: '0 0 32px',
          maxWidth: 480,
        }}>
          Real order velocity data on millions of AliExpress products. Updated every 6 hours.
        </p>

        {/* CTA row */}
        <div>
          <a
            href="/sign-up"
            className="mj-hero-cta"
            style={{
              display: 'inline-block',
              fontFamily: F.body,
              fontSize: 16,
              fontWeight: 600,
              color: '#ffffff',
              background: '#4f8ef7',
              border: 'none',
              borderRadius: 10,
              padding: '14px 32px',
              textDecoration: 'none',
              transition: 'all 200ms ease',
            }}
          >
            Get Started {'\u2192'}
          </a>
          <p style={{
            fontFamily: F.body,
            fontSize: 14,
            color: '#4b5563',
            marginTop: 12,
          }}>
            {'\u2713'} No credit card {'\u00B7'} {'\u2713'} Cancel anytime {'\u00B7'} {'\u2713'} 30-day guarantee
          </p>
        </div>

        {/* Live dropshipper count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
              animation: 'mjPulse 2s infinite',
            }}
          />
          <span style={{ fontFamily: F.body, fontSize: 14, color: '#6b7280' }}>
            {liveCount} dropshippers found a winner in the last hour
          </span>
        </div>

        {/* Mobile static card */}
        <MobileStaticCard product={product} />
      </div>

      {/* Right: Animated product demo */}
      <div
        className="mj-hero-demo-wrap"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <AnimatedDemo product={product} />
      </div>
    </section>
  );
}
