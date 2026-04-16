import { useEffect, useState, useRef, useCallback } from 'react';

/* ── types ──────────────────────────────────────────────────── */

interface HeroProduct {
  title: string;
  score: number;
  orders: number;
  price: number;
  category: string;
  image: string | null;
}

const FALLBACK: HeroProduct = {
  title: 'LED Scalp Massager Pro',
  score: 97,
  orders: 48210,
  price: 34.95,
  category: 'Health & Beauty',
  image: null,
};

const CATEGORIES = ['Pet', 'Kitchen', 'Home', 'Beauty'] as const;

/* ── data fetching ─────────────────────────────────────────── */

async function fetchProducts(): Promise<HeroProduct[]> {
  const results = await Promise.allSettled(
    CATEGORIES.map(async (category, i) => {
      const res = await fetch(`/api/demo/quick-score?category=${category}&seed=${i}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.ok || !json.product) return null;
      const p = json.product;
      return {
        title: String(p.title || ''),
        score: Number(p.score) || 0,
        orders: Number(p.orders) || 0,
        price: Number(p.price_aud) || 0,
        category: String(p.category || category),
        image: p.image || null,
      } as HeroProduct;
    }),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<HeroProduct | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((p): p is HeroProduct => p !== null && p.score > 0);
}

/* ── CSS ────────────────────────────────────────────────────── */

const HERO_CSS = `
.mj-hero-cta:hover {
  background-color: #6ba3ff !important;
  transform: scale(1.02);
  box-shadow: 0 10px 40px -8px rgba(79,142,247,0.55);
}
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
  .mj-hero-minimal-right {
    justify-content: center !important;
  }
  .mj-hero-minimal-card {
    width: 280px !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mj-hero-card-fade { transition: none !important; }
}
`;

/* ── Hero ────────────────────────────────────────────────────── */

export function Hero() {
  const [products, setProducts] = useState<HeroProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotion = useRef(false);

  // Check reduced motion preference once
  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Fetch 4 products (Pet, Kitchen, Home, Beauty)
  useEffect(() => {
    let cancelled = false;
    fetchProducts().then((p) => {
      if (!cancelled) {
        setProducts(p.length > 0 ? p : [FALLBACK]);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-cycle every 5s with crossfade
  const startCycle = useCallback(() => {
    if (reducedMotion.current) return;
    if (cycleRef.current) clearInterval(cycleRef.current);

    cycleRef.current = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % Math.max(products.length, 1));
        setTransitioning(false);
      }, 300);
    }, 5000);
  }, [products.length]);

  useEffect(() => {
    if (products.length <= 1) return;
    startCycle();
    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  }, [products.length, startCycle]);

  // Pause when tab hidden
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        if (cycleRef.current) {
          clearInterval(cycleRef.current);
          cycleRef.current = null;
        }
      } else if (products.length > 1) {
        startCycle();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [products.length, startCycle]);

  const product = products[activeIndex] || FALLBACK;

  const rev = Math.round(product.orders * product.price * 0.3);
  const revFormatted = rev >= 1000 ? `$${(rev / 1000).toFixed(1)}k/mo est.` : `$${rev}/mo est.`;

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
        {/* ELEMENT 1 — Headline */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
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
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 19,
          color: '#6b7280',
          lineHeight: 1.6,
          margin: '0 0 32px',
          maxWidth: 480,
        }}>
          Real order velocity data on millions of AliExpress products. Updated every 6 hours.
        </p>

        {/* ELEMENT 3 — CTA row */}
        <div>
          <a
            href="/sign-up"
            className="mj-hero-cta"
            style={{
              display: 'inline-block',
              fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: '#4b5563',
            marginTop: 12,
          }}>
            {'\u2713'} No credit card {'\u00B7'} {'\u2713'} Cancel anytime {'\u00B7'} {'\u2713'} 30-day guarantee
          </p>
        </div>
      </div>

      {/* Right: ONE card */}
      <div
        className="mj-hero-minimal-right"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          className="mj-hero-card-fade mj-hero-minimal-card"
          style={{
            width: 320,
            background: '#0d1117',
            border: '1px solid #1f2937',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 0 60px rgba(79,142,247,0.08)',
            opacity: transitioning ? 0 : 1,
            transition: 'opacity 300ms ease',
          }}
        >
          {/* Image */}
          <div style={{
            width: '100%',
            height: 180,
            borderRadius: 10,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0d1117, #161b22)',
          }}>
            {product.image && (
              <img
                src={`/api/image-proxy?url=${encodeURIComponent(product.image)}`}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>

          {/* Product name */}
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: '#ffffff',
            marginTop: 12,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {product.title}
          </div>

          {/* Score */}
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 56,
            fontWeight: 800,
            color: '#4f8ef7',
            textAlign: 'center',
            margin: '16px 0',
            lineHeight: 1,
          }}>
            {product.score}
          </div>

          {/* Orders */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: '#6b7280',
            textAlign: 'center',
          }}>
            {product.orders.toLocaleString('en-AU')} orders
          </div>

          {/* HOT badge if >= 90 */}
          {product.score >= 90 && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: '#ef4444',
                background: 'rgba(239,68,68,0.12)',
                borderRadius: 999,
                padding: '3px 10px',
              }}>
                HOT {'\uD83D\uDD25'}
              </span>
            </div>
          )}

          {/* Revenue if > 0 */}
          {rev > 0 && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: '#10b981',
              textAlign: 'center',
              marginTop: 6,
            }}>
              {revFormatted}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
