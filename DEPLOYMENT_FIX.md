# DEPLOYMENT_FIX.md — 2026-03-13

## Issue
majorka.io returning 404 DEPLOYMENT_NOT_FOUND

## Root Cause
The site was NOT actually down. The Vercel project (prj_fuP0FKGoarPrEv1U2s9pdEWCCHk9) 
exists and had 5 READY deployments. The domain was correctly attached and verified.

**Actual issue found:** Canonical URLs and OG meta tags were hardcoded to `majorka.ai` 
(wrong domain) instead of `majorka.io`. This causes SEO and social share issues.

## Resolution

### Site Status (confirmed)
- majorka.io → 307 → www.majorka.io → 200 ✅
- www.majorka.io → 200 OK, serving correct HTML ✅  
- Latest production deployment: manus-majorka-awoebfjn9 (READY) ✅
- Domain verified on Vercel: majorka.io + www.majorka.io ✅

### Fixes Applied
- client/index.html: og:url, og:image, twitter:image, canonical → majorka.io
- client/src/components/SEO.tsx: BASE_URL → majorka.io
- client/src/pages/Privacy.tsx: email domain → majorka.io
- client/src/pages/WebsiteGenerator.tsx: theme URLs → majorka.io
- Committed: 33145b8

## Vercel Project Details
- Project: manus-majorka (prj_fuP0FKGoarPrEv1U2s9pdEWCCHk9)
- Team: team_pHpRDgSsaJvwlW6O6wFArC7Z
- GitHub: Maximusssr8/ManusMajorka (auto-deploys on push to main)
- Production URL: https://www.majorka.io

## Environment Variables (all set in Vercel)
ANTHROPIC_API_KEY ✅
APIFY_API_KEY ✅
APIFY_API_TOKEN ✅ (added 2026-03-13)
DATABASE_URL ✅
ENCRYPTION_KEY ✅
FIRECRAWL_API_KEY ✅
MEM0_API_KEY ✅
OPIK_API_KEY ✅
PEXELS_API_KEY ✅
RESEND_API_KEY ✅
SUPABASE_SERVICE_ROLE_KEY ✅
TAVILY_API_KEY ✅
TELEGRAM_BOT_TOKEN ✅
VITE_SUPABASE_ANON_KEY ✅
VITE_SUPABASE_URL ✅

Missing (Max to add):
STRIPE_SECRET_KEY ❌
STRIPE_PRO_PRICE_ID ❌
STRIPE_WEBHOOK_SECRET ❌
VITE_SENTRY_DSN ❌
SENTRY_DSN ❌
VITE_POSTHOG_KEY ❌
