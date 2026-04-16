import { useEffect, useState } from 'react';
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
    .filter((p): p is HeroProduct => p !== null && p.score >= 75);

  // Deduplicate by base product id
  const seen = new Set<string>();
  const unique: HeroProduct[] = [];
  for (const p of all) {
    const baseId = p.id.replace(/-\d+$/, '');
    if (!seen.has(baseId)) {
      seen.add(baseId);
      unique.push(p);
    }
  }

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
  if (rev >= 1000) return `$${(rev / 1000).toFixed(1)}k/mo`;
  return `$${rev}/mo`;
}

function formatOrders(n: number): string {
  return n.toLocaleString('en-AU');
}

/* ── CSS ────────────────────────────────────────────────────── */

const HERO_CSS = `
@keyframes mjScrollUp {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}
@keyframes mjPulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
}
.mj-hero-scroll-feed {
  animation: mjScrollUp 60s linear infinite;
}
.mj-hero-scroll-feed:hover {
  animation-play-state: paused;
}
.mj-hero-feed-col {
  position: relative;
  overflow: hidden;
}
.mj-hero-feed-col::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 120px;
  background: linear-gradient(to bottom, #04060f, transparent);
  z-index: 2;
  pointer-events: none;
}
.mj-hero-feed-col::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 120px;
  background: linear-gradient(to top, #04060f, transparent);
  z-index: 2;
  pointer-events: none;
}
.mj-hero-cta:hover {
  background-color: #3a7de0 !important;
  transform: scale(1.02);
  box-shadow: 0 0 40px rgba(79,142,247,0.3);
}
.mj-hero-mobile-cards { display: none; }
@media (prefers-reduced-motion: reduce) {
  .mj-hero-scroll-feed { animation: none !important; }
}
@media (max-width: 768px) {
  .mj-hero-split { grid-template-columns: 1fr !important; }
  .mj-hero-left { padding: 100px 20px 32px !important; text-align: center; align-items: center; }
  .mj-hero-h1 { font-size: 36px !important; }
  .mj-hero-scroll-feed { animation: none !important; }
  .mj-hero-feed-col { display: none !important; }
  .mj-hero-feed-col::before, .mj-hero-feed-col::after { display: none; }
  .mj-hero-mobile-cards { display: flex !important; flex-direction: column; gap: 12px; padding: 0 20px; margin-top: 24px; }
}
`;

/* ── ProductCard ─────────────────────────────────────────────── */

function ProductCard({ product }: { product: HeroProduct }) {
  const revenue = formatRevenue(product.orders, product.price);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#0d1117',
        border: '1px solid #161b22',
        borderLeft: hovered ? '3px solid #4f8ef7' : '1px solid #161b22',
        borderRadius: 12,
        padding: 16,
        paddingLeft: hovered ? 13 : 16,
        marginBottom: 0,
        borderBottom: '1px solid #0d1520',
        display: 'flex',
        flexDirection: 'row',
        gap: 14,
        alignItems: 'center',
        transition: 'border-left 150ms ease, padding-left 150ms ease',
      }}
    >
      {/* Image */}
      <div
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
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== product.image && product.image) {
                img.src = product.image;
              } else {
                img.style.display = 'none';
              }
            }}
          />
        )}
      </div>

      {/* Text column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
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
        <div style={{ fontFamily: F.body, fontSize: 11, color: '#6b7280', background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '1px 6px', display: 'inline-block' }}>
          {product.category}
        </div>
      </div>

      {/* Right column — score + meta */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 14,
            fontWeight: 700,
            color: '#4f8ef7',
            background: '#1e3a5f',
            borderRadius: 6,
            padding: '4px 10px',
            lineHeight: 1,
          }}
        >
          {product.score}
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 12, color: '#8b949e' }}>
          {formatOrders(product.orders)}
        </span>
        {product.score >= 90 ? (
          <span
            style={{
              fontFamily: F.body,
              fontSize: 10,
              fontWeight: 700,
              color: '#ef4444',
              background: 'rgba(239,68,68,0.12)',
              borderRadius: 999,
              padding: '2px 6px',
            }}
          >
            HOT {'\uD83D\uDD25'}
          </span>
        ) : product.score >= 80 ? (
          <span
            style={{
              fontFamily: F.body,
              fontSize: 10,
              fontWeight: 700,
              color: '#4f8ef7',
              background: 'rgba(79,142,247,0.12)',
              borderRadius: 999,
              padding: '2px 6px',
            }}
          >
            TRENDING {'\u2191'}
          </span>
        ) : null}
        {revenue && (
          <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 600, color: '#10b981' }}>
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

  useEffect(() => {
    let cancelled = false;
    fetchHeroProducts().then((p) => {
      if (!cancelled) setProducts(p);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <section
      className="mj-hero-split"
      style={{
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      <style>{HERO_CSS}</style>

      {/* ── BG layers ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: '#04060f', zIndex: 0 }} />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(79,142,247,0.07), transparent 70%)',
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

      {/* ── LEFT HALF ── */}
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
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              animation: 'mjPulse 2s infinite',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: '#6b7280',
            }}
          >
            LIVE {'\u00B7'} AU / US / UK
          </span>
        </div>

        {/* H1 */}
        <h1
          className="mj-hero-h1"
          style={{
            fontFamily: F.display,
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: LT.text,
            margin: '0 0 20px 0',
          }}
        >
          Find winning products before your competitors even know they exist.
        </h1>

        {/* Sub */}
        <p
          style={{
            fontFamily: F.body,
            fontSize: 17,
            color: '#8b949e',
            lineHeight: 1.7,
            maxWidth: 440,
            margin: '0 0 32px 0',
          }}
        >
          Majorka scores millions of AliExpress products by real order velocity. You see winners first.
        </p>

        {/* CTA */}
        <Link
          href="/sign-up"
          className="mj-hero-cta"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
            padding: '16px 32px',
            background: LT.cobalt,
            color: '#fff',
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 10,
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
            marginBottom: 16,
          }}
        >
          Get Started {'\u2192'}
        </Link>

        {/* Trust line */}
        <p
          style={{
            fontFamily: F.body,
            fontSize: 13,
            color: '#4b5563',
            margin: '0 0 0 0',
          }}
        >
          {'\u2713'} No credit card {'\u00B7'} {'\u2713'} Cancel anytime {'\u00B7'} {'\u2713'} 30-day guarantee
        </p>

        {/* Mobile cards — visible only ≤768px */}
        <div className="mj-hero-mobile-cards">
          {products.slice(0, 3).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* ── RIGHT HALF ── */}
      <div
        className="mj-hero-feed-col"
        aria-hidden="true"
        style={{
          position: 'relative',
          overflow: 'hidden',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          background: '#060810',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        {products.length > 0 && (
          <div
            className="mj-hero-scroll-feed"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '0 24px',
              width: '100%',
            }}
          >
            {/* Render list twice for seamless loop */}
            {[...products, ...products].map((p, i) => (
              <ProductCard key={`${p.id}-${i}`} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
