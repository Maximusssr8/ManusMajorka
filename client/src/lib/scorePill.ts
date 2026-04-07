/**
 * Premium clean score pill — coloured background, no emoji.
 * 90+ green / 70+ blue / 50+ amber / <50 grey
 */
export interface ScorePillStyle {
  background: string;
  color: string;
}

export function scorePillStyle(score: number): ScorePillStyle {
  if (score >= 90) return { background: 'rgba(34,197,94,0.15)',  color: '#22c55e' };
  if (score >= 70) return { background: 'rgba(59,130,246,0.15)', color: '#3b82f6' };
  if (score >= 50) return { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
  return             { background: 'rgba(107,114,128,0.15)', color: '#6b7280' };
}

/** Solid colour only (for sparklines / strokes that need a single colour). */
export function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#3b82f6';
  if (score >= 50) return '#f59e0b';
  return '#6b7280';
}
