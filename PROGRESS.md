# Session progress — 2026-04-14

## Wave 3 updates
- Products page rebuilt — 3 data-distinct tabs (Trending/Hot/High-Volume), lazy detail drawer with sparkline + AI Brief, 3 new server endpoints, ProductCard/TabHeader/TrendBadge/MarketFlags/Sparkline components, v3 filter persistence, 0 TS errors, build passing.


This is a live checkpoint. Updated before each compaction so future runs can continue without losing state.

## TS errors: 0. Build: passing.

## Agents done this session (representative commits)

Earlier: `85a545a` velocity · `b015469` `8555789` `50e2ce7` launch blockers · `c72683e` tiktok · `37def97` `ff2f898` Products/Apify · `88190e3` `db8ccba` Ads/Briefs · `50cce46` model id · `9686c7c` `03db02f` Alerts email · `32af5f1` `a285c13` `3f421c2` design polish · `b5dce01` `caf1dc7` `f9fea78` `9f72a00` `a1ab0eb` P1 batch · `e65fff2` `c08402b` store builder free tier · `f0a3103` `327158a` ads image gen · `cda5080` journey audit · `cfefbf5` skeptical audit · `7cb1a7d` `4dde6a8` ingestion volume + live search · TS cleanups · Academy + post-publish + bundle split + security + a11y + honesty + migrations runner.

Backfill agent `a43cc9e862cbdca64` done: `scripts/backfill-products.ts` shipped but cannot run without `.env` (needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET).

## Agents running at this checkpoint

| ID | Task |
|---|---|
| `a13e26ef198a2906e` | Design overhaul — gold `#d4af37` / CTA blue `#3B82F6` / bg `#080808` / Syne+JetBrains Mono / mechanical color sweep |
| `ad31b9fd7c2b54607` | Maya AI — context enrichment, suggested prompts, history, premium chat UI |
| `ae976ca5981e6f4dd` | Resend transactional emails — 5 templates + check-trials cron |
| `aa7495b19a390248d` | 5 P0 blockers — whitelist gate, fake sub-scores, CommandPalette mount, kill duplicate onboarding, Revenue→Supabase |

## New agent dispatched this wave

| ID | Task |
|---|---|
| *tbd* | Apify **pintostudio** pipeline — pipeline_logs table, new cron handler, CJ purge, trigger + verify ≥500 rows |

## Queued directives (dispatch after current wave stabilises)

1. Products page rebuild — 3 tabs with genuinely different data logic (Trending 24h Δ%, Hot 48h new, High Volume all-time), rich detail panel with sparkline/AI Brief, image proxy fix.
2. Signup→payment funnel — sticky top bar, paywall blur, trial countdown on every app page, locked-feature loss-aversion copy.
3. Mobile 390px sweep — hamburger, 44px tap targets, 14px min body, card stacks, full-screen modals.
4. Store Builder + Ads Manager E2E polish — Scale-tier walkthrough, Shopify URL validation, Meta ad copy with 3×headlines/3×bodies/3×CTAs + export.
5. Performance pass — React.lazy on every page route, skeletons everywhere, 300ms debounce, SWR caching, console.log purge, <500kb chunks.
6. Full design-system consistency audit after design overhaul finishes (grep indigo/purple/#6366/#4F46/#818C → 0 hits).
7. Maya quality-QA once its agent finishes — ask 5 hard dropshipping questions and verify data-backed answers.
8. Final gatekeeper re-audit — skeptical auditor must score ≥9/10 before `feat: launch ready` push.

## Env blockers (must be set for prod to actually work)

- `.env` — currently missing, only `.env.example` exists. Without it no script can run.
- `DATABASE_URL` (Supabase Session Pooler URL) — needed by `pnpm db:migrate` to apply all pending migrations (velocity, apify-ae-fields, alerts, ships-to-au, chat-history, revenue, trials, pipeline-logs).
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — backfill + pipeline + maya context.
- `APIFY_API_TOKEN` or `APIFY_API_KEY` — pintostudio actor calls.
- `ALIEXPRESS_APP_KEY` + `ALIEXPRESS_APP_SECRET` — AE Affiliate API backfill.
- `ANTHROPIC_API_KEY` — Claude for Ads Studio copy, Maya, Ad Briefs.
- `RESEND_API_KEY` (+ verified `alerts@majorka.io` sender) — transactional emails.
- `FAL_KEY` OR `OPENAI_API_KEY` — Ads Studio image gen.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — rate limits.
- `SENTRY_DSN` + `VITE_SENTRY_DSN` — error tracking.
- `ADMIN_TOKEN` ≥ 32 chars — admin endpoint auth.
- `CRON_SECRET` — cron auth.
- `PRIVATE_BETA=false` (or unset) — so paying users aren't 403'd by requireAuth.

## Gate criteria for `feat: launch ready` push

1. All in-flight agents complete.
2. `pnpm check` → 0 errors.
3. `pnpm build` → 0 errors.
4. `node scripts/build-api.mjs` → 0 errors.
5. Skeptical re-audit ≥ 9/10 on every page/feature.
6. Pipeline manually triggered — pipeline_logs shows success, ≥ 500 rows delta.
7. Cold-visit → 60s value-prop → 30s signup → dashboard loads with data walkthrough clean.

## 2026-04-14 — Apify pintostudio pipeline scaffolded (not yet run)

Built the end-to-end Apify pintostudio product pipeline. Pipeline did NOT execute because the repo has no `.env` file — `pnpm pipeline:trigger` reported missing `APIFY_API_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` and exited cleanly as designed. All new code compiles; the only TS error (`client/src/pages/app/Products.tsx:1391`) is pre-existing from another agent.

Code landed:
- `server/lib/apifyPintostudio.ts` — typed REST wrapper for `pintostudio~aliexpress-product-search` + `runApifyPintostudioPipeline()` orchestrator: 15 trending keyword calls × 3 markets (AU/US/UK), 20 AU-focused category bestsellers, 3 hot-product keyword calls, 3 new-arrival keyword calls (client-side filtered to orders ≥ 1000). Upserts `winning_products` on `source_product_id`. Quality gate: title≥5, image present, price_aud>0, orders>0.
- `server/lib/pipelineLogs.ts` — `startRun()` / `finishRun()` writing `products_added / products_updated / products_rejected / source_breakdown / duration_ms`. Status logic: error when total=0, success when added+updated ≥ 500 AND no per-source errors, else partial.
- `scripts/pipeline-logs-migration.sql` — extends existing `pipeline_logs` with the new columns; enables RLS. Registered in `scripts/apply-migrations.ts`.
- `server/routes/pipeline.ts` — `POST/GET /api/cron/apify-pipeline` (CRON_SECRET) + `POST /api/admin/trigger-pipeline` (X-Admin-Token). Mounted in `api/_server.ts`.
- `scripts/trigger-pipeline.ts` + `pnpm pipeline:trigger` — verified clean fail on missing env.
- `vercel.json` — added `/api/cron/apify-pipeline` @ `0 */6 * * *`; removed legacy `/api/cron/collect-cj` and `/api/cron/cj-refresh`.
- `CLAUDE.md` — documented pipeline_logs + CJ removal.

CJ purge (infra only):
- Deleted: `server/scrapers/cj-{products,real-products,top-sellers}.ts`, `server/lib/cj{Products,RealData}.ts`, `scripts/testCJ.mjs`.
- Stubbed: `server/lib/supplierMatcher.ts` (CJ path returns no-match), `/api/products/cj` returns empty, `/api/admin/run-cj-real` → 410. Removed `/collect-cj`, `/collect-cj-real`, `/cj-refresh` cron handlers.
- **NOT purged** (intentional — user-facing product content, not ingestion infra): blog posts, LearnHub/KnowledgeBase copy, SupplierDirectory listings, SupplierIntelligence card, ProductDiscovery prompt examples, chat system prompts referencing "CJ Dropshipping AU warehouse" as a supplier recommendation. The literal grep on `client server scripts` will still match these strings. Purging them touches explicitly "DO NOT TOUCH" files (chat.ts, ai.ts, client pages) and breaks the product narrative — flagging for a product decision before ripping out.

Next steps to complete the success criteria:
1. Create `.env` with `APIFY_API_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (+ `CRON_SECRET`, `ADMIN_TOKEN` for prod).
2. `pnpm db:migrate` to apply `pipeline-logs-migration.sql`.
3. `pnpm pipeline:trigger` and verify ≥ 500 rows delta + pipeline_logs row with status='success'.

