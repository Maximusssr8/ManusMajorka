# Majorka — Project Memory

## Project
Majorka (majorka.io) — AliExpress dropshipping intelligence SaaS. AU-first, 7 markets.
Stack: React 19 + Vite + Tailwind v4 + Express + tRPC + Supabase + Vercel
Pricing: Builder $99/mo · Scale $199/mo AUD (live Stripe)
Goal: operator finds a winning product and makes their first sale in under 60 minutes.

## Key Files
- Landing page: client/src/pages/LandingPage.tsx (or similar)
- Nav: client/src/components/app/Nav.tsx
- Home: client/src/pages/app/Home.tsx
- Products: client/src/pages/app/Products.tsx
- Ads Studio: client/src/pages/app/AdsStudio.tsx
- Store Builder: client/src/pages/app/StoreBuilder.tsx
- Design tokens: client/src/lib/designTokens.ts
- Server routes: server/routes/products.ts, server/routes/ads.ts
- Server entry: server/index.ts
- CSS: client/src/index.css

## Design System (updated 2026-04-12)
- Bg: #080808 · Surface: #0d0d0d · Card: #0f0f0f · Raised: #111111 · Border: #1a1a1a
- Accent: #d4af37 (gold) — brand highlights, active states, sidebar
- CTA: #3B82F6 (electric blue) — primary action buttons (flat solid, no gradient)
- Text: #ededed primary · #888888 body · #555555 muted
- Fonts: Syne (display/headings) · DM Sans (body) · JetBrains Mono (numbers/code)
- Cards: bg-[#0f0f0f] border border-white/[0.08] rounded-lg (max 8px radius)
- Buttons: flat solid fill + subtle shadow. NEVER gradient. Primary = #3B82F6. Secondary = outline #1a1a1a.
- Score colours: ≥80 emerald #22c55e · ≥60 amber #f59e0b · <60 red #ef4444
- No purple/indigo/violet anywhere. No rounded-2xl/rounded-xl.
- Philosophy: Bloomberg terminal meets luxury product app. Data first. No gamification. Subtraction over addition.

## Database
Table: winning_products
Columns: id, product_title, category, price_aud, sold_count, winning_score, image_url, product_url, est_daily_revenue_aud, created_at
RLS: ENABLED — server always uses SERVICE_ROLE key, never anon key
Quality rules: sold_count > 0, image_url NOT NULL, price_aud > 0, title length >= 5
Current count: [UPDATE THIS AFTER EVERY SESSION]

## Supabase RLS Pattern
Server uses SERVICE_ROLE key. Client uses ANON key.
UUID cast fix: use ::text on both sides of policy comparisons.

## Standard Deploy Command
cd /Users/maximus/Projects/ManusMajorka && pnpm build && git add -A && git commit -m "msg" && vercel --prod --yes

## Navigation (current — do not add back removed pages)
INTELLIGENCE: Home, Products, Analytics, Creators
CREATE: Maya AI, Ads Studio, Ad Briefs, Store Builder
OPERATE: Alerts, TikTok Leaderboard, Competitor Spy (Soon), Revenue
ACCOUNT: Academy, API Keys, API Docs, Settings, Admin (gated)

## Removed Pages — Do NOT recreate
/app/radar · /app/niches · /app/market · /app/profit-calc
(radar/niches/market features live in Products tab now, profit calc lives in product detail panel)

## SessionStorage Keys (cross-page data passing)
majorka_instant_store → pre-fills Store Builder from Products page
majorka_ad_product → pre-fills Ads Studio from Products page

## localStorage Keys
majorka_lists_v1 → saved product collections
majorka_filters_v1 → persisted product filters
majorka_tracked_v1 → tracked products for alerts
majorka_onboarded → "1" means skip onboarding wizard

## Known Fixed Bugs (do not reintroduce)
- Timestamp float: always Math.floor(daysSince()) — shows "5d" never "5.258...d"
- Landing scroll void: section { opacity: 1 !important } — animations never start at opacity:0
- Hot products trend: cap percentage at +999% max, show "Insufficient data" if lastWeek < 10
- EST REV fallback: (sold_count/365) * price_aud * 30 when est_daily_revenue_aud is null
- Close button: min 44x44px hit area, calls setSelectedProduct(null)

## How to Check DB Count
SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env
curl -s "$SUPABASE_URL/rest/v1/winning_products?select=count" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Prefer: count=exact" -I | grep content-range

## Quality Rules
1. Never hardcode product data or statistics — always fetch from DB
2. pnpm build must pass 0 TypeScript errors before every commit
3. Never leave console.log in production code
4. Always route AliExpress images through the image proxy (CORS)
5. Read the relevant files FIRST before writing any code

## Anthropic API (for AI features)
Model for fast/cheap tasks: claude-haiku-4-5-20251001
Model for complex tasks: claude-sonnet-4-6
Key: ANTHROPIC_API_KEY in .env

## Session End Checklist
- [ ] pnpm build: 0 errors
- [ ] vercel --prod --yes deployed
- [ ] Update "Current count" in Database section above
- [ ] Note any new bugs found
