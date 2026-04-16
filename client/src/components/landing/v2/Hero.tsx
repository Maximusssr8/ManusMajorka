// Hero v2 — premium centered hero with live dashboard mockup + floating badges.
import { useEffect, useState, useRef } from 'react';
import { Link } from 'wouter';
import { LT, F, MAX } from '@/lib/landingTokens';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface DemoProduct {
  id: string;
  title: string;
  image: string | null;
  orders: number;
  score: number;
  category: string;
}

/* ── Fetch helpers ──────────────────────────────────────────────────────── */
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

/* ── CSS keyframes (injected once) ──────────────────────────────────────── */
const HERO_CSS = `
@keyframes mjPulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
@keyframes mjUnderline {
  from { stroke-dashoffset: 300; }
  to { stroke-dashoffset: 0; }
}
@keyframes mjBadgeFadeRight {
  from { opacity:0; transform: translateX(20px); }
  to { opacity:1; transform: translateX(0); }
}
@keyframes mjBadgeFadeLeft {
  from { opacity:0; transform: translateX(-20px); }
  to { opacity:1; transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .mj-hero-underline-path { animation: none !important; stroke-dashoffset: 0 !important; }
  .mj-hero-badge { animation: none !important; opacity: 1 !important; }
  .mj-hero-card-stagger { opacity: 1 !important; transform: none !important; }
}
@media (max-width: 768px) {
  .mj-hero-h1 { font-size: 48px !important; }
  .mj-hero-mockup { transform: none !important; }
  .mj-hero-mockup-wrap { perspective: none !important; }
  .mj-hero-badge { display: none !important; }
  .mj-hero-dashboard { flex-direction: column !important; }
  .mj-hero-sidebar { display: none !important; }
  .mj-hero-right-panel { display: none !important; }
}
`;

/* ── Sparkline SVG ──────────────────────────────────────────────────────── */
function Sparkline() {
  const points = [20, 25, 22, 30, 35, 28, 40, 45, 38, 52, 58, 65];
  const w = 200;
  const h = 60;
  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const range = maxVal - minVal || 1;
  const coords = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - minVal) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={coords} fill="none" stroke={LT.cobalt} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── MarketBar ──────────────────────────────────────────────────────────── */
function MarketBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontFamily: F.mono, fontSize: 11, color: LT.textMute, width: 24 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: LT.cobalt, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: F.mono, fontSize: 11, color: LT.textMute, width: 30, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

/* ── Product card (inside dashboard) ────────────────────────────────────── */
function DashProductCard({
  p,
  loading,
  delay,
  visible,
}: {
  p: DemoProduct | null;
  loading: boolean;
  delay: number;
  visible: boolean;
}) {
  const style: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${LT.border}`,
    borderRadius: 10,
    padding: 12,
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
  };

  if (loading || !p) {
    return (
      <div className="mj-hero-card-stagger" style={style}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '80%', marginBottom: 6 }} />
          <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '50%' }} />
        </div>
      </div>
    );
  }

  const title = p.title.length > 35 ? p.title.slice(0, 34).trimEnd() + '\u2026' : p.title;
  return (
    <div className="mj-hero-card-stagger" style={style}>
      <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
        {p.image ? (
          <img
            src={proxyImage(p.image)}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 500, color: LT.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
          <span style={{
            fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: LT.cobalt,
            background: LT.cobaltTint, borderRadius: 999, padding: '1px 8px',
          }}>
            {p.score}
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 13, color: LT.textMute }}>
            {p.orders.toLocaleString('en-AU')} orders
          </span>
          <span style={{
            fontFamily: F.body, fontSize: 10, fontWeight: 500, color: LT.textMute,
            background: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: '2px 8px',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {p.category}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Nav items for sidebar ──────────────────────────────────────────────── */
const SIDEBAR_ITEMS = [
  { label: 'Home', active: false },
  { label: 'Products', active: true },
  { label: 'Analytics', active: false },
  { label: 'Maya AI', active: false },
  { label: 'Ad Copy', active: false },
];

/* ── Hero export ────────────────────────────────────────────────────────── */
export function Hero() {
  const [products, setProducts] = useState<(DemoProduct | null)[]>([null, null, null, null]);
  const [loading, setLoading] = useState(true);
  const [cardsVisible, setCardsVisible] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(HERO_CATEGORIES.map((c) => fetchDemoProduct(c)));
      if (cancelled) return;
      const withFallback = results.map((r, i) => r ?? {
        id: `fallback-${i}`,
        title: `${HERO_CATEGORIES[i]} \u2014 loading product data`,
        image: null,
        orders: 0,
        score: 0,
        category: HERO_CATEGORIES[i],
      });
      setProducts(withFallback);
      setLoading(false);
      // Trigger card stagger after a tick
      requestAnimationFrame(() => { if (!cancelled) setCardsVisible(true); });
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        paddingTop: 120,
        paddingBottom: 96,
        paddingLeft: 24,
        paddingRight: 24,
        background: LT.bg,
        overflow: 'hidden',
      }}
    >
      <style>{HERO_CSS}</style>

      {/* Radial glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(800px circle at 50% 40%, ${LT.cobaltGlow}, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: MAX, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* ROW A — Text */}

        {/* Eyebrow pill */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: LT.cobalt,
              border: '1px solid rgba(79,142,247,0.25)',
              borderRadius: 9999,
              padding: '5px 14px',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: LT.cobalt,
                animation: 'mjPulse 2s infinite',
              }}
            />
            AI Product Intelligence &middot; AU / US / UK
          </span>
        </div>

        {/* H1 */}
        <h1
          className="mj-hero-h1"
          style={{
            fontFamily: F.display,
            fontSize: 80,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: LT.text,
            margin: '0 auto',
            maxWidth: 900,
          }}
        >
          The{' '}
          <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
            unfair
            <svg
              aria-hidden
              style={{ position: 'absolute', left: -4, right: -4, bottom: -8, width: 'calc(100% + 8px)', height: 14, overflow: 'visible' }}
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                className="mj-hero-underline-path"
                d="M2 9 C50 3, 150 3, 198 9"
                stroke={LT.cobalt}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="300"
                strokeDashoffset="0"
                style={{ animation: 'mjUnderline 0.6s ease-out forwards' }}
              />
            </svg>
          </span>{' '}
          advantage
          <br />
          for dropshippers.
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontFamily: F.body,
            fontWeight: 400,
            fontSize: 20,
            lineHeight: 1.6,
            color: LT.textMute,
            margin: '24px auto 0',
            maxWidth: 540,
          }}
        >
          Majorka analyses millions of AliExpress listings and surfaces the few worth selling &mdash; ranked by real order velocity across AU, US and UK.
        </p>

        {/* CTAs */}
        <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
          <Link
            href="/sign-up"
            className="mj-cta-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 32px',
              background: LT.cobalt,
              color: '#fff',
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'transform 150ms ease, background 150ms ease, box-shadow 150ms ease',
            }}
          >
            Get Started &rarr;
          </Link>
          <Link
            href="#demo"
            className="mj-cta-ghost"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 32px',
              background: 'transparent',
              color: LT.textMute,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
          >
            Watch 90-sec demo &rarr;
          </Link>
        </div>

        {/* Trust strip */}
        <div style={{ marginTop: 20, fontFamily: F.body, fontSize: 13, color: '#6b7280', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span>&#10003; No credit card</span>
          <span>&#10003; Cancel anytime</span>
          <span>&#10003; 30-day guarantee</span>
        </div>

        {/* ROW B — Dashboard mockup */}
        <div
          ref={mockupRef}
          className="mj-hero-mockup-wrap"
          style={{
            marginTop: 64,
            maxWidth: 1120,
            marginLeft: 'auto',
            marginRight: 'auto',
            perspective: '1400px',
            position: 'relative',
          }}
        >
          {/* Floating badges */}
          <div
            className="mj-hero-badge"
            style={{
              position: 'absolute',
              top: 24,
              right: -24,
              transform: 'rotate(6deg)',
              zIndex: 10,
              background: LT.bgCard,
              border: '1px solid rgba(79,142,247,0.25)',
              borderRadius: 10,
              padding: '8px 14px',
              fontFamily: F.body,
              fontSize: 13,
              fontWeight: 700,
              color: LT.cobalt,
              animation: 'mjBadgeFadeRight 0.5s ease-out 0.8s both',
              whiteSpace: 'nowrap',
            }}
          >
            &uarr; 120,933 orders
          </div>
          <div
            className="mj-hero-badge"
            style={{
              position: 'absolute',
              bottom: 80,
              left: -16,
              transform: 'rotate(-4deg)',
              zIndex: 10,
              background: LT.bgCard,
              border: '1px solid rgba(79,142,247,0.25)',
              borderRadius: 10,
              padding: '8px 14px',
              fontFamily: F.body,
              fontSize: 13,
              fontWeight: 700,
              color: LT.text,
              animation: 'mjBadgeFadeLeft 0.5s ease-out 1s both',
              whiteSpace: 'nowrap',
            }}
          >
            Score: 94 &middot; AU demand 49%
          </div>
          <div
            className="mj-hero-badge"
            style={{
              position: 'absolute',
              bottom: 32,
              right: 16,
              zIndex: 10,
              background: LT.bgCard,
              border: '1px solid rgba(79,142,247,0.25)',
              borderRadius: 10,
              padding: '8px 14px',
              fontFamily: F.body,
              fontSize: 13,
              fontWeight: 700,
              color: '#f59e0b',
              animation: 'mjBadgeFadeRight 0.5s ease-out 1.2s both',
              whiteSpace: 'nowrap',
            }}
          >
            &#128276; Price dropped 12% &mdash; restock alert
          </div>

          {/* Dashboard frame */}
          <div
            className="mj-hero-mockup"
            style={{
              background: 'linear-gradient(180deg, #0d1117, #080c14)',
              border: '1px solid #161b22',
              borderRadius: 16,
              boxShadow: '0 0 0 1px #161b22, 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 120px -40px rgba(79,142,247,0.19)',
              overflow: 'hidden',
              transformOrigin: 'top center',
              transform: 'perspective(1400px) rotateX(4deg)',
              transition: 'transform 600ms ease',
            }}
          >
            {/* Browser chrome */}
            <div
              style={{
                height: 36,
                borderBottom: '1px solid #161b22',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: 8,
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
              <span style={{ marginLeft: 16, fontFamily: F.mono, fontSize: 11, color: '#52525b' }}>
                majorka.io/app/products
              </span>
            </div>

            {/* 3-column dashboard */}
            <div
              className="mj-hero-dashboard"
              style={{ display: 'flex', minHeight: 320 }}
            >
              {/* Left sidebar */}
              <div
                className="mj-hero-sidebar"
                style={{
                  width: 180,
                  background: '#080c14',
                  borderRight: '1px solid #161b22',
                  padding: '16px 0',
                  flexShrink: 0,
                }}
              >
                {SIDEBAR_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 16px',
                      fontFamily: F.body,
                      fontSize: 13,
                      color: item.active ? LT.text : LT.textMute,
                      borderLeft: item.active ? `2px solid ${LT.cobalt}` : '2px solid transparent',
                      background: item.active ? 'rgba(79,142,247,0.06)' : 'transparent',
                    }}
                  >
                    <span style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: item.active ? LT.cobaltTint : 'rgba(255,255,255,0.06)',
                      flexShrink: 0,
                    }} />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Center content */}
              <div style={{ flex: 1, padding: 20, minWidth: 0, minHeight: 200 }}>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: LT.text, marginBottom: 4 }}>
                  Products
                </div>
                <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute, marginBottom: 16 }}>
                  Winners ranked by real order velocity
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {products.map((p, i) => (
                    <DashProductCard key={i} p={p} loading={loading} delay={i * 80} visible={cardsVisible || loading} />
                  ))}
                </div>
              </div>

              {/* Right panel */}
              <div
                className="mj-hero-right-panel"
                style={{
                  width: 240,
                  background: '#080c14',
                  borderLeft: '1px solid #161b22',
                  padding: 20,
                  flexShrink: 0,
                }}
              >
                <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 600, color: LT.textMute, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  Trend Velocity &middot; 30D
                </div>
                <Sparkline />
                <div style={{ marginTop: 20 }}>
                  <MarketBar label="AU" pct={49} />
                  <MarketBar label="US" pct={31} />
                  <MarketBar label="UK" pct={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
