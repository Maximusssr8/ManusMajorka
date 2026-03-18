interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Sparkline({ data, width = 80, height = 30, color = '#d4af37', strokeWidth = 1.5 }: SparklineProps) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = strokeWidth;
  const innerH = height - pad * 2;
  const innerW = width - pad * 2;

  const points = data.map((val, i) => {
    const x = pad + (i / (data.length - 1)) * innerW;
    const y = pad + innerH - ((val - min) / range) * innerH;
    return `${x},${y}`;
  }).join(' ');

  const isUp = data[data.length - 1] >= data[0];
  const lineColor = color === '#d4af37' ? color : (isUp ? '#2dca72' : '#ef4444');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
