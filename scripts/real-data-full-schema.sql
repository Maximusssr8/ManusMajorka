-- ═══════════════════════════════════════════════════════════════════════════════
-- MAJORKA REAL PRODUCT DATA — FULL SCHEMA MIGRATION
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Phase 1: Core real-data columns ──────────────────────────────────────────
ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS source_url TEXT,             -- actual product page URL (clickable)
  ADD COLUMN IF NOT EXISTS data_source TEXT,            -- 'aliexpress' | 'cj_api' | 'tiktok_shop' | 'amazon_au'
  ADD COLUMN IF NOT EXISTS source_product_id TEXT,      -- ID from the source platform
  ADD COLUMN IF NOT EXISTS cj_product_id TEXT,          -- CJ Dropshipping PID
  ADD COLUMN IF NOT EXISTS amazon_asin TEXT,            -- Amazon ASIN
  ADD COLUMN IF NOT EXISTS tiktok_shop_product_id TEXT; -- TikTok Shop product ID

-- ── Phase 2: Demand / sales data from real sources ───────────────────────────
ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS tiktok_shop_units_sold INT,   -- real TikTok Shop units sold
  ADD COLUMN IF NOT EXISTS tiktok_shop_url TEXT,         -- https://www.tiktok.com/view/product/[ID]
  ADD COLUMN IF NOT EXISTS tiktok_shop_price_aud NUMERIC(10,2), -- real TikTok Shop sell price
  ADD COLUMN IF NOT EXISTS tiktok_shop_seller TEXT,      -- seller name on TikTok Shop
  ADD COLUMN IF NOT EXISTS amazon_bsr_rank INT,          -- Amazon Bestseller Rank
  ADD COLUMN IF NOT EXISTS amazon_bsr_category TEXT,     -- BSR category (e.g. "Pet Supplies")
  ADD COLUMN IF NOT EXISTS amazon_price_aud NUMERIC(10,2), -- real Amazon AU price
  ADD COLUMN IF NOT EXISTS amazon_url TEXT,              -- https://www.amazon.com.au/dp/[ASIN]
  ADD COLUMN IF NOT EXISTS ae_orders_count INT;          -- AliExpress real order count (rename from orders_count if needed)

-- ── Phase 3: Supplier data (real prices, not estimated) ───────────────────────
ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS supplier_platform TEXT,       -- 'cj_dropshipping' | 'aliexpress' | 'none'
  ADD COLUMN IF NOT EXISTS supplier_url TEXT,            -- direct supplier product URL
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,           -- supplier/seller name
  ADD COLUMN IF NOT EXISTS supplier_rating_score NUMERIC(3,2), -- supplier rating (e.g. 4.8)
  ADD COLUMN IF NOT EXISTS real_cost_price_aud NUMERIC(10,2),  -- confirmed real cost (not AI-estimated)
  ADD COLUMN IF NOT EXISTS real_sell_price_aud NUMERIC(10,2),  -- confirmed real sell price from source
  ADD COLUMN IF NOT EXISTS real_margin_pct NUMERIC(5,2),       -- calculated from real_cost + real_sell
  ADD COLUMN IF NOT EXISTS shipping_time_days_min INT,   -- minimum shipping days
  ADD COLUMN IF NOT EXISTS shipping_time_days_max INT,   -- maximum shipping days
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,3),       -- product weight
  ADD COLUMN IF NOT EXISTS inventory_count INT,          -- current stock level
  ADD COLUMN IF NOT EXISTS product_images TEXT[],        -- array of all real image URLs
  ADD COLUMN IF NOT EXISTS supplier_match_confidence INT, -- 0-100 match confidence score
  ADD COLUMN IF NOT EXISTS last_price_check TIMESTAMPTZ; -- when price was last verified

-- ── Phase 4: Real opportunity scoring ─────────────────────────────────────────
ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS real_opportunity_score INT,   -- score based only on real data signals
  ADD COLUMN IF NOT EXISTS demand_score INT,             -- 0-40: from real sales data
  ADD COLUMN IF NOT EXISTS quality_score INT,            -- 0-30: from real ratings
  ADD COLUMN IF NOT EXISTS cross_platform_score INT,     -- 0-20: found on multiple platforms
  ADD COLUMN IF NOT EXISTS supplier_score INT,           -- 0-10: real supplier found
  ADD COLUMN IF NOT EXISTS platforms_found TEXT[],       -- ['aliexpress', 'tiktok_shop', 'amazon_au']
  ADD COLUMN IF NOT EXISTS platform_count INT;           -- how many platforms this product appears on

-- ── Backfill: set source_url from aliexpress_url for existing products ─────────
UPDATE winning_products
  SET source_url = aliexpress_url,
      data_source = 'aliexpress',
      source_product_id = aliexpress_id,
      supplier_platform = 'aliexpress',
      supplier_url = aliexpress_url,
      real_cost_price_aud = COALESCE(cost_price_aud, supplier_cost_aud),
      real_sell_price_aud = price_aud,
      real_margin_pct = profit_margin,
      platforms_found = ARRAY['aliexpress'],
      platform_count = 1
  WHERE aliexpress_url IS NOT NULL
    AND source_url IS NULL;

-- ── Backfill: normalize platform field ────────────────────────────────────────
UPDATE winning_products SET platform = 'aliexpress' WHERE platform = 'AliExpress';

-- ── Backfill: normalize tags to Title Case ─────────────────────────────────────
UPDATE winning_products SET tags = 
  CASE 
    WHEN tags[1] = 'beauty'            THEN ARRAY['Beauty']
    WHEN tags[1] = 'kitchen'           THEN ARRAY['Kitchen']
    WHEN tags[1] = 'car accessories'   THEN ARRAY['Automotive']
    WHEN tags[1] = 'electronics'       THEN ARRAY['Tech & Gadgets']
    WHEN tags[1] = 'outdoor'           THEN ARRAY['Outdoor & Sports']
    WHEN tags[1] = 'fitness'           THEN ARRAY['Fitness']
    WHEN tags[1] = 'health'            THEN ARRAY['Health & Wellness']
    WHEN tags[1] = 'home decor'        THEN ARRAY['Home & Garden']
    WHEN tags[1] = 'phone accessories' THEN ARRAY['Tech & Gadgets']
    WHEN tags[1] = 'office'            THEN ARRAY['Office & WFH']
    WHEN tags[1] = 'pet accessories'   THEN ARRAY['Pet Care']
    ELSE tags
  END
WHERE tags[1] IN ('beauty','kitchen','car accessories','electronics','outdoor',
                   'fitness','health','home decor','phone accessories','office','pet accessories');

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wp_data_source        ON winning_products (data_source);
CREATE INDEX IF NOT EXISTS idx_wp_source_product_id  ON winning_products (source_product_id);
CREATE INDEX IF NOT EXISTS idx_wp_cj_product_id      ON winning_products (cj_product_id);
CREATE INDEX IF NOT EXISTS idx_wp_amazon_asin         ON winning_products (amazon_asin);
CREATE INDEX IF NOT EXISTS idx_wp_tiktok_shop_id      ON winning_products (tiktok_shop_product_id);
CREATE INDEX IF NOT EXISTS idx_wp_real_opportunity    ON winning_products (real_opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_wp_supplier_platform   ON winning_products (supplier_platform);
CREATE INDEX IF NOT EXISTS idx_wp_platform_count      ON winning_products (platform_count DESC);

-- ── Verify ─────────────────────────────────────────────────────────────────────
SELECT
  COUNT(*)                     AS total,
  COUNT(source_url)            AS has_source_url,
  COUNT(real_cost_price_aud)   AS has_real_cost,
  COUNT(real_sell_price_aud)   AS has_real_sell_price,
  COUNT(tiktok_shop_url)       AS has_tiktok_url,
  COUNT(amazon_url)            AS has_amazon_url,
  data_source,
  COUNT(*)                     AS count_by_source
FROM winning_products
GROUP BY data_source
ORDER BY count_by_source DESC;
