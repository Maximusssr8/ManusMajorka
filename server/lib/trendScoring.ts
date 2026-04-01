export interface TrendSignal {
  source: 'tiktok_shop' | 'aliexpress' | 'cj' | 'google_trends' | 'tiktok_creative';
  orders?: number;
  isTikTokShopTrending?: boolean;
  isCJTopSeller?: boolean;
  isGoogleBreakout?: boolean;
  isTikTokAd?: boolean;
  adCtr?: number;
  rating?: number;
  priceUsd?: number;
  costUsd?: number;
  crossSources?: number;
}

export function calculateTrendScore(signal: TrendSignal): {
  score: number;
  breakdown: { demand: number; quality: number; margin: number };
  tier: 'hot' | 'rising' | 'steady' | 'weak';
} {
  let demand = 0;
  let quality = 0;
  let margin = 0;

  // DEMAND (50 pts max)
  if (signal.isTikTokShopTrending) demand = Math.max(demand, 50);
  if (signal.orders) {
    if (signal.orders > 10000) demand = Math.max(demand, 40);
    else if (signal.orders > 1000) demand = Math.max(demand, 30);
    else if (signal.orders > 100) demand = Math.max(demand, 20);
    else if (signal.orders > 10) demand = Math.max(demand, 10);
  }
  if (signal.isCJTopSeller) demand = Math.max(demand, 25);
  if (signal.isGoogleBreakout) demand = Math.max(demand, 30);
  if (signal.isTikTokAd && (signal.adCtr || 0) > 0.02) demand = Math.max(demand, 25);
  // Multi-source bonus
  if ((signal.crossSources || 1) >= 2) demand = Math.min(50, demand + 20);

  // QUALITY (30 pts max)
  const r = signal.rating || 0;
  if (r >= 4.7) quality = 30;
  else if (r >= 4.3) quality = 20;
  else if (r >= 4.0) quality = 15;
  else quality = 10; // unknown = 10, never penalise lack of rating

  // MARGIN (20 pts max)
  const p = signal.priceUsd || 0;
  const c = signal.costUsd || (p * 0.35);
  const marginPct = p > 0 ? (p - c) / p : 0;
  if (marginPct >= 0.65 && p >= 15) margin = 20;
  else if (marginPct >= 0.50 && p >= 10) margin = 15;
  else margin = 10;

  const score = Math.min(100, demand + quality + margin);
  const tier = score >= 80 ? 'hot' : score >= 65 ? 'rising' : score >= 50 ? 'steady' : 'weak';
  return { score, breakdown: { demand, quality, margin }, tier };
}

export function inferTrend(signal: TrendSignal): string {
  if (signal.isTikTokShopTrending || signal.isGoogleBreakout) return 'Exploding';
  if ((signal.orders || 0) > 1000 || signal.isTikTokAd) return 'Rising';
  if (signal.isCJTopSeller || (signal.orders || 0) > 100) return 'Steady';
  return 'Steady';
}

export function signalBadges(signal: TrendSignal): string[] {
  const badges: string[] = [];
  if (signal.isTikTokShopTrending) badges.push('TikTok Shop Trending');
  if (signal.isTikTokAd) badges.push('TikTok Top Ad');
  if ((signal.orders || 0) > 0) badges.push(`${signal.orders!.toLocaleString()} orders`);
  if (signal.isCJTopSeller) badges.push('CJ Best Seller');
  if (signal.isGoogleBreakout) badges.push('Google Breakout');
  if ((signal.crossSources || 1) >= 2) badges.push('Multi-Platform');
  return badges;
}
