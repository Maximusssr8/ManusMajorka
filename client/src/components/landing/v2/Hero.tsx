// HERO DESIGN DECISIONS
//
// Q1: What does a dropshipper feel the moment they find a winning product?
// A: Adrenaline. "I found it before everyone else." It's the feeling of
//    having information nobody else has — like seeing a stock tip before
//    the market opens. Urgency + confidence + greed.
//
// Q2: What would make someone screenshot this page and send it to a friend?
// A: Seeing REAL products with REAL scores that they recognise from their
//    own AliExpress research — but ranked and scored in a way they've never
//    seen before. The "holy shit this exists?" moment.
//
// Q3: What does NO other dropshipping tool's landing page look like?
// A: None of them show you the ACTUAL product database on the landing page.
//    They all have generic hero images or mockup screenshots. Majorka can
//    show live data. That's the unfair advantage of the LANDING PAGE itself.
//
// CHOSEN: Option B — Full bleed product moment
// The hero IS the product. No mockup frame. No browser chrome. You're
// looking at a live Majorka product feed with real scores, real images,
// real data. The headline is small, overlaid, almost secondary to the
// data itself. Like walking into a trading floor.

import { useEffect, useState, useRef } from 'react';
import { Link } from 'wouter';
import { LT, F } from '@/lib/landingTokens';

/* ── types ──────────────────────────────────────────────────── */

interface HeroProduct {
  id: string;
  title: string;
  image: string | null;
  orders: number;
  score: number;
  price: number;
  category: string;
}

/* ── data fetching ─────────────────────────────────────────── */

const FETCH_PARAMS: Array<{ category: string; seed: number }> = [
  { category: 'Pet', seed: 0 },
  { category: 'Kitchen', seed: 0 },
  { category: 'Home', seed: 0 },
  { category: 'Beauty', seed: 0 },
  { category: 'Pet', seed: 1 },
  { category: 'Kitchen', seed: 1 },
  { category: 'Home', seed: 1 },
  { category: 'Beauty', seed: 1 },
];

async function fetchHeroProducts(): Promise<HeroProduct[]> {
  const results = await Promise.allSettled(
    FETCH_PARAMS.map(async ({ category, seed }) => {
      const res = await fetch(`/api/demo/quick-score?category=${category}&seed=${seed}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.ok || !json.product) return null;
      const p = json.product;
      return {
        id: `${p.id}-${seed}`,
        title: String(p.title || ''),
        image: p.image ?? null,
        orders: Number(p.orders) || 0,
        score: Number(p.score) || 0,
        price: Number(p.price_aud) || 0,
        category: String(p.category || category),
      } as HeroProduct;
    }),
  );

  const all = results
    .filter((r): r is PromiseFulfilledResult<HeroProduct | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((p): p is HeroProduct => p !== null);

  // Filter to score >= 85; if fewer than 4, relax to >= 75
  const high = all.filter((p) => p.score >= 85);
  const pool = high.length >= 4 ? high : all.filter((p) => p.score >= 75);

  // Deduplicate by base product id (strip seed suffix)
  const seen = new Set<string>();
  const unique: HeroProduct[] = [];
  for (const p of pool) {
    const baseId = p.id.replace(/-\d+$/, '');
    if (!seen.has(baseId)) {
      seen.add(baseId);
      unique.push(p);
    }
  }

  // Sort descending by score, take up to 8
  return unique.sort((a, b) => b.score - a.score).slice(0, 8);
}

/* ── helpers ────────────────────────────────────────────────── */

function proxyImg(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '\u2026' : s;
}

function formatRevenue(orders: number, price: number): string | null {
  const rev = Math.round(orders * price * 0.3);
  if (!rev || !Number.isFinite(rev) || rev <= 0) return null;
  if (rev >= 1000) return `$${(rev / 1000).toFixed(1)}k/mo est.`;
  return `$${rev}/mo est.`;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/* ── useCounter hook ────────────────────────────────────────── */

function useCounter(target: number, active: boolean, duration = 800): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || target <= 0) {
      setValue(0);
      startRef.current = null;
      return;
    }
    let raf: number;
    startRef.current = null;
    function tick(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.floor(easeOutCubic(progress) * target));
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

/* ── CSS ────────────────────────────────────────────────────── */

const HERO_CSS = `
@keyframes mjPulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
}
@keyframes mjShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.mj-hero-feed {
  position: relative;
}
.mj-hero-feed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(to bottom, transparent, #04060f);
  pointer-events: none;
  z-index: 1;
}
.mj-hero-cta-v2 {
  background-image: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%);
  background-size: 200% 100%;
  background-position: -200% 0;
  background-color: ${LT.cobalt};
}
.mj-hero-cta-v2:hover {
  animation: mjShimmer 0.4s ease forwards;
  transform: scale(1.03);
  box-shadow: 0 0 40px rgba(79,142,247,0.3);
  background-color: #3a7de0;
}
@media (prefers-reduced-motion: reduce) {
  .mj-hero-card {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  .mj-hero-pulse-dot { animation: none !important; }
}
@media (max-width: 768px) {
  .mj-hero-headline {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    text-align: center !important;
    padding: 100px 20px 24px !important;
    max-width: 100% !important;
  }
  .mj-hero-cta-wrap {
    position: relative !important;
    bottom: auto !important;
    right: auto !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    padding: 24px 20px 48px !important;
  }
  .mj-hero-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    padding: 0 20px !important;
  }
  .mj-hero-grid > :nth-child(n+5) {
    display: none !important;
  }
  .mj-hero-card-img {
    width: 40px !important;
    height: 40px !important;
  }
  .mj-hero-card {
    padding: 12px !important;
  }
  .mj-hero-card-name {
    font-size: 13px !important;
  }
}
`;

/* ── ProductCard ─────────────────────────────────────────────── */

interface ProductCardProps {
  product: HeroProduct;
  index: number;
  mounted: boolean;
}

function ProductCard({ product, index, mounted }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const scoreValue = useCounter(product.score, mounted, 800 + index * 100);
  const revenue = formatRevenue(product.orders, product.price);

  return (
    <div
      className="mj-hero-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: LT.bgCard,
        border: `1px solid ${hovered ? 'rgba(79,142,247,0.2)' : LT.border}`,
        borderRadius: 12,
        padding: 16,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.4s ease ${index * 80}ms, transform 0.4s ease ${index * 80}ms, border-color 200ms ease`,
      }}
    >
      {/* Image + Name row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div
          className="mj-hero-card-img"
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            overflow: 'hidden',
            background: '#161b22',
            flexShrink: 0,
          }}
        >
          {product.image && (
            <img
              src={proxyImg(product.image)}
              alt=""
              loading="eager"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="mj-hero-card-name"
            style={{
              fontFamily: F.body,
              fontSize: 14,
              fontWeight: 500,
              color: LT.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 2,
            }}
          >
            {truncate(product.title, 35)}
          </div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: '#6b7280' }}>
            {product.category} · AliExpress
          </div>
        </div>
      </div>

      {/* Score + Orders row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 14,
            fontWeight: 700,
            color: LT.cobalt,
            background: '#1e3a5f',
            borderRadius: 6,
            padding: '4px 10px',
            lineHeight: 1,
          }}
        >
          {scoreValue}
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 13, color: '#8b949e' }}>
          {product.orders.toLocaleString('en-AU')} orders
        </span>
      </div>

      {/* Labels row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minHeight: 22 }}>
        {product.score >= 90 && (
          <span
            style={{
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 700,
              color: '#ef4444',
              background: 'rgba(239,68,68,0.12)',
              borderRadius: 999,
              padding: '2px 8px',
            }}
          >
            HOT {'\uD83D\uDD25'}
          </span>
        )}
        {revenue && (
          <span style={{ fontFamily: F.mono, fontSize: 13, color: '#10b981' }}>
            {revenue}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────────── */

export function Hero() {
  const [products, setProducts] = useState<HeroProduct[]>([]);
  const [mounted, setMounted] = useState(false);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cancelled = false;
    fetchHeroProducts().then((p) => {
      if (cancelled) return;
      setProducts(p);
      if (prefersReduced.current) {
        setMounted(true);
      } else {
        requestAnimationFrame(() => {
          if (!cancelled) setMounted(true);
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <style>{HERO_CSS}</style>

      {/* ── BG layers ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: LT.bg, zIndex: 0 }} />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 40% at 50% -5%, ${LT.cobaltSubtle}, transparent 70%)`,
          zIndex: 1,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          zIndex: 2,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, #04060f 100%)',
          zIndex: 3,
        }}
      />

      {/* ── Headline — top-left ── */}
      <div
        className="mj-hero-headline"
        style={{
          position: 'absolute',
          top: 120,
          left: 48,
          zIndex: 10,
          maxWidth: 420,
        }}
      >
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 28,
            fontWeight: 600,
            lineHeight: 1.3,
            color: LT.text,
            margin: 0,
          }}
        >
          The products your competitors
          <br />
          haven't found yet.
        </h1>
        <p
          style={{
            fontFamily: F.body,
            fontSize: 15,
            color: '#8b949e',
            margin: '8px 0 0',
            lineHeight: 1.5,
          }}
        >
          Live AliExpress data. Scored by velocity. Updated every 6 hours.
        </p>
        {/* Live pill */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 600,
              color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 999,
              padding: '4px 12px',
            }}
          >
            <span
              className="mj-hero-pulse-dot"
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'mjPulse 2s infinite',
                flexShrink: 0,
              }}
            />
            LIVE
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: '#6b7280' }}>
            AU · US · UK
          </span>
        </div>
      </div>

      {/* ── Product feed grid ── */}
      <div className="mj-hero-feed" style={{ position: 'absolute', inset: 0, zIndex: 5, padding: '200px 48px 120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          className="mj-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            width: '100%',
            maxWidth: 1200,
          }}
        >
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} mounted={mounted} />
          ))}
        </div>
      </div>

      {/* ── CTA — bottom-right ── */}
      <div
        className="mj-hero-cta-wrap"
        style={{
          position: 'absolute',
          bottom: 48,
          right: 48,
          zIndex: 10,
          textAlign: 'right',
        }}
      >
        <Link
          href="/sign-up"
          className="mj-hero-cta-v2"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 32px',
            color: '#fff',
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 12,
            textDecoration: 'none',
            transition: 'transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Get Started &rarr;
        </Link>
        <div
          style={{
            marginTop: 8,
            fontFamily: F.body,
            fontSize: 12,
            color: '#4b5563',
          }}
        >
          {'\u2713'} No credit card · {'\u2713'} Cancel anytime
        </div>
      </div>
    </section>
  );
}
