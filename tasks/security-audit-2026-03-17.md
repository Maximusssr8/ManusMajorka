# Majorka Security Audit — 2026-03-17

## Summary
- **Critical**: 1 fixed, 1 requires manual action
- **High**: 3 fixed
- **Medium**: 2 fixed
- **Low/Informational**: 3 manual actions required

## Fixed (Code)

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | CRITICAL | `/api/internal/db-debug` exposed DATABASE_URL | Deleted endpoint |
| 2 | HIGH | Hardcoded migration secret in source code | Moved to env var `MIGRATION_SECRET` |
| 3 | HIGH | `/api/import-product` unauth'd — AI cost abuse | Added JWT auth check + rate limiting |
| 4 | HIGH | `/api/agent-log` GET readable by anyone | Restricted to localhost origin |
| 5 | MEDIUM | `/api/cron/refresh-trends` open to public | Added Vercel cron verification |
| 6 | MEDIUM | Missing Content-Security-Policy header | Added CSP to vercel.json |
| 7 | LOW | Pexels API key pattern in client bundle | Routed through server proxy |

## Manual Actions Required (Vercel Dashboard)

### CRITICAL — Remove unused sensitive env vars
Go to: https://vercel.com/idcboss123-6766/manus-majorka/settings/environment-variables

Remove these from Vercel (not needed by the app):
- `DATABASE_URL` — Direct postgres not used from Vercel (IPv6 fails); remove to reduce exposure
- `TELEGRAM_BOT_TOKEN` — Not used by Majorka app

### HIGH — Set CRON_SECRET in Vercel
Add env var: `CRON_SECRET` = [generate a strong random string, e.g. `openssl rand -hex 32`]
This prevents anyone from triggering the trend refresh cron manually.

### HIGH — Set MIGRATION_SECRET in Vercel
Add env var: `MIGRATION_SECRET` = [different strong random string]
Rotates away from the hardcoded `majorka-intel-2026` value.

## Informational / Already Good

- ✅ Security headers: X-Frame-Options, X-Content-Type-Options, XSS Protection, Referrer-Policy all set
- ✅ Stripe webhook signature verified (STRIPE_WEBHOOK_SECRET)
- ✅ requireSubscription middleware protects premium endpoints
- ✅ Rate limiting on website generation (10/hr per user)
- ✅ Input validation (Zod) on store builder + website generator
- ✅ SUPABASE_SERVICE_ROLE_KEY server-side only (not a VITE_ var)
- ✅ No SQL injection vectors (all queries via Supabase REST)
- ✅ Shopify OAuth state validation with HMAC

## Supabase RLS Status (manual verification needed)
Run in Supabase SQL Editor to verify:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

Tables that must have RLS enabled: user_subscriptions, generated_stores, shopify_connections, trend_signals

## Score
Before: 7/10 (security headers present, basic auth working)
After: 9/10 (critical endpoint removed, auth on all AI endpoints, CSP added)
Remaining gap: CRON_SECRET + MIGRATION_SECRET env vars (manual)
