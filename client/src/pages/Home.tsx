import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';
import { useIsMobile } from '@/hooks/useIsMobile';

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#0a0a0a',
  bgElevated: '#0e0e10',
  bgSurface: '#111114',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#ededed',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  textFaint: '#52525b',
  accent: '#6366F1',
  accentHover: '#7c83f4',
  accentDim: 'rgba(99,102,241,0.12)',
  green: '#22c55e',
  red: '#ef4444',
} as const;

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

// ── Global styles (minimal) ──────────────────────────────────────────────────
const STYLES = `
*::selection { background: rgba(99,102,241,0.3); color: #fff; }
html, body { background: ${T.bg}; }

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
  transition: border-color 200ms, background 200ms;
}
.mj-card:hover { border-color: ${T.borderStrong}; background: ${T.bgElevated}; }

.mj-grid-bg {
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 56px 56px;
}

.mj-divider { border-top: 1px solid ${T.border}; }

@media (max-width: 768px) {
  .mj-hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
  .mj-features-grid { grid-template-columns: 1fr !important; }
  .mj-pricing-grid { grid-template-columns: 1fr !important; }
  .mj-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
  .mj-nav-links { display: none !important; }
  .mj-hero-h1 { font-size: 44px !important; }
  .mj-section-h2 { font-size: 32px !important; }
  .mj-hero-cta { flex-direction: column !important; align-items: stretch !important; }
  .mj-hero-cta > * { width: 100% !important; }
  .mj-data-panel { display: none !important; }
}
`;

// ── Data ─────────────────────────────────────────────────────────────────────
const PARTNERS = ['Shopify', 'AliExpress', 'Meta Ads', 'TikTok', 'Stripe', 'Google Ads', 'DHL'];

const FEATURES: { tag: string; title: string; body: string }[] = [
  { tag: '01 / Discovery', title: 'Find winning products in seconds', body: 'AI scans global marketplaces for demand signals. Scored opportunities with margin data, competition index, and supplier matches.' },
  { tag: '02 / Margin', title: 'Validate profit before you spend', body: 'Net margin, break-even CPA, and ad budget — with shipping, tax, and platform fees built in. Real numbers, your currency.' },
  { tag: '03 / Creative', title: 'Generate ad campaigns ready to run', body: 'Five Facebook and TikTok ad variations with hooks, body copy, and creative angles — written for your market.' },
  { tag: '04 / Spy', title: 'Monitor competitor stores', body: 'See exactly what any dropshipping store runs. Ad spend signals, price changes, top SKUs. Enter a domain, get the playbook.' },
  { tag: '05 / Build', title: 'Launch a Shopify store in minutes', body: 'AI brand brief, theme, copy, and product import. Push live to your Shopify store with one click.' },
  { tag: '06 / Markets', title: 'Built for seven global markets', body: 'Local pricing, shipping, supplier networks, and tax compliance for AU, US, UK, CA, NZ, DE, and SG.' },
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

// ── Subcomponents ────────────────────────────────────────────────────────────

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
            width: 26,
            height: 26,
            borderRadius: 6,
            background: T.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: display,
            fontWeight: 800,
            fontSize: 14,
            color: '#fff',
          }}>M</div>
          <span style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 16,
            color: T.text,
            letterSpacing: '-0.02em',
          }}>Majorka</span>
        </a>

        <div className="mj-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#features" className="mj-link">Features</a>
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

function Hero() {
  return (
    <section style={{ position: 'relative', borderBottom: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div className="mj-grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{
        position: 'relative',
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
          <div>
            <div className="mj-eyebrow" style={{ marginBottom: 20 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: T.green, marginRight: 8, verticalAlign: 'middle' }} />
              The Ecommerce Operating System
            </div>
            <h1 className="mj-hero-h1" style={{
              fontFamily: display,
              fontWeight: 700,
              fontSize: 64,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: T.text,
              margin: '0 0 24px',
            }}>
              Find products that sell.<br />
              Build stores that convert.
            </h1>
            <p style={{
              fontSize: 17,
              lineHeight: 1.6,
              color: T.textMuted,
              maxWidth: 520,
              margin: '0 0 36px',
            }}>
              Product research, competitor intelligence, and store building in one platform — engineered for serious operators across seven global markets.
            </p>
            <div className="mj-hero-cta" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/sign-up" className="mj-btn-primary">Start free trial →</Link>
              <a href="#workflow" className="mj-btn-secondary">See how it works</a>
            </div>
            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: T.textDim, fontFamily: mono }}>
              <span>500+ operators</span>
              <span style={{ color: T.textFaint }}>·</span>
              <span>7 markets</span>
              <span style={{ color: T.textFaint }}>·</span>
              <span>14-day trial</span>
            </div>
          </div>

          {/* Right: terminal-style data panel */}
          <DataPanel />
        </div>
      </div>
    </section>
  );
}

function DataPanel() {
  return (
    <div className="mj-data-panel" style={{
      background: T.bgSurface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    }}>
      {/* Window chrome */}
      <div style={{
        height: 36,
        borderBottom: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 8,
        background: T.bgElevated,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3a40' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3a40' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3a40' }} />
        <span style={{ marginLeft: 14, fontFamily: mono, fontSize: 11, color: T.textFaint }}>majorka — winning_products</span>
      </div>
      {/* Body */}
      <div style={{ padding: 20, fontFamily: mono, fontSize: 12, lineHeight: 1.65 }}>
        <div style={{ color: T.textFaint, marginBottom: 14 }}>$ majorka discover --market=US --score=80+</div>
        {[
          { name: 'Posture Corrector Pro', score: 94, margin: '68%', orders: '12,847' },
          { name: 'LED Strip Lights 5m', score: 91, margin: '72%', orders: '9,213' },
          { name: 'Pet Hair Remover Roller', score: 88, margin: '64%', orders: '7,402' },
          { name: 'Magnetic Phone Charger', score: 86, margin: '59%', orders: '6,891' },
        ].map((p, i) => (
          <div key={p.name} style={{
            display: 'grid',
            gridTemplateColumns: '24px 1fr 60px 60px 70px',
            gap: 10,
            padding: '10px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${T.border}`,
            alignItems: 'center',
            color: T.textMuted,
          }}>
            <span style={{ color: T.textFaint }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <span style={{ color: T.accent }}>{p.score}</span>
            <span style={{ color: T.green }}>{p.margin}</span>
            <span style={{ textAlign: 'right' }}>{p.orders}</span>
          </div>
        ))}
        <div style={{ marginTop: 14, color: T.textFaint, fontSize: 11 }}>
          <span style={{ color: T.green }}>●</span> live · refreshed 12s ago
        </div>
      </div>
    </div>
  );
}

function PartnerBar() {
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="mj-eyebrow" style={{ textAlign: 'center', marginBottom: 24, color: T.textFaint }}>
          Integrates with the tools you already use
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 48,
          flexWrap: 'wrap',
        }}>
          {PARTNERS.map((name) => (
            <span key={name} style={{
              fontFamily: mono,
              fontSize: 13,
              fontWeight: 500,
              color: T.textDim,
              letterSpacing: '0.01em',
            }}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 64, maxWidth: 640 }}>
          <div className="mj-eyebrow" style={{ marginBottom: 16 }}>Capabilities</div>
          <h2 className="mj-section-h2" style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 48,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: T.text,
            margin: '0 0 16px',
          }}>
            Every tool you need.<br />
            <span style={{ color: T.textMuted }}>One platform.</span>
          </h2>
          <p style={{ fontSize: 16, color: T.textMuted, lineHeight: 1.6, margin: 0 }}>
            Replace six tools and a spreadsheet. Six core capabilities, one bill, one dashboard.
          </p>
        </div>

        <div className="mj-features-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: T.border,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {FEATURES.map((f) => (
            <div key={f.tag} style={{
              padding: 32,
              background: T.bg,
              minHeight: 220,
            }}>
              <div className="mj-eyebrow" style={{ marginBottom: 16 }}>{f.tag}</div>
              <h3 style={{
                fontFamily: display,
                fontWeight: 600,
                fontSize: 19,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
                color: T.text,
                margin: '0 0 10px',
              }}>{f.title}</h3>
              <p style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: T.textMuted,
                margin: 0,
              }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section id="workflow" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 64, maxWidth: 640 }}>
          <div className="mj-eyebrow" style={{ marginBottom: 16 }}>Workflow</div>
          <h2 className="mj-section-h2" style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 48,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: T.text,
            margin: 0,
          }}>
            From signal to store<br />
            <span style={{ color: T.textMuted }}>in three steps.</span>
          </h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
        }}>
          {STEPS.map((s) => (
            <div key={s.num} style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24 }}>
              <div style={{
                fontFamily: mono,
                fontSize: 12,
                color: T.accent,
                marginBottom: 16,
                fontWeight: 500,
              }}>STEP {s.num}</div>
              <h3 style={{
                fontFamily: display,
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: '-0.015em',
                color: T.text,
                margin: '0 0 12px',
                lineHeight: 1.25,
              }}>{s.title}</h3>
              <p style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: T.textMuted,
                margin: 0,
              }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface PricingProps { annual: boolean; setAnnual: (v: boolean) => void }
function Pricing({ annual, setAnnual }: PricingProps) {
  const builderPrice = annual ? 79 : 99;
  const scalePrice = annual ? 159 : 199;
  return (
    <section id="pricing" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="mj-eyebrow" style={{ marginBottom: 16 }}>Pricing</div>
          <h2 className="mj-section-h2" style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 48,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: T.text,
            margin: '0 0 16px',
          }}>
            Simple pricing. No surprises.
          </h2>
          <p style={{ fontSize: 16, color: T.textMuted, margin: '0 0 32px' }}>
            One platform replacing six tools. No contracts, cancel anytime.
          </p>
          {/* Toggle */}
          <div style={{
            display: 'inline-flex',
            background: T.bgSurface,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: 4,
          }}>
            <button onClick={() => setAnnual(false)} style={{
              padding: '8px 18px',
              border: 'none',
              background: !annual ? T.accent : 'transparent',
              color: !annual ? '#fff' : T.textMuted,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: sans,
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
            }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{
              padding: '8px 18px',
              border: 'none',
              background: annual ? T.accent : 'transparent',
              color: annual ? '#fff' : T.textMuted,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: sans,
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              Annual
              <span style={{ fontFamily: mono, fontSize: 10, color: annual ? '#fff' : T.green }}>−20%</span>
            </button>
          </div>
        </div>

        <div className="mj-pricing-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}>
          {/* Builder */}
          <PricingCard
            tag="Builder"
            price={builderPrice}
            annual={annual}
            tagline="Everything you need to find and validate winners."
            features={[
              '50 product searches / month',
              '50 video intelligence searches',
              '50 ad creative generations',
              '5 competitor shop scans',
              '3 stores in Store Builder',
              'All 7 markets supported',
            ]}
            cta="Start with Builder"
            href="/sign-up?plan=builder"
            highlight={false}
          />
          {/* Scale */}
          <PricingCard
            tag="Scale"
            price={scalePrice}
            annual={annual}
            tagline="For operators running real volume."
            features={[
              'Everything in Builder',
              'Unlimited searches across all tools',
              'Unlimited competitor shop spy',
              'Unlimited Store Builder',
              'Niche signal tracking',
              'API access + priority support',
            ]}
            cta="Start with Scale"
            href="/sign-up?plan=scale"
            highlight={true}
          />
        </div>
      </div>
    </section>
  );
}

interface PricingCardProps {
  tag: string;
  price: number;
  annual: boolean;
  tagline: string;
  features: string[];
  cta: string;
  href: string;
  highlight: boolean;
}
function PricingCard({ tag, price, annual, tagline, features, cta, href, highlight }: PricingCardProps) {
  return (
    <div style={{
      background: T.bgSurface,
      border: `1px solid ${highlight ? 'rgba(99,102,241,0.4)' : T.border}`,
      borderRadius: 10,
      padding: 32,
      position: 'relative',
    }}>
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
      <Link
        href={href}
        className={highlight ? 'mj-btn-primary' : 'mj-btn-secondary'}
        style={{ width: '100%' }}
      >
        {cta} →
      </Link>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 56 }}>
          <div className="mj-eyebrow" style={{ marginBottom: 16 }}>FAQ</div>
          <h2 className="mj-section-h2" style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 48,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: T.text,
            margin: 0,
          }}>
            Common questions.
          </h2>
        </div>
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

function FinalCTA() {
  return (
    <section style={{ borderBottom: `1px solid ${T.border}`, padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
      <div className="mj-grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <div className="mj-eyebrow" style={{ marginBottom: 20 }}>Ready when you are</div>
        <h2 className="mj-section-h2" style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.05,
          letterSpacing: '-0.035em',
          color: T.text,
          margin: '0 0 20px',
        }}>
          Stop guessing.<br />Start operating.
        </h2>
        <p style={{ fontSize: 17, color: T.textMuted, margin: '0 0 36px', lineHeight: 1.6 }}>
          Free 14-day trial. No credit card required. Cancel anytime.
        </p>
        <div className="mj-hero-cta" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/sign-up" className="mj-btn-primary">Start free trial →</Link>
          <a href="#pricing" className="mj-btn-secondary">View pricing</a>
        </div>
      </div>
    </section>
  );
}

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
            { label: 'Workflow', href: '#workflow' },
            { label: 'Store Builder', href: '/sign-up?ref=store-builder' },
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
      <PartnerBar />
      <Features />
      <Workflow />
      <Pricing annual={annual} setAnnual={setAnnual} />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
