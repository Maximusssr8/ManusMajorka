# Majorka — Ready to Launch Checklist
_Last updated: 2026-03-17_

## MUST HAVE — Blocking Launch

- [ ] **Stripe live mode** — `STRIPE_SECRET_KEY` starts with `sk_live_` in Vercel
- [ ] **Stripe live publishable key** — `STRIPE_PUBLISHABLE_KEY` starts with `pk_live_`
- [ ] **Stripe webhook registered** — endpoint at `https://majorka.io/api/stripe/webhook` in Stripe dashboard
- [ ] **Stripe webhook verified** — at least 1 test event processed successfully (use "Test" in Stripe dashboard)
- [ ] **`user_subscriptions` table created** in Supabase (manual SQL — see tasks/stripe-checklist.md)
- [ ] **`generated_stores` table created** in Supabase
- [ ] **`user_onboarding` table created** in Supabase
- [ ] **End-to-end payment test** — complete a $1 test payment, verify access unlocked
- [ ] **No JavaScript console errors** on /app for a logged-in user
- [ ] **Mobile usable** — test on iPhone SE (375px width): no horizontal scroll, all buttons tappable
- [ ] **Error boundary active** — visit a broken URL, confirm branded error screen shows
- [ ] **Rate limiting confirmed** — 10 req/hr on /api/website/generate

## SHOULD HAVE — Fix Within 48 Hours of Launch

- [ ] **Sentry error tracking** — `SENTRY_DSN` set in Vercel, errors routing to dashboard
- [ ] **Actual winning product data** — replace seed data with scraped/curated real AU products
- [ ] **Email confirmation** — Supabase auth emails customised with Majorka branding
- [ ] **Terms of Service + Privacy Policy** — linked in footer, referenced in Stripe checkout
- [ ] **/api/health** responding correctly with `stripe: "live"` in production
- [ ] **Domain email** — transactional emails from `hello@majorka.io` not Supabase default

## NICE TO HAVE — Post-Launch

- [ ] **Shopify app Partners submission**
- [ ] **Scale plan price ID** (`STRIPE_SCALE_PRICE_ID`) for $149 AUD tier
- [ ] **Real product images** — replace Pexels seed images with product-specific ones
- [ ] **Affiliate / referral system**
- [ ] **Analytics** — PostHog or Plausible for product analytics
- [ ] **Uptime monitoring** — UptimeRobot or Better Stack watching /api/health

## Current Score
- Launch Readiness: 86/100 (estimated after all code tasks complete)
- Remaining gap (14pts): Stripe live (5), real product data (3), Sentry (2), email branding (2), Scale plan (2)

## Deploy Info
- Vercel project: `prj_fuP0FKGoarPrEv1U2s9pdEWCCHk9`
- Production URL: `https://majorka.io`
- Stripe webhook URL: `https://majorka.io/api/stripe/webhook`
- Supabase SQL Editor: `https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new`
