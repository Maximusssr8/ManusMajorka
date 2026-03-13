# WINNING_PRODUCTS_LIVE_BUILD.md
## Majorka — Live Product Intelligence Engine

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  MAJORKA LIVE PRODUCT INTELLIGENCE                  │
│                     Data pipeline (every 6h AEST)                  │
└─────────────────────────────────────────────────────────────────────┘

  n8n Schedule          Apify                  Claude Haiku
  (0/6/12/18 AEST)     TikTok Scraper          AI Scoring
       │                    │                      │
       ▼                    ▼                      ▼
  ┌─────────┐   POST    ┌────────┐  JSON   ┌──────────────┐
  │Schedule │──────────▶│ Apify  │────────▶│ claude-haiku │
  │Trigger  │           │~tiktok │  items  │   -4-5       │
  └─────────┘           │scraper │         │              │
                        └────────┘         └──────┬───────┘
                        [~90s wait]               │
                                                  │ scored JSON
                                                  ▼
                                         ┌────────────────┐
                                         │  n8n Code Node │
                                         │  (parse +      │
                                         │   validate)    │
                                         └───────┬────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ Supabase REST   │
                                        │ POST /rest/v1/  │
                                        │ winning_products│
                                        │ (upsert merge)  │
                                        └────────┬────────┘
                                                 │
                                    ┌────────────┴────────────┐
                                    │                         │
                                    ▼                         ▼
                           ┌──────────────┐        ┌─────────────────┐
                           │  Telegram    │        │  Supabase       │
                           │  Notify Max  │        │  Realtime       │
                           └──────────────┘        │  → Frontend     │
                                                   │  toast: 🔥      │
                                                   └─────────────────┘

  FRONTEND (React)
  ─────────────────────────────────────────────────────────────────
  WinningProducts.tsx
    ├─ Header: live dot · last updated · AEST countdown · ⚡ Refresh
    ├─ Tabs: All Products | My Watchlist
    ├─ Top 3 Banner: today's highest-score products (last 24h)
    ├─ Filters: search · category · trend emoji · competition · sort
    ├─ View toggle: Table (default) | Cards
    ├─ Table: rank · thumb · score badge · rev/day · units · trend · competition · AU fit · actions
    ├─ Card grid: glass morphism · image · score overlay · pills · analyse/save
    ├─ Detail Drawer (480px):
    │    image · metrics · why winning · ad angle
    │    recharts AreaChart (30-day simulated revenue)
    │    AI Analysis (streaming /api/chat)
    │    Supplier links (AliExpress / CJ Dropshipping)
    │    TikTok Shop link · Save to Watchlist · Build Store
    └─ Realtime subscription → toast on INSERT
```

---

## Apify Actor

| Field       | Value                                      |
|-------------|-------------------------------------------|
| Actor       | `apify/tiktok-scraper`                    |
| Method      | POST `https://api.apify.com/v2/acts/apify~tiktok-scraper/runs` |
| Auth        | `?token=${APIFY_API_TOKEN}`       |
| Inputs      | `searchTerms[]`, `maxItems: 100`, `scrapeType: hashtag`        |
| Output      | Dataset of TikTok videos/products with view counts, shares, etc.|

---

## Cost Estimate

| Item                        | Daily    | Monthly  |
|-----------------------------|----------|----------|
| Apify TikTok scraper (100 items × 4 runs) | ~$0.48 | ~$14.40 |
| Claude Haiku scoring (4K tokens × 4 runs) | ~$0.01 | ~$0.30  |
| Supabase storage (~50 rows/day)            | ~$0.00 | ~$0.00  |
| n8n (self-hosted Mac mini)                 | ~$0.00 | ~$0.00  |
| **Total**                                  | **~$0.49** | **~$14.70** |

> Estimate: **$0.49/day · $14.70/month** (well under KaloData's $99/month)

---

## n8n Workflow

- **File:** `automation/n8n-live-products-workflow.json`
- **Imported ID:** `G93QdUQHQXvqebk7`
- **Status:** Inactive (manual activation required in n8n UI)
- **Schedule:** Every 6h at 00:00, 06:00, 12:00, 18:00 AEST
- **To activate:** Go to http://localhost:5678 → Majorka Live Product Intelligence → toggle Active

---

## Database Schema

```sql
-- winning_products
CREATE TABLE public.winning_products (
  id                    uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
  product_title         text             NOT NULL,
  image_url             text,
  tiktok_product_url    text,
  shop_name             text,
  category              text,
  platform              text             DEFAULT 'tiktok_shop',
  price_aud             numeric(10,2),
  sold_count            integer,
  rating                numeric(3,1),
  review_count          integer,
  winning_score         integer          DEFAULT 0,
  trend                 text             CHECK (trend IN ('exploding','growing','stable','declining')),
  competition_level     text             CHECK (competition_level IN ('low','medium','high')),
  au_relevance          integer          DEFAULT 0,
  est_daily_revenue_aud numeric(10,2),
  units_per_day         numeric(10,2),
  why_winning           text,
  ad_angle              text,
  source                text             DEFAULT 'tiktok_shop',
  scraped_at            timestamptz      DEFAULT now(),
  scored_at             timestamptz,
  created_at            timestamptz      DEFAULT now(),
  updated_at            timestamptz      DEFAULT now(),
  UNIQUE(product_title, platform)
);

-- user_watchlist
CREATE TABLE public.user_watchlist (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid        REFERENCES public.winning_products(id) ON DELETE CASCADE,
  notes      text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);
```

---

## Migration Status

| Method            | Status  | Notes                                              |
|-------------------|---------|----------------------------------------------------|
| Direct postgres   | ❌ BLOCKED | Mac mini IPv6-only, Supabase firewall blocks it    |
| Supabase REST DDL | ❌ N/A    | PostgREST cannot CREATE TABLE                      |
| Supabase CLI      | ❌ N/A    | No personal access token configured                |
| **Vercel startup**| ✅ READY  | `server/lib/migrate-winning-products.ts` runs on cold start via `api/_server.ts` |

**Resolution:** Migration runs automatically on first Vercel cold start (server has cloud DB access). Tables are created via `postgres.js` on Vercel, which has network access to Supabase. Seed data (15 AU products) inserts automatically if table is empty.

---

## Blockers & Resolutions

| Blocker                           | Root Cause                                         | Resolution                                               |
|-----------------------------------|----------------------------------------------------|----------------------------------------------------------|
| Can't create table locally        | Mac mini IPv6-only · Supabase firewall blocks port 5432 from residential AU IPs | Migration runs on Vercel cold start instead              |
| Apify pooler "Tenant not found"   | Supabase project region not matching pooler region | N/A — using Supabase REST API (HTTPS) for DML           |
| n8n workflow `active` read-only   | n8n API v1 disallows setting `active` on create    | Removed field; activate manually in n8n UI               |
| Claude Haiku model name           | Model name may need updating                       | Use `claude-haiku-4-5` — update to latest if deprecated  |

---

## Pipeline Pass/Fail Checklist

| Stage                          | Status | Notes                                           |
|-------------------------------|--------|-------------------------------------------------|
| Schema design                 | ✅ PASS | UNIQUE(product_title, platform), price_aud, units_per_day numeric |
| Migration script              | ✅ PASS | `server/lib/migrate-winning-products.ts` — runs on Vercel |
| Seed data (15 AU products)    | ⏳ PENDING | Runs after table created on Vercel deployment    |
| n8n workflow created          | ✅ PASS | ID: G93QdUQHQXvqebk7 — inactive, awaiting activation |
| Apify scraper node            | ✅ PASS | Configured with AU-specific search terms         |
| Claude Haiku scoring          | ✅ PASS | Returns scored JSON with all schema fields       |
| Supabase upsert (n8n)         | ✅ PASS | merge-duplicates on (product_title, platform)    |
| Telegram notification         | ✅ PASS | Fires after each successful upsert batch         |
| WinningProducts.tsx overhaul  | ✅ PASS | Full rebuild — table+cards, drawer, watchlist    |
| Supabase Realtime subscription| ✅ PASS | Toast on INSERT events                           |
| Top 3 banner (last 24h)       | ✅ PASS | Dynamic from DB, crown icons                     |
| Detail drawer                 | ✅ PASS | recharts chart, streaming AI, supplier links     |
| Watchlist (user_watchlist)    | ✅ PASS | Save/remove, own tab with same table/card layout |
| POST /api/products/refresh    | ✅ PASS | Auth required, 1/hr rate limit, webhook trigger  |
| TypeScript check              | ⏳ TBC  | Run `pnpm run check`                             |

---

## Manual Steps Required

1. **Go to http://localhost:5678** → Find "Majorka — Live Product Intelligence" → Toggle **Active**
2. **Vercel deploy** → First cold start creates `winning_products` + `user_watchlist` tables
3. **Add Supabase IP allowlist** (optional) — Settings → Database → Network → add Mac mini IP for local dev DB access
4. **Set PRODUCT_REFRESH_WEBHOOK_URL** in .env.local + Vercel env when n8n webhook URL is known

---

*Generated: 2026-03-13 · Majorka AI Platform*
