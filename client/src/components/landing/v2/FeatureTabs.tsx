// Feature Tabs v2 — 4-tab product feature section with real data in scoring panel.
import { useState, useEffect } from 'react';
import { Copy, Bell } from 'lucide-react';
import { LT, F, R } from '@/lib/landingTokens';
import { EyebrowPill, H2, Sub, Section } from './shared';

type TabKey = 'scoring' | 'alerts' | 'ads' | 'store';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'scoring', label: 'Product Scoring' },
  { key: 'alerts', label: 'Price Drop Alerts' },
  { key: 'ads', label: 'Ad Brief Generator' },
  { key: 'store', label: 'Store Builder' },
];

const FEATURE_CSS = `
.mj-feature-tablist-mobile { display: none; }
@media (max-width: 768px) {
  .mj-feature-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
  .mj-feature-tablist { display: none !important; }
  .mj-feature-tablist-mobile { display: flex !important; overflow-x: auto; gap: 0; border-bottom: 1px solid #161b22; }
}
`;

// ── Sub-panels ──────────────────────────────────────────────────────────────

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
  { product_title: 'Posture Correction Vest', image_url: null, winning_score: 77, sold_count: 18760 },
];

function ScoringPanel() {
  const [products, setProducts] = useState<DemoProduct[]>(FALLBACK_PRODUCTS);

  useEffect(() => {
    let cancelled = false;
    const categories = ['Pet', 'Kitchen', 'Home', 'Beauty'];
    const url = `/api/demo/quick-score?category=${categories.join('|')}`;
    fetch(url)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length >= 4) {
          setProducts(data.slice(0, 4) as DemoProduct[]);
        }
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {products.map((r, i) => {
          const isFirst = i === 0;
          const imgSrc = r.image_url
            ? `/api/image-proxy?url=${encodeURIComponent(r.image_url)}`
            : undefined;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: isFirst ? 'rgba(79,142,247,0.06)' : 'transparent',
                borderLeft: isFirst ? '2px solid #4f8ef7' : '2px solid transparent',
                borderRadius: 8,
              }}
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt=""
                  style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', background: '#161b22', flexShrink: 0 }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 6, background: '#161b22', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.product_title}
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: '#8b949e' }}>
                  {r.sold_count.toLocaleString('en-AU')} orders
                </div>
              </div>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 12,
                  fontWeight: 600,
                  color: isFirst ? '#4f8ef7' : '#ffffff',
                  background: isFirst ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.06)',
                  borderRadius: 999,
                  padding: '3px 10px',
                }}
              >
                {r.winning_score}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #161b22' }}>
        <div style={{ fontFamily: F.body, fontSize: 12, color: '#8b949e', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
          Trend Velocity (30d)
        </div>
        <svg viewBox="0 0 120 30" width="100%" height="40" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            points="0,28 8,26 16,27 24,24 32,22 40,24 48,20 56,18 64,19 72,16 80,14 88,15 96,12 104,10 112,11 120,8"
            fill="none"
            stroke="#4f8ef7"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function AlertsPanel() {
  const alerts = [
    { product: 'Pet Massage Claw', change: 'Price dropped 18% — AUD $7.20 → $5.91', time: '2 minutes ago', savings: 'Save $1.29/unit on 200 units = $258' },
    { product: 'LED Under-Cabinet Strip', change: 'Supplier restocked — 2,400 units available', time: '14 minutes ago', savings: 'Back in stock after 6-day gap' },
    { product: 'Silicone Lid Set (12-pc)', change: 'Price dropped 12% — AUD $14.50 → $12.76', time: '1 hour ago', savings: 'Margin up from 42% to 48%' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {alerts.map((a, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: 14,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #161b22',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(79,142,247,0.15)',
              color: '#4f8ef7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bell size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 2 }}>
              {a.product}
            </div>
            <div style={{ fontFamily: F.body, fontSize: 13, color: '#8b949e', lineHeight: 1.5 }}>
              {a.change}
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: '#4f8ef7', marginTop: 4 }}>
              {a.savings}
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: '#8b949e', marginTop: 2 }}>
              {a.time}
            </div>
          </div>
        </div>
      ))}
      <div style={{ fontFamily: F.body, fontSize: 13, color: '#8b949e', marginTop: 8 }}>
        Alerts fire within 30 seconds of a price change. SMS + email + in-app.
      </div>
    </div>
  );
}

function AdsPanel() {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: '#4f8ef7', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
            Target Audience
          </div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: '#ffffff', lineHeight: 1.6 }}>
            Pet parents 28–45 in metro AU. Spends on premium grooming. Active on TikTok, Instagram Reels.
          </div>
        </div>
        <div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: '#4f8ef7', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
            Hook (3-second scroll-stop)
          </div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: '#ffffff', lineHeight: 1.6 }}>
            &ldquo;Your dog hates being brushed. This is why.&rdquo; — Shot at eye-level, close-up reaction, 9:16 vertical.
          </div>
        </div>
        <div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: '#4f8ef7', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
            CTA variants
          </div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: '#ffffff', lineHeight: 1.6 }}>
            Primary: &ldquo;Grab yours — free AU shipping.&rdquo; &middot; Secondary: &ldquo;See the 30-second demo.&rdquo;
          </div>
        </div>
        <div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: '#4f8ef7', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
            Estimated performance
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: '#8b949e', lineHeight: 1.6 }}>
            CTR: 2.8–4.1% &middot; CPA: $8–12 AUD &middot; ROAS: 3.2–4.8x
          </div>
        </div>
      </div>
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #161b22', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: '#4f8ef7',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Copy size={14} /> Copy brief
        </button>
      </div>
    </div>
  );
}

function StorePanel() {
  const swatches = ['#4f8ef7', '#0d1117', '#f5f5f0', '#c9966b'];
  return (
    <div>
      <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
        Pawdacious
      </div>
      <div style={{ fontFamily: F.body, fontSize: 13, color: '#8b949e', marginTop: 4, marginBottom: 4 }}>
        Gear your pup actually needs.
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 12, color: '#4f8ef7', marginBottom: 16 }}>
        shopify store concept &middot; generated in 8 seconds
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {swatches.map((c, i) => (
          <div
            key={i}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: c,
              border: '1px solid #161b22',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {['Grooming Glove', 'LED Collar', 'Travel Bowl'].map((name, i) => (
          <div
            key={i}
            style={{
              aspectRatio: '1 / 1',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #161b22',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'flex-end',
              padding: 10,
            }}
          >
            <div style={{ fontFamily: F.body, fontSize: 11, color: '#8b949e' }}>
              {name}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontFamily: F.body, fontSize: 13, color: '#8b949e' }}>
        Includes hero banner, product cards, colour palette, and tagline. Export to Shopify in one click.
      </div>
    </div>
  );
}

export function FeatureTabs() {
  const [active, setActive] = useState<TabKey>('scoring');

  return (
    <Section id="features">
      <style>{FEATURE_CSS}</style>
      <div style={{ textAlign: 'left', marginBottom: 48 }}>
        <div style={{ marginBottom: 16 }}>
          <EyebrowPill>Features</EyebrowPill>
        </div>
        <H2 style={{ maxWidth: 780 }}>Everything you need to find, validate, and launch winners.</H2>
        <Sub style={{ marginTop: 12 }}>One platform. Live data. Clean decisions.</Sub>
      </div>

      {/* Mobile tab bar */}
      <div className="mj-feature-tablist-mobile" role="tablist" aria-orientation="horizontal">
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(t.key)}
              style={{
                padding: '12px 16px',
                background: 'transparent',
                color: isActive ? '#ffffff' : '#8b949e',
                border: 'none',
                borderBottom: `2px solid ${isActive ? '#4f8ef7' : 'transparent'}`,
                fontFamily: F.body,
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 150ms ease, border-color 150ms ease',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mj-feature-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48 }}>
        {/* Desktop tab list */}
        <div
          className="mj-feature-tablist"
          role="tablist"
          aria-orientation="vertical"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <button
                key={t.key}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActive(t.key)}
                style={{
                  textAlign: 'left',
                  padding: '16px 20px',
                  background: isActive ? 'rgba(79,142,247,0.06)' : 'transparent',
                  color: isActive ? '#ffffff' : '#8b949e',
                  border: 'none',
                  borderLeft: `2px solid ${isActive ? '#4f8ef7' : 'transparent'}`,
                  fontFamily: F.body,
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'color 150ms ease, background 150ms ease, border-color 150ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div
          className="mj-feature-panel"
          role="tabpanel"
          style={{
            background: '#0d1117',
            border: '1px solid #161b22',
            borderRadius: 16,
            padding: 32,
            minHeight: 360,
          }}
        >
          {active === 'scoring' && <ScoringPanel />}
          {active === 'alerts' && <AlertsPanel />}
          {active === 'ads' && <AdsPanel />}
          {active === 'store' && <StorePanel />}
        </div>
      </div>
    </Section>
  );
}
