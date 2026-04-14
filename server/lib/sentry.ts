/**
 * Server-side Sentry wrapper for Majorka. Exports idempotent init +
 * no-op captureException / addBreadcrumb when `SENTRY_DSN` is absent.
 *
 * All server code should import from here rather than `@sentry/node` so
 * tests and local dev Just Work without a DSN configured.
 */
import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry(): boolean {
  if (initialized) return true;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || !dsn.startsWith('https://')) return false;
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0.05,
    sendDefaultPii: false,
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
    // swallow — observability must never break the request path
  }
}

export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  data?: Record<string, unknown>;
}): void {
  if (!initialized) return;
  try {
    Sentry.addBreadcrumb({
      category: breadcrumb.category ?? 'app',
      message: breadcrumb.message,
      level: breadcrumb.level ?? 'info',
      data: breadcrumb.data,
    });
  } catch {
    // swallow
  }
}

export { Sentry };
