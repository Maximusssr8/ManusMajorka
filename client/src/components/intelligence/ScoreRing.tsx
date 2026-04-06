/**
 * ScoreRing — 36×36px SVG circular progress indicator
 * Displays score as a ring with color-coded tiers
 */

interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 36 }: ScoreRingProps) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#94A3B8';
  
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={3}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Score text */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color,
          fontVariantNumeric: 'tabular-nums',
          zIndex: 1,
        }}
      >
        {score}
      </span>
    </div>
  );
}
