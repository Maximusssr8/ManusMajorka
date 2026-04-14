/**
 * Production security headers middleware for the Majorka API.
 *
 * CSP is owned by `vercel.json` for the HTML shell (it applies to the static
 * client). On API responses we emit a strict, JSON-friendly CSP so even if
 * an error page is rendered the response cannot be framed / script-executed.
 *
 * CORS is already handled in `api/_server.ts` — we do NOT touch
 * `Access-Control-*` headers here.
 */
import type { Request, Response, NextFunction } from 'express';

const MIN_ADMIN_TOKEN_LENGTH = 32;
let warnedAboutAdminToken = false;

/**
 * Log a warning once at cold start if the admin token is weak / missing.
 * Intentionally uses console.warn (not a logger) so it surfaces in Vercel
 * runtime logs without a dependency on a structured logger.
 */
export function warnIfWeakAdminToken(): void {
  if (warnedAboutAdminToken) return;
  warnedAboutAdminToken = true;
  const token = process.env.ADMIN_TOKEN ?? '';
  if (!token) {
    console.warn('[security] ADMIN_TOKEN is not set — admin endpoints are unprotected');
    return;
  }
  if (token.length < MIN_ADMIN_TOKEN_LENGTH) {
    console.warn(
      `[security] ADMIN_TOKEN is ${token.length} chars — rotate to >= ${MIN_ADMIN_TOKEN_LENGTH} chars`
    );
  }
}

/**
 * Express middleware: apply strict security headers to every API response.
 *
 * Headers are idempotent — setting them twice is harmless. Does NOT
 * override CORS or rate-limit headers.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com"), usb=(), interest-cohort=()'
  );
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  );
  res.removeHeader('X-Powered-By');
  next();
}
