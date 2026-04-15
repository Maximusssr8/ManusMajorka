/**
 * Australian GST + margin calculator — AU Moat Director.
 *
 * Formula reference (spec):
 *   - 10% GST applies both on landed imports and on the selling price
 *     charged to AU customers.
 *   - 2.9% + $0.30 AUD payment processing fee per order (Stripe standard).
 *   - GST registration is required when projected annual turnover
 *     exceeds A$75,000 (projected as sellingPrice × 365).
 *   - Imports over A$1,000 attract customs duty — surface a flag so the
 *     operator consults a broker rather than getting caught at the border.
 *
 * All math is pure — no side effects, safe for deterministic tests.
 */

export interface MarginInput {
  /** Wholesale cost of the product in AUD before shipping. */
  productCostAUD: number;
  /** Shipping cost paid to supplier / courier in AUD. */
  shippingCostAUD: number;
  /** Price charged to the AU customer, AUD (inc. GST). */
  sellingPriceAUD: number;
  /** Ad spend as a percentage of selling price (e.g. 25 => 25%). */
  adSpendPercent: number;
  /** Expected refund / return rate as percent (e.g. 8 => 8%). */
  returnsPercent: number;
}

export interface MarginResult {
  grossProfit: number;
  netProfit: number;
  netMarginPercent: number;
  breakEvenROAS: number;
  gstOnImport: number;
  gstCollected: number;
  netGSTPay: number;
  processingFee: number;
  gstRequired: boolean;
  customsDutyFlag: boolean;
  annualisedRevenue: number;
}

const GST_RATE = 0.10;
const PROCESSING_PERCENT = 0.029;
const PROCESSING_FIXED = 0.30;
const GST_REGISTRATION_THRESHOLD = 75_000;
const CUSTOMS_DUTY_THRESHOLD = 1_000;

function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function nonNeg(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function calculateAUMargins(input: MarginInput): MarginResult {
  const productCost = nonNeg(input.productCostAUD);
  const shippingCost = nonNeg(input.shippingCostAUD);
  const sellingPrice = nonNeg(input.sellingPriceAUD);
  const adPct = nonNeg(input.adSpendPercent) / 100;
  const returnsPct = nonNeg(input.returnsPercent) / 100;

  // GST on import — 10% of the landed cost (cost + shipping).
  const importSubtotal = productCost + shippingCost;
  const gstOnImport = round2(importSubtotal * GST_RATE);

  // Selling price is inclusive of GST to the AU customer — derive the
  // GST component (price × 1/11) rather than price × 10%.
  const gstCollected = round2(sellingPrice / 11);

  // Net GST payable to the ATO = GST collected − GST credit on imports.
  const netGSTPay = round2(gstCollected - gstOnImport);

  // Payment processing fee (Stripe standard AU pricing).
  const processingFee = round2(sellingPrice * PROCESSING_PERCENT + PROCESSING_FIXED);

  // Ad cost + expected refund leakage (applied to revenue).
  const adCost = round2(sellingPrice * adPct);
  const returnsCost = round2(sellingPrice * returnsPct);

  // Gross profit = ex-GST revenue − landed cost.
  const exGstRevenue = round2(sellingPrice - gstCollected);
  const landedCost = round2(importSubtotal);
  const grossProfit = round2(exGstRevenue - landedCost);

  // Net profit = gross − ads − processing − returns.
  const netProfit = round2(grossProfit - adCost - processingFee - returnsCost);

  const netMarginPercent = sellingPrice > 0
    ? round2((netProfit / sellingPrice) * 100)
    : 0;

  // Break-even ROAS — revenue per $1 ad spend needed to zero-profit.
  // Contribution margin per sale (ex-ad, ex-returns) / sellingPrice,
  // then ROAS = 1 / contribution.
  const contributionPerSale = round2(
    exGstRevenue - landedCost - processingFee - returnsCost,
  );
  const contributionRate = sellingPrice > 0
    ? contributionPerSale / sellingPrice
    : 0;
  const breakEvenROAS = contributionRate > 0
    ? round2(1 / contributionRate)
    : 0;

  const annualisedRevenue = round2(sellingPrice * 365);
  const gstRequired = annualisedRevenue >= GST_REGISTRATION_THRESHOLD;
  const customsDutyFlag = landedCost >= CUSTOMS_DUTY_THRESHOLD;

  return {
    grossProfit,
    netProfit,
    netMarginPercent,
    breakEvenROAS,
    gstOnImport,
    gstCollected,
    netGSTPay,
    processingFee,
    gstRequired,
    customsDutyFlag,
    annualisedRevenue,
  };
}

// ─── BNPL score ─────────────────────────────────────────────────────────────
// Score 0-100 predicting Afterpay / Zip conversion lift for an AU buyer.
// Heuristic — no external API. Price band is the dominant signal: AUD
// 20-300 is the sweet spot; below that BNPL fees swamp the cart, above
// that approval drops and affordability dominates.

export interface BNPLInput {
  priceAud: number;
  category: string | null;
  soldCount: number | null;
  rating: number | null;
}

export interface BNPLResult {
  score: number;
  priceBandScore: number;
  categoryScore: number;
  popularityScore: number;
}

const BNPL_FRIENDLY_CATEGORIES: ReadonlyArray<string> = [
  'beauty', 'beauty & health', 'skincare', 'fashion', 'apparel',
  'apparel accessories', 'shoes', 'jewelry', 'jewellery', 'watches',
  'bags', 'bags & luggage', 'accessories',
];

const BNPL_NEUTRAL_CATEGORIES: ReadonlyArray<string> = [
  'home & garden', 'home decor', 'kitchen', 'furniture', 'lighting',
  'lights & lighting', 'fitness', 'sports & fitness', 'activewear',
];

function priceBandScore(priceAud: number): number {
  // Peak at $20–$300, trails outside.
  if (priceAud <= 0) return 0;
  if (priceAud >= 20 && priceAud <= 300) return 100;
  if (priceAud < 20) return Math.max(15, Math.round((priceAud / 20) * 60));
  if (priceAud <= 600) {
    return Math.max(30, 100 - Math.round(((priceAud - 300) / 300) * 60));
  }
  return 25;
}

function categoryScore(category: string | null): number {
  const c = (category ?? '').toLowerCase().trim();
  if (!c) return 50;
  if (BNPL_FRIENDLY_CATEGORIES.some((k) => c.includes(k))) return 100;
  if (BNPL_NEUTRAL_CATEGORIES.some((k) => c.includes(k))) return 60;
  return 40;
}

function popularityScore(soldCount: number | null, rating: number | null): number {
  const orders = Math.max(0, Number(soldCount ?? 0));
  const r = Math.max(0, Math.min(5, Number(rating ?? 0)));
  // Orders component: log-scale, caps at 10k+.
  const ordersPart = orders <= 0
    ? 10
    : Math.min(70, Math.round((Math.log10(orders + 1) / 4) * 70));
  // Rating component: 4.0+ is strong signal for BNPL conversions.
  const ratingPart = r <= 0 ? 10 : Math.round((r / 5) * 30);
  return Math.min(100, ordersPart + ratingPart);
}

export function calculateBNPLScore(input: BNPLInput): BNPLResult {
  const pb = priceBandScore(Number(input.priceAud ?? 0));
  const cat = categoryScore(input.category);
  const pop = popularityScore(input.soldCount, input.rating);
  const score = Math.max(0, Math.min(100, Math.round(pb * 0.45 + cat * 0.25 + pop * 0.30)));
  return { score, priceBandScore: pb, categoryScore: cat, popularityScore: pop };
}
