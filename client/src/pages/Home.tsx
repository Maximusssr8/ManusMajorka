import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';
import { useIsMobile } from '@/hooks/useIsMobile';

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#0a0a0a',
  bgElevated: '#0e0e10',
  bgSurface: '#111114',
  bgPanel: '#0d0d10',
  bgChrome: '#1a1a1f',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  borderFaint: 'rgba(255,255,255,0.05)',
  text: '#ededed',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  textFaint: '#52525b',
  textGhost: '#3f3f46',
  accent: '#6366F1',
  accentHover: '#7c83f4',
  accentDim: 'rgba(99,102,241,0.12)',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
} as const;

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

// ── Global styles ────────────────────────────────────────────────────────────
const STYLES = `
*::selection { background: rgba(99,102,241,0.3); color: #fff; }
html, body { background: ${T.bg}; }

@keyframes mj-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
@keyframes mj-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes mj-marquee-slow {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes mj-fade-in-down {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes mj-fade-slide-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes mj-row-stagger {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes mj-row-pulse-green {
  0%   { box-shadow: inset 3px 0 0 ${T.green}, 0 0 0 0 rgba(34,197,94,0.4); }
  50%  { box-shadow: inset 3px 0 0 ${T.green}, 0 0 0 4px rgba(34,197,94,0.0); }
  100% { box-shadow: inset 3px 0 0 transparent, 0 0 0 0 rgba(34,197,94,0); }
}
@keyframes mj-shimmer {
  0%   { transform: translateX(-120%) skewX(-20deg); }
  60%  { transform: translateX(220%) skewX(-20deg); }
  100% { transform: translateX(220%) skewX(-20deg); }
}

.mj-eyebrow {
  font-family: ${mono};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${T.accent};
}

.mj-link {
  color: ${T.textMuted};
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 150ms;
}
.mj-link:hover { color: ${T.text}; }

.mj-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 22px;
  background: ${T.accent};
  color: #fff;
  font-family: ${sans};
  font-weight: 600;
  font-size: 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background 150ms, transform 150ms;
  white-space: nowrap;
}
.mj-btn-primary:hover { background: ${T.accentHover}; transform: translateY(-1px); }

.mj-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 22px;
  background: transparent;
  color: ${T.text};
  font-family: ${sans};
  font-weight: 500;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid ${T.borderStrong};
  cursor: pointer;
  text-decoration: none;
  transition: border-color 150ms, background 150ms;
  white-space: nowrap;
}
.mj-btn-secondary:hover { border-color: ${T.accent}; background: rgba(99,102,241,0.06); }

.mj-card {
  background: ${T.bgSurface};
  border: 1px solid ${T.border};
  border-radius: 8px;
  transition: border-color 200ms, background 200ms, transform 200ms;
}
.mj-card:hover { border-color: ${T.borderStrong}; background: ${T.bgElevated}; }

.mj-pulse-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${T.green};
  box-shadow: 0 0 8px rgba(34,197,94,0.6);
  animation: mj-pulse 1.6s infinite;
}
.mj-marquee-track {
  display: flex;
  gap: 64px;
  width: max-content;
  animation: mj-marquee 32s linear infinite;
}
.mj-ticker-track {
  display: flex;
  gap: 48px;
  width: max-content;
  animation: mj-marquee-slow 35s linear infinite;
}

.mj-row-enter { animation: mj-fade-in-down 400ms ease-out; }
.mj-row-pulse { animation: mj-row-pulse-green 3s ease-out 1; }

.mj-reveal { opacity: 0; transform: translateY(16px); transition: opacity 400ms ease, transform 400ms ease; }
.mj-reveal.is-visible { opacity: 1; transform: translateY(0); }

.mj-shimmer-btn {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.mj-shimmer-btn::after {
  content: "";
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 60%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  animation: mj-shimmer 3s ease-in-out infinite;
  pointer-events: none;
}

.mj-ticker-strip { position: relative; }
.mj-ticker-strip::before, .mj-ticker-strip::after {
  content: "";
  position: absolute;
  top: 0; bottom: 0;
  width: 80px;
  pointer-events: none;
  z-index: 2;
}
.mj-ticker-strip::before { left: 0;  background: linear-gradient(90deg, ${T.bgPanel}, transparent); }
.mj-ticker-strip::after  { right: 0; background: linear-gradient(-90deg, ${T.bgPanel}, transparent); }

.mj-glow-edge { mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent); }

@media (max-width: 968px) {
  .mj-features-layout { grid-template-columns: 1fr !important; }
  .mj-features-left { position: static !important; }
}
@media (max-width: 768px) {
  .mj-hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
  .mj-pricing-grid { grid-template-columns: 1fr !important; }
  .mj-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
  .mj-nav-links { display: none !important; }
  .mj-hero-h1 { font-size: 42px !important; }
  .mj-section-h2 { font-size: 32px !important; }
  .mj-cta-h2 { font-size: 48px !important; }
  .mj-hero-cta { flex-direction: column !important; align-items: stretch !important; }
  .mj-hero-cta > * { width: 100% !important; }
  .mj-data-panel { display: none !important; }
  .mj-credibility { flex-wrap: wrap !important; gap: 12px 14px !important; }
  .mj-comparison { font-size: 12px !important; }
}
`;

// ── Data ─────────────────────────────────────────────────────────────────────
const PARTNERS = ['Shopify', 'AliExpress', 'Meta Ads', 'TikTok', 'Stripe', 'Google Ads', 'DHL'];

const TICKER_ITEMS: string[] = [
  '🇦🇺 AU operator found $14,200/mo product · 2 min ago',
  '🇺🇸 US store launched via Store Builder · 4 min ago',
  '🇬🇧 UK competitor spy scan completed · 7 min ago',
  '🇨🇦 CA margin calculator: 44% net margin · 9 min ago',
  '🇩🇪 DE winning product: 91 score · 11 min ago',
  '🇸🇬 SG ad creative generated · 14 min ago',
  '2.4M+ products tracked across 7 markets',
  '500+ active operators this week',
];

interface Feature { tag: string; title: string; subtitle: string }
const FEATURES: Feature[] = [
  { tag: '01', title: 'Discovery',           subtitle: 'AI-scored product opportunities' },
  { tag: '02', title: 'Margin',              subtitle: 'True profit before you spend' },
  { tag: '03', title: 'Creative',            subtitle: 'Ad copy and angles, ready to ship' },
  { tag: '04', title: 'Spy',                 subtitle: 'Competitor stores, fully decoded' },
  { tag: '05', title: 'Build',               subtitle: 'Shopify stores in minutes' },
  { tag: '06', title: 'Markets',             subtitle: 'Seven regions, fully localised' },
];

const STEPS: { num: string; title: string; body: string }[] = [
  { num: '01', title: 'Pick a market', body: 'Choose your region. Majorka adapts pricing, suppliers, and compliance to where you sell.' },
  { num: '02', title: 'Discover and validate', body: 'Find scored product opportunities. Run the profit calculator. Spy on competitor stores.' },
  { num: '03', title: 'Build, launch, scale', body: 'Generate the brand and store, push to Shopify, ship ad creatives. Monitor performance.' },
];

const FAQ_DATA: { q: string; a: string }[] = [
  { q: 'How is Majorka different from KaloData or Minea?', a: 'Majorka is the operating system, not a single tool. Product research, competitor spying, store building, ad creative, and profit math live in one dashboard with one bill.' },
  { q: 'Where does product data come from?', a: 'AliExpress (via affiliate API for real images and pricing), TikTok Shop, and partner marketplace integrations. We refresh signals continuously.' },
  { q: 'Do I need a Shopify store first?', a: 'No. You can build one inside Majorka and push it live to a new or existing Shopify account in minutes.' },
  { q: 'Which markets are supported?', a: 'Australia, United States, United Kingdom, Canada, New Zealand, Germany, and Singapore — with localised currency, shipping, and tax.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Month-to-month, no contracts. Annual plans save 20% and refund the unused portion.' },
];

// ── Reveal hook ─────────────────────────────────────────────────────────────
function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── Section Header ──────────────────────────────────────────────────────────
interface SectionHeaderProps {
  eyebrow: string;
  line1: string;
  line2: string;
  description?: string;
  align?: 'left' | 'center';
  maxWidth?: number;
}
function SectionHeader({ eyebrow, line1, line2, description, align = 'left', maxWidth = 700 }: SectionHeaderProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="mj-reveal"
      style={{
        marginBottom: 56,
        maxWidth,
        marginLeft: align === 'center' ? 'auto' : undefined,
        marginRight: align === 'center' ? 'auto' : undefined,
        textAlign: align,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        justifyContent: align === 'center' ? 'center' : 'flex-start',
      }}>
        <span style={{
          display: 'inline-block',
          width: 4,
          height: 32,
          background: T.accent,
          borderRadius: 2,
        }} />
        <span className="mj-eyebrow">{eyebrow}</span>
      </div>
      <h2 className="mj-section-h2" style={{
        fontFamily: display,
        fontWeight: 700,
        fontSize: 48,
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
        color: T.text,
        margin: '0 0 16px',
      }}>
        {line1}<br />
        <span style={{ color: T.accent }}>{line2}</span>
      </h2>
      {description && (
        <p style={{ fontSize: 16, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>{description}</p>
      )}
    </div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────
interface NavProps { scrolled: boolean }
function Nav({ scrolled }: NavProps) {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: scrolled ? 'rgba(10,10,10,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: `1px solid ${scrolled ? T.border : 'transparent'}`,
      transition: 'background 200ms, border-color 200ms, backdrop-filter 200ms',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6, background: T.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: display, fontWeight: 800, fontSize: 14, color: '#fff',
          }}>M</div>
          <span style={{ fontFamily: display, fontWeight: 700, fontSize: 16, color: T.text, letterSpacing: '-0.02em' }}>Majorka</span>
        </a>

        <div className="mj-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#features" className="mj-link">Features</a>
          <a href="#compare" className="mj-link">Compare</a>
          <a href="#workflow" className="mj-link">Workflow</a>
          <a href="#pricing" className="mj-link">Pricing</a>
          <a href="/blog" className="mj-link">Blog</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/sign-in" className="mj-link">Log in</Link>
          <Link href="/sign-up" className="mj-btn-primary" style={{ height: 36, fontSize: 13, padding: '0 16px' }}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      position: 'relative',
      borderBottom: `1px solid ${T.border}`,
      overflow: 'hidden',
      isolation: 'isolate',
    }}>
      {/* Radial glows */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 55% 35%, rgba(99,102,241,0.16) 0%, rgba(99,102,241,0.04) 45%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 40% 30% at 85% 15%, rgba(99,102,241,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 1200,
        margin: '0 auto',
        padding: '120px 24px 100px',
      }}>
        <div className="mj-hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: 64,
          alignItems: 'center',
        }}>
          {/* Left: copy */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="mj-eyebrow" style={{ marginBottom: 20 }}>
              <span className="mj-pulse-dot" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              The Ecommerce Operating System
            </div>
            <h1 className="mj-hero-h1" style={{
              fontFamily: display,
              fontWeight: 700,
              fontSize: 60,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: T.text,
              margin: '0 0 24px',
            }}>
              The unfair advantage<br />
              serious dropshippers<br />
              <span style={{ color: T.textMuted }}>don&apos;t talk about.</span>
            </h1>
            <p style={{
              fontSize: 17,
              lineHeight: 1.6,
              color: T.textMuted,
              maxWidth: 540,
              margin: '0 0 36px',
            }}>
              Product intelligence, margin data, competitor spy, and store builder — across 7 markets. One platform, one bill.
            </p>
            <div className="mj-hero-cta" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/sign-up" className="mj-btn-primary">Find my first winning product →</Link>
              <a href="#features" className="mj-btn-secondary">See it in action</a>
            </div>

            {/* Credibility bar */}
            <div className="mj-credibility" style={{
              marginTop: 28,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              padding: '10px 18px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {[
                  { i: 'A', from: '#6366F1', to: '#8B5CF6' },
                  { i: 'J', from: '#22c55e', to: '#10b981' },
                  { i: 'S', from: '#f59e0b', to: '#ef4444' },
                ].map((a, i) => (
                  <div key={a.i} style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
                    border: `2px solid ${T.bg}`,
                    marginLeft: i === 0 ? 0 : -8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: display,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                  }}>{a.i}</div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: T.amber, fontFamily: mono, fontWeight: 600 }}>
                <span>★★★★★</span><span style={{ color: T.text, marginLeft: 4 }}>4.9</span>
              </div>
              <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontFamily: mono, fontSize: 12, color: T.textMuted }}>500+ operators</span>
              <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontFamily: mono, fontSize: 12, color: T.textMuted }}>7 global markets</span>
              <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 12, color: T.textMuted }}>
                <span className="mj-pulse-dot" />
                live data
              </span>
            </div>
          </div>

          {/* Right: app window */}
          <AppWindow />
        </div>
      </div>
    </section>
  );
}

// ── App Window ──────────────────────────────────────────────────────────────
interface PRow { name: string; score: number; trend: string; vol: string; isNew?: boolean }
const PRODUCT_POOL: PRow[] = [
  { name: 'Posture Corrector Pro',  score: 94, trend: '+18%', vol: '12,847' },
  { name: 'LED Strip Lights 5m',    score: 91, trend: '+22%', vol: '9,213' },
  { name: 'Pet Hair Remover Roller', score: 88, trend: '+11%', vol: '7,402' },
  { name: 'Magnetic Phone Charger', score: 86, trend: '+9%',  vol: '6,891' },
  { name: 'Cloud Slippers Memory',  score: 92, trend: '+27%', vol: '11,420' },
  { name: 'Mini Portable Blender',  score: 87, trend: '+15%', vol: '8,118' },
  { name: 'Solar Garden Lights x6', score: 89, trend: '+14%', vol: '5,943' },
  { name: 'Heated Massage Pillow',  score: 90, trend: '+19%', vol: '10,302' },
];

function useCountUp(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setVal(Math.round(target * (0.5 - Math.cos(Math.PI * t) / 2)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function ScoreCell({ score }: { score: number }) {
  const v = useCountUp(score);
  return <span style={{ color: T.accent, textAlign: 'right' }}>{v}</span>;
}

function AppWindow() {
  const [rows, setRows] = useState<PRow[]>(PRODUCT_POOL.slice(0, 5).map((p, i) => ({ ...p, isNew: i === 4 })));
  const [tick, setTick] = useState(0);
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const cycle = setInterval(() => {
      setRows((prev) => {
        const next = { ...PRODUCT_POOL[(tick + 5) % PRODUCT_POOL.length], isNew: true };
        const cleared = prev.map((r) => ({ ...r, isNew: false }));
        return [next, ...cleared.slice(0, 4)];
      });
      setTick((t) => t + 1);
      setSecondsAgo(0);
    }, 3000);
    const ticker = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => { clearInterval(cycle); clearInterval(ticker); };
  }, [tick]);

  return (
    <div className="mj-data-panel" style={{
      background: T.bgPanel,
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 24px 64px rgba(0,0,0,0.6)',
    }}>
      {/* Window chrome */}
      <div style={{
        height: 38,
        background: T.bgChrome,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 8,
      }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
        <span style={{
          flex: 1,
          textAlign: 'center',
          fontFamily: mono,
          fontSize: 11,
          color: T.textFaint,
          letterSpacing: '0.02em',
        }}>majorka — discover · market: US · score: 80+</span>
        <span style={{ width: 36 }} />
      </div>
      {/* Body */}
      <div style={{ padding: 20, fontFamily: mono, fontSize: 12, lineHeight: 1.65 }}>
        <div style={{ color: T.accent, marginBottom: 14 }}>
          <span style={{ color: T.textFaint }}>$</span> majorka discover --market=US --score=80+
        </div>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '24px 1fr 56px 60px 76px',
          gap: 10,
          padding: '6px 0',
          borderBottom: `1px solid ${T.border}`,
          color: T.textFaint,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          <span>#</span>
          <span>PRODUCT</span>
          <span style={{ textAlign: 'right' }}>SCORE</span>
          <span style={{ textAlign: 'right' }}>TREND</span>
          <span style={{ textAlign: 'right' }}>VOL/MO</span>
        </div>
        {rows.map((p, i) => (
          <div
            key={`${p.name}-${tick}-${i}`}
            className={p.isNew ? 'mj-row-pulse mj-row-enter' : ''}
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr 56px 60px 76px',
              gap: 10,
              padding: '12px 0 12px 8px',
              borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${T.border}`,
              alignItems: 'center',
              color: T.textMuted,
              animation: !p.isNew ? `mj-row-stagger 350ms ease-out ${i * 80}ms both` : undefined,
            }}
          >
            <span style={{ color: T.textFaint }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <ScoreCell score={p.score} />
            <span style={{ color: T.green, textAlign: 'right' }}>{p.trend}</span>
            <span style={{ textAlign: 'right' }}>{p.vol}</span>
          </div>
        ))}
        <div style={{
          marginTop: 14,
          color: T.textFaint,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span className="mj-pulse-dot" />
          live · 7 markets · refreshed {secondsAgo}s ago
        </div>
      </div>
    </div>
  );
}

// ── Live Activity Ticker ────────────────────────────────────────────────────
function LiveTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <section className="mj-ticker-strip" style={{
      background: T.bgPanel,
      borderTop: `1px solid ${T.borderFaint}`,
      borderBottom: `1px solid ${T.borderFaint}`,
      padding: '14px 0',
      overflow: 'hidden',
    }}>
      <div className="mj-ticker-track">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            fontFamily: mono,
            fontSize: 13,
            color: '#6b7280',
            whiteSpace: 'nowrap',
          }}>
            {item}
            <span style={{ color: '#2d2d35' }}>·</span>
          </span>
        ))}
      </div>
    </section>
  );
}

// ── Partner Bar (marquee) ───────────────────────────────────────────────────
function PartnerBar() {
  const loop = [...PARTNERS, ...PARTNERS];
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '36px 0', overflow: 'hidden' }}>
      <div className="mj-eyebrow" style={{ textAlign: 'center', marginBottom: 24, color: T.textFaint }}>
        Integrates with the tools you already use
      </div>
      <div className="mj-glow-edge">
        <div className="mj-marquee-track">
          {loop.map((name, i) => (
            <span key={`${name}-${i}`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              background: T.bgSurface,
              fontFamily: mono,
              fontSize: 13,
              fontWeight: 500,
              color: T.textDim,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.accent }} />
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features Sticky Scroll ──────────────────────────────────────────────────
function Features() {
  const [active, setActive] = useState(0);
  return (
    <section id="features" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Capabilities"
          line1="Every tool you need."
          line2="One platform."
          description="Six core capabilities, no tab-switching, no spreadsheet handoffs."
        />
        <div className="mj-features-layout" style={{
          display: 'grid',
          gridTemplateColumns: '38% 62%',
          gap: 56,
          alignItems: 'flex-start',
        }}>
          {/* Left nav */}
          <div className="mj-features-left" style={{ position: 'sticky', top: 100 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FEATURES.map((f, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={f.tag}
                    onClick={() => setActive(i)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? `3px solid ${T.accent}` : '3px solid transparent',
                      padding: '16px 18px',
                      cursor: 'pointer',
                      borderRadius: 6,
                      transition: 'background 200ms, border-color 200ms',
                    }}
                  >
                    <div style={{
                      fontFamily: mono,
                      fontSize: 11,
                      color: isActive ? T.accent : T.textFaint,
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}>{f.tag}</div>
                    <div style={{
                      fontFamily: display,
                      fontSize: 17,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: isActive ? T.text : T.textMuted,
                      marginBottom: 2,
                    }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: T.textDim }}>{f.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ minHeight: 480 }}>
            <div key={active} style={{
              animation: 'mj-fade-slide-in 350ms ease-out',
            }}>
              {active === 0 && <PanelDiscovery />}
              {active === 1 && <PanelMargin />}
              {active === 2 && <PanelCreative />}
              {active === 3 && <PanelSpy />}
              {active === 4 && <PanelBuild />}
              {active === 5 && <PanelMarkets />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Panel: Discovery ────────────────────────────────────────────────────────
function PanelDiscovery() {
  const products = PRODUCT_POOL.slice(0, 6);
  return (
    <div style={{
      background: T.bgSurface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Filter bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        borderBottom: `1px solid ${T.border}`,
        background: T.bgElevated,
        fontFamily: mono,
        fontSize: 12,
        color: T.textMuted,
        flexWrap: 'wrap',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: T.bgPanel,
          border: `1px solid ${T.border}`,
          borderRadius: 6,
        }}>
          MARKET <span style={{ color: T.accent }}>US ▾</span>
        </span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: T.bgPanel,
          border: `1px solid ${T.border}`,
          borderRadius: 6,
        }}>
          SCORE <span style={{ color: T.accent }}>80+</span>
          <span style={{ display: 'inline-block', width: 60, height: 4, background: T.border, borderRadius: 2, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '70%', background: T.accent, borderRadius: 2 }} />
          </span>
        </span>
        <span style={{ marginLeft: 'auto', color: T.textFaint, fontSize: 11 }}>{products.length} results</span>
      </div>
      {/* Table */}
      <div style={{ padding: 18, fontFamily: mono, fontSize: 12 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '24px 1fr 56px 60px 76px',
          gap: 10,
          padding: '6px 0',
          borderBottom: `1px solid ${T.border}`,
          color: T.textFaint,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          <span>#</span>
          <span>PRODUCT</span>
          <span style={{ textAlign: 'right' }}>SCORE</span>
          <span style={{ textAlign: 'right' }}>TREND</span>
          <span style={{ textAlign: 'right' }}>VOL/MO</span>
        </div>
        {products.map((p, i) => (
          <div key={p.name} style={{
            display: 'grid',
            gridTemplateColumns: '24px 1fr 56px 60px 76px',
            gap: 10,
            padding: '11px 0',
            borderBottom: i === products.length - 1 ? 'none' : `1px solid ${T.border}`,
            alignItems: 'center',
            color: T.textMuted,
          }}>
            <span style={{ color: T.textFaint }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <span style={{ color: T.accent, textAlign: 'right' }}>{p.score}</span>
            <span style={{ color: T.green, textAlign: 'right' }}>{p.trend}</span>
            <span style={{ textAlign: 'right' }}>{p.vol}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel: Margin ──────────────────────────────────────────────────────────
function PanelMargin() {
  const sale = 49.95;
  const cost = 8.20;
  const ship = 4.50;
  const fees = 2.10;
  const ad   = 12.40;
  const net = sale - cost - ship - fees - ad;
  const marginPct = (net / sale) * 100;
  return (
    <div style={{
      background: T.bgSurface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: 28,
    }}>
      <div className="mj-eyebrow" style={{ marginBottom: 18 }}>Margin Calculator</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Sale price',   val: `$${sale.toFixed(2)}` },
          { label: 'Cost (AliExpress)', val: `$${cost.toFixed(2)}` },
          { label: 'Shipping',     val: `$${ship.toFixed(2)}` },
          { label: 'Platform fees',val: `$${fees.toFixed(2)}` },
        ].map((row) => (
          <div key={row.label} style={{
            background: T.bgPanel,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: '12px 14px',
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: T.textFaint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{row.label}</div>
            <div style={{ fontFamily: display, fontSize: 18, fontWeight: 600, color: T.text }}>{row.val}</div>
          </div>
        ))}
      </div>
      {/* Margin bar */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Net margin</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: T.green }}>{marginPct.toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: T.bgPanel, borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.border}` }}>
          <div style={{
            width: `${marginPct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${T.accent}, ${T.green})`,
          }} />
        </div>
      </div>
      <div style={{
        padding: 16,
        background: 'rgba(34,197,94,0.06)',
        border: `1px solid rgba(34,197,94,0.2)`,
        borderRadius: 8,
        fontFamily: mono,
        fontSize: 13,
        color: T.text,
      }}>
        Net margin: <span style={{ color: T.green }}>{marginPct.toFixed(1)}%</span>
        <span style={{ color: T.textFaint, margin: '0 8px' }}>·</span>
        Break-even CPA: <span style={{ color: T.green }}>${ad.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ── Panel: Creative ────────────────────────────────────────────────────────
function PanelCreative() {
  const ads = [
    {
      tag: 'TIKTOK · ANGLE 1',
      hook: 'POV: You finally fixed the back pain you\'ve had for 6 years.',
      body: 'No chiropractor. No pills. Just 15 minutes a day with this $49 device.',
      cta: 'Shop now →',
    },
    {
      tag: 'META · ANGLE 2',
      hook: 'Your posture is costing you 4cm of height. Here\'s the fix.',
      body: 'Engineered for desk workers. Wear under any shirt. Free AU shipping.',
      cta: 'Get yours →',
    },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {ads.map((ad) => (
        <div key={ad.tag} style={{
          background: T.bgSurface,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: 22,
        }}>
          <div className="mj-eyebrow" style={{ marginBottom: 14, fontSize: 10 }}>{ad.tag}</div>
          {[
            { label: 'HOOK', text: ad.hook },
            { label: 'BODY', text: ad.body },
            { label: 'CTA',  text: ad.cta  },
          ].map((s) => (
            <div key={s.label} style={{ marginBottom: 14 }}>
              <div style={{
                fontFamily: mono,
                fontSize: 9,
                color: T.textFaint,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 6,
              }}>{s.label}</div>
              <div style={{
                fontFamily: sans,
                fontSize: 13,
                color: T.text,
                lineHeight: 1.55,
              }}>{s.text}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Panel: Spy ─────────────────────────────────────────────────────────────
function PanelSpy() {
  const rows = [
    { label: 'Ad spend (est.)', val: '$8,400/mo', color: T.green },
    { label: 'Top SKU',         val: 'Magnetic Phone Charger', color: T.text },
    { label: 'Avg. price',      val: '$39.99 USD', color: T.text },
    { label: 'Revenue (est.)',  val: '$162K/mo', color: T.accent },
    { label: 'Tech stack',      val: 'Shopify · Klaviyo · Loox', color: T.textMuted },
  ];
  return (
    <div style={{
      background: T.bgSurface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${T.border}`,
        background: T.bgElevated,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>STORE</span>
        <span style={{
          flex: 1,
          padding: '6px 10px',
          background: T.bgPanel,
          border: `1px solid ${T.border}`,
          borderRadius: 6,
          fontFamily: mono,
          fontSize: 12,
          color: T.text,
        }}>peakflowstore.com</span>
        <span className="mj-eyebrow" style={{ fontSize: 10, color: T.green }}>● scanned</span>
      </div>
      <div style={{ padding: '6px 18px' }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 0',
            borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${T.border}`,
          }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.label}</span>
            <span style={{ fontFamily: r.label === 'Top SKU' || r.label === 'Tech stack' ? sans : mono, fontSize: 14, fontWeight: 600, color: r.color }}>{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel: Build ───────────────────────────────────────────────────────────
function PanelBuild() {
  return (
    <div style={{
      background: T.bgSurface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: 28,
    }}>
      <div className="mj-eyebrow" style={{ marginBottom: 18 }}>Store Preview</div>
      <div style={{
        background: T.bgPanel,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: 24,
        marginBottom: 18,
      }}>
        <div style={{
          fontFamily: mono,
          fontSize: 10,
          color: T.textFaint,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}>BRAND NAME</div>
        <div style={{
          fontFamily: display,
          fontSize: 28,
          fontWeight: 700,
          color: T.text,
          letterSpacing: '-0.025em',
          marginBottom: 18,
        }}>PeakFlow Co.</div>
        <div style={{
          fontFamily: mono,
          fontSize: 10,
          color: T.textFaint,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}>PALETTE</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {['#6366F1', '#0d0d10', '#22c55e', '#ededed'].map((c) => (
            <div key={c} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              fontFamily: mono,
              fontSize: 10,
              color: T.textMuted,
            }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
              {c}
            </div>
          ))}
        </div>
        <div style={{
          fontFamily: mono,
          fontSize: 10,
          color: T.textFaint,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 6,
        }}>HEADLINE</div>
        <div style={{ fontFamily: display, fontSize: 16, fontWeight: 600, color: T.text }}>
          The posture device built for desk warriors.
        </div>
      </div>
      <button className="mj-btn-primary" style={{ width: '100%' }}>Push to Shopify →</button>
    </div>
  );
}

// ── Panel: Markets ─────────────────────────────────────────────────────────
function PanelMarkets() {
  const m = [
    { flag: '🇦🇺', code: 'AU', stat: '$AUD · Afterpay' },
    { flag: '🇺🇸', code: 'US', stat: '$USD · ShopPay' },
    { flag: '🇬🇧', code: 'UK', stat: '£GBP · Klarna' },
    { flag: '🇨🇦', code: 'CA', stat: '$CAD · GST' },
    { flag: '🇳🇿', code: 'NZ', stat: '$NZD · NZ Post' },
    { flag: '🇩🇪', code: 'DE', stat: '€EUR · GDPR' },
    { flag: '🇸🇬', code: 'SG', stat: '$SGD · GST' },
  ];
  return (
    <div style={{
      background: T.bgSurface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: 28,
    }}>
      <div className="mj-eyebrow" style={{ marginBottom: 18 }}>7 Markets · Live</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
      }}>
        {m.map((mk) => (
          <div key={mk.code} style={{
            background: T.bgPanel,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{mk.flag}</div>
            <div style={{
              fontFamily: mono,
              fontSize: 11,
              color: T.accent,
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}>{mk.code}</div>
            <div style={{
              fontFamily: mono,
              fontSize: 11,
              color: T.textDim,
            }}>{mk.stat}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Comparison ─────────────────────────────────────────────────────────────
const COMPARISON_ROWS: { feature: string; m: string; minea: string; auto: string; ecom: string }[] = [
  { feature: 'Product Research',         m: '✓', minea: '✓', auto: '✓', ecom: '✓' },
  { feature: 'Margin Calculator',        m: '✓', minea: '—', auto: '✓', ecom: '—' },
  { feature: 'Ad Creative Generator',    m: '✓', minea: '—', auto: '—', ecom: '—' },
  { feature: 'Competitor Store Spy',     m: '✓', minea: '✓', auto: '—', ecom: '—' },
  { feature: 'Store Builder',            m: '✓', minea: '—', auto: '✓', ecom: '—' },
  { feature: 'Multi-Market Support (7)', m: '✓', minea: '—', auto: '—', ecom: '—' },
  { feature: 'TikTok + Meta Ad Spy',     m: '✓', minea: '✓', auto: '—', ecom: '—' },
  { feature: 'Profit Calculator',        m: '✓', minea: '—', auto: '✓', ecom: '—' },
  { feature: 'Starting Price',           m: '$99', minea: '$49', auto: '$26', ecom: '$23' },
];

function Comparison() {
  return (
    <section id="compare" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Comparison"
          line1="One platform."
          line2="Everything included."
          description="Six tools and a spreadsheet — replaced. Side by side with the alternatives."
        />
        <div className="mj-comparison" style={{
          background: T.bgSurface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          overflowX: 'auto',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: sans,
            fontSize: 14,
            minWidth: 720,
          }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '20px 24px',
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: T.textFaint,
                  borderBottom: `1px solid ${T.border}`,
                }}>Feature</th>
                <th style={{
                  textAlign: 'center',
                  padding: '20px 16px',
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  background: T.accent,
                  borderBottom: `1px solid ${T.accent}`,
                  boxShadow: '0 0 0 2px #6366F1',
                  position: 'relative',
                }}>Majorka</th>
                {['Minea', 'AutoDS', 'Ecomhunt'].map((label) => (
                  <th key={label} style={{
                    textAlign: 'center',
                    padding: '20px 16px',
                    fontFamily: mono,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: T.textFaint,
                    borderBottom: `1px solid ${T.border}`,
                  }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => {
                const isLast = i === COMPARISON_ROWS.length - 1;
                const renderCell = (val: string, accent: boolean) => {
                  const isCheck = val === '✓';
                  const isDash = val === '—';
                  return (
                    <td style={{
                      textAlign: 'center',
                      padding: '18px 16px',
                      fontFamily: mono,
                      fontSize: 14,
                      fontWeight: isCheck ? 700 : 500,
                      color: isCheck ? T.green : isDash ? T.textGhost : accent ? T.text : T.textMuted,
                      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                      background: accent ? 'rgba(99,102,241,0.08)' : 'transparent',
                      boxShadow: accent ? 'inset 2px 0 0 #6366F1, inset -2px 0 0 #6366F1' : 'none',
                    }}>{val}</td>
                  );
                };
                return (
                  <tr key={row.feature}>
                    <td style={{
                      padding: '18px 24px',
                      color: T.text,
                      fontWeight: 500,
                      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                    }}>{row.feature}</td>
                    {renderCell(row.m, true)}
                    {renderCell(row.minea, false)}
                    {renderCell(row.auto, false)}
                    {renderCell(row.ecom, false)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── Markets Grid ───────────────────────────────────────────────────────────
const MARKETS: { code: string; flag: string; name: string; value: string }[] = [
  { code: 'AU', flag: '🇦🇺', name: 'Australia',     value: 'Afterpay-native pricing, local AliExpress suppliers' },
  { code: 'US', flag: '🇺🇸', name: 'United States', value: 'Domestic Shopify supply, FB ad benchmarks' },
  { code: 'UK', flag: '🇬🇧', name: 'United Kingdom', value: 'VAT-aware margins, Klarna and HMRC compliance' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada',        value: 'CAD pricing, GST tracking, cross-border duties' },
  { code: 'NZ', flag: '🇳🇿', name: 'New Zealand',   value: 'NZ Post rates, local supplier network mapped' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany',       value: 'EUR pricing, EU VAT, GDPR-first onboarding' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore',     value: 'Asia-Pacific shipping, SGD margins, GST ready' },
];

function Markets() {
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Global Coverage"
          line1="Built for your market."
          line2="Not just the US."
          description="Localised pricing, suppliers, taxes, and benchmarks for seven regions — pick yours."
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {MARKETS.map((m) => (
            <div key={m.code} className="mj-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>{m.flag}</span>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: T.accent, letterSpacing: '0.08em', marginBottom: 2 }}>{m.code}</div>
                  <div style={{ fontFamily: display, fontWeight: 600, fontSize: 16, color: T.text, letterSpacing: '-0.01em' }}>{m.name}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: T.textMuted, margin: 0 }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Workflow ────────────────────────────────────────────────────────────────
function Workflow() {
  return (
    <section id="workflow" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Workflow"
          line1="From signal to store"
          line2="in three steps."
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
        }}>
          {STEPS.map((s) => (
            <div key={s.num} style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24 }}>
              <div style={{ fontFamily: mono, fontSize: 12, color: T.accent, marginBottom: 16, fontWeight: 500 }}>STEP {s.num}</div>
              <h3 style={{
                fontFamily: display,
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: '-0.015em',
                color: T.text,
                margin: '0 0 12px',
                lineHeight: 1.25,
              }}>{s.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: T.textMuted, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ───────────────────────────────────────────────────────────
const TESTIMONIALS: { initials: string; name: string; flag: string; city: string; quote: string }[] = [
  { initials: 'AM', name: 'Alex M.',  flag: '🇦🇺', city: 'Sydney', quote: "Found a $12K/mo product in 20 minutes using Majorka's discovery tool. Switched from Minea and never looked back." },
  { initials: 'JT', name: 'James T.', flag: '🇺🇸', city: 'Austin', quote: "Majorka's margin calculator saved me from a $4K ad spend mistake on a low-margin product." },
  { initials: 'PK', name: 'Priya K.', flag: '🇬🇧', city: 'London', quote: "Built and launched a Shopify store in under an hour. Competitors couldn't match the UK supplier data." },
];

function Testimonials() {
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Operators"
          line1="Used by serious"
          line2="sellers."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="mj-card" style={{ padding: 28 }}>
              <p style={{
                fontFamily: display,
                fontSize: 17,
                lineHeight: 1.55,
                color: T.text,
                margin: '0 0 24px',
                letterSpacing: '-0.01em',
              }}>&ldquo;{t.quote}&rdquo;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(99,102,241,0.12)',
                  border: `1px solid rgba(99,102,241,0.3)`,
                  color: T.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: display, fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
                }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 11, color: T.textDim, marginTop: 2 }}>
                    <span>{t.flag}</span>
                    <span>{t.city}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────
interface PricingProps { annual: boolean; setAnnual: (v: boolean) => void }
function Pricing({ annual, setAnnual }: PricingProps) {
  const builderPrice = annual ? 79 : 99;
  const scalePrice = annual ? 159 : 199;
  return (
    <section id="pricing" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Pricing"
          line1="Simple pricing."
          line2="No surprises."
          description="One platform replacing six tools. No contracts, cancel anytime."
          align="center"
        />

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex',
            background: T.bgSurface,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: 4,
          }}>
            <button onClick={() => setAnnual(false)} style={{
              padding: '8px 18px', border: 'none',
              background: !annual ? T.accent : 'transparent',
              color: !annual ? '#fff' : T.textMuted,
              fontSize: 13, fontWeight: 600, fontFamily: sans, borderRadius: 4, cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
            }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{
              padding: '8px 18px', border: 'none',
              background: annual ? T.accent : 'transparent',
              color: annual ? '#fff' : T.textMuted,
              fontSize: 13, fontWeight: 600, fontFamily: sans, borderRadius: 4, cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              Annual
              <span style={{ fontFamily: mono, fontSize: 10, color: annual ? '#fff' : T.green }}>−20%</span>
            </button>
          </div>
        </div>

        <div className="mj-pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <PricingCard
            tag="Builder" price={builderPrice} annual={annual}
            tagline="Everything you need to find and validate winners."
            features={[
              '50 product searches / month',
              '50 video intelligence searches',
              '50 ad creative generations',
              '5 competitor shop scans',
              '3 stores in Store Builder',
              'All 7 markets supported',
            ]}
            cta="Start with Builder" href="/sign-up?plan=builder" highlight={false}
          />
          <PricingCard
            tag="Scale" price={scalePrice} annual={annual}
            tagline="For operators running real volume."
            features={[
              'Everything in Builder',
              'Unlimited searches across all tools',
              'Unlimited competitor shop spy',
              'Unlimited Store Builder',
              'Niche signal tracking',
              'API access + priority support',
            ]}
            cta="Start with Scale" href="/sign-up?plan=scale" highlight={true}
          />
        </div>
      </div>
    </section>
  );
}

interface PricingCardProps {
  tag: string; price: number; annual: boolean; tagline: string;
  features: string[]; cta: string; href: string; highlight: boolean;
}
function PricingCard({ tag, price, annual, tagline, features, cta, href, highlight }: PricingCardProps) {
  const [hover, setHover] = useState(false);
  const baseStyle: React.CSSProperties = {
    background: highlight
      ? `linear-gradient(135deg, rgba(99,102,241,0.08), transparent), ${T.bgSurface}`
      : T.bgSurface,
    border: highlight ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 32,
    position: 'relative',
    transition: 'all 250ms ease',
    transform: hover ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: highlight
      ? '0 0 40px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.4)'
      : 'none',
  };
  return (
    <div
      style={baseStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {highlight && (
        <div style={{
          position: 'absolute',
          top: -10,
          right: 24,
          background: T.accent,
          color: '#fff',
          fontFamily: mono,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: 4,
        }}>Recommended</div>
      )}
      <div style={{
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.textFaint,
        marginBottom: 16,
      }}>{tag}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontFamily: display, fontSize: 48, fontWeight: 700, color: T.text, letterSpacing: '-0.025em', lineHeight: 1 }}>${price}</span>
        <span style={{ fontSize: 14, color: T.textDim }}>/ month</span>
      </div>
      <div style={{ fontSize: 12, color: T.textFaint, fontFamily: mono, marginBottom: 16, height: 14 }}>
        {annual ? `billed $${price * 12} annually` : ''}
      </div>
      <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 24px', lineHeight: 1.5 }}>{tagline}</p>
      <div style={{ height: 1, background: T.border, marginBottom: 24 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {features.map((f) => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: T.textMuted }}>
            <span style={{ color: T.accent, fontSize: 12 }}>✓</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
      <Link href={href} className={highlight ? 'mj-btn-primary' : 'mj-btn-secondary'} style={{ width: '100%' }}>
        {cta} →
      </Link>
    </div>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="FAQ"
          line1="Common"
          line2="questions."
        />
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          {FAQ_DATA.map((item, i) => (
            <div key={item.q} style={{ borderBottom: `1px solid ${T.border}` }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '24px 0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  color: T.text,
                  fontFamily: display,
                  fontWeight: 600,
                  fontSize: 17,
                  letterSpacing: '-0.01em',
                }}
              >
                {item.q}
                <span style={{
                  fontFamily: mono,
                  fontSize: 18,
                  color: T.textDim,
                  transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                  transition: 'transform 200ms',
                }}>+</span>
              </button>
              {open === i && (
                <p style={{
                  fontSize: 15,
                  color: T.textMuted,
                  lineHeight: 1.65,
                  margin: '0 0 24px',
                  maxWidth: 640,
                }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{
      position: 'relative',
      borderBottom: `1px solid ${T.border}`,
      padding: '120px 24px',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      isolation: 'isolate',
    }}>
      {/* Bottom-center radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 90%, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.05) 45%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 40% 30% at 20% 80%, rgba(99,102,241,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', textAlign: 'center', width: '100%' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          justifyContent: 'center',
        }}>
          <span style={{ display: 'inline-block', width: 4, height: 32, background: T.accent, borderRadius: 2 }} />
          <span className="mj-eyebrow">Ready when you are</span>
        </div>
        <h2 className="mj-cta-h2" style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 80,
          lineHeight: 1.0,
          letterSpacing: '-0.04em',
          color: T.text,
          margin: '0 0 28px',
        }}>
          Stop guessing.<br />
          <span style={{ color: T.accent }}>Start operating.</span>
        </h2>
        <p style={{ fontSize: 18, color: T.textMuted, margin: '0 0 44px', lineHeight: 1.6 }}>
          Find your first winning product in 20 minutes. Or your money back.
        </p>
        <div className="mj-hero-cta" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 18 }}>
          <Link href="/sign-up" className="mj-btn-primary mj-shimmer-btn" style={{ height: 56, padding: '0 32px', fontSize: 16 }}>
            Find my first winning product →
          </Link>
          <a href="#pricing" className="mj-btn-secondary" style={{ height: 56, padding: '0 28px', fontSize: 15 }}>
            See pricing
          </a>
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', fontFamily: mono }}>
          14-day free trial · No credit card · Cancel anytime
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: T.bg, padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="mj-footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 48,
          marginBottom: 48,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6, background: T.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: display, fontWeight: 800, fontSize: 14, color: '#fff',
              }}>M</div>
              <span style={{ fontFamily: display, fontWeight: 700, fontSize: 16, color: T.text, letterSpacing: '-0.02em' }}>Majorka</span>
            </div>
            <p style={{ fontSize: 13, color: T.textDim, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
              The ecommerce operating system. Product research, store building, and ad intelligence in one platform.
            </p>
          </div>
          <FooterCol title="Product" links={[
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Compare', href: '#compare' },
            { label: 'Workflow', href: '#workflow' },
          ]} />
          <FooterCol title="Company" links={[
            { label: 'Blog', href: '/blog' },
            { label: 'About', href: '/about' },
            { label: 'Contact', href: 'mailto:hello@majorka.io' },
            { label: 'Support', href: 'mailto:support@majorka.io' },
          ]} />
          <FooterCol title="Legal" links={[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Cookies', href: '/cookies' },
            { label: 'Refunds', href: '/refund-policy' },
          ]} />
        </div>
        <div style={{
          paddingTop: 24,
          borderTop: `1px solid ${T.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontFamily: mono,
          fontSize: 12,
          color: T.textFaint,
        }}>
          <span>© 2026 Majorka Pty Ltd</span>
          <span>7 markets · global platform</span>
        </div>
      </div>
    </footer>
  );
}

interface FooterColProps { title: string; links: { label: string; href: string }[] }
function FooterCol({ title, links }: FooterColProps) {
  return (
    <div>
      <div style={{
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.textFaint,
        marginBottom: 16,
      }}>{title}</div>
      {links.map((l) => (
        <a key={l.label} href={l.href} style={{
          display: 'block',
          fontSize: 13,
          color: T.textDim,
          textDecoration: 'none',
          marginBottom: 10,
          transition: 'color 150ms',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.textDim)}
        >{l.label}</a>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Home() {
  const isMobile = useIsMobile();
  void isMobile;
  const [scrolled, setScrolled] = useState(false);
  const [annual, setAnnual] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{
      background: T.bg,
      color: T.text,
      fontFamily: sans,
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      <SEO
        title="Majorka — The Ecommerce Operating System"
        description="Find winning products, build Shopify stores, and run ad campaigns from one platform. Built for serious dropshipping operators across 7 global markets."
        path="/"
        ogImage="/og-image.svg"
      />
      <style>{STYLES}</style>
      <Nav scrolled={scrolled} />
      <Hero />
      <LiveTicker />
      <PartnerBar />
      <Features />
      <Comparison />
      <Markets />
      <Workflow />
      <Testimonials />
      <Pricing annual={annual} setAnnual={setAnnual} />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
