import React from 'react';

type VelocityLabel = 'EARLY' | 'PEAK' | 'FADING' | 'UNKNOWN';

interface VelocityBadgeProps {
  label: VelocityLabel;
  score?: number;
  peakInDays?: number | null;
  curve?: Array<{ signal_strength: number }>;
  size?: 'sm' | 'md';
}

const VELOCITY_CONFIG: Record<VelocityLabel, { color: string; bg: string; border: string; emoji: string; text: string }> = {
  EARLY:   { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', emoji: '\u26A1', text: 'EARLY' },
  PEAK:    { color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', emoji: '\uD83D\uDD25', text: 'PEAK' },
  FADING:  { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', emoji: '\uD83D\uDCC9', text: 'FADING' },
  UNKNOWN: { color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB', emoji: '\u25CB', text: 'UNKNOWN' },
};

function MiniSparkline({ curve, color }: { curve: Array<{ signal_strength: number }>; color: string }) {
  if (!curve || curve.length < 2) return null;
  const max = Math.max(...curve.map(p => p.signal_strength), 1);
  const w = 60, h = 22;
  const pointsArr = curve.map((p, i) => ({
    x: ((i / (curve.length - 1)) * (w - 4) + 2).toFixed(1),
    y: (h - 2 - ((p.signal_strength / max) * (h - 6))).toFixed(1),
  }));
  const points = pointsArr.map(p => `${p.x},${p.y}`).join(' ');
  const last = pointsArr[pointsArr.length - 1];
  return (
    <svg width={w} height={h} style={{ flexShrink: 0, marginLeft: 4 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
    </svg>
  );
}

export function VelocityBadge({ label, score, peakInDays, curve, size = 'md' }: VelocityBadgeProps) {
  if (!label || label === 'UNKNOWN') return null;

  const cfg = VELOCITY_CONFIG[label];
  const isSmall = size === 'sm';

  const peakText = label === 'EARLY' && peakInDays && peakInDays > 0
    ? `Peaks in ~${peakInDays}d`
    : label === 'PEAK'
    ? 'At peak now'
    : label === 'FADING'
    ? 'Past peak'
    : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        height: isSmall ? 20 : 24,
        padding: `0 ${isSmall ? 6 : 8}px`,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 20,
        fontSize: isSmall ? 9 : 10,
        fontWeight: 800,
        color: cfg.color,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        flexShrink: 0,
        cursor: peakText ? 'help' : 'default',
      }} title={peakText || undefined}>
        <span>{cfg.emoji}</span>
        <span>{cfg.text}</span>
      </div>

      {!isSmall && curve && curve.length >= 2 && (
        <MiniSparkline curve={curve} color={cfg.color} />
      )}

      {!isSmall && peakText && (
        <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600, whiteSpace: 'nowrap' as const }}>
          {peakText}
        </span>
      )}
    </div>
  );
}
