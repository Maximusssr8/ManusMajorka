import { useState, useRef, useEffect } from 'react';
import { useRegion } from '../context/RegionContext';
import { REGION_LIST } from '../lib/regions';
import type { RegionCode } from '../lib/regions';

export function RegionSelector() {
  const { regionCode, region, setRegionCode } = useRegion();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (code: RegionCode) => {
    setRegionCode(code);
    setOpen(false);
    const r = REGION_LIST.find(r => r.code === code);
    if (r) {
      setToast(`Showing data for ${r.flag} ${r.name}`);
      setTimeout(() => setToast(''), 3000);
    }
  };

  return (
    <>
      <div ref={ref} style={{ position: 'relative' as const }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 34, padding: '0 10px',
            background: open ? '#EEF2FF' : 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 8, cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: '#374151',
            transition: 'all 150ms',
          }}
        >
          <span style={{ fontSize: 16 }}>{region.flag}</span>
          <span>{region.currency}</span>
          <span style={{ fontSize: 9, color: '#9CA3AF', marginLeft: 2 }}>&#9662;</span>
        </button>

        {open && (
          <div style={{
            position: 'absolute' as const, top: '100%', right: 0, zIndex: 200,
            background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden',
            minWidth: 200, marginTop: 6,
          }}>
            <div style={{ padding: '8px 12px 6px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Select Market
            </div>
            {REGION_LIST.map(r => (
              <button
                key={r.code}
                onClick={() => handleSelect(r.code as RegionCode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '8px 14px',
                  background: regionCode === r.code ? '#EEF2FF' : 'white',
                  border: 'none', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'background 100ms',
                  borderLeft: regionCode === r.code ? '3px solid #6366F1' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (regionCode !== r.code) e.currentTarget.style.background = '#FAFAFF'; }}
                onMouseLeave={e => { if (regionCode !== r.code) e.currentTarget.style.background = 'white'; }}
              >
                <span style={{ fontSize: 20 }}>{r.flag}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: regionCode === r.code ? '#6366F1' : '#0A0A0A' }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{r.currency} · ~{r.avg_shipping_days}d shipping</div>
                </div>
                {regionCode === r.code && <span style={{ marginLeft: 'auto', color: '#6366F1', fontSize: 14 }}>&#10003;</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed' as const, bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#0A0A0A', color: 'white', padding: '10px 20px',
          borderRadius: 100, fontSize: 13, fontWeight: 500, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', pointerEvents: 'none' as const,
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
