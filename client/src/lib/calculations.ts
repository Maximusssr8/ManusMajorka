/**
 * Shared calculation helpers for margins, scores, and financial data.
 */

/**
 * Calculate margin percentage from sell price and cost.
 * Returns null when data is unavailable or margin would be negative.
 */
export function calculateMargin(
  price: number | null | undefined,
  originalPrice: number | null | undefined,
): number | null {
  if (!price || !originalPrice) return null;
  if (originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Returns a Tailwind colour class for the given margin value.
 */
export function getMarginColour(margin: number | null): string {
  if (margin === null) return 'text-white/30';
  if (margin >= 60) return 'text-emerald-400';
  if (margin >= 40) return 'text-amber-400';
  if (margin >= 20) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Returns a Tailwind class string for score badge styling.
 */
export function getScoreStyle(score: number | null | undefined): string {
  if (!score) return 'text-white/30 border-white/10 bg-white/[0.04]';
  if (score >= 70) return 'text-emerald-400 border-emerald-400/25 bg-emerald-400/[0.08]';
  if (score >= 55) return 'text-amber-400 border-amber-400/25 bg-amber-400/[0.08]';
  return 'text-slate-500 border-white/10 bg-white/[0.04]';
}
