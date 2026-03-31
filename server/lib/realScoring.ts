/**
 * Phase 7 — Score Recalibration Engine
 * Scores products based on real scraped data with oversaturation filter.
 * Formula: Demand (40) + Quality (25) + Margin (20) + Niche (15) = 100
 */

const OVERSATURATED_KEYWORDS = [
  'phone case', 'phone mount', 'water bottle', 'posture corrector',
  'compression socks', 'cable organizer', 'cable organiser',
  'phone charger', 'eyebrow stamp', 'hair tie', 'basic sunglass',
];

export interface ScoreBreakdown {
  demand: number;
  quality: number;
  margin_pts: number;
  niche: number;
}

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdown;
}

/**
 * Score a product using the Phase 7 recalibrated formula.
 * Uses real data columns when available, falls back to legacy columns.
 */
export function scoreProduct(p: Record<string, any>): ScoreResult {
  // ── DEMAND (40 pts) ─────────────────────────────────────────────────────
  const realOrders = p.real_orders_count ?? p.orders_count ?? null;
  let demand: number;
  if (realOrders === null || realOrders === undefined) {
    demand = 10; // unknown
  } else if (realOrders > 10000) {
    demand = 40;
  } else if (realOrders >= 1000) {
    demand = 25;
  } else if (realOrders >= 100) {
    demand = 15;
  } else {
    demand = 5;
  }

  // ── QUALITY (25 pts) ────────────────────────────────────────────────────
  const rating = p.real_rating ?? p.rating ?? null;
  let quality: number;
  if (rating === null || rating === undefined) {
    quality = 10; // unknown
  } else if (rating >= 4.7) {
    quality = 25;
  } else if (rating >= 4.3) {
    quality = 20;
  } else if (rating >= 4.0) {
    quality = 15;
  } else {
    quality = 5;
  }

  // ── MARGIN (20 pts) ─────────────────────────────────────────────────────
  const sell = p.suggested_sell_aud || p.price_aud || 0;
  const costVal = p.real_cost_aud || p.cost_price_aud || 0;
  let marginPts: number;
  if (sell > 0 && costVal > 0) {
    const marginPct = ((sell - costVal) / sell) * 100;
    if (marginPct > 50) {
      marginPts = 20;
    } else if (marginPct >= 35) {
      marginPts = 15;
    } else if (marginPct >= 25) {
      marginPts = 10;
    } else {
      marginPts = 5;
    }
  } else {
    marginPts = 5; // can't calculate
  }

  // ── NICHE (15 pts) ──────────────────────────────────────────────────────
  const title = (p.product_title || p.name || '').toLowerCase();
  const isOversaturated = OVERSATURATED_KEYWORDS.some(kw => title.includes(kw));
  const niche = isOversaturated ? 0 : 15;

  const score = demand + quality + marginPts + niche;

  return {
    score,
    breakdown: { demand, quality, margin_pts: marginPts, niche },
  };
}

// ── Legacy compatibility exports ──────────────────────────────────────────

export interface RealProductSignals {
  ae_orders?: number;
  ae_rating?: number;
  ae_review_count?: number;
  tiktok_units_sold?: number;
  tiktok_rating?: number;
  amazon_bsr_rank?: number;
  amazon_rating?: number;
  amazon_review_count?: number;
  has_cj_supplier?: boolean;
  has_ae_supplier?: boolean;
  cj_in_stock?: boolean;
  platform_count?: number;
}

export interface RealScore {
  total: number;
  demand: number;
  quality: number;
  cross_platform: number;
  supplier: number;
  reasoning: string[];
}

/** Legacy API — wraps new scoreProduct */
export function calculateRealScore(signals: RealProductSignals): RealScore {
  const result = scoreProduct({
    real_orders_count: signals.ae_orders,
    real_rating: signals.ae_rating || signals.tiktok_rating || signals.amazon_rating,
    orders_count: signals.ae_orders,
    rating: signals.ae_rating,
  });
  return {
    total: result.score,
    demand: result.breakdown.demand,
    quality: result.breakdown.quality,
    cross_platform: result.breakdown.niche, // mapped for compat
    supplier: result.breakdown.margin_pts,  // mapped for compat
    reasoning: [`Score: ${result.score}/100`],
  };
}

/** Legacy API — wraps new scoreProduct */
export function scoreFromProductRow(p: Record<string, any>): RealScore {
  const result = scoreProduct(p);
  return {
    total: result.score,
    demand: result.breakdown.demand,
    quality: result.breakdown.quality,
    cross_platform: result.breakdown.niche,
    supplier: result.breakdown.margin_pts,
    reasoning: [`Score: ${result.score}/100`],
  };
}
