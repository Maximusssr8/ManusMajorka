/**
 * 5-tier score banding. Widens the visible palette so scores
 * don't all look identical in the top range.
 *
 *   95-100: bright green   — elite
 *   85-94:  teal           — strong
 *   70-84:  violet         — good
 *   55-69:  amber          — ok
 *   <55:    grey           — cold
 */
export interface ScorePillStyle {
  background: string;
  color: string;
  border?: string;
}

export function scorePillStyle(score: number): ScorePillStyle {
  if (score >= 95) return { background: 'rgba(16,185,129,0.16)',  color: '#10b981', border: '1px solid rgba(16,185,129,0.28)' };
  if (score >= 85) return { background: 'rgba(20,184,166,0.14)',  color: '#14b8a6', border: '1px solid rgba(20,184,166,0.22)' };
  if (score >= 70) return { background: 'rgba(124,106,255,0.14)', color: '#a78bfa', border: '1px solid rgba(124,106,255,0.22)' };
  if (score >= 55) return { background: 'rgba(245,158,11,0.14)',  color: '#f59e0b', border: '1px solid rgba(245,158,11,0.22)' };
  return             { background: 'rgba(255,255,255,0.06)',      color: 'rgba(255,255,255,0.3)' };
}

/** Solid stroke colour for sparklines. */
export function scoreColor(score: number): string {
  if (score >= 95) return '#10b981';
  if (score >= 85) return '#14b8a6';
  if (score >= 70) return '#a78bfa';
  if (score >= 55) return '#f59e0b';
  return 'rgba(255,255,255,0.3)';
}

/**
 * Display helper — the raw DB score is integer but we format with one decimal
 * so the user can see the score isn't a hard-capped sentinel value.
 * NOTE: underlying data is integer. If backfill produces sub-integer scores
 * later this still works.
 */
export function fmtScore(score: number | null | undefined): string {
  if (score == null) return '—';
  return score.toFixed(1);
}
