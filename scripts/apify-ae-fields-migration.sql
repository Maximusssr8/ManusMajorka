-- Migration: add full AliExpress extraction fields for Apify pipeline
-- These columns capture everything the apify/aliexpress-scraper actor returns
-- so operators get accurate, non-null data in Products tab detail sheets.

ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS description text,                 -- product description from AliExpress
  ADD COLUMN IF NOT EXISTS hi_res_image_url text,            -- 800px+ primary image
  ADD COLUMN IF NOT EXISTS additional_image_urls jsonb,      -- remaining gallery images
  ADD COLUMN IF NOT EXISTS shipping_cost_aud numeric(10,2),  -- cheapest shipping cost to AU in AUD
  ADD COLUMN IF NOT EXISTS shipping_to_au boolean,           -- whether product ships to AU at all
  ADD COLUMN IF NOT EXISTS seller_name text,                 -- store/seller display name
  ADD COLUMN IF NOT EXISTS seller_rating numeric(3,2),       -- 0-5 seller positive feedback rating
  ADD COLUMN IF NOT EXISTS seller_followers int,             -- seller follower count
  ADD COLUMN IF NOT EXISTS variant_count int,                -- number of SKU variants (sizes/colors)
  ADD COLUMN IF NOT EXISTS variants jsonb,                   -- full variant payload
  ADD COLUMN IF NOT EXISTS source_currency text,             -- original price currency (USD, EUR, ...)
  ADD COLUMN IF NOT EXISTS fx_rate_at_scrape numeric(10,4),  -- currency rate used when we captured price_aud
  ADD COLUMN IF NOT EXISTS last_apify_run_id text,           -- most recent apify run id that updated this row
  ADD COLUMN IF NOT EXISTS apify_raw jsonb;                  -- full raw actor output for debugging

-- Helpful index for the "stale detail refresh" cron selector
CREATE INDEX IF NOT EXISTS idx_winning_products_link_status
  ON winning_products (link_status, link_verified_at NULLS FIRST);
