// Innovation 2 — ROI Calculator
// Interactive calculator showing projected returns to make $99-$199/mo feel trivial.

import { useState, useCallback } from 'react';
import { LT, F } from '@/lib/landingTokens';
import { Eyebrow, H2, CtaPrimary } from './shared';
import { useInViewFadeUp } from '../useInViewFadeUp';

interface SliderConfig {
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  format: (v: number) => string;
}

const SLIDERS: SliderConfig[] = [
  {
    label: 'Your selling price',
    min: 20, max: 200, step: 5, defaultValue: 45,
    format: (v) => `$${v} AUD`,
  },
  {
    label: 'Estimated daily orders',
    min: 5, max: 100, step: 5, defaultValue: 20,
    format: (v) => `${v} orders`,
  },
  {
    label: 'Your profit margin',
    min: 10, max: 50, step: 5, defaultValue: 30,
    format: (v) => `${v}%`,
  },
];

const SLIDER_CSS = `
.mj-roi-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #161b22;
  outline: none;
  cursor: pointer;
}
.mj-roi-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4f8ef7;
  border: 2px solid #0d1117;
  box-shadow: 0 0 12px rgba(79,142,247,0.4);
  cursor: pointer;
}
.mj-roi-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4f8ef7;
  border: 2px solid #0d1117;
  box-shadow: 0 0 12px rgba(79,142,247,0.4);
  cursor: pointer;
}
.mj-roi-slider::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: #161b22;
}
`;

function SliderInput({
  config,
  value,
  onChange,
}: {
  config: SliderConfig;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - config.min) / (config.max - config.min)) * 100;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 10,
      }}>
        <span style={{
          fontFamily: F.body,
          fontSize: 14,
          color: '#9CA3AF',
        }}>
          {config.label}
        </span>
        <span style={{
          fontFamily: F.mono,
          fontSize: 15,
          fontWeight: 600,
          color: '#E0E0E0',
        }}>
          {config.format(value)}
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        {/* Cobalt fill track behind the slider */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          transform: 'translateY(-50%)',
          width: `${pct}%`,
          height: 6,
          borderRadius: 3,
          background: 'rgba(79,142,247,0.5)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        <input
          type="range"
          className="mj-roi-slider"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={config.label}
          style={{ position: 'relative', zIndex: 1 }}
        />
      </div>
    </div>
  );
}

export function ROICalculator() {
  const fade = useInViewFadeUp();
  const [price, setPrice] = useState(SLIDERS[0].defaultValue);
  const [orders, setOrders] = useState(SLIDERS[1].defaultValue);
  const [margin, setMargin] = useState(SLIDERS[2].defaultValue);

  const dailyProfit = price * orders * (margin / 100);
  const monthlyProfit = dailyProfit * 30;
  const majorkaCost = 166; // Scale annual = $199 * 10 / 12 ≈ $166
  const roi = majorkaCost > 0 ? monthlyProfit / majorkaCost : 0;
  const paybackDays = dailyProfit > 0 ? majorkaCost / dailyProfit : 999;

  const setSliderValue = useCallback((idx: number, v: number) => {
    if (idx === 0) setPrice(v);
    else if (idx === 1) setOrders(v);
    else setMargin(v);
  }, []);

  const values = [price, orders, margin];

  return (
    <section
      ref={fade.ref}
      style={{
        ...fade.style,
        background: '#04060f',
        padding: '64px 24px',
        width: '100%',
      }}
    >
      <style>{SLIDER_CSS}</style>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Eyebrow center>THE MATHS</Eyebrow>
        <H2 style={{ textAlign: 'center', marginBottom: 40 }}>
          What one winning product is worth.
        </H2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
        }}>
          {/* Sliders column */}
          <div className="mj-roi-sliders" style={{ minWidth: 0 }}>
            {SLIDERS.map((s, i) => (
              <SliderInput
                key={s.label}
                config={s}
                value={values[i]}
                onChange={(v) => setSliderValue(i, v)}
              />
            ))}
          </div>

          {/* Results card */}
          <div style={{
            background: '#0d1117',
            border: '1px solid #161b22',
            borderRadius: 16,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
          }}>
            <ResultRow
              label="Daily profit"
              value={`$${Math.round(dailyProfit).toLocaleString('en-AU')}`}
              color="#10b981"
            />
            <ResultRow
              label="Monthly profit"
              value={`$${Math.round(monthlyProfit).toLocaleString('en-AU')}`}
              color="#10b981"
            />
            <div style={{ borderTop: '1px solid #161b22', margin: '4px 0' }} />
            <ResultRow
              label="Majorka cost"
              value={`$${majorkaCost}/mo`}
              color="#6B7280"
              sublabel="Scale annual"
            />
            <ResultRow
              label="ROI"
              value={`${roi.toFixed(1)}x`}
              color={LT.cobalt}
              bold
            />
            <ResultRow
              label="Payback period"
              value={paybackDays < 1 ? `${(paybackDays * 24).toFixed(0)} hours` : `${paybackDays.toFixed(1)} days`}
              color="#E0E0E0"
              emphasis
            />
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{
            fontFamily: F.body,
            fontSize: 16,
            color: '#9CA3AF',
            margin: '0 0 16px',
          }}>
            One product. That's all it takes.
          </p>
          <CtaPrimary href="/sign-up">
            Get Started →
          </CtaPrimary>
        </div>
      </div>

      {/* Mobile: stack grid */}
      <style>{`
        @media (max-width: 640px) {
          .mj-roi-sliders { grid-column: 1 / -1 !important; }
          div:has(> .mj-roi-sliders) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function ResultRow({
  label,
  value,
  color,
  sublabel,
  bold,
  emphasis,
}: {
  label: string;
  value: string;
  color: string;
  sublabel?: string;
  bold?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{
        fontFamily: F.mono,
        fontSize: 12,
        color: '#6B7280',
        letterSpacing: '0.05em',
      }}>
        {label}
        {sublabel && (
          <span style={{ fontSize: 10, marginLeft: 6, color: '#4b5563' }}>({sublabel})</span>
        )}
      </span>
      <span style={{
        fontFamily: F.mono,
        fontSize: bold ? 22 : emphasis ? 18 : 16,
        fontWeight: bold ? 700 : 600,
        color,
        letterSpacing: '-0.01em',
      }}>
        {value}
      </span>
    </div>
  );
}
