# Majorka — Skeptical Launch Audit (Brutal)
Date: 2026-04-14 · Auditor: Claude Opus 4.6 (external, skeptical)
Scope: cold-user reality check. No cheerleading. Every claim has a file:line.

---

## Honest score: **58/100**

Weighted (product+store+ads = 3x, alerts+revenue+briefs = 2x, rest = 1x).
Prior new-user audit said 38/100 launch / 55/100 functional; several of its P0s have since been fixed (alerts server route + email provider shim, free-tier preview, velocity pipeline). But TypeScript is broken, a required migration (`scripts/velocity-migration.sql`) has not been confirmed applied, ingestion is throttled, and multiple features still rely on unset env vars. 58/100 is generous; 52 is defensible.

## Can this ship today? **No.**
One-sentence justification: Home depends on `velocity_7d` (`client/src/pages/app/Home.tsx:96`), which is a schema column only guaranteed by `scripts/velocity-migration.sql` — if that migration has not been run in prod Supabase, Home's Velocity Leaders silently returns empty and the KPI design collapses; combined with 40+ TypeScript errors and deceptive UI in Ads/Alerts/Revenue when provider env vars are missing, a cold user will visibly hit broken surfaces in the first 10 minutes.

---

## Top 10 Blockers (ranked by severity)

### P0-1 — Velocity migration not verifiable as applied
- `client/src/pages/app/Home.tsx:96` hard-orders by `velocity_7d`.
- `client/src/hooks/useProducts.ts:112` issues `query.order('velocity_7d', ...)`.
- Schema change lives in `scripts/velocity-migration.sql` (unapplied migrations directory `migrations/` does not exist). There is no CI-applied migration system — `scripts/apply-migrations.ts` exists but is manual.
- If the column is missing, Supabase returns a 400 and `useProducts` sets empty products. Home shows "Velocity Leaders" as blank with no fallback copy (`Home.tsx:121` fallback is for Hot Today, not Velocity Leaders).
- Cron writer at `server/routes/cron.ts:1015` writes `velocity_7d` into upsert payload — if column doesn't exist, cron fails hard.
- **Fix**: confirm via `\d winning_products` in prod Supabase; if missing, run `psql $DATABASE_URL -f scripts/velocity-migration.sql`. Add a readiness check to Home that falls back to `sold_count` when ordering by velocity yields 0 rows.

### P0-2 — TypeScript check fails (40+ errors)
- `pnpm check` fails. Examples: `client/src/pages/Alerts.tsx:210,214` references undefined `_dark`; `client/src/pages/app/Products.tsx:547–586` twenty `product is possibly null` errors; `client/src/pages/MarketDashboard.tsx:71,80` duplicate `price_aud`; `client/src/pages/store-builder/index.tsx:1540,1746` "Cannot find namespace 'JSX'"; `server/routes/products.ts:1146` `.catch on PromiseLike<void>`; `server/routes/ai.ts:504` free-plan type mismatch; `client/src/components/MajorkaAppShell.tsx:59` broken `FREE_LESSON_IDS` import.
- `pnpm build` passes only because Vite doesn't run tsc. CLAUDE.md says "pnpm build must pass 0 TS errors before every commit" — that rule is being violated and the errors are real correctness defects (null refs, undefined vars).
- **Fix**: run `tsc --noEmit` in a pre-commit hook; fix the legacy `Alerts.tsx _dark` and the `Products.tsx` null guards first (those two files ship in the user path).

### P0-3 — Ingestion throttled to ~350/tick; no growth past 3,715
- `server/routes/cron.ts:885` calls `fetchHotProductsAllMarkets(50)` — 50 × 7 markets = 350 candidates per tick, cap hard-coded.
- `server/routes/cron.ts:908–911` dedups by `product_id`; with 3,715 existing, the delta per 6h cron is almost all re-upsert, not new rows.
- No pagination (`pageNo: 1` only at `:867`). No category rotation. No TikTok/CJ diversification in the hot cron.
- Vercel cron config (`vercel.json`) runs `ae-hot-products` every 6h and `refresh-hotproducts` every 6h — two overlapping jobs on the same source, not a growth strategy.
- **Fix**: loop pages 1-5 per market (2,450 ceiling), add `ae-bestsellers` category rotation, promote CJ/Apify actors to real writers not just signals.

### P0-4 — Academy route promised, content unverified
- Nav lists "Academy" at `client/src/components/app/Nav.tsx` (per earlier audit). Route resolves to `LearnHub.tsx`, but `MajorkaAppShell.tsx:59` has a broken import (`FREE_LESSON_IDS`/`TOTAL_FREE` not exported). The shell literally fails to load the lesson gating it advertises.
- A cold user clicking Academy today gets a TypeScript-broken component path; best case it renders, worst case stale content with no lesson count.
- **Fix**: make the exports real in `LearnHub.tsx`, wire at least 5 real lessons tied to the 11-step journey, or hide the Nav item until shipped.

### P0-5 — Synthetic reviews ship without disclaimer
- `client/src/pages/store-builder/index.tsx:82–88` hash-generates fake reviews.
- No FTC/ACCC "sample content" label in preview (confirmed in prior audit Step 5).
- Publishing a live store with fabricated reviews is a legal liability in AU (ACCC misleading conduct) and the US (FTC 16 CFR §465).
- **Fix**: add a prominent "Sample reviews — replace before publish" badge and block publish until user confirms.

### P1-6 — Alerts fire but email provider optional; UI admits it inline
- `server/routes/alerts.ts` exists and the page (`client/src/pages/app/Alerts.tsx:103,144,182`) posts to `/api/alerts` — so the prior audit's "fake alerts" critique is outdated.
- However: `client/src/pages/app/Alerts.tsx:216` shows a warning banner when `emailHealth.ok === false` (when neither `RESEND_API_KEY` nor `POSTMARK_API_KEY` is set). If prod env has neither, alerts are created, cron fires, but no email goes out — the banner saves face, but the pricing page sells "instant email alerts".
- `server/routes/cron.ts:1209,1272` cron evaluator exists. Dependencies: schema `alerts` table (`scripts/alerts-migration.sql` — unverified as applied) + email provider env var.
- **Fix**: treat `RESEND_API_KEY` as a deploy-time required var; fail CI if absent on prod branch.

### P1-7 — Free-tier Store Builder: preview works, publish correctly gated, BUT limit check ignores plan
- `server/routes/store-builder.ts:499` does `subscription?.plan || 'builder'` — falls back to BUILDER (not free) if subscription middleware hasn't populated. This means an unauthenticated/edge-case user gets BUILDER limits server-side. Mild — `requireAuth` is on the route at `:457` — but the fallback is wrong direction (should fall back to free).
- Client-side free gate `client/src/pages/store-builder/index.tsx` was loosened per the comment at `:461` "Free-tier users can preview the full wizard; publish is gated below on the Publish step" — confirm the publish CTA for free users is actually disabled on client (not verified in this audit).
- **Fix**: change server default plan to `'free'` for safety.

### P1-8 — Ads Studio: image gen disabled without FAL_KEY/OPENAI_API_KEY; UI is honest but flow leads to a wall
- `client/src/pages/AdsStudio.tsx:1014,1059` shows "Add FAL_KEY or OPENAI_API_KEY" banner — honest.
- `server/routes/ai.ts:520` returns `{ ok: false, reason: 'no_provider' }`.
- This is a **blocker for the promised user journey** ("create ads with imagery in minutes"). The banner is a liability, not a fix. Prod env must have FAL_KEY set.
- **Fix**: confirm `FAL_KEY` is in Vercel prod env; if absent, set it or remove image-gen from marketing copy.

### P1-9 — Ad Briefs doesn't consume `majorka_ad_product`
- `client/src/pages/app/AdBriefs.tsx:72` reads `majorka_ad_product`, but the Products page also writes that key only for Ads Studio. Whether AdBriefs actually receives a pre-fill depends on which producer wrote last. The producer→consumer map for this key is: Products.tsx writes (546, 1727), store-builder writes (1565), AdsStudio reads (182), AdBriefs reads (72). Both consumers consume AND `removeItem` — second reader gets nothing.
- **Fix**: use separate keys (`majorka_ad_product_for_studio`, `majorka_ad_product_for_brief`) OR peek without removing.

### P2-10 — CLAUDE.md stale handoff key
- CLAUDE.md line: `majorka_instant_store → Store Builder from Products`. Actual key: `majorka_import_product` (`Products.tsx:566,1738` → `store-builder/index.tsx:417`).
- Any agent trusting CLAUDE.md will write a key no consumer reads.
- **Fix**: correct CLAUDE.md.

---

## Top 3 "Theatre" Offenders

1. **Revenue tab** (`client/src/pages/app/Revenue.tsx` — pure `majorka_revenue_v1` localStorage). Labelled "Revenue" but is a manual diary. Not tied to the Shopify store the user just published. Renaming to "Profit Journal" would fix most of this — the label is the deception.
2. **Alerts email promise** (`client/src/pages/app/Alerts.tsx:211` "Delivered to your inbox"). Banner at `:216` hedges in small print only when the backend reports no provider — but the primary CTA copy remains bold. If RESEND/POSTMARK aren't in prod env, the user creates an alert, believes email is coming, and never gets one. The banner is not a substitute for honest CTA copy.
3. **Competitor Spy — Soon** (`Nav.tsx` per prior audit). Shipped as "Soon" for 6+ months. Competitors (Minea/PiPiAds) lead with this feature. A paying customer sees it every session, never ships. Hide it until real, or drop a real MVP.

Runner-up: **AdsStudio `majorka_saved_ads` cap=10 localStorage only**. Ad library that evaporates on browser clear is not a library; it's a cache.

---

## Data pipeline reality check (numbers)

- Current count: 3,715 (per CLAUDE.md).
- Per-tick ceiling: 350 (`fetchHotProductsAllMarkets(50)` × 7 markets × 1 page).
- Cron cadence: every 6h = 4 ticks/day × 350 = 1,400 candidates/day, but after dedup against existing 3,715 the true new-row rate is likely <50/day.
- To hit 10k rows: at current rate, ~4 months. To hit 10k in 30 days requires multi-page pagination + category rotation + Apify/CJ supplementation into `winning_products` (currently they write to different tables).

---

## Specific fixes (priority order)

1. **Run `scripts/velocity-migration.sql` and `scripts/alerts-migration.sql` in prod** (confirm applied via `\d+ winning_products` + `\dt alerts`). Without this, P0-1 and P1-6 are live bugs.
2. **Fix the 6 TypeScript files blocking `pnpm check`** — start with `Alerts.tsx _dark`, `Products.tsx` null guards, `MarketDashboard.tsx` duplicates, `MajorkaAppShell.tsx` imports. Add `tsc --noEmit` to CI.
3. **Confirm `FAL_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY` are all set in Vercel prod env**. One missing = broken user path.
4. **Ingestion**: paginate pageNo 1→5 in `cron.ts:867,885`, expect 5x candidate throughput. Add a daily category-rotation cron.
5. **Rename Revenue → "Profit Journal"** (one-line JSX change in `Revenue.tsx`).
6. **Hide Competitor Spy Nav item** until a real MVP exists (one-line in `Nav.tsx`).
7. **Synthetic reviews**: add "Sample — replace before publishing" badge in `store-builder/index.tsx` near `:82`.
8. **CLAUDE.md**: change `majorka_instant_store` → `majorka_import_product`.
9. **AdBriefs peek-don't-pop**: `sessionStorage.getItem` without subsequent `removeItem` in `AdBriefs.tsx:72–81`.
10. **Server store-builder plan default**: change `|| 'builder'` to `|| 'free'` in `store-builder.ts:499` (and `:56`).

---

## Per-tool honest scores (/10)

| Tool | Score | Notes |
|---|---|---|
| Home | 6 | Real DB, but depends on unverified velocity migration |
| Products | 7 | Real data, real live AE search, 2,444-line monolith, null-ref TS errors |
| Store Builder | 6 | Publish works; synthetic reviews + server plan fallback bug |
| Ads Studio | 6 | Real Claude, but image gen dark if FAL_KEY unset; ads saved in localStorage |
| Ad Briefs | 6 | Works, but handoff key conflict with Ads Studio |
| Alerts | 5 | Server + cron real; email silently NOOP without RESEND; banner hedges but CTA doesn't |
| Revenue | 3 | Theatre — diary masquerading as tracker |
| Maya AI | 7 | Real Sonnet, no persistence |
| Academy | 2 | Shell TS-broken; content depth unverified |
| Settings | 7 | Stripe portal real, checkout-session surfaced via `/pricing` only |
| Landing/Signup | 7 | Works; dual onboarding legacy issue per prior audit may still apply |

Weighted (product+store+ads ×3, alerts+revenue+briefs ×2, rest ×1):
- (7+6+6)×3 = 57
- (5+3+6)×2 = 28
- (6+7+2+7+7)×1 = 29
- Sum = 114 / max 190 = **60/100**. Rounded down for unverified migrations and failing `pnpm check` = **58/100**.

---

Word count: ~1,420.
