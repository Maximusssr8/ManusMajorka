/**
 * Cross-source signal scoring engine.
 * Products are scored based on which platforms validate them.
 * Higher score = stronger multi-platform demand signal.
 */

export interface SignalScores {
  tiktok_shop_bestseller: boolean;
  tiktok_ad_top_performing: boolean;
  meta_ad_30_days: boolean;
  amazon_bsr_under_1000: boolean;
  aliexpress_choice: boolean;
  aliexpress_orders_over_1000: boolean;
  tiktok_hashtag_viral: boolean;
  multi_source: boolean;
}

const SIGNAL_POINTS: Record<string, number> = {
  tiktok_shop_bestseller: 25,
  tiktok_ad_top_performing: 25,
  meta_ad_30_days: 20,
  amazon_bsr_under_1000: 20,
  aliexpress_choice: 15,
  aliexpress_orders_over_1000: 15,
  tiktok_hashtag_viral: 10,
  multi_source: 20, // bonus for appearing in 2+ sources
};

export function calculateSignalScore(signals: Partial<SignalScores>): number {
  let score = 0;
  let sourcesHit = 0;

  for (const [key, points] of Object.entries(SIGNAL_POINTS)) {
    if (key === 'multi_source') continue;
    if (signals[key as keyof SignalScores]) {
      score += points;
      sourcesHit++;
    }
  }

  // Multi-source bonus
  if (sourcesHit >= 2) score += SIGNAL_POINTS.multi_source;

  return Math.min(150, score);
}

export function getQualityTier(score: number): 'emerging' | 'rising' | 'winning' | 'viral' {
  if (score >= 100) return 'viral';
  if (score >= 80) return 'winning';
  if (score >= 60) return 'rising';
  return 'emerging';
}

export function buildDataSourcesArray(signals: Partial<SignalScores>): string[] {
  const sources: string[] = [];
  if (signals.tiktok_shop_bestseller || signals.tiktok_ad_top_performing || signals.tiktok_hashtag_viral) sources.push('tiktok');
  if (signals.meta_ad_30_days) sources.push('meta');
  if (signals.amazon_bsr_under_1000) sources.push('amazon');
  if (signals.aliexpress_choice || signals.aliexpress_orders_over_1000) sources.push('aliexpress');
  return sources;
}

// Quality filter — must pass ALL
export function passesQualityFilter(product: {
  rating?: number;
  price_usd?: number;
  title?: string;
  image_url?: string;
}): boolean {
  if (!product.title || product.title.length < 5) return false;
  if (!product.image_url || !product.image_url.includes('http')) return false;
  if (product.rating != null && product.rating > 0 && product.rating < 4.0) return false;
  const p = product.price_usd || 0;
  if (p < 1 || p > 100) return false;

  const blocked = ['phone case', 'charger cable', 'fidget spinner', 'adult', 'pharmaceutical', 'drug', 'tobacco', 'weapon', 'replica', 'knockoff'];
  const titleLower = product.title.toLowerCase();
  if (blocked.some(b => titleLower.includes(b))) return false;

  return true;
}
