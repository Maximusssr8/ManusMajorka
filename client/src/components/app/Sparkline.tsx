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

/**
 * Hash a UUID/string id to a deterministic positive integer seed.
 */
function hashId(id: number | string): number {
  if (typeof id === 'number') return Math.abs(id);
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * ProductSparkline — deterministic per product (so the curve is stable across renders).
 * Trends up if score >= 65, down otherwise.
 */
export function ProductSparkline({
  productId,
  score,
  width = 52,
  height = 18,
  points = 6,
}: {
  productId: number | string;
  score: number;
  width?: number;
  height?: number;
  points?: number;
}) {
  const seed = hashId(productId) % 100;
  const isUp = score >= 65;
  const vals = Array.from({ length: points }, (_, i) => {
    const base = isUp ? 30 + i * 8 : 50 - i * 5;
    return Math.max(5, Math.min(55, base + ((seed + i * 7) % 20) - 10));
  });
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const yPad = 2;
  const usable = height - yPad * 2;
  const normalize = (v: number) => yPad + usable - ((v - min) / (max - min || 1)) * usable;
  const stride = (width - 2) / (points - 1);
  const pts = vals.map((v, i) => `${1 + i * stride},${normalize(v)}`).join(' ');
  const stroke = scoreColor(score);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
