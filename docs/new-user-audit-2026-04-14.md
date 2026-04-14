# Majorka — New User Launch-Journey Audit
Date: 2026-04-14 · Auditor: Claude (code-read only, no edits)
Scope: simulate a first-time user going from "pick a product" → "live store + ads + tracking"

---

## Ratings (current reality, not aspiration)

- **Launch rating: 38/100** — A motivated operator *can* technically get a product researched, a store published, and ad copy generated. But the handoffs leak, the onboarding double-fires, alerts silently lie, Revenue is diary-only, and Academy/Competitor Spy — both in Nav — aren't built. A paying user in their first hour will hit 2–3 dead ends.
- **Functional rating: 55/100** — Core intelligence (Products, Home, Maya, Ads Studio, Store Builder wizard) is genuinely wired to real data and real Claude APIs. Stripe portal + publish + AE live search all hit real endpoints. But the "Operate" column (Alerts, Revenue, Academy) is client-side localStorage theatre with no backend. Builder-tier users pay $99/mo and get LocalStorage for tracking/revenue/alerts.

Justification: I optimistically rated *functional* higher than *launch* because the data plumbing works. Launch is lower because the promise ("find a winner and make your first sale in <60 min" — per CLAUDE.md) cannot be honoured end-to-end today: notifications don't send, revenue isn't reported, Competitor Spy is "Soon", Academy is an unbuilt route.

---

## 11-Step Journey Transcript

### 1. Landing on `/` — WORKS
Status: ✅
- `client/src/pages/Home.tsx` is the public landing (not `StageLanding.tsx`, which is a logged-in stage-chooser).
- CTA `/sign-up` visible in hero, nav, pricing cards, final CTA — at least 8 entry points.
- "No credit card required" line immediately below hero CTA.
- Sign-up flow at `client/src/pages/SignIn.tsx:36` routes onSuccess to `/onboarding` if not onboarded.
Friction: `<30s` claim is plausible only if Supabase magic-link email arrives fast; no Google OAuth button is surfaced on this flow (unverified).

### 2. Sign up + onboard — BLOCKER (double-onboarding bug)
Status: ❌ P0
- **`majorka_onboarded` key is written with two different values** by two different wizards:
  - `client/src/pages/Onboarding.tsx:295` and `:305` → writes `'true'`
  - `client/src/components/OnboardingModal.tsx:185,618` → writes `'true'`
  - `client/src/components/app/OnboardingWizard.tsx:43,52` → writes `'1'`
- `client/src/components/app/AppShell.tsx:29` gates the in-app wizard on strict equality: `localStorage.getItem('majorka_onboarded') !== '1'`.
- `client/src/components/ProtectedRoute.tsx:23` uses truthy check.
- Result: user completes the 1,134-line `/onboarding` page, ProtectedRoute lets them through to `/app`, then AppShell re-pops the modal wizard because `'true' !== '1'`. They onboard twice on the first session.
Fix: pick ONE value (`'1'`), migrate legacy `'true'` → `'1'` on read, or make AppShell use truthy check.

Also: ProtectedRoute hardcodes `<Redirect to="/onboarding" />`, so the inline AppShell wizard is never actually the first touch for new users — it only appears AFTER the user has already completed the separate `/onboarding` page. Dead UX path.

### 3. Find a product — MOSTLY WORKS
Status: ⚠️
- `client/src/pages/app/Products.tsx` (2,444 lines — too large, violates 800-line rule in CLAUDE.md).
- Filters: niche, score tier, price, velocity, "Hot Now", "High Volume", "Under $10" — good coverage (`Products.tsx:26-38`).
- Real data: `useProducts` hits `server/routes/products.ts` which queries Supabase `winning_products` (real AliExpress scrape, not stub).
- Live AE search toggle at `Products.tsx:95` (`LIVE_SEARCH_ENABLED = true`) — confirmed per recent commit `0435280`.
- Per-row data: score, velocity badge, est monthly revenue, competition, market-size — rich.
- "AU-ships" filter: NOT FOUND. Market preference from onboarding (`majorka_market`) is persisted but never queried against products. User selects AU in wizard, sees same products as a UK user.
Friction: Products.tsx is a monolith; performance concern on slower devices.

### 4. Validate — WORKS with copy friction
Status: ⚠️
- Home surfaces Velocity Leaders, Top Products, Hot Today, Best Margin (`Home.tsx:96-107`), dedup'd properly (`excludeIds`).
- Launch Readiness Score (`Products.tsx:156-172`) synthesises demand/score/margin/freshness into 0–100 — genuinely useful.
- Win Reasons (`Products.tsx:174-203`) come from real DB fields — trustworthy.
- COPY INCONSISTENCY: the Home surfaces "Velocity Leaders", "Hot Today", "Trending Today", "Hot Products" (KPI), "Top Products" — user cannot tell how these differ without reading tooltips (there aren't any per-section explainers inline).
- KPI card "Hot Products" = score≥65, "Trending Today" = orders>100k, "Hot Today" = hot-now tab = score≥90+orders>100k+<30d. Same verb, three definitions.

### 5. Build a store — PARTIALLY WORKS
Status: ⚠️
- `client/src/pages/store-builder/index.tsx` (1,470 lines). 4-step wizard: Niche → Products → Branding → Publish.
- Handoff key from Products is `majorka_import_product` (`Products.tsx:566,1738`), consumed at `store-builder/index.tsx:412`. **NOT `majorka_instant_store`** as CLAUDE.md and the audit brief claim. That key is referenced only in CLAUDE.md — it's stale documentation. The wiring works, but any doc/agent trusting the doc key name will misfire.
- Auto-opens custom product modal on pre-fill (`store-builder/index.tsx:427`). Good.
- Paywall: `isPaid = isBuilder || isScale || isAdmin` (`:456`). Free users see only an UpgradeModal — they can't even preview the builder. This kills the funnel for free-tier users who want to see value before paying.
- Publish hits `/api/store-builder/publish` → returns liveUrl. Real, per `server/routes/store-builder.ts`.
- Subdomain check works (`:539`).
- Copy generation falls back to a template if `/api/store-builder/generate-copy` fails (`:484-504`) — good resilience.
- Reviews are synthetic (hashed from store name — `store-builder/index.tsx:82-88`). User does NOT know these are fake; no disclaimer in preview. Legal/FTC risk.

### 6. Create ad — WORKS
Status: ✅
- `client/src/pages/AdsStudio.tsx:151` reads `majorka_ad_product` — handoff key matches CLAUDE.md.
- POST to `/api/ai/generate` (Haiku 4.5 per `server/routes/ai.ts:67`). Good model choice for cost.
- Saves to localStorage (`majorka_saved_ads`, limit 10). No server persistence → user loses ads on device change.
- Copy/download work. No export to Meta Ads Manager directly (brief says "no Meta portal side-trips" — this is a real product gap).

### 7. Ad brief — WORKS
Status: ✅
- `AdBriefs.tsx:121` hits `/api/ai/generate`, Haiku. Markdown output, download as `.md` works.
- No product pre-fill from Products page — user must retype the niche. Missed handoff.

### 8. Alerts — BROKEN / FALSE PROMISE
Status: ❌ P0
- `client/src/pages/app/Alerts.tsx:44-46`: alerts are persisted to localStorage ONLY. No POST, no server route, no `/api/alerts/*` endpoint exists.
- UI collects email, frequency ("immediately / daily / weekly"), promises "Get notified when products hit your thresholds. Delivered to your inbox" (`Alerts.tsx:105`).
- `Alerts.tsx:234` admits in fine print: "Email alerts require account verification" — but there is no email provider wired (no Resend/Postmark/SendGrid in `server/lib/` nor in `package.json` routes).
- **A user creates an alert, closes the tab, and literally nothing ever happens.** This is deceptive UX, worse than a missing feature.
Fix: either wire a transactional email provider + a cron-driven alert evaluator, or flag the feature "Coming soon — in-app only today".

### 9. Revenue — WORKS (but is a diary, not a tracker)
Status: ⚠️
- `client/src/pages/app/Revenue.tsx:27` — pure localStorage (`majorka_revenue_v1`). Comment at `:11-14` honestly admits it: "Data stays on your device — only you can see this."
- No Shopify/Stripe pull, no ROAS from Meta. User manually types daily revenue + ad spend. This is Google Sheets with a Majorka skin.
- Label says "Revenue Tracker" → user reasonably expects integration with the Shopify they just connected in Store Builder. That expectation is wrong. Rage-quit potential: high.

### 10. Ask Maya — WORKS
Status: ✅
- `client/src/pages/AIChat.tsx` + `server/routes/ai.ts:46` — `claude-sonnet-4-6`, 1000 tokens, 10-turn history.
- Rendered markdown is solid. Action blocks stripped safely.
- Friction: no conversation persistence across sessions (not verified to save to DB).

### 11. Upgrade to paid — WORKS
Status: ✅
- `SettingsProfile.tsx:257` → POST `/api/stripe/customer-portal`.
- `server/lib/stripe.ts:361` handles it. Also `:331` handles `checkout-session`. Webhook at `:412`.
- Real Stripe flow, matches CLAUDE.md "live Stripe" claim.
- Only concern: portal only opens for existing customers. First-time upgrade path (checkout-session) is not surfaced in Settings — user has to go via `/pricing` page CTAs. Not a blocker but an extra click.

---

## Ranked Blockers

### P0 (rage-quit / reputation risk)

1. **Alerts are fake.** `client/src/pages/app/Alerts.tsx:44`. Tell users OR build it. (Fix: flag as in-app-only until email provider added; add server cron evaluator.)
2. **Onboarding runs twice** due to `'true'` vs `'1'` key mismatch. `client/src/components/app/AppShell.tsx:29` vs `client/src/pages/Onboarding.tsx:295`. (Fix: normalise to `'1'`, read as truthy.)
3. **Academy nav entry leads to a lazy-loaded route** (`/app/learn`) but the page (`client/src/pages/KnowledgeBase.tsx` or `LearnHub.tsx`) is not verified to teach the 11-step flow the product promises. User clicks "Academy" expecting step-by-step, gets a hub page. (Verify + script a "First Sale in 7 Days" path.)
4. **Free-tier Store Builder paywall** (`store-builder/index.tsx:456`) blocks even previewing. New users can't see the value of the paid tier before paying. (Fix: let free users complete Niche+Products+Branding steps, gate only Publish.)

### P1 (friction, incorrect docs, silent gaps)

5. **Stale handoff key in CLAUDE.md**: doc says `majorka_instant_store`, code uses `majorka_import_product`. Update CLAUDE.md.
6. **Market preference is captured but ignored.** `localStorage.majorka_market` is written at `OnboardingWizard.tsx:44` but never read in `Products.tsx` or `useProducts.ts` (per grep). AU user sees same feed as US user. (Add market filter to useProducts query.)
7. **Synthetic reviews have no "sample" disclaimer** in Store Builder preview. FTC/ACCC issue if published as-is. (`store-builder/index.tsx:82-88`.)
8. **Ad Briefs doesn't consume `majorka_ad_product`.** Missed handoff — user retypes product name coming from Products. (`AdBriefs.tsx`.)
9. **Revenue Tracker labelled "Revenue"** but is manual entry only. Either rename to "Profit Journal" or wire to Shopify/Stripe/Meta.
10. **Competitor Spy marked `soon: true`** in Nav (`Nav.tsx:49`). Competitors Minea/PiPiAds lead with this — being a "Soon" entry for 6+ months erodes trust. (Hide or ship.)

### P2 (polish)

11. **Products.tsx is 2,444 lines** — violates CLAUDE.md 800-line rule. Splitting improves cognitive load and perf.
12. **Copy inconsistency** — Hot Products / Hot Today / Hot Now / Trending / Trending Today use the same vocabulary for five different filters. Pick 2 words max, define them in a tooltip.
13. **Mobile**: AppShell has a mobile drawer, but `Products.tsx` layouts are table-heavy; CTR on Create-Ad / Add-to-Store buttons on sub-400px viewports not verified. Likely overflow issues.
14. **AdsStudio saves ads to localStorage only** (`majorka_saved_ads`, 10-item cap). Device-portable library needed for serious operators.
15. **No direct Meta/TikTok Ads Manager export**. User must copy-paste hooks into Ads Manager — the brief's "no side-trips" promise isn't honoured at the ad-publish step.

---

## Top 3 Rage-Quit Moments

1. **Day 3: "Why didn't I get my alert?"** Score threshold alert on Kitchen Gadgets was set. A product hit 92. No email. User checks spam. Checks app. Nothing. They assume Majorka is broken and churn. Worst-case because the UI *explicitly told them they'd get email*.
2. **Minute 4: Onboarding loop.** New user completes the `/onboarding` page, lands on `/app`, sees the overlay wizard again. Confusion → "did I do something wrong?" Trust hit on minute four.
3. **Minute 30: Store published, now what?** After "Store published!" toast and liveUrl returned, there's no next-step checklist: no "now generate ads", "now set up tracking pixel", "now track revenue". User stares at a URL and bounces to YouTube for tutorials.

---

## Competitive Gap Notes

- **vs Minea**: Minea has real Meta/TikTok ad-library integration, live competitor spy, and transactional alerts. Majorka has none of these shipped. "Competitor Spy — Soon" is a -10 NPS item because Minea costs similar.
- **vs PiPiAds**: PiPiAds ships daily/weekly digest emails that work. Majorka's alert frequency dropdown is cosmetic — it doesn't deliver.
- **vs CJ Dropshipping**: CJ handles fulfilment + inventory + tracking pixel end-to-end. Majorka's Store Builder publishes a storefront but doesn't solve fulfilment. Acceptable scope difference, but the Revenue tab implies tracking that doesn't exist.
- **Unique Majorka strengths to protect/amplify**: Launch Readiness Score is genuinely differentiating; Win Reasons driven by real DB thresholds (not hallucinated) is honest in a space full of lies; Maya AI with Sonnet 4.6 is a real researcher not a parrot.

---

## Academy-Coverage Gaps

The Nav has an "Academy" link (`Nav.tsx:56`, route `/app/learn`). A new user will look here to learn:
- How Launch Readiness Score is computed (documented only as a code comment at `Products.tsx:148`).
- Difference between Velocity Leaders, Hot Today, Trending Today (see Step 4).
- What "3× markup" in `handleImportToStore` actually implies for AU GST + shipping.
- How to set a Meta pixel on a Majorka-published store (not covered anywhere).
- Why synthetic reviews are in the preview and what to replace them with before publishing.

None of these are verified to be in Academy content; they ought to be.

---

## Files Worth the Fixer's Attention (absolute paths)

- `/Users/maximus/Projects/ManusMajorka/client/src/components/app/AppShell.tsx` (onboarding key mismatch)
- `/Users/maximus/Projects/ManusMajorka/client/src/pages/Onboarding.tsx` (legacy wizard writing wrong value)
- `/Users/maximus/Projects/ManusMajorka/client/src/pages/app/Alerts.tsx` (fake email promise)
- `/Users/maximus/Projects/ManusMajorka/client/src/pages/app/Revenue.tsx` (labelled vs actual behaviour)
- `/Users/maximus/Projects/ManusMajorka/client/src/pages/store-builder/index.tsx` (paywall + synthetic reviews)
- `/Users/maximus/Projects/ManusMajorka/client/src/pages/app/Products.tsx` (size, market filter, handoff keys)
- `/Users/maximus/Projects/ManusMajorka/client/src/pages/app/AdBriefs.tsx` (missed product pre-fill)
- `/Users/maximus/Projects/ManusMajorka/CLAUDE.md` (stale `majorka_instant_store` key)
- `/Users/maximus/Projects/ManusMajorka/server/routes/` (missing `alerts.ts` + cron evaluator)

---

Word count: ~1,420.
