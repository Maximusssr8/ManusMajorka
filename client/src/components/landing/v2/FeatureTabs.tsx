// Feature Tabs v2 — 4-tab product feature section. Static mockups, zero animation on swap.
import { useState } from 'react';
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

// ── Sub-panels ──────────────────────────────────────────────────────────────
function ScoringPanel() {
  const rows = [
    { name: 'LED Scalp Massager Pro', orders: 48210, score: 94, active: true },
    { name: 'Silicone Pet Grooming Brush', orders: 31450, score: 88, active: false },
    { name: 'Mini Dough Press Kit', orders: 24980, score: 82, active: false },
    { name: 'Posture Correction Vest', orders: 18760, score: 77, active: false },
  ];
  // Static 30-point sparkline path (pre-rendered, no animation).
  const spark = '0,28 8,26 16,27 24,24 32,22 40,24 48,20 56,18 64,19 72,16 80,14 88,15 96,12 104,10 112,11 120,8';
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: r.active ? 'rgba(79,142,247,0.06)' : 'transparent',
              borderLeft: r.active ? `2px solid ${LT.cobalt}` : '2px solid transparent',
              borderRadius: 8,
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: LT.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.name}
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: LT.textMute }}>
                {r.orders.toLocaleString('en-AU')} orders
              </div>
            </div>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 600,
                color: r.active ? LT.cobalt : LT.text,
                background: r.active ? LT.cobaltTint : 'rgba(255,255,255,0.06)',
                borderRadius: 999,
                padding: '3px 10px',
              }}
            >
              {r.score}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${LT.border}` }}>
        <div style={{ fontFamily: F.body, fontSize: 12, color: LT.textMute, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
          Trend Velocity (30d)
        </div>
        <svg viewBox="0 0 120 30" width="100%" height="40" preserveAspectRatio="none" aria-hidden>
          <polyline
            points={spark}
            fill="none"
            stroke={LT.cobalt}
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
    { product: 'Pet Massage Claw', change: 'price dropped 18% (AUD $7.20 → $5.91)', time: '2 minutes ago' },
    { product: 'LED Under-Cabinet Strip', change: 'supplier stock restocked — 2,400 units', time: '14 minutes ago' },
    { product: 'Silicone Lid Set (12-pc)', change: 'price dropped 12% (AUD $14.50 → $12.76)', time: '1 hour ago' },
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
            border: `1px solid ${LT.border}`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: LT.cobaltTint,
              color: LT.cobalt,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bell size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: LT.text, marginBottom: 2 }}>
              {a.product}
            </div>
            <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute, lineHeight: 1.5 }}>
              {a.change}
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: LT.textMute, marginTop: 4 }}>
              {a.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdsPanel() {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: LT.cobalt, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
            Target Audience
          </div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: LT.text, lineHeight: 1.6 }}>
            Pet parents 28–45 in metro AU. Spends on premium grooming. Active on TikTok, Instagram Reels.
          </div>
        </div>
        <div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: LT.cobalt, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
            Hook
          </div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: LT.text, lineHeight: 1.6 }}>
            "Your dog hates being brushed. This is why." — 3-second visual reveal, shot at eye-level.
          </div>
        </div>
        <div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: LT.cobalt, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
            CTAs
          </div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: LT.text, lineHeight: 1.6 }}>
            Primary: "Grab yours — free AU shipping." · Secondary: "See the demo."
          </div>
        </div>
      </div>
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${LT.border}`, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: LT.cobalt,
            color: LT.text,
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
  const swatches = [LT.cobalt, '#0d1117', '#f5f5f0', '#c9966b'];
  return (
    <div>
      <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: LT.text, letterSpacing: '-0.01em' }}>
        Pawdacious
      </div>
      <div style={{ fontFamily: F.body, fontSize: 13, color: LT.textMute, marginTop: 4, marginBottom: 16 }}>
        Gear your pup actually needs.
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
              border: `1px solid ${LT.border}`,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              aspectRatio: '1 / 1',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${LT.border}`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'flex-end',
              padding: 10,
            }}
          >
            <div style={{ fontFamily: F.body, fontSize: 11, color: LT.textMute }}>
              Product {i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeatureTabs() {
  const [active, setActive] = useState<TabKey>('scoring');

  return (
    <Section id="features">
      <div style={{ textAlign: 'left', marginBottom: 48 }}>
        <div style={{ marginBottom: 16 }}>
          <EyebrowPill>Features</EyebrowPill>
        </div>
        <H2 style={{ maxWidth: 780 }}>Everything you need to find, validate, and launch winners.</H2>
        <Sub style={{ marginTop: 12 }}>One platform. Live data. Clean decisions.</Sub>
      </div>

      <div className="mj-feature-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48 }}>
        {/* Tab list */}
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
                  color: isActive ? LT.text : LT.textMute,
                  border: 'none',
                  borderLeft: `2px solid ${isActive ? LT.cobalt : 'transparent'}`,
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
            background: LT.bgCard,
            border: `1px solid ${LT.border}`,
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
