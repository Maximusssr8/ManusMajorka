/**
 * Error tracking — uses Sentry if DSN is configured, otherwise console.error.
 * Add VITE_SENTRY_DSN to .env to enable Sentry.
 */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.error('[ErrorTracker]', err, context);
    return;
  }
  import('@sentry/react').then(Sentry => {
    Sentry.captureException(err, { extra: context });
  }).catch(() => console.error('[ErrorTracker]', err));
}

export function initErrorTracking(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  import('@sentry/react').then(Sentry => {
    Sentry.init({
      dsn,
      environment: import.meta.env.PROD ? 'production' : 'development',
      tracesSampleRate: 0.1,
    });
  }).catch(() => {});
}
