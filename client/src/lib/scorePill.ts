/**
 * Premium clean score pill — coloured background, no emoji.
 * Codex token system: green / violet / amber / faint.
 */
export interface ScorePillStyle {
  background: string;
  color: string;
  border?: string;
}

export function scorePillStyle(score: number): ScorePillStyle {
  if (score >= 99) return { background: 'rgba(16,185,129,0.15)',  color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' };
  if (score >= 90) return { background: 'rgba(16,185,129,0.10)',  color: '#10b981' };
  if (score >= 70) return { background: 'rgba(124,106,255,0.12)', color: '#a78bfa', border: '1px solid rgba(124,106,255,0.2)' };
  if (score >= 50) return { background: 'rgba(245,158,11,0.10)',  color: '#f59e0b' };
  return             { background: 'rgba(255,255,255,0.06)',      color: 'rgba(255,255,255,0.3)' };
}

/** Solid colour only (for sparklines / strokes). */
export function scoreColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#a78bfa';
  if (score >= 50) return '#f59e0b';
  return 'rgba(255,255,255,0.3)';
}
