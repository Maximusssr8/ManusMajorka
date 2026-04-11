# Majorka vs KaloData vs Minea — Competitive Edge Plan

> Session date: 2026-04-11. Goal: ship concrete feature gaps until Majorka has clear parity + AU-native edge over KaloData and Minea.

## Competitor feature matrix

| Capability | KaloData | Minea | Majorka (before) | Majorka (after this session) |
|---|---|---|---|---|
| TikTok Shop product ranking | ✅ Core | ❌ | ⚠️ Data ingested, no UI | ✅ `/app/tiktok-leaderboard` |
| AliExpress trending ingest (auto) | ❌ | ❌ | ⚠️ Apify every 6h only | ✅ Apify + direct DataHub ingest 500/6h |
| "Just in" freshness indicator | ❌ | ❌ | ❌ | ✅ `JUST IN` badge <6h |
| Winning ads library / ad spy | ⚠️ Limited | ✅ Core | ❌ | ❌ (see Phase 2) |
| Creator leaderboard | ✅ | ❌ | ⚠️ Creators page, no ranking | ❌ (see Phase 2) |
| Shop/store leaderboard | ✅ | ✅ | ⚠️ CompetitorSpy (search only) | ❌ (see Phase 2) |
| Daily sales time-series per product | ✅ | ❌ | ❌ | ⚠️ Sparklines on KPI cards (aggregate only) |
| Category trend charts | ✅ | ❌ | ⚠️ Partial in Analytics | ⚠️ Redesigned, still missing per-category history |
| Ad brief / copy generation | ❌ | ❌ | ✅ Native | ✅ (redesigned templates) |
| Store Builder (Shopify generator) | ❌ | ❌ | ✅ Native | ✅ (mock preview added) |
| Maya AI research chat | ❌ | ❌ | ✅ Native | ✅ (branded, suggested prompts) |
| AU-first market data | ❌ | ❌ | ✅ 7 markets | ✅ |
| Pricing: AUD native | ❌ | ❌ | ✅ | ✅ |

## Phase 1 — shipped this session

1. **DataHub ingest agent** — `server/lib/ingestAliExpressDataHub.ts` + `/api/cron/ingest-aliexpress-datahub`, scheduled every 6h at offset :15. Rotates 15 of ~25 curated high-intent keywords per run, dedupes, feeds `aeProductPipeline` (Haiku enrichment + scoring + insert).
2. **JUST IN badge** — Products grid shows an electric-blue `JUST IN` pill for items created within 6h; `NEW` badge stays for the 30-day window.
3. **TikTok Shop leaderboard** — `/api/products/tiktok-leaderboard` ranks `winning_products WHERE platform='tiktok_shop'` by `score × 0.4 + log(velocity) × 0.6`. New page at `/app/tiktok-leaderboard`, wired into sidebar under OPERATE.
4. **KPI sparklines** — 14-day daily-add series from `/api/products/stats-overview` rendered on Home KPI cards. Real data only, null-safe.
5. **Unblocked Competitor Spy** — still exists as a Tavily search tool, but the leaderboard gives users the data-driven view the label was missing.

## Phase 2 — next sprint (highest ROI remaining gaps)

1. **Winning Ads Library** (Minea parity)
   - New `ad_creatives` surface: scrape Meta Ad Library + TikTok Creative Center via existing `server/scrapers/tiktok-creative-center.ts`.
   - New table `ad_creatives` with fields: platform, media_url, brand, niche, cta, engagement, first_seen, last_seen.
   - New page `/app/ads-library` with filters (platform, niche, date range, engagement floor).
   - Extend Ads Studio to "Clone this ad" from library → pre-fill the brief.

2. **Creator leaderboard** (KaloData parity)
   - Feed existing TikTok CC ingest into a `creators` table.
   - `/app/creators` already exists — replace the grid with a sortable ranking by GMV, follower delta, product promotion count.
   - Add "Top live streamers" row (tie to livestream_analytics scraper output).

3. **Store leaderboard** (KaloData + Minea parity)
   - Use existing Apify TikTok Shop + Shopify store scrapers to populate a `shops` table.
   - New `/app/stores` page ranked by revenue, product count, recent launches.
   - Per-store drill-down: products, estimated monthly revenue, competitor fingerprint.

4. **Daily sales time-series per product** (KaloData parity)
   - New table `product_sales_snapshots` capturing daily sold_count deltas.
   - Tiny cron to snapshot nightly.
   - Product detail panel: real line chart of daily orders over 30 days (replaces placeholder).

5. **Category trend charts** (KaloData parity)
   - Extend `analytics-categories` endpoint with 30-day series from `product_sales_snapshots`.
   - Analytics page: stacked area chart per category.

6. **AU-native edge amplifiers** (differentiation vs KaloData/Minea)
   - Shipping lane intelligence: show average AU delivery time per supplier (use AliExpress `ships_from` field).
   - GST + AU duty calculator inline on product detail.
   - AUD conversion everywhere, cached FX.
   - "Made in Australia" filter toggle.

## Differentiation thesis

KaloData is TikTok Shop-only and US-first. Minea is ad-spy-first. Majorka is the **only AU-native, operator-first intelligence + execution platform**: research (Products, TikTok Leaderboard), decide (Maya, Alerts), execute (Store Builder, Ads Studio, Ad Briefs), operate (Revenue, Analytics). The phase-2 work above closes the research parity gap; the execution layer is already an edge neither competitor has.

## Success metric

> An AU operator finds a winning product and places their first Stripe order in under 60 minutes from signup.

Track via: signup → first product saved, first store drafted, first Stripe checkout. Needs the funnel events wired into `usage_counters` + PostHog (already plumbed).
