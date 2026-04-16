// Feature Previews v2 — Academy-inspired: monospace eyebrows, two-tone headings,
// Academy card style (#0d1117, rounded-2xl, subtle cobalt borders), Syne display.
import { useState, useEffect, useRef, useCallback } from 'react';
import { F } from '@/lib/landingTokens';
import { Eyebrow, H2, Sub } from './shared';
import { useInViewFadeUp } from '../useInViewFadeUp';

/* ── Shared helpers ─────────────────────────────────────────────────────────── */

const CARD_BG = '#0d1117';
const CARD_BORDER = 'rgba(79,142,247,0.08)';
const CARD_BORDER_HOVER = 'rgba(79,142,247,0.18)';
const MUTED = '#9CA3AF';
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
.mj-feat-row { display: flex; align-items: center; gap: 64px; min-height: 55vh; }
.mj-feat-row--reverse { flex-direction: row-reverse; }
.mj-feat-text { max-width: 420px; flex-shrink: 0; }
.mj-feat-visual { flex: 1; min-width: 0; }
@media (max-width: 768px) {
  .mj-feat-row, .mj-feat-row--reverse { flex-direction: column !important; gap: 32px !important; min-height: auto !important; }
  .mj-feat-text { max-width: 100% !important; }
  .mj-feat-ghost-num { font-size: 28px !important; }
}
`;

/* ── Feature text block ─────────────────────────────────────────────────────── */

function FeatureText({
  num, headline, body, stat,
}: { num: string; headline: string; body: string; stat: string }) {
  return (
    <div className="mj-feat-text">
      <div
        className="mj-feat-ghost-num"
        style={{
          fontFamily: F.mono,
          fontSize: 48,
          fontWeight: 700,
          color: 'rgba(79,142,247,0.12)',
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
        fontSize: 16,
        color: MUTED,
        lineHeight: 1.7,
        margin: '0 0 20px 0',
      }}>
        {body}
      </p>
      <div style={{
        fontFamily: F.mono,
        fontSize: 12,
        letterSpacing: '0.06em',
        color: COBALT,
      }}>
        {stat}
      </div>
    </div>
  );
}

/* ── Feature 1: Product Scoring ─────────────────────────────────────────────── */

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

function ScoreRow({ product, visible }: { product: DemoProduct; visible: boolean }) {
  const count = useCountUp(product.winning_score, visible);
  const isHot = product.winning_score >= 90;
  const imgSrc = product.image_url
    ? `/api/image-proxy?url=${encodeURIComponent(product.image_url)}`
    : undefined;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 12,
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
          fontFamily: F.body, fontSize: 13, fontWeight: 600, color: '#E0E0E0',
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
        background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)',
        borderRadius: 999, padding: '3px 10px',
      }}>
        {count}
      </span>
      {isHot && (
        <span style={{
          fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: '#ef4444',
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
      <div style={{
        background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 16, padding: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {products.map((p, i) => (
            <ScoreRow key={i} product={p} visible={visible} />
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
      </div>
    </div>
  );
}

/* ── Feature 2: Price Drop Alerts ───────────────────────────────────────────── */

const ALERTS = [
  {
    text: 'Pet Massage Claw \u2014 price dropped 18%',
    price: '$7.20 \u2192 $5.91 AUD',
    time: '2 min ago',
    hasPrice: true,
  },
  {
    text: 'LED Under-Cabinet Strip \u2014 restocked (2,400 units)',
    price: '',
    time: '14 min ago',
    hasPrice: false,
  },
  {
    text: 'Silicone Lid Set \u2014 price dropped 12%',
    price: '$14.50 \u2192 $12.76 AUD',
    time: '1 hour ago',
    hasPrice: true,
  },
];

function AlertsVisual() {
  const { ref, visible } = useInView();
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  return (
    <div ref={ref as (el: HTMLDivElement | null) => void} className="mj-feat-visual">
      <div style={{
        background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 16, padding: 0,
        overflow: 'hidden',
      }}>
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
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 400ms ease-out ${delay}ms, transform 400ms ease-out ${delay}ms`,
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: COBALT, flexShrink: 0, marginTop: 6,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.body, fontSize: 13, color: '#E0E0E0', lineHeight: 1.5 }}>
                  {a.text}
                </div>
                {a.hasPrice && (
                  <div style={{ fontFamily: F.mono, fontSize: 13, color: GREEN, marginTop: 2 }}>
                    {a.price}
                  </div>
                )}
                <div style={{ fontFamily: F.mono, fontSize: 10, color: '#6B7280', marginTop: 4, letterSpacing: '0.04em' }}>
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

/* ── Feature 3: Ad Brief Generator ──────────────────────────────────────────── */

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
      <div style={{
        background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 16, padding: 20,
      }}>
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
              borderRadius: 10, fontFamily: F.body, fontSize: 13, fontWeight: 600, cursor: 'default',
              flexShrink: 0,
            }}
          >
            Generate
          </button>
        </div>

        {/* Brief output */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 300ms ease-out 200ms, transform 300ms ease-out 200ms',
        }}>
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
      </div>
    </div>
  );
}

/* ── Feature 4: Store Builder ───────────────────────────────────────────────── */

function StoreVisual() {
  const fade = useInViewFadeUp();

  return (
    <div className="mj-feat-visual" ref={fade.ref} style={fade.style}>
      <div style={{
        background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 16, padding: 24,
      }}>
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

        {/* Colour palette */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['#4f8ef7', '#0d1117', '#f5f0e8', '#ff6b6b'].map((c) => (
            <div
              key={c}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: c,
                border: `1px solid ${CARD_BORDER}`,
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

        {/* Deploy button mock */}
        <div style={{
          fontFamily: F.mono, fontSize: 12, fontWeight: 500, color: COBALT, cursor: 'default',
          letterSpacing: '0.04em',
        }}>
          Deploy to Shopify {'\u2192'}
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
  stat: string;
  reverse: boolean;
  Visual: React.ComponentType;
}

const FEATURES: FeatureBlock[] = [
  {
    num: '01',
    headline: 'Find the winner before the crowd.',
    body: 'Majorka scores every product by real order velocity \u2014 not just total orders. A product doubling weekly at 10K beats one slowing at 100K. You see the signal weeks early.',
    stat: '50M+ listings scanned',
    reverse: false,
    Visual: ScoringVisual,
  },
  {
    num: '02',
    headline: 'Get the alert. Beat the restock.',
    body: 'Set alerts on any product. When a supplier drops price by 12%, you know at 3am \u2014 before anyone else orders. Automated edge.',
    stat: 'Checks every 6 hours',
    reverse: true,
    Visual: AlertsVisual,
  },
  {
    num: '03',
    headline: 'Paste a URL. Get a complete ad strategy.',
    body: "Every product comes with an AI-generated marketing brief \u2014 target audience, hook angles, platform recommendations, and AU-specific insights. Not a template. Fresh analysis from today\u2019s data.",
    stat: 'Generated in 3 seconds',
    reverse: false,
    Visual: AdBriefVisual,
  },
  {
    num: '04',
    headline: 'One click. A complete store concept.',
    body: 'Input your niche. Majorka generates a store name, tagline, colour palette, product selection rationale, and hero copy. Connect to Shopify and launch.',
    stat: 'Shopify-ready output',
    reverse: true,
    Visual: StoreVisual,
  },
];

export function FeatureTabs() {
  return (
    <section
      id="features"
      style={{ padding: '80px 20px', maxWidth: 1152, margin: '0 auto' }}
    >
      <style>{SECTION_CSS}</style>

      {/* Section header -- Academy-style monospace eyebrow + two-tone heading */}
      <div style={{ marginBottom: 64 }}>
        <Eyebrow>The Toolkit {'\u00B7'} 4 tools {'\u00B7'} 1 subscription</Eyebrow>
        <H2>
          Stop researching.
          <br />
          <span style={{ color: '#9CA3AF' }}>Start selling.</span>
        </H2>
        <Sub style={{ marginTop: 12 }}>
          Every edge a dropshipper needs. Data-backed, not guesswork.
        </Sub>
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
        stat={feature.stat}
      />
      {children}
    </div>
  );
}
