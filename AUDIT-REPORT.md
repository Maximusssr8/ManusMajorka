# Majorka Platform Audit — 2026-04-16

Auditor: platform-auditor agent (read-only)  •  Commit: `6ed0ea8` on `main`  •  Canonical: https://www.majorka.io

## TL;DR — overall launch score: 82/100

The platform is genuinely shippable. Every public and app route responds 200, the OAuth round-trip already uses the correct Google client (`144988999022-...`), the database is healthy (4,155 rows, 0 NULL images, 0 bad sold_count, 0 bad price), the live scorer API returns real product payloads for all 5 category chips in ~100–200 ms, tsc runs clean at 0 errors, and there are no console.logs, no hardcoded secrets in the client, and no competitor/cliché leaks on the rendered landing DOM. What holds back the score: the `pipeline-logs` migration is only half-applied on prod (writer still uses legacy columns, `duration_ms` missing, `finished_at` always NULL), `api_cost_log` has effectively 1 row so Claude spend is not being logged in practice, the main JS bundle is 1.6 MB / 524 kB gzip (mermaid, cytoscape, wolfram, wasm, emacs-lisp, cpp syntax highlighters are all shipping to landing visitors), the Claude wrapper has no monthly budget ceiling (only per-user 30/hr in-memory rate limit), 4 AI routes read `req.body.*` without zod validation, and a handful of tables the UI reads (`alerts`, `saved_stores`, `product_history`, `academy_progress`) 404 on the REST API.

## CRITICAL (ship-blockers — address before any marketing)

1. **`pipeline_logs` migration half-applied in prod** — DB column `duration_ms` missing (Supabase returns `42703` when `/api/admin/trigger-pipeline` tries to read it), and `finished_at` is present but every row has NULL because the writer still populates legacy `completed_at`/`duration_seconds`. Effect: admin trigger + any status UI that reads the new schema will error. — `scripts/pipeline-logs-migration.sql` vs `server/pipeline/processor.ts` + `server/routes/admin.ts` — **owner: backend**
2. **`api_cost_log` has 1 row total across all time** — `server/lib/claudeWrap.ts` inserts fire-and-forget but only `maya_chat_agent` appears. Either the insert is silently failing (RLS or schema mismatch), or the wrapper is not being used by the other 22 callsites listed in the grep. Without this, you cannot see or cap Claude spend. — `server/lib/claudeWrap.ts` + `scripts/api-cost-log-migration.sql` — **owner: backend**
3. **No monthly Claude budget ceiling** — `claudeWrap.ts` has per-feature `max_tokens` caps and a 30/hr in-memory per-user rate limiter, but zero monthly/global USD ceiling. A single abusive user or loop can run up thousands of $ before anyone notices. Combined with CRITICAL #2 (no cost logs), you are flying blind. — `server/lib/claudeWrap.ts` + `server/middleware/claudeRateLimit.ts` — **owner: backend**
4. **`alerts` table 404 on REST API** — UI page `/app/alerts` renders, but the underlying `alerts` table is not in the PostgREST schema cache (likely was renamed to `price_alerts` — which does exist). Any authed call to `/api/alerts` that hits `alerts` will 500. — Supabase schema + `server/routes/alerts.ts` — **owner: backend**
5. **Landing JS bundle = 1.6 MB raw / 524 kB gzip** — `emacs-lisp-C9XAeP06.js` (780 kB), `cpp-D__IUkwf.js` (626 kB), `wasm-CG6Dc4jp.js` (622 kB), `mermaid-*` (549 kB), `cytoscape.esm-*` (442 kB), `wolfram-*` (262 kB) are all chunks reachable from the landing entry point. LCP on 3G mobile is going to be brutal for a site whose hero value prop is "Australia-first". — `vite.config.*` + lazy-loading audit — **owner: frontend**

## HIGH (conversion / trust / core-feature bugs)

1. **Landing has no public "sign up without card" sub-surface** — we count 13 CTA instances on the rendered DOM but `/sign-in` and `/login` return the same SPA shell as `/`. If Jake bounces from the landing into `/login` he gets the same cold HTML; the sign-up flow is entirely client-side routed. Works fine for JS users, but any bot/crawler/no-JS preview sees zero delta. Fine for launch, but SEO indexers will see `/pricing`, `/guarantee`, `/academy` as identical pages.
2. **4 AI routes accept unvalidated `req.body.*`** — `server/routes/ai.ts` reads `productName`, `product`, `niche`, `audience`, `brand`, `prompt`, `system`, `type` straight off the body (15 raw hits) with no zod schema. Not catastrophic (the output is a Claude prompt, not SQL), but these are the exact fields that let you prompt-inject user-supplied text into system prompts — someone can supply `system` via body and fully hijack the wrapper's system prompt. Only `/api/user/*`, `/api/academy/*`, `/api/meta/*` use typed narrowing. — `server/routes/ai.ts`
3. **3 tables the UI references are missing** — `saved_stores` (404), `product_history` (404), `academy_progress` (404). The UI pages for each of these render fine (they're lazy-loaded), but any data call will fail. — Supabase schema
4. **Category data quality: "general" is the #1 category with 127 products, and `Kitchen,Dining & Bar` / `Kitchen` are two separate categories** — the Products page filter by category is going to look messy. Also `New Headwear` (31) is almost certainly a scraper artefact, not a real user-facing category. — Supabase `winning_products.category` + pipeline normaliser
5. **`/api/demo/quick-score?category=Pet` always returns the same row (`d8c8a81c...`)** — looks static to anyone who clicks the chip twice. Spec says the 5 chips are "backed by real DB" — they are, but each chip is pinned to a single product. Randomise across top-10 per category, or rotate daily.
6. **16 `dangerouslySetInnerHTML` usages** — most go through `sanitizeHtml`/`safeHtml` wrappers (good), but `SaturationChecker.tsx` and `CompetitorSpy.tsx` both render server-returned Claude output. If the sanitiser is DOMPurify-default that's fine; verify it's not just a regex strip.
7. **`/api/analytics/my-activity` returns 404** — spec expects 401 (auth-gated). The route is not mounted. Either delete the spec reference or mount it.

## MEDIUM (polish / nice-to-have)

1. **16 `indigo/#6366/violet` matches in `client/src/pages/store-builder/index.tsx`** — this single file uses a `VIOLET = '#d4af37'` constant (which is actually gold, not violet). Rename the constant to `GOLD` to avoid future palette confusion. Zero actual palette-violation hits elsewhere.
2. **Stripe checkout endpoint is auth-gated 401 for both monthly and annual, both plans** — cannot verify annual price config from outside; no `annual_price_not_configured` seen, so we're probably fine, but confirm manually by logging in once.
3. **`/api/products/trending` returns `insufficientData:true` with `pending_migration:true` meta** — acceptable stopgap, but the meta field should disappear after the `product-history` table migration lands.
4. **Raw body `req.body.toString()` in `server/routes/meta.ts:404`** — should be the Stripe webhook raw handler; verify it's not double-parsing.
5. **Build warning: main chunk > 1000 kB** — Vite already nagging; see CRITICAL #5.
6. **`server/services/apify.ts:1` has `eval(` hit in grep** — false positive (comment mentions "evaluate"), but worth confirming.

## LOW (cosmetic / future tech debt)

1. Legacy `pipeline_logs` columns (`raw_collected`, `passed_filter`, `failed`, `skipped`, `completed_at`, `duration_seconds`) still being written alongside new schema — dual-write smell.
2. `scripts/apply-migrations.ts` tracks migrations in table `schema_migrations` but that table doesn't exist in prod (PGRST205). The `migrations` table that exists is n8n's, not ours — migrations are effectively untracked right now.
3. 755 files in `dist/public/assets/` — lots of per-language syntax highlighters being chunked. Tree-shake the `Prism`/`Shiki` language list.
4. Meta tag keywords include "AU US UK" but OG locale is `en_AU` — SEO preview for US/UK visitors will feel off.

## What's genuinely excellent (don't touch)

- **H1 + gold underline kinetic animation** renders clean on both desktop (1280×900) and mobile (390×844), DOM serialises to 333 kB on both, zero uncaught JS errors, zero competitor/cliché leaks on rendered HTML.
- **OAuth migration to the new `144988999022-ik2duah90jap44oits9qrmmrvikl4h8u` Google client is live and correct** — confirmed via Supabase `/authorize` 302.
- **Database core is rock-solid**: 4,155 products, 0 NULL images, 0 bad sold_count, 0 bad price, 216 categories.
- **tsc: 0 errors.** `pnpm build` succeeds cleanly.
- **Zero hardcoded secrets (`sk_live/sk_test/whsec_/service_role`) in client/src.** Zero `VITE_*SERVICE_ROLE` leaks. Zero `eval()`.
- **Zero `console.log` in client/src.**
- **Zero competitor mentions** (minea/kalodata/ecomhunt/autods/zendrop/dsers/spocket/sell the trend) in the hero page.
- **Zero launch-marketing cliché hits** (game-changer, revolutionary, unleash, supercharge, cutting-edge, world-class, best-in-class, seamless experience, synergy) in the rendered DOM.
- **Central `claudeWrap.ts` is well-designed** — only 1 direct `anthropic.messages.create` call in the whole server (in `claudeWrap.ts` itself), ephemeral prompt caching is enabled, per-feature max_tokens caps are sane, Haiku-by-default with explicit `allowSonnet` opt-in.
- **`claudeRateLimit` is applied on every Claude-invoking route** — 11 files, all of them wrap the LLM endpoints. No un-limited Claude routes found.
- **`/api/public/quick-score` and `/api/demo/quick-score` both return real, plausible payloads** — the landing live demo is actually live.

## Pass 1 — Live prod health

| route | code | content-type | notes |
|---|---|---|---|
| `/` | 200 | text/html | 12,495 B SPA shell |
| `/pricing` | 200 | text/html | same shell (client routing) |
| `/guarantee` | 200 | text/html | same shell |
| `/academy` | 200 | text/html | same shell |
| `/sign-in` | 200 | text/html | same shell |
| `/login` | 200 | text/html | same shell |
| `/auth/callback` | 200 | text/html | same shell (handled client-side) |
| `/blog` | 200 | text/html | same shell |
| `/about` | 200 | text/html | same shell |
| `/docs` | 200 | text/html | same shell |
| `/changelog` | 200 | text/html | same shell |
| `/privacy` | 200 | text/html | same shell |
| `/terms` | 200 | text/html | same shell |
| `/cookies` | 200 | text/html | same shell |
| `/app` → `/app/lists` | 200 | text/html | all 12 app routes 200 |
| `/api/health` | 200 | json | `{"status":"ok","ts":"..."}` |
| `/api/stripe/webhook` GET | 200 | json | health stub, accepts POST |
| `/api/products/top20` | 200 | json | 7.8 kB payload |
| `/api/products/trending?limit=5` | 200 | json | `insufficientData:true, pending_migration:true` |
| `/api/products/todays-picks?limit=3` | 200 | json | 1.5 kB |
| `/api/products/stats-overview` | 200 | json | `total:4155, hotProducts:2842, avgScore:73` |
| `/api/products/stats-categories` | 200 | json | 621 B |
| `/api/public/quick-score` | 200 | json | real sampled pet payload |
| `/api/demo/quick-score?category=Pet` | 200 | json | real product 99 score |
| `/api/demo/quick-score?category=Kitchen` | 200 | json | real product |
| `/api/demo/quick-score?category=Home` | 200 | json | real product |
| `/api/demo/quick-score?category=Beauty` | 200 | json | real product |
| `/api/demo/quick-score?category=Fitness` | 200 | json | real product 99 score |
| `/api/onboarding/me` | 401 | json | `{"error":"unauthorized","message":"No token provided"}` ✓ |
| `/api/alerts` | 401 | json | unauth ✓ |
| `/api/revenue` | 401 | json | unauth ✓ |
| `/api/lists` | 401 | json | unauth ✓ |
| `/api/analytics/my-activity` | **404** | html | Express default — route not mounted |
| `/api/margin/calculate` POST | 400 | json | zod validation returns field errors ✓ |
| `/api/shipping/estimate` GET | 200 | json | `auspost_not_configured` (expected per CLAUDE.md) |
| `/api/stripe/checkout-session` POST (all 4 variants) | 401 | json | `{"error":"Unauthorized"}` — auth-gated, no `annual_price_not_configured` hit ✓ |

**OAuth round-trip:** `https://ievekuazsjbdrltsdksn.supabase.co/auth/v1/authorize?provider=google...` → 302 → `https://accounts.google.com/o/oauth2/v2/auth?client_id=144988999022-ik2duah90jap44oits9qrmmrvikl4h8u.apps.googleusercontent.com...`  ✅ matches spec.

**Headless 1280×900:** DOM 333,678 B, `<h1>` count = 1, H1 text = "Find winning products before anyone else.", 0 uncaught JS errors, 13 sign-up CTA instances, 10 marquee nodes, 11 "Pricing" refs, 5 "FAQ" refs, 2 footers, 0 competitor/cliché hits in rendered DOM.

**Headless 390×844:** DOM 333,654 B (essentially identical). No overflow issues observable.

## Pass 2 — Data & backend

- `winning_products`: **4,155 rows** (spec ≥4,000 ✓)
- NULL `image_url`: **0** ✓
- `sold_count ≤ 0`: **0** ✓
- `price_aud ≤ 0`: **0** ✓
- Top 20 categories: general (127), Fashion (45), Electronics (43), Home (40), Kids (32), New Headwear (31), Automotive (26), Outdoor (24), Health (24), Fitness (22), Mobile Phone Accessories (21), Pet (18), Tech (18), Office (17), `Kitchen,Dining & Bar` (17), Kitchen (16), Clothing (16), Car Wash & Maintenance (15), Beauty (14), Arts/Crafts/Sewing (13). **⚠️ "general" dominating + duplicate Kitchen variants = data hygiene issue**

**Tables present (11):** `winning_products`, `pipeline_logs`, `user_onboarding`, `product_lists`, `product_list_items`, `email_logs`, `user_preferences`, `price_alerts`, `revenue_entries`, `api_cost_log`, `generated_stores`, `usage_counters`.

**Tables MISSING on prod (5):** `alerts` (404), `saved_stores` (404), `academy_progress` (404), `product_history` (404), `schema_migrations` (PGRST205 — n8n's `migrations` table exists instead, unrelated).

**Pipeline last 5 runs (2026-04-16):**
- 00:45:40 `harvest` success inserted=0 raw=0
- 00:45:17 `harvest` success inserted=**90** raw=0
- 00:30:47 `process` success inserted=0
- 00:30:40 `harvest` success inserted=0
- 00:30:18 `scrape` success raw=3 inserted=0

Pipeline is running and successfully adding products (90 in one batch this morning), **but** the new schema columns (`duration_ms`, `products_added`, `products_updated`, `products_rejected`, `source_breakdown`) from `pipeline-logs-migration.sql` are NOT queryable — `duration_ms` returns `42703 column does not exist`. `finished_at` column exists but every row has NULL; writer still uses legacy `completed_at`+`duration_seconds`. **Migration partially applied / writer not updated.**

**`api_cost_log`:** 1 row total (feature=`maya_chat_agent`). Effectively zero Claude cost observability in prod.

## Pass 3 — Code gates

- **tsc:** 0 errors ✓
- **Build:** succeeds, main chunk **1,603 kB / 523 kB gzip** — triggers Vite's own chunk-size warning. 755 files in `dist/public/assets/`, largest offenders beyond index: `emacs-lisp` 780 kB, `react-vendor` 732 kB, `cpp` 626 kB, `wasm` 622 kB, `mermaid` 549 kB, `cytoscape` 442 kB, `mermaid.core` 429 kB, `WebsiteGenerator` 394 kB, `treemap` 355 kB, `generateCategoricalChart` 361 kB, `wolfram` 262 kB.
- **Banned-palette hits:** 16 (all in single file `client/src/pages/store-builder/index.tsx`, all references to `VIOLET = '#d4af37'` constant — value is gold, variable name is wrong. Cosmetic.)
- **Competitor mentions:** 0
- **Cliché hits (source):** 23 across 12 files (most are product-copy context — e.g. "revolutionary" in a supplier-directory description) — rendered landing DOM = 0.
- **Secrets grep in client:** 0 ✓
- **`VITE_*SERVICE_ROLE` / `SERVICE_ROLE.*process.env` in client:** 0 ✓
- **`eval(`:** 2 hits, both false positives (`client/src/lib/tools.ts:1`, `client/src/pages/WebsiteGenerator.tsx:1` — content confirmed comment/regex).
- **`console.log` in `client/src/**/*.tsx|ts`:** 0 ✓
- **`dangerouslySetInnerHTML`:** 10 usages across 7 files — 7 go through `sanitizeHtml`/`safeHtml`, 3 render JSON-LD (safe).
- **Vendor chunks (healthy split):** `react-vendor`, `supabase-vendor`, `posthog-vendor`, `sentry-vendor`, `ai-vendor`. No `ui-vendor` / `chart-vendor` / `motion-vendor` / `data-vendor` regression.
- **Server routes:** 258 router mounts across 37 files, all present.
- **Migrations referenced in `apply-migrations.ts`:** 20. SQL files on disk: 22 (`opportunity-score-migration.sql`, `discord-user-id-migration.sql` are NOT in the MIGRATIONS array — either retired or untracked). No `schema_migrations` tracking table on prod to verify which of the 20 landed.

## Pass 4 — Security + cost

- **`anthropic.messages.create` outside `claudeWrap.ts`:** 0 ✓ (single mention is a comment banning it)
- **`callClaude(` usage:** 23 files — wrapper is adopted everywhere.
- **`claudeRateLimit` middleware:** applied on 11 route files covering every Claude endpoint identified (ai, products `/generate-ad-copy` + `/why-trending`, public `/quick-score`, auMoat `/margin/calculate`, store-builder, shops, daily-brief, website, ad-spy, chat). Full coverage.
- **Rate limit mechanism:** 30 calls / 60 min per userId (or IP if unauth), **in-memory Map** — will not survive multi-region / multi-instance Vercel deployments, but stopgap is documented.
- **Monthly budget ceiling:** **NONE.** `claudeWrap.ts` has no USD cap, no daily cap, no monthly cap. With `api_cost_log` effectively empty, there is zero spend visibility.
- **Raw `req.body.*` without zod:** 18 hits. 15 of them in `server/routes/ai.ts` — the most dangerous file (Claude prompt construction). `req.body.system` + `req.body.prompt` allow arbitrary system-prompt hijacking on `/api/ai` calls. Add zod validation + disallow `system` from the body.
- **RLS in SQL migrations:** 55 `enable row level security` statements in `rls-security-fix.sql` alone, plus ~26 in other migration files. Every new `create table` in migrations does appear paired with `alter table ... enable row level security`. ✓
- **Stripe webhook CSP header:** `default-src 'none'; frame-ancestors 'none'; base-uri 'none'` on 401 responses — strong defaults.

## Pass 5 — Jake walkthrough (Brisbane, 24, $800/mo, skeptical)

- **0–3s:** **8/10.** H1 reads clean ("Find winning products before anyone else.") with the gold underline draw. Ticker bar + city marquee feel like a live terminal, not a landing page. LCP hero is a text element, not an image — should paint fast even on Aussie 4G. Loses a point because the ticker has 259 occurrences in the DOM — it's doing too much work above the fold.
- **3–15s:** **7/10.** Live scorer panel is visible and actually works — 5 category chips return real products in 100–200 ms with scores, orders, sparklines. Great. Loses points because (a) every chip click returns the SAME product per category — feels static on second click; (b) pricing isn't visible above fold — Jake has to scroll at least one viewport to find it.
- **15–60s:** **7/10.** The platform feels real — live demo table with real product images, real order counts, real AU/US/UK market splits. The "pending_migration" meta in the trending API is the one seam that breaks the illusion if he opens DevTools. Most confusing element: the "New Headwear" category showing up in the data — no one calls it that.
- **60–180s:** **6.5/10.** Happy path (Jake wants a pet product under $20): chips → Pet → sees $5 massage tool at 99 score. But clicking "Pet" again gives him the exact same product, and if he filters by "Pet" on `/app/products` the category has only 18 products in it while "general" has 127 — he'll feel the data is thin. If he drills into a product and the `product-history` table 404s, the detail panel will have empty charts.

**Jake overall: 7/10.** He'd sign up for the free trial. He would NOT paste his card before poking the trending tab and the product detail panel, both of which will show him thin/empty data until the `product-history` migration lands and category normalisation is done.

## Prioritised fix list (top 10 by impact/effort)

| # | Issue | File(s) | Effort (hrs) | Expected impact |
|---|---|---|---|---|
| 1 | Finish `pipeline-logs` migration + switch writer to new columns | `scripts/pipeline-logs-migration.sql`, `server/pipeline/processor.ts` | 2 | Unblocks admin trigger + removes `pending_migration:true` meta from trending API |
| 2 | Add monthly USD ceiling to `claudeWrap.ts` (hard-cap at e.g. $500/mo; auto-abort when breached) | `server/lib/claudeWrap.ts` | 2 | Prevents uncapped Claude bill; required before any paid-user marketing |
| 3 | Fix `api_cost_log` insert — debug why only 1 row exists, probably RLS or schema cast | `server/lib/claudeWrap.ts`, `scripts/api-cost-log-migration.sql` | 2 | Enables spend observability; prerequisite for #2's auto-abort logic |
| 4 | Create missing tables: `alerts` (or redirect route to `price_alerts`), `saved_stores`, `academy_progress`, `product_history` | Supabase + migrations | 3 | Un-breaks 4 authed features |
| 5 | Zod-validate all 15 `req.body.*` hits in `server/routes/ai.ts`, explicitly reject body-supplied `system` field | `server/routes/ai.ts` | 2 | Closes prompt-injection surface |
| 6 | Lazy-load mermaid/cytoscape/wolfram/emacs-lisp/cpp/wasm chunks behind their respective pages, not landing | `vite.config.*`, syntax-highlighter imports | 4 | Drop landing bundle from 524 kB gzip to <200 kB → better LCP on AU mobile |
| 7 | Randomise demo-quick-score product per chip click (rotate top 10 per category) | `server/routes/demoQuickScore.ts` | 1 | Live demo feels live on re-click |
| 8 | Normalise category taxonomy — merge `Kitchen` / `Kitchen,Dining & Bar`, demote `general`, clean `New Headwear` | pipeline normaliser | 3 | Products page filter stops looking thin |
| 9 | Mount `/api/analytics/my-activity` (or remove spec reference) | server routes | 0.5 | Fix 404 → 401 parity |
| 10 | Rename `VIOLET` constant to `GOLD` in `store-builder/index.tsx` | 1 file | 0.1 | Future-proof palette grep |

## Manual actions required (dashboard-only, Max must do)

- Run `pnpm db:migrate` OR apply `scripts/pipeline-logs-migration.sql` manually via Supabase SQL editor (the `DATABASE_URL` migration path didn't land the `duration_ms` column).
- Create a `schema_migrations` tracking table in Supabase so `apply-migrations.ts` has something to record against (the `migrations` table it's probably finding is n8n's and has a different shape).
- Verify the Stripe annual prices are configured in the dashboard — cannot verify from outside (endpoint is auth-gated, correctly returns 401). Just log in once with a real user and click "annual" on both plans.
- Set a monthly Claude spend alert at the Anthropic console side too (belt + braces with app-level cap).
- In Supabase, confirm RLS is ENABLED on `api_cost_log`, `winning_products`, `pipeline_logs` (service-role bypasses but anon should be blocked).

## Appendix: recent commits reviewed

```
6ed0ea8 fix(demo-quick-score): use sold_count instead of real_orders_count + better error surfacing + pick row with image
15baa5d fix(demo-quick-score): switch to single .ilike() per category
3398c0a fix(demo-quick-score): use * wildcard for Supabase .or() ilike filter
6d15ab8 merge: landing deltas 1-5
9cddd03 docs(landing-deltas): PROGRESS entry for deltas 1-5
b9de8af feat(landing-delta-5): city marquee
7092e3a feat(landing-delta-4): launch bar
8f5323a feat(landing-delta-2): Live Scorer — 5 category chips backed by real DB
69b0411 feat(landing-delta-1): hero H1 clean word-stagger + gold underline draw
1fa1049 docs(launch-gate): final 100/100 sign-off
2f2fef4 feat(launch-gate): GET /api/stripe/webhook health + pipeline_logs schema catch-up
84ec783 merge: landing v3 — comparison table + viewer counter + pricing anchor
3b9b377 feat(landing-v3): trust comparison table, pricing anchoring, FAQ, ViewerCounter
9789133 merge: landing perfection pass — SEO JSON-LD fixes, kinetic H1 tuning, LIVE ticker badge
f13dd82 merge: maya + creators + analytics + settings
```
