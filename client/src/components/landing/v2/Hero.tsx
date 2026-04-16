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

interface MiniProduct {
  id: string;
  title: string;
  score: number;
  orders: number;
  image: string | null;
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

async function fetchMiniProducts(): Promise<MiniProduct[]> {
  const seeds = Array.from({ length: 18 }, (_, i) => i);
  const results = await Promise.allSettled(
    seeds.map(async (seed) => {
      const category = CATEGORIES[seed % CATEGORIES.length];
      const res = await fetch(`/api/demo/quick-score?category=${category}&seed=${seed}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.ok || !json.product) return null;
      const p = json.product;
      const score = Number(p.score) || 0;
      if (score < 75) return null;
      return {
        id: String(p.id || seed),
        title: String(p.title || ''),
        score,
        orders: Number(p.orders) || 0,
        image: p.image || null,
      } as MiniProduct;
    }),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<MiniProduct | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((p): p is MiniProduct => p !== null);
}

/* ── helpers ────────────────────────────────────────────────── */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function formatOrdersShort(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}k sold`;
  return `${n} sold`;
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
@keyframes mjScrollUp {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}
@keyframes mjBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
.mj-hero-cta:hover {
  background-color: #6ba3ff !important;
  transform: scale(1.02);
  box-shadow: 0 10px 40px -8px rgba(79,142,247,0.55);
}
.mj-hero-col-1 { animation: mjScrollUp 20s linear infinite; }
.mj-hero-col-2 { animation: mjScrollUp 28s linear infinite; }
.mj-hero-col-3 { animation: mjScrollUp 24s linear infinite; }
@media (max-width: 768px) {
  .mj-hero-3zone { grid-template-columns: 1fr !important; }
  .mj-hero-middle { display: none !important; }
  .mj-hero-left {
    padding: 100px 20px 24px !important;
    text-align: center;
    align-items: center;
  }
  .mj-hero-h1 { font-size: 36px !important; }
  .mj-hero-right { padding: 0 20px 80px !important; }
  .mj-hero-cta { width: 100% !important; align-self: stretch !important; }
  .mj-hero-trust { text-align: center; }
}
@media (prefers-reduced-motion: reduce) {
  .mj-hero-col-1, .mj-hero-col-2, .mj-hero-col-3 { animation: none !important; }
  .mj-hero-bounce { animation: none !important; }
  * { transition-duration: 0s !important; }
}
`;

/* ── Mini Product Card ─────────────────────────────────────── */

function MiniCard({ product }: { product: MiniProduct }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = product.image ? `/api/image-proxy?url=${encodeURIComponent(product.image)}` : null;

  return (
    <div
      style={{
        background: '#0d1117',
        border: '1px solid #161b22',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        width: '100%',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', height: 80, borderRadius: 6, overflow: 'hidden' }}>
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt=""
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0d1117, #161b22)' }} />
        )}
        {/* Score badge */}
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: '#1e3a5f',
            color: '#4f8ef7',
            fontFamily: F.mono,
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            lineHeight: 1.3,
          }}
        >
          {product.score}
        </span>
      </div>
      {/* Name */}
      <div
        style={{
          fontFamily: F.body,
          fontSize: 11,
          color: '#ffffff',
          marginTop: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
        }}
      >
        {truncate(product.title, 40)}
      </div>
      {/* Orders */}
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 10,
          color: '#6b7280',
          marginTop: 2,
        }}
      >
        {formatOrdersShort(product.orders)}
      </div>
    </div>
  );
}

/* ── Scrolling Column ──────────────────────────────────────── */

function ScrollColumn({ products, className }: { products: MiniProduct[]; className: string }) {
  // Duplicate for seamless loop
  const doubled = [...products, ...products];
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column' }}>
      {doubled.map((p, i) => (
        <MiniCard key={`${p.id}-${i}`} product={p} />
      ))}
    </div>
  );
}

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

    const t1 = setTimeout(() => { setPhase(1); phaseRef.current = 1; }, 50);
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

    const t3 = setTimeout(() => { setPhase(3); phaseRef.current = 3; }, 1800);
    const t4 = setTimeout(() => { setPhase(4); phaseRef.current = 4; }, 2800);
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
  const showPhase = reducedMotion ? 5 : phase;

  // Market bars — AU-skewed
  const auPct = Math.min(99, Math.round(product.score * 0.52));
  const usPct = 31;
  const ukPct = 20;

  return (
    <div
      className="mj-hero-card"
      style={{
        background: '#0d1117',
        border: '1px solid #161b22',
        borderRadius: 16,
        padding: 28,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
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
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: '#8b949e',
          }}>
            {showPhase >= 5 ? 'SCORED' : 'SCORING\u2026'}
          </span>
        </div>

        <div style={{
          fontFamily: F.body,
          fontSize: 16,
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
          fontSize: 12,
          color: '#6b7280',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 4,
          padding: '2px 8px',
          marginBottom: 20,
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
            fontWeight: 800,
            fontSize: 56,
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
          marginBottom: 20,
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

      {/* Phase 3: Market bars */}
      <div style={{
        minHeight: 64,
        opacity: showPhase >= 3 ? 1 : 0,
        transform: showPhase >= 3 ? 'translateY(0)' : 'translateY(8px)',
        transition: reducedMotion ? 'none' : 'opacity 300ms ease, transform 300ms ease',
      }}>
        {[
          { label: 'AU', pct: auPct, opacity: 1 },
          { label: 'US', pct: usPct, opacity: 0.6 },
          { label: 'UK', pct: ukPct, opacity: 0.4 },
        ].map((bar) => (
          <div key={bar.label} style={{ marginBottom: 8 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 3,
            }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: '#8b949e' }}>
                {bar.label} {bar.pct}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 4,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${bar.pct}%`,
                height: '100%',
                background: LT.cobalt,
                opacity: bar.opacity,
                borderRadius: 2,
                transition: reducedMotion ? 'none' : 'width 800ms ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Phase 4: Label + target */}
      <div style={{ marginTop: 12, minHeight: 48 }}>
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
          fontSize: 13,
          fontStyle: 'italic',
          color: '#6b7280',
          marginTop: 8,
          opacity: showPhase >= 4 ? 1 : 0,
          transition: reducedMotion ? 'none' : 'opacity 300ms ease 200ms',
        }}>
          {'\u2192'} Target: {getTargetLine(product.category)}
        </div>
      </div>

      {/* View link */}
      <div style={{
        marginTop: 16,
        opacity: showPhase >= 5 ? 1 : 0,
        transition: reducedMotion ? 'none' : 'opacity 300ms ease',
      }}>
        <span style={{
          fontFamily: F.body,
          fontSize: 13,
          color: LT.cobalt,
          cursor: 'pointer',
        }}>
          View this product {'\u2192'}
        </span>
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────────── */

export function Hero() {
  const [products, setProducts] = useState<HeroProduct[]>([]);
  const [miniProducts, setMiniProducts] = useState<MiniProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardVisible, setCardVisible] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current = window.innerWidth <= 768;
  }, []);

  // Fetch score card products
  useEffect(() => {
    let cancelled = false;
    fetchScoreProducts().then((p) => {
      if (!cancelled && p.length > 0) setProducts(p);
    });
    return () => { cancelled = true; };
  }, []);

  // Fetch mini products for middle columns
  useEffect(() => {
    let cancelled = false;
    fetchMiniProducts().then((p) => {
      if (!cancelled && p.length > 0) setMiniProducts(p);
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-cycle every 4s with crossfade
  const startCycle = useCallback(() => {
    if (isMobileRef.current || products.length <= 1) return;
    cycleTimerRef.current = setTimeout(() => {
      setCardVisible(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % products.length);
        setCardVisible(true);
        startCycle();
      }, 300);
    }, 4000);
  }, [products]);

  useEffect(() => {
    if (products.length === 0) return;
    startCycle();
    return () => { if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current); };
  }, [products, startCycle]);

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

  // Distribute mini products into 3 columns of 6
  const col1 = miniProducts.slice(0, 6);
  const col2 = miniProducts.slice(6, 12);
  const col3 = miniProducts.slice(12, 18);

  // Social proof avatars
  const avatars = [
    { initials: 'JM', bg: LT.cobalt },
    { initials: 'SL', bg: '#22c55e' },
    { initials: 'RT', bg: '#7c3aed' },
    { initials: 'CR', bg: '#f59e0b' },
    { initials: 'AB', bg: LT.cobalt },
  ];

  return (
    <section
      className="mj-hero-3zone"
      style={{
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '30% 40% 30%',
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

      {/* ── LEFT ZONE (30%) ── */}
      <div
        className="mj-hero-left"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 32px 0 48px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
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
          <span style={{ fontFamily: F.mono, fontSize: 11, color: '#6b7280' }}>
            {'\u25CF'} LIVE
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: '#6b7280' }}>
            AU {'\u00B7'} US {'\u00B7'} UK
          </span>
        </div>

        {/* H1 */}
        <h1
          className="mj-hero-h1"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            margin: '0 0 16px 0',
          }}
        >
          Know what sells before you sell it.
        </h1>

        {/* Sub */}
        <p
          style={{
            fontFamily: F.body,
            fontSize: 15,
            color: '#8b949e',
            lineHeight: 1.6,
            margin: '0 0 24px 0',
          }}
        >
          Majorka scores millions of AliExpress products by real order velocity. You see winners first.
        </p>

        {/* CTA */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/sign-up"
            className="mj-hero-cta"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 28px',
              background: '#4f8ef7',
              color: '#000',
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 10,
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

        {/* Social proof */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {avatars.map((a, i) => (
              <div
                key={a.initials}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: a.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: i === 0 ? 0 : -8,
                  border: '2px solid #04060f',
                  zIndex: 5 - i,
                  position: 'relative',
                }}
              >
                <span style={{
                  fontFamily: F.body,
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1,
                }}>
                  {a.initials}
                </span>
              </div>
            ))}
          </div>
          <span style={{
            fontFamily: F.body,
            fontSize: 13,
            color: '#6b7280',
            marginLeft: 10,
          }}>
            Join 287 dropshippers already winning
          </span>
        </div>

        {/* Trust line */}
        <p style={{
          fontFamily: F.body,
          fontSize: 12,
          color: '#4b5563',
          margin: 0,
        }}>
          {'\u2713'} No credit card {'\u00B7'} {'\u2713'} Cancel anytime
        </p>
      </div>

      {/* ── MIDDLE ZONE (40%) ── */}
      <div
        className="mj-hero-middle"
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          zIndex: 10,
          display: 'flex',
          gap: 12,
          padding: '0 8px',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        {/* Additional left/right fades via a wrapper */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 20,
            background: 'linear-gradient(to right, #04060f 0%, transparent 10%, transparent 90%, #04060f 100%)',
          }}
        />
        {col1.length > 0 && (
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <ScrollColumn products={col1} className="mj-hero-col-1" />
          </div>
        )}
        {col2.length > 0 && (
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <ScrollColumn products={col2} className="mj-hero-col-2" />
          </div>
        )}
        {col3.length > 0 && (
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <ScrollColumn products={col3} className="mj-hero-col-3" />
          </div>
        )}
      </div>

      {/* ── RIGHT ZONE (30%) ── */}
      <div
        className="mj-hero-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 48px 0 32px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {activeProduct && (
          <div style={{
            width: '100%',
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

      {/* ── BELOW THE FOLD HINT ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div style={{ width: 40, height: 1, background: '#161b22' }} />
        <span
          className="mj-hero-bounce"
          style={{
            fontFamily: F.body,
            fontSize: 12,
            color: '#4b5563',
            animation: 'mjBounce 2s infinite',
          }}
        >
          {'\u2193'} See how it works
        </span>
      </div>
    </section>
  );
}
