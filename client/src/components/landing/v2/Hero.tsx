import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { LT, F } from '@/lib/landingTokens';

/* ── types ──────────────────────────────────────────────────── */

interface HeroProduct {
  title: string;
  score: number;
  orders: number;
  price: number;
  category: string;
}

/* ── data fetching ─────────────────────────────────────────── */

const CATEGORIES = ['Pet', 'Kitchen', 'Home', 'Beauty'] as const;

async function fetchScoreProducts(): Promise<HeroProduct[]> {
  const results = await Promise.allSettled(
    CATEGORIES.map(async (category) => {
      const res = await fetch(`/api/demo/quick-score?category=${category}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.ok || !json.product) return null;
      const p = json.product;
      const score = Number(p.score) || 0;
      if (score < 75) return null;
      return {
        title: String(p.title || ''),
        score,
        orders: Number(p.orders) || 0,
        price: Number(p.price_aud) || 0,
        category: String(p.category || category),
      } as HeroProduct;
    }),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<HeroProduct | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((p): p is HeroProduct => p !== null && p.score >= 75);
}

/* ── helpers ────────────────────────────────────────────────── */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function formatOrders(n: number): string {
  return n.toLocaleString('en-AU');
}

function formatRevenue(orders: number, price: number): string | null {
  const rev = Math.round(orders * price * 0.3);
  if (!rev || !Number.isFinite(rev) || rev <= 0) return null;
  if (rev >= 1000) return `$${(rev / 1000).toFixed(1)}k/mo`;
  return `$${rev}/mo`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '\u2026' : s;
}

function getLabel(score: number): { text: string; color: string; bg: string } | null {
  if (score >= 90) return { text: 'HOT \uD83D\uDD25', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  if (score >= 80) return { text: 'TRENDING \u2191', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' };
  return null;
}

function getTargetLine(category: string): string {
  const targets: Record<string, string> = {
    Pet: 'Pet owners 25-44 in AU',
    Kitchen: 'Home cooks 28-50 in AU',
    Home: 'Homeowners 30-55 in AU',
    Beauty: 'Beauty enthusiasts 18-35 in AU',
  };
  return targets[category] || `${category} shoppers in AU`;
}

/* ── reduced motion check ──────────────────────────────────── */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

/* ── CSS ────────────────────────────────────────────────────── */

const HERO_CSS = `
@keyframes mjPulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
}
@keyframes mjLabelPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes mjCobaltPulse {
  0% { box-shadow: 0 0 0 0 rgba(79,142,247,0.3); }
  70% { box-shadow: 0 0 0 6px rgba(79,142,247,0); }
  100% { box-shadow: 0 0 0 0 rgba(79,142,247,0); }
}
@keyframes heroGridPulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.55; }
}
.mj-hero-cta:hover {
  background-color: #6ba3ff !important;
  transform: scale(1.02);
  box-shadow: 0 10px 40px -8px rgba(79,142,247,0.55);
}
@media (max-width: 768px) {
  .mj-hero-split { grid-template-columns: 1fr !important; }
  .mj-hero-left {
    padding: 100px 20px 32px !important;
    text-align: center;
    align-items: center;
  }
  .mj-hero-h1 { font-size: 36px !important; }
  .mj-hero-right { padding: 0 20px 40px !important; }
  .mj-hero-score-num { font-size: clamp(60px, 15vw, 80px) !important; }
  .mj-hero-card { padding: 24px !important; }
  .mj-hero-cta { width: 100% !important; align-self: stretch !important; }
  .mj-hero-trust { text-align: center; }
}
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0s !important; transition-duration: 0s !important; }
}
`;

/* ── Score Card ─────────────────────────────────────────────── */

interface ScoreCardProps {
  product: HeroProduct;
  isVisible: boolean;
  reducedMotion: boolean;
}

function ScoreCard({ product, isVisible, reducedMotion }: ScoreCardProps) {
  const [phase, setPhase] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [glowActive, setGlowActive] = useState(false);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef(0);

  // Reset on product change
  useEffect(() => {
    if (!isVisible) return;

    if (reducedMotion) {
      setPhase(5);
      setDisplayScore(product.score);
      setProgressWidth(product.score);
      setGlowActive(true);
      return;
    }

    setPhase(0);
    setDisplayScore(0);
    setProgressWidth(0);
    setGlowActive(false);
    phaseRef.current = 0;

    // Phase 1: product name (0-600ms)
    const t1 = setTimeout(() => { setPhase(1); phaseRef.current = 1; }, 50);

    // Phase 2: score counter (600-1800ms)
    const t2 = setTimeout(() => {
      setPhase(2);
      phaseRef.current = 2;
      const startTime = performance.now();
      const duration = 1200;
      const target = product.score;

      function tick(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const val = Math.round(easeOutCubic(t) * target);
        setDisplayScore(val);
        setProgressWidth(easeOutCubic(t) * target);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }, 600);

    // Phase 3: stats (1800-2800ms)
    const t3 = setTimeout(() => { setPhase(3); phaseRef.current = 3; }, 1800);

    // Phase 4: label (2800-3400ms)
    const t4 = setTimeout(() => { setPhase(4); phaseRef.current = 4; }, 2800);

    // Phase 5: glow (3400ms+)
    const t5 = setTimeout(() => {
      setPhase(5);
      phaseRef.current = 5;
      setGlowActive(true);
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [product, isVisible, reducedMotion]);

  const label = getLabel(product.score);
  const revenue = formatRevenue(product.orders, product.price);
  const showPhase = reducedMotion ? 5 : phase;

  const statLines = [
    { text: `${formatOrders(product.orders)} orders`, color: '#ffffff' },
    { text: `AU demand ${Math.min(99, Math.round(product.score * 0.52))}%`, color: '#8b949e' },
    ...(revenue ? [{ text: `Est. ${revenue} revenue`, color: '#10b981' }] : []),
  ];

  return (
    <div
      className="mj-hero-card"
      style={{
        background: '#0d1117',
        border: '1px solid #161b22',
        borderRadius: 16,
        padding: '32px 40px',
        maxWidth: 420,
        width: '100%',
        position: 'relative',
        transition: 'box-shadow 400ms ease',
        boxShadow: glowActive ? '0 0 40px rgba(79,142,247,0.15)' : 'none',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : 'translateY(8px)',
      }}
    >
      {/* Phase 1: Scoring label + product name */}
      <div style={{
        opacity: showPhase >= 1 ? 1 : 0,
        transform: showPhase >= 1 ? 'translateY(0)' : 'translateY(8px)',
        transition: reducedMotion ? 'none' : 'opacity 300ms ease, transform 300ms ease',
      }}>
        {/* Scoring indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: LT.cobalt,
            animation: showPhase < 5 ? 'mjCobaltPulse 1.5s infinite' : 'none',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: F.mono,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: '#8b949e',
          }}>
            {showPhase >= 5 ? 'SCORED' : 'SCORING\u2026'}
          </span>
        </div>

        {/* Product name + category */}
        <div style={{
          fontFamily: F.body,
          fontSize: 18,
          fontWeight: 500,
          color: '#ffffff',
          marginBottom: 4,
          lineHeight: 1.3,
        }}>
          {truncate(product.title, 50)}
        </div>
        <div style={{
          display: 'inline-block',
          fontFamily: F.body,
          fontSize: 11,
          color: '#6b7280',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 4,
          padding: '2px 8px',
          marginBottom: 24,
        }}>
          {product.category}
        </div>
      </div>

      {/* Phase 2: THE SCORE */}
      <div style={{
        opacity: showPhase >= 2 ? 1 : 0,
        transition: reducedMotion ? 'none' : 'opacity 200ms ease',
      }}>
        <div
          className="mj-hero-score-num"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(80px, 12vw, 120px)',
            lineHeight: 1,
            color: LT.cobalt,
            letterSpacing: '-0.03em',
            marginBottom: 8,
          }}
        >
          {displayScore}
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: 3,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          marginBottom: 24,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progressWidth}%`,
            height: '100%',
            background: LT.cobalt,
            borderRadius: 2,
            transition: reducedMotion ? 'none' : 'width 50ms linear',
          }} />
        </div>
      </div>

      {/* Phase 3: Stats */}
      <div style={{ minHeight: 72 }}>
        {statLines.map((line, i) => (
          <div
            key={line.text}
            style={{
              fontFamily: F.mono,
              fontSize: 15,
              color: line.color,
              lineHeight: 1.8,
              opacity: showPhase >= 3 ? 1 : 0,
              transform: showPhase >= 3 ? 'translateX(0)' : 'translateX(12px)',
              transition: reducedMotion
                ? 'none'
                : `opacity 300ms ease ${i * 150}ms, transform 300ms ease ${i * 150}ms`,
            }}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Phase 4: Label + target */}
      <div style={{ marginTop: 16, minHeight: 48 }}>
        {label && (
          <span style={{
            display: 'inline-block',
            fontFamily: F.mono,
            fontSize: 12,
            fontWeight: 700,
            color: label.color,
            background: label.bg,
            borderRadius: 999,
            padding: '4px 12px',
            letterSpacing: '0.08em',
            opacity: showPhase >= 4 ? 1 : 0,
            animation: showPhase === 4 && !reducedMotion ? 'mjLabelPop 400ms ease forwards' : 'none',
            ...(showPhase >= 5 ? { transform: 'scale(1)' } : {}),
          }}>
            {label.text}
          </span>
        )}
        <div style={{
          fontFamily: F.body,
          fontSize: 14,
          fontStyle: 'italic',
          color: '#6b7280',
          marginTop: 8,
          opacity: showPhase >= 4 ? 1 : 0,
          transition: reducedMotion ? 'none' : 'opacity 300ms ease 200ms',
        }}>
          {'\u2192'} Target: {getTargetLine(product.category)}
        </div>
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────────── */

export function Hero() {
  const [products, setProducts] = useState<HeroProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardVisible, setCardVisible] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobileRef = useRef(false);

  // Check mobile once
  useEffect(() => {
    isMobileRef.current = window.innerWidth <= 768;
  }, []);

  // Fetch products
  useEffect(() => {
    let cancelled = false;
    fetchScoreProducts().then((p) => {
      if (!cancelled && p.length > 0) setProducts(p);
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-cycle (desktop only, 8s interval)
  const startCycle = useCallback(() => {
    if (isMobileRef.current || products.length <= 1) return;
    cycleTimerRef.current = setTimeout(() => {
      setCardVisible(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % products.length);
        setCardVisible(true);
        startCycle();
      }, 300);
    }, 8000);
  }, [products]);

  useEffect(() => {
    if (products.length === 0) return;
    startCycle();
    return () => { if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current); };
  }, [products, startCycle]);

  // Pause on hidden
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      } else {
        startCycle();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [startCycle]);

  const activeProduct = products[activeIndex] || null;

  return (
    <section
      className="mj-hero-split"
      style={{
        minHeight: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        alignItems: 'center',
      }}
    >
      <style>{HERO_CSS}</style>

      {/* BG layers */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: '#04060f', zIndex: 0 }} />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(79,142,247,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(circle at 50% 40%, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black 0%, transparent 70%)',
          animation: 'heroGridPulse 8s ease-in-out infinite',
          zIndex: 1,
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '35%',
          top: '15%',
          width: 800,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(79,142,247,0.12) 0%, transparent 65%)',
          filter: 'blur(40px)',
          zIndex: 2,
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, #04060f 100%)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      {/* LEFT HALF */}
      <div
        className="mj-hero-left"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 64px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: F.mono,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: '#6ba3ff',
              background: 'rgba(79,142,247,0.1)',
              border: '1px solid rgba(79,142,247,0.3)',
              borderRadius: 999,
              padding: '5px 12px',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'mjPulse 2s infinite',
                flexShrink: 0,
              }}
            />
            Live {'\u00B7'} AU {'\u00B7'} US {'\u00B7'} UK
          </span>
        </div>

        {/* H1 */}
        <h1
          className="mj-hero-h1"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            margin: '0 0 20px 0',
            maxWidth: 440,
          }}
        >
          The dropshipping
          <br />
          intelligence platform.
        </h1>

        {/* Sub */}
        <p
          style={{
            fontFamily: F.body,
            fontSize: 17,
            color: '#8b949e',
            lineHeight: 1.6,
            maxWidth: 440,
            margin: '0 0 32px 0',
          }}
        >
          Scores millions of AliExpress products by real order velocity.
          You see what's selling before you spend a dollar on ads.
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link
            href="/sign-up"
            className="mj-hero-cta"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'flex-start',
              padding: '16px 28px',
              gap: 8,
              background: '#4f8ef7',
              color: '#000',
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 12,
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
              boxShadow: '0 10px 40px -8px rgba(79,142,247,0.55)',
            }}
          >
            Get Started {'\u2192'}
          </Link>
        </div>

        {/* Trust */}
        <p
          className="mj-hero-trust"
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: '0.04em',
            color: '#6B7280',
            margin: 0,
          }}
        >
          No credit card {'\u00B7'} Cancel anytime {'\u00B7'} 30-day guarantee
        </p>
      </div>

      {/* RIGHT HALF — Score Reveal Card */}
      <div
        className="mj-hero-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
          padding: '0 32px',
        }}
      >
        {activeProduct && (
          <div style={{
            opacity: cardVisible ? 1 : 0,
            transition: reducedMotion ? 'none' : 'opacity 300ms ease',
          }}>
            <ScoreCard
              product={activeProduct}
              isVisible={cardVisible}
              reducedMotion={reducedMotion}
            />
          </div>
        )}
      </div>
    </section>
  );
}
