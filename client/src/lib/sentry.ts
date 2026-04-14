/**
 * Client-side Sentry init for Majorka. No-op when VITE_SENTRY_DSN is absent
 * or invalid so local dev and preview builds never surface "Invalid DSN"
 * console errors.
 */
import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry(): boolean {
  if (initialized) return true;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string' || !dsn.startsWith('https://') || dsn === 'pending') {
    return false;
  }
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
    beforeSend(event) {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return null;
      return event;
    },
  });
  initialized = true;
  return true;
}

export function isSentryEnabled(): boolean {
  return initialized;
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  try {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    // swallow
  }
}

export { Sentry };
