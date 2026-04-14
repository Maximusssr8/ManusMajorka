import React from 'react';

interface BorderBeamProps {
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  size = 150,
  duration = 12,
  colorFrom = '#d4af37',
  colorTo = '#d4af37',
}: BorderBeamProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        '--size': `${size}px`,
        '--duration': `${duration}s`,
        '--color-from': colorFrom,
        '--color-to': colorTo,
      } as React.CSSProperties}
    >
      <div className="border-beam-inner" />
    </div>
  );
}
