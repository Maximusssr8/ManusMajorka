/**
 * Analytics helpers — thin wrappers around PostHog for consistent event tracking.
 */

import { getAttributionFlat } from '@/lib/attribution';
import { capture, identifyUser } from '@/lib/posthog';

/** Track a named event with optional properties */
export function track(event: string, props?: Record<string, any>) {
  capture(event, props);
}

/** Identify authenticated user with traits */
export function identify(userId: string, traits: Record<string, any>) {
  identifyUser(userId, traits);
}

/** Track tool_used event — call when a chat request is fired */
export function trackToolUsed(toolName: string, market?: string) {
  capture('tool_used', { toolName, market });
}

/** Track signup with UTM attribution */
export function trackSignup(method: string) {
  const attrs = getAttributionFlat();
  capture('signup', { method, ...attrs });
}

/** Track login */
export function trackLogin(method: string) {
  capture('login', { method });
}

/** Track upgrade button click */
export function trackUpgradeClicked(props?: Record<string, any>) {
  capture('upgrade_clicked', props);
}

/** Track market change */
export function trackMarketChanged(from: string, to: string) {
  capture('market_changed', { from, to });
}

/** Track website generated */
export function trackWebsiteGenerated(props?: Record<string, any>) {
  capture('website_generated', props);
}

/** Track demo usage */
export function trackDemoUsed(feature: string) {
  capture('demo_used', { feature });
}

/** Track email capture (e.g. newsletter, lead form) */
export function trackEmailCaptured(source: string) {
  capture('email_captured', { source });
}
