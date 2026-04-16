/*
 * PHASE 0 — Reference site findings (2026-04-15)
 * LINEAR: 100vh, giant typography, dot grid bg, extreme restraint
 * VERCEL: 100vh centred, gradient mesh, framework logos
 * LOOM: ~90vh, video thumbnail, floating UI overlays
 * STRIPE: 100vh, code+UI split, gradient orbs, layered depth
 * RESEND: 100vh dark, code block, subtle gradient, Bloomberg feel
 *
 * CHOSEN: Concept C "The Intelligence Feed"
 * Giant animated counter + streaming real product cards + dot grid + beam + parallax
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { LT, F, MAX } from '@/lib/landingTokens';

interface DemoProduct {
  id: string;
  title: string;
  image: string | null;
  orders: number;
  score: number;
  category: string;
}

const HERO_CATEGORIES = ['Pet', 'Kitchen', 'Home', 'Beauty'] as const;

async function fetchDemoProduct(category: string): Promise<DemoProduct | null> {
  try {
    const res = await fetch(`/api/demo/quick-score?category=${category}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.ok || !json.product) return null;
    return {
      id: json.product.id,
      title: json.product.title,
      image: json.product.image,
      orders: json.product.orders ?? 0,
      score: json.product.score ?? 0,
      category: json.product.category ?? category,
    };
  } catch {
    return null;
  }
}

function proxyImage(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

const HERO_CSS = `
@keyframes mjLivePulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
}
@keyframes mjBeamSweep {
  0% { transform: translateX(-100%) rotate(-45deg); }
  100% { transform: translateX(200vw) rotate(-45deg); }
}
@keyframes mjChevronBounce {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(6px); opacity: 1; }
}
@keyframes mjShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .mj-hero-parallax { transform: none !important; }
  .mj-hero-beam { display: none !important; }
  .mj-hero-card { animation: none !important; opacity: 1 !important; transform: none !important; }
  .mj-hero-chevron { animation: none !important; }
  .mj-hero-pulse-dot { animation: none !important; }
}
@media (max-width: 768px) {
  .mj-hero-beam { display: none !important; }
  .mj-hero-parallax { transform: none !important; }
  .mj-hero-card:nth-child(n+3) { display: none !important; }
  .mj-hero-floating-badge { display: none !important; }
}
.mj-cta-primary-v2 {
  background-image: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%);
  background-size: 200% 100%;
  background-position: -200% 0;
  background-color: #4f8ef7;
}
.mj-cta-primary-v2:hover {
  animation: mjShimmer 0.4s ease forwards;
  transform: scale(1.03);
  box-shadow: 0 0 40px rgba(79,142,247,0.3);
  background-color: #3a7de0;
}
.mj-cta-ghost-v2:hover {
  border-color: #4f8ef7 !important;
  color: #ffffff !important;
}
.mj-cta-ghost-v2:hover .mj-play-icon {
  transform: rotate(15deg);
}
.mj-play-icon {
  transition: transform 200ms ease;
  display: inline-block;
}
`;

function useCounter(target: number, duration: number = 1800): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target <= 0) return;
    let raf: number;
    function tick(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function ProductCard({ product, index, visible }: { product: DemoProduct | null; index: number; visible: boolean }) {
  const isHot = product !== null && product.score > 90;
  const delay = index * 100;

  if (!product) {
    return (
      <div className="mj-hero-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #161b22', borderRadius: 14, padding: 16, display: 'flex', gap: 14, alignItems: 'center', minWidth: 280, opacity: 0 }}>
        <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '75%', marginBottom: 8 }} />
          <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '50%' }} />
        </div>
      </div>
    );
  }

  const title = product.title.length > 32 ? product.title.slice(0, 31).trimEnd() + '\u2026' : product.title;

  return (
    <div className="mj-hero-card" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid #161b22', borderRadius: 14, padding: 16, display: 'flex', gap: 14, alignItems: 'center', minWidth: 280, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms` }}>
      <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
        {product.image ? (
          <img src={proxyImage(product.image)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 }}>{title}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#4f8ef7', background: 'rgba(79,142,247,0.15)', borderRadius: 999, padding: '2px 10px' }}>{product.score}</span>
          <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, fontWeight: 600, color: isHot ? '#f59e0b' : '#4f8ef7', letterSpacing: '0.02em' }}>{isHot ? 'HOT \uD83D\uDD25' : 'TRENDING \u2191'}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#8b949e' }}>{product.orders.toLocaleString('en-AU')} orders</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const [products, setProducts] = useState<(DemoProduct | null)[]>([null, null, null, null]);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseCurrent = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const displayCount = useCounter(totalProducts, 1800);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(HERO_CATEGORIES.map((c) => fetchDemoProduct(c)));
      if (cancelled) return;
      const withFallback = results.map((r, i) => r ?? { id: `fallback-${i}`, title: `${HERO_CATEGORIES[i]} -- trending product`, image: null, orders: 0, score: 0, category: HERO_CATEGORIES[i] });
      setProducts(withFallback);
      setTotalProducts(3715);
      requestAnimationFrame(() => { if (!cancelled) setCardsVisible(true); });
    })();
    return () => { cancelled = true; };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseTarget.current = { x: ((e.clientX - cx) / rect.width) * 24, y: ((e.clientY - cy) / rect.height) * 16 };
  }, []);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isMobile || prefersReduced) return;
    const hero = heroRef.current;
    if (!hero) return;
    hero.addEventListener('mousemove', handleMouseMove);
    function animate() {
      mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * 0.08;
      mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * 0.08;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate3d(${mouseCurrent.current.x.toFixed(2)}px, ${mouseCurrent.current.y.toFixed(2)}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => { hero.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(rafRef.current); };
  }, [handleMouseMove]);

  return (
    <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '120px 24px 80px' }}>
      <style>{HERO_CSS}</style>

      <div aria-hidden style={{ position: 'absolute', inset: 0, background: '#04060f', zIndex: 0 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(79,142,247,0.07), transparent 70%)', zIndex: 1 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', zIndex: 2 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, #04060f 100%)', zIndex: 3 }} />
      <div aria-hidden style={{ position: 'absolute', top: '30%', left: '50%', width: 600, height: 600, transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(79,142,247,0.06), transparent 70%)', borderRadius: '50%', zIndex: 4, pointerEvents: 'none' }} />

      <div className="mj-hero-beam" aria-hidden style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: 2, height: '200%', background: 'linear-gradient(180deg, transparent, rgba(79,142,247,0.6), transparent)', animation: 'mjBeamSweep 1.2s ease-out forwards', transformOrigin: 'center center' }} />
      </div>

      <div ref={parallaxRef} className="mj-hero-parallax" style={{ position: 'relative', zIndex: 10, maxWidth: MAX, width: '100%', margin: '0 auto', textAlign: 'center', willChange: 'transform' }}>
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#8b949e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9999, padding: '6px 16px' }}>
            <span className="mj-hero-pulse-dot" aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'mjLivePulse 2s infinite', flexShrink: 0 }} />
            Live data
          </span>
        </div>

        <h1 style={{ fontFamily: "'Syne', system-ui, -apple-system, sans-serif", fontSize: 'clamp(52px, 8vw, 96px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', color: '#ffffff', margin: '0 auto', maxWidth: 800 }}>
          Find winners<br />before everyone else.
        </h1>

        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 19, fontWeight: 400, lineHeight: 1.6, color: '#8b949e', margin: '24px auto 0', maxWidth: 540 }}>
          AI scans millions of AliExpress products and surfaces the few worth selling.
        </p>

        <div style={{ marginTop: 48, marginBottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'Syne', system-ui, -apple-system, sans-serif", fontSize: 'clamp(64px, 10vw, 112px)', fontWeight: 800, color: '#4f8ef7', lineHeight: 1, letterSpacing: '-0.04em' }}>
            {displayCount.toLocaleString('en-AU')}
          </span>
          <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, fontWeight: 500, color: '#8b949e', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            winning products tracked
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, maxWidth: 720, margin: '0 auto 48px' }}>
          {products.map((p, i) => (
            <ProductCard key={p?.id ?? `slot-${i}`} product={p} index={i} visible={cardsVisible} />
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
          <Link href="/sign-up" className="mj-cta-primary-v2" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '16px 36px', color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 16, borderRadius: 12, textDecoration: 'none', transition: 'transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease', border: 'none', cursor: 'pointer' }}>
            Get Started &rarr;
          </Link>
          <Link href="#demo" className="mj-cta-ghost-v2" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 32px', background: 'transparent', color: '#8b949e', fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, textDecoration: 'none', transition: 'border-color 200ms ease, color 200ms ease', cursor: 'pointer' }}>
            <span className="mj-play-icon">{'\u25B6'}</span>
            Watch 90s Demo
          </Link>
        </div>

        <div style={{ marginTop: 20, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: '#4b5563', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span>{'\u2713'} No credit card</span>
          <span>{'\u2713'} Cancel anytime</span>
          <span>{'\u2713'} 30-day guarantee</span>
        </div>
      </div>

      <div className="mj-hero-chevron" style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'mjChevronBounce 2s ease-in-out infinite' }}>
        <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, color: '#4b5563', letterSpacing: '0.04em' }}>Scroll to see live products</span>
        <span style={{ fontSize: 18, color: '#4b5563' }}>{'\u2193'}</span>
      </div>
    </section>
  );
}
