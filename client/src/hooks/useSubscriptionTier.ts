import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

export type Tier = 'free' | 'builder' | 'scale';
export type SubscriptionStatus =
  | 'anonymous'
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export interface SubscriptionTierState {
  tier: Tier;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  daysRemaining: number | null;
  hoursRemaining: number | null;
  loading: boolean;
  isFeatureUnlocked: (feature: FeatureKey) => boolean;
  refetch: () => void;
}

/**
 * FEATURE_GATES — declarative map of features to the MINIMUM tier that unlocks them.
 * Used by LockedTeaser, UpgradeCTA, and any gating logic across the app.
 */
export const FEATURE_GATES = {
  'ads.image-gen': 'scale',
  'ads.brief-full': 'scale',
  'creators.matrix': 'scale',
  'academy.track-2': 'scale',
  'academy.track-3': 'scale',
  'alerts.unlimited': 'scale',
  'spy.competitor-matrix': 'scale',
  'products.export': 'builder',
  'store-builder.unlimited': 'scale',
} as const;

export type FeatureKey = keyof typeof FEATURE_GATES;

const TIER_ORDER: Record<Tier, number> = { free: 0, builder: 1, scale: 2 };

interface ApiSubscriptionResponse {
  plan?: string;
  status?: string;
  subscribed?: boolean;
  trial_ends_at?: string | null;
  trialEndsAt?: string | null;
  current_period_end?: string | null;
}

interface CacheEntry {
  at: number;
  data: ApiSubscriptionResponse | null;
}

const CACHE_TTL_MS = 60_000;
let cache: CacheEntry | null = null;

function normalizeTier(plan: string | undefined): Tier {
  const p = (plan ?? '').toLowerCase();
  if (p.includes('scale')) return 'scale';
  if (p.includes('builder') || p.includes('pro')) return 'builder';
  return 'free';
}

function normalizeStatus(raw: string | undefined, subscribed: boolean | undefined): SubscriptionStatus {
  const s = (raw ?? '').toLowerCase();
  if (s === 'trialing' || s === 'trial') return 'trialing';
  if (s === 'active') return 'active';
  if (s === 'past_due') return 'past_due';
  if (s === 'canceled' || s === 'cancelled') return 'canceled';
  if (s === 'expired') return 'expired';
  if (subscribed) return 'active';
  return 'free';
}

/**
 * useSubscriptionTier — single source of truth for tier + trial state.
 * Cached in-memory for 60s across components.
 */
export function useSubscriptionTier(): SubscriptionTierState {
  const { session } = useAuth();
  const [data, setData] = useState<ApiSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const token = session?.access_token ?? null;

  const load = (): void => {
    if (!token) {
      setData(null);
      setLoading(false);
      return;
    }
    const now = Date.now();
    if (cache && now - cache.at < CACHE_TTL_MS) {
      setData(cache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/subscription/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ApiSubscriptionResponse | null) => {
        cache = { at: Date.now(), data: d };
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Refetch on tab focus so a user returning from Stripe Checkout sees
  // their new tier within seconds without a manual refresh.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFocus = (): void => {
      cache = null;
      load();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Also refetch immediately when the app mounts with ?upgraded=true
  // (post-Stripe redirect target).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      cache = null;
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const tier: Tier = token ? normalizeTier(data?.plan) : 'free';
  const status: SubscriptionStatus = token
    ? normalizeStatus(data?.status, data?.subscribed)
    : 'anonymous';

  const trialEndsAtRaw = data?.trial_ends_at ?? data?.trialEndsAt ?? null;
  const trialEndsAt = trialEndsAtRaw ? new Date(trialEndsAtRaw) : null;

  let daysRemaining: number | null = null;
  let hoursRemaining: number | null = null;
  if (trialEndsAt) {
    const diffMs = trialEndsAt.getTime() - Date.now();
    if (diffMs > 0) {
      daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    } else {
      daysRemaining = 0;
      hoursRemaining = 0;
    }
  }

  const isFeatureUnlocked = (feature: FeatureKey): boolean => {
    const required = FEATURE_GATES[feature];
    if (!required) return true;
    return TIER_ORDER[tier] >= TIER_ORDER[required as Tier];
  };

  return {
    tier,
    status,
    trialEndsAt,
    daysRemaining,
    hoursRemaining,
    loading,
    isFeatureUnlocked,
    refetch: () => {
      cache = null;
      load();
    },
  };
}
