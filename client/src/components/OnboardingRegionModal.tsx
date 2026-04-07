import { useState } from 'react';
import { useRegion } from '../context/RegionContext';
import { REGION_LIST } from '../lib/regions';
import type { RegionCode } from '../lib/regions';

interface OnboardingRegionModalProps {
  onComplete: () => void;
}

export function OnboardingRegionModal({ onComplete }: OnboardingRegionModalProps) {
  const { setRegionCode } = useRegion();
  const [selected, setSelected] = useState<RegionCode>('US');
  const brico = "'Bricolage Grotesque', sans-serif";

  const handleConfirm = () => {
    setRegionCode(selected);
    localStorage.setItem('majorka_onboarded', 'true');
    onComplete();
  };

  const selectedRegion = REGION_LIST.find(r => r.code === selected);

  return (
    <>
      <div style={{ position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed' as const, top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#0d0d10', borderRadius: 20, padding: '40px 48px',
        zIndex: 1001, maxWidth: 600, width: '90vw',
        boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
      }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>&#127758;</div>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 24, color: '#F8FAFC', margin: '0 0 8px' }}>
            Welcome to Majorka
          </h2>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>Which market are you selling into?</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {REGION_LIST.map(r => (
            <button
              key={r.code}
              onClick={() => setSelected(r.code as RegionCode)}
              style={{
                padding: '14px 16px', background: selected === r.code ? '#EEF2FF' : '#FAFAFA',
                border: `2px solid ${selected === r.code ? '#6366F1' : '#E5E7EB'}`,
                borderRadius: 12, cursor: 'pointer', textAlign: 'left' as const,
                transition: 'all 150ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{r.flag}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selected === r.code ? '#6366F1' : '#0A0A0A' }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{r.currency} · {r.popular_niches.slice(0, 2).join(', ')}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button onClick={handleConfirm}
          style={{
            width: '100%', height: 48, background: '#6366F1', color: 'white',
            border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: brico,
          }}>
          Show me {selectedRegion?.flag} {selectedRegion?.name} products &#8594;
        </button>
        <p style={{ textAlign: 'center' as const, fontSize: 11, color: '#9CA3AF', margin: '12px 0 0' }}>
          You can change this anytime in settings
        </p>
      </div>
    </>
  );
}
