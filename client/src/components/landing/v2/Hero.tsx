/*
 * HERO — "The Scoring Moment"
 * A single product is scanned and scored live, phase by phase.
 * Visitor watches the drama unfold and thinks "I want that."
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { LT, F, MAX } from '@/lib/landingTokens';

/* ── types ──────────────────────────────────────────────────── */

interface DemoProduct {
  id: string;
  title: string;
  image: string | null;
  orders: number;
  score: number;
  category: string;
  estRevenue?: number;
}

/* ── data helpers ───────────────────────────────────────────── */

const CYCLE_CATEGORIES = ['Pet', 'Kitchen', 'Home', 'Beauty'] as const;

async function fetchDemoProduct(category: string): Promise<DemoProduct | null> {
  try {
    const res = await fetch(`/api/demo/quick-score?category=${category}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.ok || !json.product) return null;
    const p = json.product;
    const orders = p.orders ?? 0;
    const price = p.price ?? 0;
    return {
      id: p.id,
      title: p.title,
      image: p.image,
      orders,
      score: p.score ?? 0,
      category: p.category ?? category,
      estRevenue: p.estRevenue ?? Math.round((orders / 365) * price * 30),
    };
  } catch {
    return null;
  }
}

function proxyImg(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '\u2026' : s;
}

/* ── easing ─────────────────────────────────────────────────── */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/* ── CSS keyframes ──────────────────────────────────────────── */

const HERO_CSS = `
@keyframes mjPulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
}
@keyframes mjDrawLine {
  from { width: 0; }
  to { width: 100%; }
}
@keyframes mjFadeSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes mjCtaPulseGlow {
  0%, 100% { box-shadow: 0 0 30px rgba(79,142,247,0.3); }
  50% { box-shadow: 0 0 50px rgba(79,142,247,0.5); }
}
@keyframes mjShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes mjLabelPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes mjScoreGlow {
  0% { box-shadow: 0 0 40px rgba(79,142,247,0.3); }
  100% { box-shadow: 0 0 0px transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .mj-scoring-card, .mj-scoring-label, .mj-scoring-bar,
  .mj-scoring-brief, .mj-scoring-cta {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  .mj-hero-pulse-dot { animation: none !important; }
  .mj-score-counter { transition: none !important; }
}
@media (max-width: 768px) {
  .mj-hero-frame { transform: none !important; }
  .mj-scoring-bars { display: none !important; }
}
.mj-cta-primary-v2 {
  background-image: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%);
  background-size: 200% 100%;
  background-position: -200% 0;
  background-color: ${LT.cobalt};
}
.mj-cta-primary-v2:hover {
  animation: mjShimmer 0.4s ease forwards;
  transform: scale(1.03);
  box-shadow: 0 0 40px rgba(79,142,247,0.3);
  background-color: #3a7de0;
}
.mj-card-crossfade {
  transition: opacity 300ms ease;
}
.mj-card-crossfade-out {
  opacity: 0;
}
.mj-card-crossfade-in {
  opacity: 1;
}
`;

/* ── useCounter hook ────────────────────────────────────────── */

function useCounter(target: number, active: boolean, duration: number = 1200): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || target <= 0) { setValue(0); startRef.current = null; return; }
    let raf: number;
    startRef.current = null;
    function tick(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return value;
}

/* ── useTypewriter hook ─────────────────────────────────────── */

function useTypewriter(text: string, active: boolean, charDelay: number = 40): string {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!active) { setDisplayed(''); return; }
    let i = 0;
    setDisplayed('');
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, charDelay);
    return () => clearInterval(iv);
  }, [text, active, charDelay]);
  return displayed;
}

/* ── ScoringCard component ──────────────────────────────────── */

interface ScoringCardProps {
  product: DemoProduct;
  phase: number; // 0-6
  scoreDisplay: number;
  aiBriefText: string;
}

const MARKET_BARS = [
  { label: 'AU', pct: 49, opacity: 1 },
  { label: 'US', pct: 31, opacity: 0.6 },
  { label: 'UK', pct: 20, opacity: 0.4 },
];

interface ScoringCardExtProps extends ScoringCardProps {
  scoreGlow: boolean;
}

function ScoringCard({ product, phase, scoreDisplay, aiBriefText, scoreGlow }: ScoringCardExtProps) {
  const isHot = product.score >= 90;
  const estRev = product.estRevenue ?? 0;
  const [barAnimated, setBarAnimated] = useState(false);

  useEffect(() => {
    if (phase >= 2) {
      // Delay slightly so browser paints width:0 first
      const t = requestAnimationFrame(() => setBarAnimated(true));
      return () => cancelAnimationFrame(t);
    } else {
      setBarAnimated(false);
    }
  }, [phase]);

  return (
    <div
      className="mj-scoring-card"
      style={{
        position: 'relative',
        background: LT.bgCard,
        border: `1px solid ${LT.border}`,
        borderRadius: 16,
        padding: 24,
        maxWidth: 480,
        width: '100%',
        margin: '0 auto',
        minHeight: 420,
        boxShadow: scoreGlow
          ? '0 32px 64px -16px rgba(0,0,0,0.6), 0 0 40px rgba(79,142,247,0.3)'
          : '0 32px 64px -16px rgba(0,0,0,0.6), 0 0 80px rgba(79,142,247,0.08)',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 400ms ease, transform 400ms ease, box-shadow 800ms ease',
      }}
    >
      {/* Product header */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
          {product.image ? (
            <img
              src={proxyImg(product.image)}
              alt=""
              loading="eager"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.body, fontSize: 15, fontWeight: 600, color: LT.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
            {truncate(product.title, 40)}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600, color: LT.cobalt, background: LT.cobaltTint, borderRadius: 999, padding: '2px 10px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
              {product.category}
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 13, color: LT.textMute }}>
              A${(Math.round((product.orders > 0 ? (estRev / product.orders) * 365 / 30 : 29.99) * 100) / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Score area */}
      <div style={{ textAlign: 'center', marginBottom: 20, minHeight: 72 }}>
        {phase < 2 ? (
          <div style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute, animation: 'mjPulse 2s infinite', display: 'inline-block', padding: '8px 0' }}>
            Analysing...
          </div>
        ) : (
          <>
            <div
              className="mj-score-counter"
              style={{ fontFamily: F.mono, fontSize: 48, fontWeight: 700, color: LT.cobalt, lineHeight: 1.1 }}
            >
              {scoreDisplay}
            </div>
            {/* Progress bar — animates from 0 to 100% */}
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', margin: '12px auto 0', maxWidth: 200, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: 2,
                background: LT.cobalt,
                width: barAnimated ? '100%' : '0%',
                transition: 'width 0.8s ease-out',
              }} />
            </div>
          </>
        )}
      </div>

      {/* Labels — phase 3 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: phase >= 4 ? 20 : 0 }}>
        {phase >= 3 && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          }}>
            {isHot ? (
              <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.12)', borderRadius: 999, padding: '3px 12px', animation: 'mjLabelPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
                HOT {'\uD83D\uDD25'}
              </span>
            ) : (
              <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: LT.cobalt, background: LT.cobaltTint, borderRadius: 999, padding: '3px 12px', animation: 'mjLabelPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
                TRENDING {'\u2191'}
              </span>
            )}
          </div>
        )}
        {phase >= 3 && (
          <div style={{
            fontFamily: F.mono, fontSize: 15, color: LT.textMute,
            opacity: 1,
            transform: 'translateX(0)',
            transition: 'opacity 300ms ease 200ms, transform 300ms ease 200ms',
          }}>
            {product.orders.toLocaleString('en-AU')} orders
          </div>
        )}
        {phase >= 3 && estRev > 0 && (
          <div style={{
            fontFamily: F.mono, fontSize: 15, color: '#10b981',
            opacity: 1,
            transform: 'translateX(0)',
            transition: 'opacity 300ms ease 400ms, transform 300ms ease 400ms',
          }}>
            Est. ${estRev.toLocaleString('en-AU')}/mo revenue
          </div>
        )}
      </div>

      {/* Market bars — phase 4 */}
      {phase >= 4 && (
        <div className="mj-scoring-bars" style={{ marginBottom: 20 }}>
          {MARKET_BARS.map((bar, i) => (
            <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: F.body, fontSize: 12, color: LT.textMute, width: 20, textAlign: 'right' }}>{bar.label}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 3,
                  background: LT.cobalt,
                  opacity: bar.opacity,
                  width: `${bar.pct}%`,
                  transition: `width 600ms ease-out ${i * 150}ms`,
                }} />
              </div>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: LT.textMute, width: 28 }}>{bar.pct}%</span>
            </div>
          ))}
        </div>
      )}

      {/* AI Brief — phase 5 */}
      {phase >= 5 && (
        <div className="mj-scoring-brief" style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${LT.border}`,
          borderRadius: 10,
          padding: '12px 16px',
          opacity: phase >= 5 ? 1 : 0,
          transform: phase >= 5 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
        }}>
          <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600, color: LT.cobalt, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
            AI Brief
          </div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute, fontStyle: 'italic', lineHeight: 1.5, minHeight: 21 }}>
            {aiBriefText}
            <span style={{ display: 'inline-block', width: 2, height: 14, background: LT.cobalt, marginLeft: 1, verticalAlign: 'text-bottom', animation: 'mjPulse 1s infinite' }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Hero ──────────────────────────────────────────────── */

export function Hero() {
  const [product, setProduct] = useState<DemoProduct | null>(null);
  const [phase, setPhase] = useState(0);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [scoreGlow, setScoreGlow] = useState(false);
  const prefersReduced = useRef(false);
  const visibilityRef = useRef(true);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aiBriefFull = product
    ? `"Target: ${product.category} lovers 25-44 in AU. Hook: Your ${product.category.toLowerCase()} needs this."`
    : '';
  const scoreDisplay = useCounter(product?.score ?? 0, phase >= 2, 1200);
  const aiBriefText = useTypewriter(aiBriefFull, phase >= 5, 40);

  // Check reduced motion once
  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Visibility API — pause cycling when tab hidden
  useEffect(() => {
    function handleVis() { visibilityRef.current = !document.hidden; }
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  // Fetch product and run sequence
  const runSequence = useCallback(async (catIndex: number) => {
    const cat = CYCLE_CATEGORIES[catIndex % CYCLE_CATEGORIES.length];
    const p = await fetchDemoProduct(cat);
    if (!p) return;

    setProduct(p);

    if (prefersReduced.current) {
      // Skip animation — show final state
      setPhase(6);
      return;
    }

    // Phase 1: card appears (0ms)
    setPhase(1);

    // Phase 2: score counts up (600ms)
    const t2 = setTimeout(() => setPhase(2), 600);

    // Score glow after counter finishes (600 + 1200 = 1800ms)
    const tGlow = setTimeout(() => {
      setScoreGlow(true);
      setTimeout(() => setScoreGlow(false), 800);
    }, 1800);

    // Phase 3: labels fire in (1800ms)
    const t3 = setTimeout(() => setPhase(3), 1800);

    // Phase 4: market bars (2400ms)
    const t4 = setTimeout(() => setPhase(4), 2400);

    // Phase 5: AI brief (3200ms)
    const t5 = setTimeout(() => setPhase(5), 3200);

    // Phase 6: CTA pulse (4000ms)
    const t6 = setTimeout(() => setPhase(6), 4000);

    return () => { clearTimeout(t2); clearTimeout(tGlow); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  }, []);

  // Initial load + auto-cycle
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let mounted = true;

    async function start() {
      cleanup = await runSequence(cycleIndex) || undefined;
      if (!mounted) return;

      // After 6s of final state, cycle to next category with crossfade
      cycleTimerRef.current = setTimeout(() => {
        if (!mounted || !visibilityRef.current) return;
        setTransitioning(true); // fade out
        setTimeout(() => {
          if (!mounted) return;
          setPhase(0);
          setProduct(null);
          setTimeout(() => {
            if (mounted) {
              setTransitioning(false); // fade in happens with new product
              setCycleIndex((prev) => prev + 1);
            }
          }, 100);
        }, 300); // wait for fade-out
      }, 10000); // 4s sequence + 6s hold
    }

    start();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, [cycleIndex, runSequence]);

  return (
    <section style={{
      position: 'relative',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      padding: '120px 24px 80px',
    }}>
      <style>{HERO_CSS}</style>

      {/* ── BG layers ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: LT.bg, zIndex: 0 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 40% at 50% -5%, ${LT.cobaltSubtle}, transparent 70%)`, zIndex: 1 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', zIndex: 2 }} />
      <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: `linear-gradient(to top, ${LT.bg}, transparent)`, zIndex: 3 }} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: MAX, width: '100%', margin: '0 auto', textAlign: 'center' }}>

        {/* ROW 1 — eyebrow pill with pulse dot */}
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: F.body, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em',
            color: LT.textMute,
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 9999, padding: '6px 16px',
          }}>
            <span className="mj-hero-pulse-dot" aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: LT.success, animation: 'mjPulse 2s infinite', flexShrink: 0 }} />
            Live data
          </span>
        </div>

        {/* ROW 2 — H1 */}
        <h1 style={{
          fontFamily: F.display,
          fontSize: 'clamp(52px, 8vw, 96px)',
          fontWeight: 900,
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          color: LT.text,
          margin: '0 auto',
          maxWidth: 800,
        }}>
          Find winners<br />before everyone else.
        </h1>

        {/* ROW 3 — sub */}
        <p style={{
          fontFamily: F.body, fontSize: 19, fontWeight: 400, lineHeight: 1.6,
          color: LT.textMute, margin: '24px auto 0', maxWidth: 540,
        }}>
          AI scans millions of AliExpress products and surfaces the few worth selling.
        </p>

        {/* ROW 4 — CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <Link href="/sign-up" className="mj-cta-primary-v2" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px 36px', color: '#fff', fontFamily: F.body,
            fontWeight: 600, fontSize: 16, borderRadius: 12, textDecoration: 'none',
            transition: 'transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
            border: 'none', cursor: 'pointer',
          }}>
            Get Started &rarr;
          </Link>
        </div>

        {/* ROW 5 — trust line */}
        <div style={{ marginTop: 20, fontFamily: F.body, fontSize: 13, color: '#4b5563', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span>{'\u2713'} No credit card</span>
          <span>{'\u2713'} Cancel anytime</span>
          <span>{'\u2713'} 30-day guarantee</span>
        </div>

        {/* ── ROW 6 — THE SCORING MOMENT ── */}
        <div style={{ marginTop: 56 }}>
          {/* Browser chrome frame */}
          <div
            className="mj-hero-frame"
            style={{
              background: LT.bgCard,
              border: `1px solid ${LT.border}`,
              borderRadius: 16,
              overflow: 'hidden',
              maxWidth: 560,
              margin: '0 auto',
              transform: 'perspective(1200px) rotateX(3deg)',
            }}
          >
            {/* Title bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: `1px solid ${LT.border}`,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3f3f46' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3f3f46' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3f3f46' }} />
              <div style={{
                flex: 1, marginLeft: 10,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 6, padding: '4px 12px',
                fontFamily: F.mono, fontSize: 11, color: LT.textMute,
              }}>
                majorka.io/products
              </div>
            </div>

            {/* Card content area */}
            <div style={{ padding: '24px 20px 28px' }}>
              {product ? (
                <ScoringCard
                  product={product}
                  phase={phase}
                  scoreDisplay={scoreDisplay}
                  aiBriefText={aiBriefText}
                />
              ) : (
                /* Loading placeholder */
                <div style={{
                  maxWidth: 480, margin: '0 auto', padding: 24,
                  background: LT.bgCard, border: `1px solid ${LT.border}`,
                  borderRadius: 16, opacity: 0.4,
                }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '70%', marginBottom: 8 }} />
                      <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '45%' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 6 — CTA pulse */}
              {phase >= 6 && (
                <div className="mj-scoring-cta" style={{ marginTop: 20, textAlign: 'center', opacity: phase >= 6 ? 1 : 0, transition: 'opacity 400ms ease' }}>
                  <Link href="/sign-up" style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '12px 28px',
                    background: LT.cobalt,
                    color: '#fff',
                    fontFamily: F.body, fontWeight: 600, fontSize: 14,
                    borderRadius: 10, textDecoration: 'none',
                    animation: 'mjCtaPulseGlow 2s ease-in-out infinite',
                    transition: 'transform 150ms ease',
                  }}>
                    Find products like this &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
