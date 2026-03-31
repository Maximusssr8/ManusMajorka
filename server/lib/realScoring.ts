/**
 * Real Opportunity Score Engine
 * Scores products based ONLY on real scraped data.
 * No AI estimates, no made-up numbers.
 *
 * Score = Demand (40) + Quality (30) + Cross-Platform (20) + Supplier (10)
 */

export interface RealProductSignals {
  // AliExpress
  ae_orders?: number;
  ae_rating?: number;
  ae_review_count?: number;

  // TikTok Shop
  tiktok_units_sold?: number;
  tiktok_rating?: number;

  // Amazon AU
  amazon_bsr_rank?: number;
  amazon_rating?: number;
  amazon_review_count?: number;

  // Supplier
  has_cj_supplier?: boolean;
  has_ae_supplier?: boolean;
  cj_in_stock?: boolean;

  // Cross-platform
  platform_count?: number;
}

export interface RealScore {
  total: number;         // 0-100
  demand: number;        // 0-40
  quality: number;       // 0-30
  cross_platform: number; // 0-20
  supplier: number;      // 0-10
  reasoning: string[];
}

export function calculateRealScore(signals: RealProductSignals): RealScore {
  const reasoning: string[] = [];
  let demand = 0;
  let quality = 0;
  let crossPlatform = 0;
  let supplier = 0;

  // ── DEMAND SIGNALS (40 pts max) ─────────────────────────────────────────────

  // AliExpress orders
  if (signals.ae_orders) {
    if (signals.ae_orders >= 10000) {
      demand += 20; reasoning.push(`AE ${signals.ae_orders.toLocaleString()} orders (+20)`);
    } else if (signals.ae_orders >= 1000) {
      demand += 10; reasoning.push(`AE ${signals.ae_orders.toLocaleString()} orders (+10)`);
    } else if (signals.ae_orders >= 100) {
      demand += 5;  reasoning.push(`AE ${signals.ae_orders.toLocaleString()} orders (+5)`);
    }
  }

  // TikTok Shop units sold
  if (signals.tiktok_units_sold) {
    if (signals.tiktok_units_sold >= 1000) {
      demand += 20; reasoning.push(`TikTok ${signals.tiktok_units_sold.toLocaleString()} sold (+20)`);
    } else if (signals.tiktok_units_sold >= 100) {
      demand += 10; reasoning.push(`TikTok ${signals.tiktok_units_sold.toLocaleString()} sold (+10)`);
    } else if (signals.tiktok_units_sold >= 10) {
      demand += 5;  reasoning.push(`TikTok ${signals.tiktok_units_sold.toLocaleString()} sold (+5)`);
    }
  }

  // Amazon BSR
  if (signals.amazon_bsr_rank) {
    if (signals.amazon_bsr_rank <= 100) {
      demand += 20; reasoning.push(`Amazon BSR #${signals.amazon_bsr_rank} (+20)`);
    } else if (signals.amazon_bsr_rank <= 1000) {
      demand += 10; reasoning.push(`Amazon BSR #${signals.amazon_bsr_rank} (+10)`);
    } else if (signals.amazon_bsr_rank <= 5000) {
      demand += 5;  reasoning.push(`Amazon BSR #${signals.amazon_bsr_rank} (+5)`);
    }
  }

  demand = Math.min(40, demand);

  // ── QUALITY SIGNALS (30 pts max) ────────────────────────────────────────────

  // Best rating across sources
  const ratings = [signals.ae_rating, signals.tiktok_rating, signals.amazon_rating].filter((r): r is number => r != null && r > 0);
  const bestRating = ratings.length ? Math.max(...ratings) : 0;

  if (bestRating >= 4.5) {
    quality += 15; reasoning.push(`Rating ${bestRating.toFixed(1)}/5 (+15)`);
  } else if (bestRating >= 4.0) {
    quality += 10; reasoning.push(`Rating ${bestRating.toFixed(1)}/5 (+10)`);
  } else if (bestRating >= 3.5) {
    quality += 5;  reasoning.push(`Rating ${bestRating.toFixed(1)}/5 (+5)`);
  }

  // Review count
  const totalReviews = (signals.ae_review_count || 0) + (signals.amazon_review_count || 0);
  if (totalReviews >= 1000) {
    quality += 15; reasoning.push(`${totalReviews.toLocaleString()} reviews (+15)`);
  } else if (totalReviews >= 100) {
    quality += 10; reasoning.push(`${totalReviews.toLocaleString()} reviews (+10)`);
  } else if (totalReviews >= 10) {
    quality += 5;  reasoning.push(`${totalReviews.toLocaleString()} reviews (+5)`);
  }

  quality = Math.min(30, quality);

  // ── CROSS-PLATFORM SIGNALS (20 pts max) ─────────────────────────────────────

  const count = signals.platform_count || 1;
  if (count >= 3) {
    crossPlatform = 20; reasoning.push(`Found on 3+ platforms (+20)`);
  } else if (count === 2) {
    crossPlatform = 10; reasoning.push(`Found on 2 platforms (+10)`);
  }

  // ── SUPPLIER SIGNALS (10 pts max) ────────────────────────────────────────────

  if (signals.has_cj_supplier && signals.cj_in_stock) {
    supplier = 10; reasoning.push(`CJ supplier in stock (+10)`);
  } else if (signals.has_cj_supplier) {
    supplier = 7;  reasoning.push(`CJ supplier found (+7)`);
  } else if (signals.has_ae_supplier) {
    supplier = 5;  reasoning.push(`AliExpress supplier (+5)`);
  }

  const total = demand + quality + crossPlatform + supplier;

  return { total, demand, quality, cross_platform: crossPlatform, supplier, reasoning };
}

/**
 * Build score from a winning_products row (after real data columns exist)
 */
export function scoreFromProductRow(p: Record<string, any>): RealScore {
  return calculateRealScore({
    ae_orders:           p.orders_count || p.ae_orders_count,
    ae_rating:           p.rating,
    ae_review_count:     p.review_count,
    tiktok_units_sold:   p.tiktok_shop_units_sold,
    tiktok_rating:       p.tiktok_rating,
    amazon_bsr_rank:     p.amazon_bsr_rank,
    amazon_rating:       p.amazon_rating,
    amazon_review_count: p.amazon_review_count,
    has_cj_supplier:     !!p.cj_product_id,
    has_ae_supplier:     !!p.aliexpress_url,
    cj_in_stock:         p.inventory_count == null || p.inventory_count > 0,
    platform_count:      p.platform_count || 1,
  });
}
