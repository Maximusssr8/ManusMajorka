import { useEffect, useState, useRef } from 'react';

/* ── types ──────────────────────────────────────────────────── */

interface HeroProduct {
  title: string;
  score: number;
  orders: number;
  category: string;
  image: string | null;
}

const FALLBACK_PRODUCTS: HeroProduct[] = [
  { title: 'LED Scalp Massager Pro', score: 97, orders: 48210, category: 'Health', image: null },
  { title: 'Silicone Pet Grooming Brush', score: 94, orders: 31450, category: 'Pet', image: null },
  { title: 'Nano Tape Double-sided Roll', score: 92, orders: 231847, category: 'Home', image: null },
  { title: 'Pour & Spray Oil Dispenser', score: 91, orders: 152300, category: 'Kitchen', image: null },
  { title: 'Mini Dough Press Kit', score: 88, orders: 24980, category: 'Kitchen', image: null },
  { title: 'Phone Stand Adjustable', score: 85, orders: 18420, category: 'Tech', image: null },
];

const FETCH_PARAMS = [
  { category: 'Pet', seed: 0 },
  { category: 'Kitchen', seed: 0 },
  { category: 'Home', seed: 0 },
  { category: 'Beauty', seed: 0 },
  { category: 'Fitness', seed: 0 },
  { category: 'Pet', seed: 1 },
  { category: 'Kitchen', seed: 1 },
  { category: 'Home', seed: 1 },
  { category: 'Beauty', seed: 1 },
];

/* ── data fetching ─────────────────────────────────────────── */

async function fetchProducts(): Promise<HeroProduct[]> {
  const results = await Promise.allSettled(
    FETCH_PARAMS.map(async ({ category, seed }) => {
      const res = await fetch(`/api/demo/quick-score?category=${category}&seed=${seed}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.ok || !json.product) return null;
      const p = json.product;
      return {
        title: String(p.title || ''),
        score: Number(p.score) || 0,
        orders: Number(p.orders) || 0,
        category: String(p.category || category),
        image: p.image || null,
      } as HeroProduct;
    }),
  );

  const products = results
    .filter((r): r is PromiseFulfilledResult<HeroProduct | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((p): p is HeroProduct => p !== null && p.score >= 80);

  // Deduplicate by title, sort by score desc, take top 6
  const seen = new Set<string>();
  const unique: HeroProduct[] = [];
  for (const p of products.sort((a, b) => b.score - a.score)) {
    if (!seen.has(p.title)) {
      seen.add(p.title);
      unique.push(p);
    }
    if (unique.length >= 6) break;
  }
  return unique;
}

/* ── format helpers ────────────────────────────────────────── */

function formatOrders(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ── CSS ────────────────────────────────────────────────────── */

const HERO_CSS = `
.mj-hero-cta:hover {
  background-color: #6ba3ff !important;
  transform: scale(1.02);
  box-shadow: 0 10px 40px -8px rgba(79,142,247,0.55);
}
.mj-hero-table-row:hover {
  background: rgba(79,142,247,0.04) !important;
}
@keyframes mj-pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
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
  .mj-hero-table-container {
    max-width: 100% !important;
  }
  .mj-hero-table-img {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
  }
  .mj-hero-table-rank {
    font-size: 11px !important;
  }
  .mj-hero-table-name {
    font-size: 12px !important;
  }
  .mj-hero-table-cat {
    font-size: 9px !important;
  }
  .mj-hero-table-orders {
    font-size: 12px !important;
  }
  .mj-hero-table-score {
    font-size: 12px !important;
  }
  .mj-hero-table-hot {
    font-size: 8px !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mj-hero-row-stagger { opacity: 1 !important; transform: none !important; transition: none !important; }
}
`;

/* ── Hero ────────────────────────────────────────────────────── */

export function Hero() {
  const [products, setProducts] = useState<HeroProduct[]>([]);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchProducts().then((p) => {
      if (!cancelled) {
        const list = p.length > 0 ? p : FALLBACK_PRODUCTS;
        setProducts(list);
        // Trigger stagger after data loads
        requestAnimationFrame(() => {
          if (!cancelled) setMounted(true);
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  // On mobile show 4 rows, desktop 6
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const displayProducts = products.slice(0, isMobile ? 4 : 6);
  const totalCount = '4,155';

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

      {/* Right: Live Product Intelligence Table */}
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
          className="mj-hero-table-container"
          style={{
            maxWidth: 480,
            width: '100%',
            background: '#0a0d14',
            border: '1px solid #161b22',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 0 80px rgba(79,142,247,0.06)',
          }}
        >
          {/* Header row */}
          <div style={{
            background: '#0d1117',
            padding: '10px 16px',
            borderBottom: '1px solid #161b22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Top Scored Products
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                animation: 'mj-pulse-dot 2s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                color: '#22c55e',
                letterSpacing: '0.05em',
              }}>
                LIVE
              </span>
            </span>
          </div>

          {/* Data rows */}
          {displayProducts.map((product, i) => (
            <div
              key={`${product.title}-${i}`}
              className="mj-hero-table-row mj-hero-row-stagger"
              style={{
                padding: '12px 16px',
                borderBottom: i < displayProducts.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: `background 150ms ease, opacity 0.3s ease ${i * 80}ms, transform 0.3s ease ${i * 80}ms`,
                opacity: mounted || reducedMotion.current ? 1 : 0,
                transform: mounted || reducedMotion.current ? 'translateY(0)' : 'translateY(8px)',
              }}
            >
              {/* Rank */}
              <span
                className="mj-hero-table-rank"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: '#4b5563',
                  minWidth: 14,
                  textAlign: 'right',
                }}
              >
                {i + 1}
              </span>

              {/* Image */}
              <div
                className="mj-hero-table-img"
                style={{
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #0d1525, #162033)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {product.image ? (
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(product.image)}`}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.style.display = 'none';
                      if (el.parentElement) {
                        el.parentElement.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                      }
                    }}
                  />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                )}
              </div>

              {/* Name + Category */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="mj-hero-table-name"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                  }}
                >
                  {product.title}
                </div>
                <div
                  className="mj-hero-table-cat"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    color: '#6b7280',
                    marginTop: 1,
                  }}
                >
                  {product.category}
                </div>
              </div>

              {/* Orders */}
              <span
                className="mj-hero-table-orders"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: '#8b949e',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {formatOrders(product.orders)}
              </span>

              {/* Score badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <span
                  className="mj-hero-table-score"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#4f8ef7',
                    background: '#1e3a5f',
                    padding: '3px 8px',
                    borderRadius: 6,
                    lineHeight: 1.2,
                  }}
                >
                  {product.score}
                </span>
                {product.score >= 90 && (
                  <span
                    className="mj-hero-table-hot"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#ef4444',
                      marginTop: 2,
                      lineHeight: 1,
                    }}
                  >
                    HOT
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Bottom bar */}
          <div style={{
            background: '#0d1117',
            padding: '8px 16px',
            borderTop: '1px solid #161b22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: '#4b5563',
            }}>
              Showing top {displayProducts.length} of {totalCount}+ scored products
            </span>
            <a
              href="/sign-up"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: '#4f8ef7',
                textDecoration: 'none',
              }}
            >
              View all {'\u2192'}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
