export const PLANS = ['builder', 'scale'] as const;
export type Plan = typeof PLANS[number];

export const PLAN_LIMITS: Record<Plan, Record<string, number>> = {
  builder: {
    product_searches:    50,
    video_searches:      50,
    ad_intel:            50,
    creator_searches:    50,
    shop_spy:            5,
    store_builder:       3,   // max stores (not monthly)
    alerts:              5,   // max alerts (not monthly)
    ads_studio:          20,
  },
  scale: {
    product_searches:    999999,
    video_searches:      999999,
    ad_intel:            999999,
    creator_searches:    999999,
    shop_spy:            999999,
    store_builder:       999999,
    alerts:              999999,
    ads_studio:          999999,
  },
};

export const SCALE_ONLY_FEATURES = ['niche_signals', 'api_access', 'priority_support'] as const;

export function isScaleOnly(feature: string): boolean {
  return (SCALE_ONLY_FEATURES as readonly string[]).includes(feature);
}

export function getPlanLimit(plan: Plan, feature: string): number {
  return PLAN_LIMITS[plan]?.[feature] ?? 0;
}

export function isUnlimited(plan: Plan, feature: string): boolean {
  return getPlanLimit(plan, feature) >= 999999;
}
