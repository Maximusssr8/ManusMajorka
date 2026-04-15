// Delta 2 — Live Scorer: 5 category chips backed by real DB products.
// Endpoint: GET /api/demo/quick-score?category=<Pet|Kitchen|Home|Beauty|Fitness>
// Response: { ok: true, product: { id, title, image, price_aud, orders, score,
//   market_split:{au,us,uk}, sparkline:number[], brief, category } }
// Auto-cycles to the next chip every 6s of inactivity (Delta 3 cadence).

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { LT, F, R, SHADOW } from '@/lib/landingTokens';
import { proxyImage } from '@/lib/imageProxy';
import { CountUp, MarketSplitBars, SparklineDraw, Typewriter, usePrefersReducedMotion } from '../primitives';

// ── Config ──────────────────────────────────────────────────────────────────
type CategoryKey = 'Pet' | 'Kitchen' | 'Home' | 'Beauty' | 'Fitness';
interface Chip { key: CategoryKey; label: string; }

const CHIPS: Chip[] = [
  { key: 'Pet',     label: 'Pet Products' },
  { key: 'Kitchen', label: 'Kitchen & Bar' },
  { key: 'Home',    label: 'Home Storage' },
  { key: 'Beauty',  label: 'Beauty' },
  { key: 'Fitness', label: 'Fitness' },
];

const AUTO_CYCLE_MS = 6000; // Delta 3: 6 seconds
const TOTAL_SCORED = 4155;  // CTA count — marketing-shelf number

// ── API payload shape ───────────────────────────────────────────────────────
interface DemoProduct {
  id: string;
  title: string;
  image: string | null;
  price_aud: number;
  orders: number;
  score: number;
  market_split: { au: number; us: number; uk: number };
  sparkline: number[];
  brief: string;
  category: string;
}

interface DemoOk { ok: true; product: DemoProduct; }
interface DemoErr { ok: false; reason: string; }
type DemoResponse = DemoOk | DemoErr;

// ── Sampled fallback (2 consecutive API fails) ──────────────────────────────
const SAMPLED: Record<CategoryKey, DemoProduct> = {
  Pet: {
    id: 'sampled-pet',
    title: 'Self-Cleaning Slow Feeder Bowl',
    image: null, price_aud: 24.9, orders: 18400, score: 87,
    market_split: { au: 42, us: 38, uk: 20 },
    sparkline: [12,14,13,17,22,24,28,31,30,34,38,41,45,48,50,54,58,61,66,70,72,75,79,82,85,88,91,94,97,100],
    brief: 'Pet staple · 18,400+ orders · AU demand 42%',
    category: 'Pet',
  },
  Kitchen: {
    id: 'sampled-kitchen',
    title: 'Electric Citrus Juicer (USB-C)',
    image: null, price_aud: 34.5, orders: 22100, score: 91,
    market_split: { au: 45, us: 36, uk: 19 },
    sparkline: [15,17,19,21,25,28,32,36,40,44,48,52,56,60,64,68,72,74,78,82,85,87,90,92,94,95,96,97,98,100],
    brief: 'Kitchen staple · 22,100+ orders · AU demand 45%',
    category: 'Kitchen',
  },
  Home: {
    id: 'sampled-home',
    title: 'Foldable Storage Cube Set (6-pack)',
    image: null, price_aud: 19.5, orders: 14800, score: 84,
    market_split: { au: 40, us: 40, uk: 20 },
    sparkline: [10,11,13,15,18,22,26,30,34,38,41,44,48,52,55,58,62,66,70,73,76,79,82,85,88,91,94,96,98,100],
    brief: 'Home staple · 14,800+ orders · AU demand 40%',
    category: 'Home',
  },
  Beauty: {
    id: 'sampled-beauty',
    title: 'LED Scalp Massager Pro',
    image: null, price_aud: 42.9, orders: 31200, score: 94,
    market_split: { au: 48, us: 34, uk: 18 },
    sparkline: [20,22,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,83,86,88,90,92,94,95,96,97,98,99,99,100],
    brief: 'Beauty staple · 31,200+ orders · AU demand 48%',
    category: 'Beauty',
  },
  Fitness: {
    id: 'sampled-fitness',
    title: 'Adjustable Resistance Loop Kit',
    image: null, price_aud: 29.0, orders: 12600, score: 82,
    market_split: { au: 38, us: 42, uk: 20 },
    sparkline: [8,10,12,15,18,22,26,30,34,38,42,45,48,52,55,58,62,65,68,71,74,77,80,83,86,89,92,94,97,100],
    brief: 'Fitness staple · 12,600+ orders · AU demand 38%',
    category: 'Fitness',
  },
};

// ── Component ───────────────────────────────────────────────────────────────
export interface QuickScoreHeroProps {
  // Unused legacy prop — kept to avoid churn in <Hero /> callsite.
  externalUrl?: string | null;
}

export function QuickScoreHero(_props: QuickScoreHeroProps) {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState<CategoryKey>('Pet');
  const [loading, setLoading] = useState<boolean>(true);
  const [product, setProduct] = useState<DemoProduct | null>(null);
  const [sampled, setSampled] = useState<boolean>(false);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);

  // Sequential anim flags, derived from a single "phase" timer.
  const [phase, setPhase] = useState<number>(0); // 0 skeleton, 1 image+name, 2 stats, 3 markets, 4 spark, 5 brief

  const failStreak = useRef<number>(0);
  const cycleTimer = useRef<number | null>(null);
  const userInteracted = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  // ── Fetch + orchestrate ──────────────────────────────────────────────────
  const runCategory = useCallback(async (key: CategoryKey) => {
    setActive(key);
    setLoading(true);
    setProduct(null);
    setImgLoaded(false);
    setPhase(0);

    let result: DemoProduct | null = null;
    let isSampled = false;

    try {
      const r = await fetch(`/api/demo/quick-score?category=${encodeURIComponent(key)}`, {
        credentials: 'omit',
      });
      const json: DemoResponse = await r.json();
      if (r.ok && json.ok) {
        result = json.product;
        failStreak.current = 0;
      } else {
        throw new Error(json.ok ? 'ok-but-bad' : json.reason);
      }
    } catch {
      failStreak.current += 1;
      if (failStreak.current >= 2) {
        result = SAMPLED[key];
        isSampled = true;
      }
    }

    if (!mountedRef.current) return;

    if (!result) {
      // First failure — show a minimal fallback to avoid a dead card.
      result = SAMPLED[key];
      isSampled = true;
    }

    setSampled(isSampled);
    setProduct(result);
    setLoading(false);

    // Orchestrate 700-900ms sequence: 100ms skeleton already elapsed by render.
    if (reduced) {
      setPhase(5);
      return;
    }
    const t1 = window.setTimeout(() => mountedRef.current && setPhase(1), 100);
    const t2 = window.setTimeout(() => mountedRef.current && setPhase(2), 250);
    const t3 = window.setTimeout(() => mountedRef.current && setPhase(3), 450);
    const t4 = window.setTimeout(() => mountedRef.current && setPhase(4), 650);
    const t5 = window.setTimeout(() => mountedRef.current && setPhase(5), 800);
    // Cleanup on next call handled via mountedRef guards.
    void t1; void t2; void t3; void t4; void t5;
  }, [reduced]);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    runCategory('Pet');
    // We intentionally only want this on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-cycle every 6 seconds of inactivity, paused when tab hidden ────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const clear = () => {
      if (cycleTimer.current !== null) {
        window.clearTimeout(cycleTimer.current);
        cycleTimer.current = null;
      }
    };
    const schedule = () => {
      clear();
      if (userInteracted.current) return;
      cycleTimer.current = window.setTimeout(() => {
        if (document.hidden || userInteracted.current) {
          schedule(); // re-check later
          return;
        }
        const currentIdx = CHIPS.findIndex((c) => c.key === active);
        const next = CHIPS[(currentIdx + 1) % CHIPS.length].key;
        runCategory(next).then(schedule);
      }, AUTO_CYCLE_MS);
    };
    schedule();

    const onVisibility = () => { schedule(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active, runCategory]);

  const onChip = (key: CategoryKey) => {
    userInteracted.current = true;
    if (cycleTimer.current !== null) {
      window.clearTimeout(cycleTimer.current);
      cycleTimer.current = null;
    }
    runCategory(key);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: LT.bgElevated,
        border: `1px solid ${LT.border}`,
        borderRadius: R.card,
        padding: 24,
        display: 'grid',
        gap: 16,
      }}
    >
      {/* Live badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: 100, background: LT.gold,
          animation: reduced ? undefined : 'mjLivePulse 1.6s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: F.mono, fontSize: 11, color: LT.gold,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Live Scorer · Real DB Data
        </span>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CHIPS.map((c) => {
          const isActive = c.key === active;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onChip(c.key)}
              aria-pressed={isActive}
              style={{
                minHeight: 44,
                padding: '8px 16px',
                borderRadius: 999,
                border: `1px solid ${isActive ? LT.gold : LT.border}`,
                background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                color: isActive ? LT.gold : LT.textMute,
                fontFamily: F.body,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'border-color 150ms ease, color 150ms ease, background 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = LT.gold;
                  (e.currentTarget as HTMLButtonElement).style.color = LT.gold;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = LT.border;
                  (e.currentTarget as HTMLButtonElement).style.color = LT.textMute;
                }
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Result region */}
      <div aria-live="polite" aria-atomic="true" style={{ minHeight: 280 }}>
        {loading && !product && <ScorerSkeleton />}
        {product && (
          <ResultCard
            key={`${active}-${product.id}`}
            product={product}
            phase={phase}
            imgLoaded={imgLoaded}
            onImgLoad={() => setImgLoaded(true)}
            reduced={reduced}
          />
        )}
      </div>

      {/* Primary CTA */}
      <Link
        href="/sign-up"
        style={{
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 48,
          padding: '14px 22px',
          background: LT.gold,
          color: '#0a0a0a',
          border: 'none',
          borderRadius: 10,
          fontFamily: F.body,
          fontSize: 14,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: SHADOW.button,
          transition: 'transform 120ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
      >
        Find {TOTAL_SCORED.toLocaleString('en-AU')} products like this →
      </Link>

      {sampled && (
        <div style={{ fontFamily: F.mono, fontSize: 10, color: LT.textDim, lineHeight: 1.5, textAlign: 'center' }}>
          Sampled demo — API momentarily unavailable
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function ScorerSkeleton() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      padding: 16,
      background: LT.bgCard,
      border: `1px solid ${LT.border}`,
      borderRadius: R.card,
    }} className="mj-grid-two">
      <div style={{ display: 'grid', gap: 10 }}>
        <Shimmer w="60%" h={12} />
        <Shimmer w="80%" h={48} />
        <Shimmer w="100%" h={52} />
        <Shimmer w="100%" h={16} />
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <Shimmer w="100%" h={160} />
        <Shimmer w="90%" h={14} />
        <Shimmer w="70%" h={14} />
      </div>
    </div>
  );
}

function Shimmer({ w, h }: { w: number | string; h: number }) {
  return (
    <div
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: h,
        borderRadius: 8,
        background: `linear-gradient(90deg, ${LT.bg} 0%, rgba(255,255,255,0.04) 50%, ${LT.bg} 100%)`,
        backgroundSize: '200% 100%',
        animation: 'mjShimmer 1.1s linear infinite',
      }}
    >
      <style>{`@keyframes mjShimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }`}</style>
    </div>
  );
}

interface ResultProps {
  product: DemoProduct;
  phase: number;
  imgLoaded: boolean;
  onImgLoad: () => void;
  reduced: boolean;
}

function ResultCard({ product, phase, imgLoaded, onImgLoad, reduced }: ResultProps) {
  const markets = [
    { label: 'AU', pct: product.market_split.au },
    { label: 'US', pct: product.market_split.us },
    { label: 'UK', pct: product.market_split.uk },
  ];
  const proxied = proxyImage(product.image);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        padding: 16,
        background: LT.bgCard,
        border: `1px solid ${LT.border}`,
        borderRadius: R.card,
      }}
      className="mj-grid-two"
    >
      {/* LEFT: Score + sparkline + market bars */}
      <div style={{ display: 'grid', gap: 10 }}>
        <span style={{
          fontFamily: F.mono, fontSize: 10, color: LT.textMute,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Trend Velocity
        </span>
        <div style={{
          fontFamily: F.display, fontSize: 56, fontWeight: 800, color: LT.gold,
          lineHeight: 1,
          opacity: phase >= 2 ? 1 : 0,
          transition: reduced ? undefined : 'opacity 260ms ease-out',
        }}>
          {phase >= 2
            ? <CountUp to={product.score} duration={900} format={(v) => `${v}`} />
            : '0'}
        </div>
        <div style={{
          fontFamily: F.mono, fontSize: 11, color: LT.textMute,
          letterSpacing: '0.04em',
        }}>
          Orders (30d)
        </div>
        <div style={{
          fontFamily: F.mono, fontSize: 22, fontWeight: 700, color: LT.gold,
          opacity: phase >= 2 ? 1 : 0,
          transition: reduced ? undefined : 'opacity 260ms ease-out',
        }}>
          {phase >= 2
            ? <CountUp to={product.orders} duration={900} format={(v) => v.toLocaleString('en-AU')} />
            : '0'}
        </div>
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0)' : 'translateY(6px)',
          transition: reduced ? undefined : 'opacity 260ms ease-out, transform 260ms ease-out',
        }}>
          <MarketSplitBars data={markets} color={LT.gold} />
        </div>
        <div style={{
          opacity: phase >= 4 ? 1 : 0,
          transition: reduced ? undefined : 'opacity 260ms ease-out',
        }}>
          <SparklineDraw values={product.sparkline} width={260} height={52} color={LT.gold} />
        </div>
      </div>

      {/* RIGHT: Image + title + price + brief */}
      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <div style={{
          width: '100%',
          aspectRatio: '1 / 1',
          maxHeight: 160,
          borderRadius: 10,
          background: LT.bg,
          border: `1px solid ${LT.border}`,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {proxied && (
            <img
              src={proxied}
              alt={product.title}
              onLoad={onImgLoad}
              onError={onImgLoad}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: imgLoaded && phase >= 1 ? 1 : 0,
                transition: reduced ? undefined : 'opacity 260ms ease-out',
              }}
            />
          )}
        </div>
        <div style={{
          fontFamily: F.body, fontSize: 14, color: LT.text, fontWeight: 600, lineHeight: 1.3,
          opacity: phase >= 1 ? 1 : 0,
          transition: reduced ? undefined : 'opacity 260ms ease-out',
        }}>
          {product.title}
        </div>
        <div style={{
          fontFamily: F.mono, fontSize: 13, color: LT.textMute,
        }}>
          <span style={{ color: LT.text }}>${product.price_aud.toFixed(2)}</span>
          <span style={{ margin: '0 8px', color: LT.textDim }}>·</span>
          <span>{product.category}</span>
        </div>
        <div style={{
          fontFamily: F.body, fontSize: 13, color: LT.textMute, lineHeight: 1.5,
          padding: 12, background: LT.bg, border: `1px solid ${LT.border}`, borderRadius: 10,
          opacity: phase >= 5 ? 1 : 0,
          transition: reduced ? undefined : 'opacity 320ms ease-out',
        }}>
          {phase >= 5 ? <Typewriter text={product.brief} speed={18} /> : '\u00A0'}
        </div>
      </div>
    </div>
  );
}

export default QuickScoreHero;
