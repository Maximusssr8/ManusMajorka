-- Real Product Data Schema Migration
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new

-- Add missing columns for real product data
ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'aliexpress',
  ADD COLUMN IF NOT EXISTS source_product_id TEXT,
  ADD COLUMN IF NOT EXISTS shipping_time_days_min INT,
  ADD COLUMN IF NOT EXISTS shipping_time_days_max INT,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS seller_name TEXT,
  ADD COLUMN IF NOT EXISTS seller_rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS inventory_count INT,
  ADD COLUMN IF NOT EXISTS product_images TEXT[],  -- array of all image URLs
  ADD COLUMN IF NOT EXISTS variants JSONB,         -- full variant options
  ADD COLUMN IF NOT EXISTS cj_product_id TEXT,     -- CJ Dropshipping product ID
  ADD COLUMN IF NOT EXISTS last_price_check TIMESTAMPTZ;

-- Backfill source_url from aliexpress_url for existing products
UPDATE winning_products
  SET source_url = aliexpress_url,
      data_source = 'aliexpress'
  WHERE aliexpress_url IS NOT NULL
    AND source_url IS NULL;

-- Backfill source_product_id from aliexpress_id
UPDATE winning_products
  SET source_product_id = aliexpress_id
  WHERE aliexpress_id IS NOT NULL
    AND source_product_id IS NULL;

-- Normalize platform field (fix capitalization inconsistency)
UPDATE winning_products
  SET platform = 'aliexpress'
  WHERE platform = 'AliExpress';

-- Index for fast source lookups
CREATE INDEX IF NOT EXISTS idx_wp_data_source ON winning_products (data_source);
CREATE INDEX IF NOT EXISTS idx_wp_source_product_id ON winning_products (source_product_id);
CREATE INDEX IF NOT EXISTS idx_wp_cj_product_id ON winning_products (cj_product_id);

-- Tags normalization (lowercase → Title Case)
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

-- Verify
SELECT 
  COUNT(*) as total,
  COUNT(source_url) as has_source_url,
  COUNT(aliexpress_url) as has_ae_url,
  COUNT(aliexpress_id) as has_ae_id,
  COUNT(image_url) as has_image,
  COUNT(cost_price_aud) as has_cost,
  COUNT(orders_count) as has_orders,
  data_source,
  COUNT(*) as count_by_source
FROM winning_products
GROUP BY data_source
ORDER BY count_by_source DESC;
