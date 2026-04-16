import { useState } from 'react';

interface MetricTooltipProps {
  label: string;
  tip: string;
  children?: React.ReactNode;
}

export function MetricTooltip({ label, tip, children }: MetricTooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {children || label}
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 14, height: 14, borderRadius: '50%',
          background: 'rgba(79,142,247,0.2)', color: '#9CA3AF',
          fontSize: 9, fontWeight: 700, cursor: 'help', flexShrink: 0,
        }}
      >?</span>
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: '#1E2433', border: '1px solid rgba(79,142,247,0.3)',
          borderRadius: 8, padding: '8px 12px', width: 220, fontSize: 12,
          color: '#D1D5DB', lineHeight: 1.5, zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)', marginBottom: 6,
          pointerEvents: 'none',
        }}>
          {tip}
        </div>
      )}
    </span>
  );
}
