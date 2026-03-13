/**
 * PostHog analytics — initialisation, identification, and event helpers.
 * Reads VITE_POSTHOG_KEY and VITE_POSTHOG_HOST from env.
 */
import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || "https://us.i.posthog.com";

let initialised = false;

export function initPostHog() {
  if (initialised || !POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
    // Session replay
    session_recording: { maskAllInputs: false, maskInputOptions: { password: true } },
  });
  initialised = true;
}

/** Identify logged-in user with profile traits */
export function identifyUser(userId: string, traits: Record<string, any>) {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, traits);
}

/** Reset identity on logout */
export function resetUser() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

/** Capture a named event with properties */
export function capture(event: string, properties?: Record<string, any>) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

/** Check a feature flag value */
export function getFeatureFlag(flag: string): boolean | string | undefined {
  if (!POSTHOG_KEY) return undefined;
  return posthog.getFeatureFlag(flag) as boolean | string | undefined;
}

/** Check if a boolean flag is enabled */
export function isFeatureEnabled(flag: string): boolean {
  if (!POSTHOG_KEY) return false;
  return posthog.isFeatureEnabled(flag) ?? false;
}

// Re-export posthog instance for advanced usage
export { posthog };
