export const PLAN_LIMITS = {
  builder: {
    productsTracked: 500,
    storesAllowed: 3,
    aiBriefsPerMonth: 50,
    reportsPerMonth: 20,
    productSearchPerDay: 200,
    apifyScansPerDay: 0,
    exportRowsPerRequest: 500,
    savedFilters: 5,
    teamMembers: 1,
  },
  scale: {
    productsTracked: -1,
    storesAllowed: -1,
    aiBriefsPerMonth: -1,
    reportsPerMonth: -1,
    productSearchPerDay: 1000,
    apifyScansPerDay: 3,
    exportRowsPerRequest: 5000,
    savedFilters: -1,
    teamMembers: 5,
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
export type LimitKey = keyof typeof PLAN_LIMITS['builder'];

export function getLimit(plan: PlanName, key: LimitKey): number {
  return PLAN_LIMITS[plan][key];
}

export function isUnlimited(plan: PlanName, key: LimitKey): boolean {
  return PLAN_LIMITS[plan][key] === -1;
}

export function checkLimit(plan: PlanName, key: LimitKey, currentUsage: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
} {
  const limit = getLimit(plan, key);
  if (limit === -1) return { allowed: true, limit: -1, remaining: -1 };
  return {
    allowed: currentUsage < limit,
    limit,
    remaining: Math.max(0, limit - currentUsage),
  };
}
