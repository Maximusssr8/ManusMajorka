// Comparison Table v2 — Manual vs Majorka.
import { Check, X } from 'lucide-react';
import { LT, F } from '@/lib/landingTokens';
import { EyebrowPill, H2, Sub, Section } from './shared';

const ROWS: Array<{ feature: string; manual: boolean; majorka: boolean }> = [
  { feature: 'Live order velocity data', manual: false, majorka: true },
  { feature: 'AI product scoring', manual: false, majorka: true },
  { feature: 'Price drop alerts', manual: false, majorka: true },
  { feature: 'AU market fit analysis', manual: false, majorka: true },
  { feature: 'Ad brief generator', manual: false, majorka: true },
  { feature: 'Shopify-ready store builder', manual: false, majorka: true },
  { feature: 'Data refresh every 6 hours', manual: false, majorka: true },
  { feature: 'Free to start', manual: true, majorka: true },
];

function Tick() {
  return <Check size={18} style={{ color: LT.cobalt }} />;
}
function Cross() {
  return <X size={18} style={{ color: LT.crossGrey }} />;
}

export function ComparisonTable() {
  return (
    <Section id="compare">
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <EyebrowPill>Compare</EyebrowPill>
        </div>
        <H2 style={{ margin: '0 auto' }}>Why Majorka vs. doing it manually?</H2>
        <Sub style={{ margin: '12px auto 0' }}>The maths are simple.</Sub>
      </div>

      <div
        style={{
          border: `1px solid ${LT.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px 120px',
            background: LT.bgCard,
            borderBottom: `1px solid ${LT.border}`,
            padding: '14px 20px',
          }}
        >
          <span style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute }}>Feature</span>
          <span style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute, textAlign: 'center' }}>Manual</span>
          <span style={{ fontFamily: F.body, fontSize: 14, color: LT.cobalt, fontWeight: 600, textAlign: 'center' }}>Majorka</span>
        </div>
        {ROWS.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 120px',
              padding: '14px 20px',
              borderBottom: i < ROWS.length - 1 ? `1px solid ${LT.border}` : 'none',
              background: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
            }}
          >
            <span style={{ fontFamily: F.body, fontSize: 14, color: LT.text }}>{r.feature}</span>
            <span style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}>{r.manual ? <Tick /> : <Cross />}</span>
            <span style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}>{r.majorka ? <Tick /> : <Cross />}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
