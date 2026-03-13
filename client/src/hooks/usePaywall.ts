/**
 * usePaywall — A/B tested upgrade modal system.
 * Uses PostHog feature flags when available, falls back to deterministic hash.
 * Placements: product_research_limit, feature_locked_builder, feature_locked_scale, export_locked
 */
import { useState, useCallback } from "react";
import { capture, getFeatureFlag } from "@/lib/posthog";

export type PaywallVariant = "A" | "B";

function getVariant(): PaywallVariant {
  // Try PostHog feature flag first
  const flag = getFeatureFlag("paywall_variant");
  if (flag === "A" || flag === "B") return flag;

  // Deterministic fallback: hash a stable user identifier
  const userId = localStorage.getItem("majorka-auth");
  if (userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 2 === 0 ? "A" : "B";
  }

  // Random fallback
  return Math.random() > 0.5 ? "A" : "B";
}

export function usePaywall() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [placement, setPlacement] = useState("");
  const [variant, setVariant] = useState<PaywallVariant>("A");

  const triggerPaywall = useCallback((placementName: string, userTier: string = "free") => {
    const v = getVariant();
    setVariant(v);
    setPlacement(placementName);
    setShowPaywall(true);
    capture("upgrade_modal_shown", { trigger_feature: placementName, user_tier: userTier, variant: v });
  }, []);

  const dismissPaywall = useCallback(() => {
    capture("paywall_dismissed", { placement, variant });
    setShowPaywall(false);
  }, [placement, variant]);

  return {
    showPaywall,
    placement,
    variant,
    triggerPaywall,
    dismissPaywall,
  };
}
