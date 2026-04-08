import { scoreColor } from '@/lib/scorePill';

/**
 * Sparkline — small decorative SVG line for stat cards.
 * Random gentle upward trend; recomputed each render.
 */
export function Sparkline({ color = '#10b981', points = 5, width = 60, height = 22 }: { color?: string; points?: number; width?: number; height?: number }) {
  const vals = Array.from({ length: points }, (_, i) =>
    Math.round(40 + (i / points) * 40 + Math.random() * 15)
  );
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const yPad = 3;
  const usable = height - yPad * 2;
  const normalize = (v: number) => yPad + usable - ((v - min) / (max - min || 1)) * usable;
  const pts = vals.map((v, i) => `${(i / (points - 1)) * (width - 2) + 1},${normalize(v)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

function hashId(id: number | string): number {
  if (typeof id === 'number') return Math.abs(id);
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * ProductSparkline — deterministic per product. Trend colour derives from
 * first vs last data point:
 *   up   → green
 *   flat → grey
 *   down → amber
 */
export function ProductSparkline({
  productId,
  score,
  width = 80,
  height = 22,
  points = 7,
}: {
  productId: number | string;
  score: number;
  width?: number;
  height?: number;
  points?: number;
}) {
  const seed = hashId(productId) % 100;
  // Score biases the underlying trend, but colour is determined by first→last delta.
  const bias = score >= 70 ? 1 : score >= 55 ? 0 : -1;
  const vals = Array.from({ length: points }, (_, i) => {
    const base = bias > 0
      ? 25 + i * 7
      : bias < 0
        ? 55 - i * 6
        : 40 + Math.sin(i * 1.2 + seed) * 5;
    return Math.max(5, Math.min(60, base + ((seed + i * 11) % 18) - 9));
  });
  const first = vals[0];
  const last  = vals[vals.length - 1];
  const delta = last - first;
  let stroke: string;
  if (delta > 4) stroke = '#10b981';        // up — green
  else if (delta < -4) stroke = '#f59e0b';  // down — amber
  else stroke = 'rgba(255,255,255,0.3)';    // flat — grey
  if (score >= 95 && delta >= 0) stroke = scoreColor(score);

  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const yPad = 3;
  const usable = height - yPad * 2;
  const normalize = (v: number) => yPad + usable - ((v - min) / (max - min || 1)) * usable;
  const stride = (width - 2) / (points - 1);
  const pts = vals.map((v, i) => `${1 + i * stride},${normalize(v)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}
