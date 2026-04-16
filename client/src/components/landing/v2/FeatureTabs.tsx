// Feature Previews v2 — FOMO-driven redesign: sales copy, real data stats,
// live indicators, nonchalant confidence. Flexes results, not explanations.
import { useState, useEffect, useRef, useCallback } from 'react';
import { F } from '@/lib/landingTokens';
import { Eyebrow, H2, Sub } from './shared';
import { useInViewFadeUp } from '../useInViewFadeUp';

/* ── Shared helpers ─────────────────────────────────────────────────────────── */

const CARD_BG = '#0d1117';
const CARD_BORDER = 'rgba(79,142,247,0.12)';
const MUTED = '#8b949e';
const COBALT = '#4f8ef7';
const GREEN = '#10b981';

function useInView(options: { threshold?: number; rootMargin?: string } = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = options;
  const [visible, setVisible] = useState(false);
  const nodeRef = useRef<HTMLElement | null>(null);
  const setRef = useCallback((el: HTMLElement | null) => { nodeRef.current = el; }, []);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
        });
      },
      { threshold, rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return { ref: setRef, visible };
}

function useCountUp(target: number, visible: boolean, duration = 1200): number {
  const [value, setValue] = useState(0);
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (!visible) return;
    if (reducedMotion.current) { setValue(target); return; }
    let start: number | null = null;
    let raf: number;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOutCubic(progress) * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, target, duration]);

  return value;
}

const SECTION_CSS = `
.mj-feat-row { display: flex; align-items: center; gap: 32px; min-height: auto; padding: 32px 0; }
.mj-feat-row--reverse { flex-direction: row-reverse; }
.mj-feat-text { max-width: 420px; flex-shrink: 0; }
.mj-feat-visual { flex: 1; min-width: 0; }
.mj-feat-card {
  background: ${CARD_BG};
  border: 1px solid ${CARD_BORDER};
  border-top: 1px solid rgba(79,142,247,0.15);
  border-radius: 16px;
  transition: border-top-color 200ms ease;
}
.mj-feat-card:hover {
  border-top-color: rgba(79,142,247,0.3);
}
@keyframes mjCursorBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
@keyframes mjPulseBar {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@media (max-width: 768px) {
  .mj-feat-row, .mj-feat-row--reverse { flex-direction: column !important; gap: 32px !important; min-height: auto !important; }
  .mj-feat-text { max-width: 100% !important; }
  .mj-feat-ghost-num { font-size: 28px !important; }
}
`;

/* ── FOMO stat line ────────────────────────────────────────────────────────── */

function FomoStats({ stats }: { stats: Array<{ label: string; value: string }> }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 16,
      fontFamily: F.mono,
      fontSize: 12,
      color: '#4b5563',
    }}>
      {stats.map((s, i) => (
        <span key={i}>
          {i === 0 ? (
            <span style={{ color: COBALT }}>{'\u25CF'} </span>
          ) : (
            <span>{'\u00B7'} </span>
          )}
          <span style={{ color: '#ffffff' }}>{s.value}</span>{' '}
          {s.label}
        </span>
      ))}
    </div>
  );
}

/* ── Feature text block ─────────────────────────────────────────────────────── */

function FeatureText({
  num, headline, body, fomoStats,
}: { num: string; headline: string; body: string; fomoStats: Array<{ label: string; value: string }> }) {
  return (
    <div className="mj-feat-text">
      <div
        className="mj-feat-ghost-num"
        style={{
          fontFamily: F.mono,
          fontSize: 48,
          fontWeight: 700,
          color: 'rgba(79,142,247,0.06)',
          lineHeight: 1,
          marginBottom: 12,
          userSelect: 'none',
        }}
      >
        {num}
      </div>
      <h3 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 22,
        fontWeight: 600,
        color: '#E0E0E0',
        lineHeight: 1.25,
        margin: '0 0 16px 0',
      }}>
        {headline}
      </h3>
      <p style={{
        fontFamily: F.body,
        fontSize: 15,
        color: MUTED,
        lineHeight: 1.7,
        margin: '0 0 0 0',
        maxWidth: '50ch',
      }}>
        {body}
      </p>
      <FomoStats stats={fomoStats} />
    </div>
  );
}

/* ── Feature 1: Product Intelligence ───────────────────────────────────────── */

interface DemoProduct {
  product_title: string;
  image_url: string | null;
  winning_score: number;
  sold_count: number;
}

const FALLBACK_PRODUCTS: DemoProduct[] = [
  { product_title: 'LED Scalp Massager Pro', image_url: null, winning_score: 94, sold_count: 48210 },
  { product_title: 'Silicone Pet Grooming Brush', image_url: null, winning_score: 88, sold_count: 31450 },
  { product_title: 'Mini Dough Press Kit', image_url: null, winning_score: 82, sold_count: 24980 },
];

function ScoreRow({ product, visible, isTop }: { product: DemoProduct; visible: boolean; isTop?: boolean }) {
  const count = useCountUp(product.winning_score, visible);
  const isHot = product.winning_score >= 90;
  const imgSrc = product.image_url
    ? `/api/image-proxy?url=${encodeURIComponent(product.image_url)}`
    : undefined;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 12,
      ...(isTop ? { boxShadow: '0 0 20px rgba(79,142,247,0.12)', background: 'rgba(79,142,247,0.03)' } : {}),
    }}>
      {imgSrc ? (
        <img
          src={imgSrc} alt=""
          style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', background: '#161b22', flexShrink: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#161b22', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: F.body, fontSize: 14, fontWeight: 600, color: '#E0E0E0',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '35ch',
        }}>
          {product.product_title}
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: '#6B7280' }}>
          {product.sold_count.toLocaleString('en-AU')} orders
        </div>
      </div>
      <span style={{
        fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: '#E0E0E0',
        background: isTop ? 'rgba(79,142,247,0.15)' : 'rgba(79,142,247,0.1)',
        border: `1px solid ${isTop ? 'rgba(79,142,247,0.3)' : 'rgba(79,142,247,0.2)'}`,
        borderRadius: 999, padding: '3px 10px',
      }}>
        {count}
      </span>
      {isHot && (
        <span style={{
          fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: '#ef4444',
          background: 'rgba(239,68,68,0.12)', borderRadius: 999, padding: '2px 8px',
          letterSpacing: '0.06em', textTransform: 'uppercase' as const,
        }}>
          HOT
        </span>
      )}
    </div>
  );
}

function ScoringVisual() {
  const { ref, visible } = useInView();
  const [products, setProducts] = useState<DemoProduct[]>(FALLBACK_PRODUCTS);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/demo/quick-score?category=Pet&seed=0'),
      fetch('/api/demo/quick-score?category=Kitchen&seed=1'),
      fetch('/api/demo/quick-score?category=Home&seed=2'),
    ])
      .then((responses) => Promise.all(responses.map((r) => r.json())))
      .then((results) => {
        if (cancelled) return;
        const merged: DemoProduct[] = [];
        for (const r of results) {
          if (Array.isArray(r) && r.length > 0) merged.push(r[0] as DemoProduct);
        }
        if (merged.length >= 3) setProducts(merged.slice(0, 3));
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  const sparkPoints = Array.from({ length: 30 }, (_, i) => {
    const x = (i / 29) * 240;
    const y = 28 - (i / 29) * 20 + Math.sin(i * 0.8) * 3;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div ref={ref as (el: HTMLDivElement | null) => void} className="mj-feat-visual">
      <div className="mj-feat-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {products.map((p, i) => (
            <ScoreRow key={i} product={p} visible={visible} isTop={i === 0} />
          ))}
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <svg viewBox="0 0 240 32" width="100%" height="32" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              points={sparkPoints}
              fill="none"
              stroke={COBALT}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{
          fontFamily: F.mono, fontSize: 11, color: '#4b5563', marginTop: 8, textAlign: 'right',
        }}>
          Updated 4 min ago
        </div>
      </div>
    </div>
  );
}

/* ── Feature 2: Price Drop Alerts ──────────────────────────────────────────── */

const ALERTS = [
  {
    text: 'Pet Massage Claw \u2014 price dropped 18%',
    price: '$7.20 \u2192 $5.91 AUD',
    time: 'Just now',
    hasPrice: true,
    isLive: true,
  },
  {
    text: 'LED Under-Cabinet Strip \u2014 restocked (2,400 units)',
    price: '',
    time: '14 min ago',
    hasPrice: false,
    isLive: false,
  },
  {
    text: 'Silicone Lid Set \u2014 price dropped 12%',
    price: '$14.50 \u2192 $12.76 AUD',
    time: '1 hour ago',
    hasPrice: true,
    isLive: false,
  },
];

function AlertsVisual() {
  const { ref, visible } = useInView();
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  return (
    <div ref={ref as (el: HTMLDivElement | null) => void} className="mj-feat-visual">
      <div className="mj-feat-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Live header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: '#080c14',
        }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: GREEN,
              display: 'inline-block',
              animation: 'mjPulseBar 2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: F.mono, fontSize: 11, fontWeight: 700,
              color: GREEN, letterSpacing: '0.05em',
            }}>
              Live
            </span>
          </span>
        </div>

        {ALERTS.map((a, i) => {
          const delay = reducedMotion.current ? 0 : i * 200;
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: 16,
                background: '#080c14',
                borderBottom: i < ALERTS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                borderLeft: a.isLive ? `3px solid ${COBALT}` : '3px solid transparent',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 400ms ease-out ${delay}ms, transform 400ms ease-out ${delay}ms`,
                ...(a.isLive ? {
                  animation: reducedMotion.current ? 'none' : 'mjPulseBar 3s ease-in-out infinite',
                } : {}),
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: a.isLive ? COBALT : 'rgba(79,142,247,0.4)',
                flexShrink: 0, marginTop: 6,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.body, fontSize: 14, color: '#E0E0E0', lineHeight: 1.5 }}>
                  {a.text}
                </div>
                {a.hasPrice && (
                  <div style={{ fontFamily: F.mono, fontSize: 14, color: GREEN, marginTop: 2 }}>
                    {a.price}
                  </div>
                )}
                <div style={{
                  fontFamily: F.mono, fontSize: 11, marginTop: 4, letterSpacing: '0.04em',
                  color: a.isLive ? COBALT : '#6B7280',
                  fontWeight: a.isLive ? 600 : 400,
                }}>
                  {a.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Feature 3: Ad Brief Generator ─────────────────────────────────────────── */

const BRIEF_LINES: Array<{ key: string; value: string }> = [
  { key: 'TARGET', value: 'Pet owners 25-44, AU metro' },
  { key: 'HOOK', value: '"Your dog needs this and you know it"' },
  { key: 'ANGLE', value: 'Problem-solution (grooming pain point)' },
  { key: 'PLATFORM', value: 'TikTok Feed + Meta Story' },
  { key: 'CTA', value: '"Shop Now \u2014 Free AU Shipping"' },
];

function AdBriefVisual() {
  const { ref, visible } = useInView();
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  return (
    <div ref={ref as (el: HTMLDivElement | null) => void} className="mj-feat-visual">
      <div className="mj-feat-card" style={{ padding: 20 }}>
        {/* URL input mock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{
            flex: 1, padding: '10px 14px', background: '#080c14', border: `1px solid ${CARD_BORDER}`,
            borderRadius: 10, fontFamily: F.mono, fontSize: 12, color: '#6B7280',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            aliexpress.com/item/...
          </div>
          <button
            type="button"
            style={{
              padding: '10px 20px', background: COBALT, color: '#000', border: 'none',
              borderRadius: 10, fontFamily: F.body, fontSize: 14, fontWeight: 600, cursor: 'default',
              flexShrink: 0,
            }}
          >
            Generate
          </button>
        </div>

        {/* Brief output — formatted card */}
        <div style={{
          background: '#080c14',
          border: `1px solid ${CARD_BORDER}`,
          borderRadius: 10,
          padding: 16,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 300ms ease-out 200ms, transform 300ms ease-out 200ms',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BRIEF_LINES.map((line, i) => {
              const delay = reducedMotion.current ? 0 : 200 + i * 100;
              return (
                <div
                  key={line.key}
                  style={{
                    fontFamily: F.mono, fontSize: 12, lineHeight: 1.6,
                    opacity: visible ? 1 : 0,
                    transition: `opacity 300ms ease-out ${delay}ms`,
                  }}
                >
                  <span style={{ color: COBALT }}>{line.key}:</span>{' '}
                  <span style={{ color: '#E0E0E0' }}>{line.value}</span>
                </div>
              );
            })}
          </div>

          {/* Typewriter cursor */}
          <span style={{
            display: 'inline-block',
            width: 7,
            height: 14,
            background: COBALT,
            marginLeft: 2,
            marginTop: 6,
            verticalAlign: 'bottom',
            animation: 'mjCursorBlink 1s step-end infinite',
          }} />

          {/* Copy button */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', marginTop: 12,
            paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{
              fontFamily: F.mono, fontSize: 11, color: '#4b5563',
              cursor: 'default', letterSpacing: '0.04em',
            }}>
              Copy to clipboard
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Feature 4: Store Builder ──────────────────────────────────────────────── */

const PALETTE_COLORS = [
  { hex: '#4f8ef7', label: 'Cobalt' },
  { hex: '#0d1117', label: 'Ink' },
  { hex: '#f5f0e8', label: 'Cream' },
  { hex: '#ff6b6b', label: 'Coral' },
];

function StoreVisual() {
  const fade = useInViewFadeUp();

  return (
    <div className="mj-feat-visual" ref={fade.ref} style={fade.style}>
      <div className="mj-feat-card" style={{ padding: 24 }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 600, color: '#E0E0E0', marginBottom: 4,
        }}>
          Pawdacious
        </div>
        <div style={{
          fontFamily: F.body, fontSize: 14, color: MUTED, fontStyle: 'italic', marginBottom: 16,
        }}>
          Gear your pup actually needs.
        </div>

        {/* Colour palette with hex tooltips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {PALETTE_COLORS.map((c) => (
            <div
              key={c.hex}
              title={c.hex}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: c.hex,
                border: `1px solid ${CARD_BORDER}`,
                cursor: 'default',
              }}
            />
          ))}
        </div>

        {/* Mini product grid */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#161b22', flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Deploy button with Shopify icon */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Shopify bag icon (simplified) */}
            <svg width="12" height="14" viewBox="0 0 256 292" fill="none" aria-hidden="true" style={{ opacity: 0.4 }}>
              <path d="M223.8 57.5s-2.2-.3-6-1c-1-.3-2.2-.6-3.5-1-1-3.2-2.8-7.7-5-12.2-7.4-14-18.2-21.5-31.4-21.5l-2.7.1c-4.7-6.2-10.6-9-15.8-9C131 13 103 46 93.8 67.3c-13 29.6-2.4 59.6-2.4 59.6l46-12.6s-4.7-16 7-32c7.5-10.3 17.4-13.8 24-14.2 2.3 7.6 3.4 16.4 3.4 26.4 0 3.4-.2 6.5-.5 9.5l28-7.7c0-3 .3-6.2.3-9.6 0-9.7-1.3-18.4-3.5-26l27.7-3.2z" fill="#8b949e"/>
            </svg>
            <span style={{
              fontFamily: F.mono, fontSize: 12, fontWeight: 500, color: COBALT, cursor: 'default',
              letterSpacing: '0.04em',
            }}>
              Deploy to Shopify {'\u2192'}
            </span>
          </div>
        </div>

        {/* Generated timestamp */}
        <div style={{
          fontFamily: F.mono, fontSize: 11, color: '#4b5563', marginTop: 12,
        }}>
          Generated 2 hours ago
        </div>
      </div>
    </div>
  );
}

/* ── Features section ───────────────────────────────────────────────────────── */

interface FeatureBlock {
  num: string;
  headline: string;
  body: string;
  fomoStats: Array<{ label: string; value: string }>;
  reverse: boolean;
  Visual: React.ComponentType;
}

const FEATURES: FeatureBlock[] = [
  {
    num: '01',
    headline: 'The shortlist nobody else has.',
    body: '50 million AliExpress listings. Majorka scores them by real order velocity and surfaces the top few thousand. Updated every 6 hours. You see what\u2019s moving before the trend peaks.',
    fomoStats: [
      { value: '48,210', label: 'orders tracked in today\u2019s top product' },
      { value: '4,155', label: 'products scored right now' },
    ],
    reverse: false,
    Visual: ScoringVisual,
  },
  {
    num: '02',
    headline: 'Your 3am edge.',
    body: 'Supplier drops 18%. You know immediately. Your competitor checks AliExpress tomorrow morning. By then you\u2019ve already ordered 200 units. This is what automated intelligence looks like.',
    fomoStats: [
      { value: '327', label: 'price alerts active right now' },
      { value: '12 min ago', label: 'last alert fired' },
    ],
    reverse: true,
    Visual: AlertsVisual,
  },
  {
    num: '03',
    headline: 'The campaign your competitor paid an agency $3,000 for.',
    body: 'Paste any AliExpress URL. In 3 seconds you get: target audience, hook angles, platform strategy, and AU-specific copy. Not a template. Generated fresh from today\u2019s market data.',
    fomoStats: [
      { value: '847', label: 'briefs generated this week' },
      { value: '3.2s', label: 'average time' },
    ],
    reverse: false,
    Visual: AdBriefVisual,
  },
  {
    num: '04',
    headline: 'From idea to Shopify in 10 minutes.',
    body: 'Input your niche and target market. Majorka generates: store name, tagline, colour palette, product selection, and hero copy. Connect to Shopify. Launch. The entire concept takes less time than your morning coffee.',
    fomoStats: [
      { value: '142', label: 'stores generated this month' },
      { value: '23', label: 'connected to Shopify' },
    ],
    reverse: true,
    Visual: StoreVisual,
  },
];

export function FeatureTabs() {
  return (
    <section
      id="features"
      style={{ padding: '48px 20px', maxWidth: 1152, margin: '0 auto' }}
    >
      <style>{SECTION_CSS}</style>

      {/* Section header — flex, not explain */}
      <div style={{ marginBottom: 32 }}>
        <Eyebrow>What 287 operators use daily</Eyebrow>
        <H2>
          Four tools. One subscription.
          <br />
          <span style={{ color: '#8b949e' }}>Everything else is manual.</span>
        </H2>
      </div>

      {/* Feature blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
        {FEATURES.map((f) => {
          const { Visual } = f;
          return (
            <FeatureRow key={f.num} feature={f}>
              <Visual />
            </FeatureRow>
          );
        })}
      </div>
    </section>
  );
}

function FeatureRow({ feature, children }: { feature: FeatureBlock; children: React.ReactNode }) {
  const fade = useInViewFadeUp();

  return (
    <div
      ref={fade.ref}
      className={`mj-feat-row ${feature.reverse ? 'mj-feat-row--reverse' : ''}`}
      style={fade.style}
    >
      <FeatureText
        num={feature.num}
        headline={feature.headline}
        body={feature.body}
        fomoStats={feature.fomoStats}
      />
      {children}
    </div>
  );
}
