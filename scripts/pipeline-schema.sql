-- Pipeline Infrastructure Schema
-- Run this in Supabase SQL Editor

-- Apify run queue (fire-and-forget tracking)
CREATE TABLE IF NOT EXISTS apify_run_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id text NOT NULL UNIQUE,
  actor text NOT NULL,
  source text NOT NULL,
  dataset_id text,
  status text DEFAULT 'running', -- running | succeeded | failed | harvested
  retry_count integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  items_collected integer DEFAULT 0,
  error_message text
);
CREATE INDEX IF NOT EXISTS idx_arq_status ON apify_run_queue(status, started_at);

-- Raw scrape results staging table
CREATE TABLE IF NOT EXISTS raw_scrape_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,
  title text NOT NULL,
  price_usd numeric(10,2) DEFAULT 0,
  price_aud numeric(10,2) DEFAULT 0,
  orders_count integer DEFAULT 0,
  rating numeric(3,2),
  review_count integer DEFAULT 0,
  image_url text,
  product_url text,
  source_product_id text,
  category text,
  extra_data jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  processing_result text,
  scraped_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_raw_scrape_unprocessed ON raw_scrape_results(processed, scraped_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_raw_scrape_source ON raw_scrape_results(source, scraped_at);

-- Pipeline execution logs
CREATE TABLE IF NOT EXISTS pipeline_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_type text NOT NULL,
  source text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_seconds integer,
  raw_collected integer DEFAULT 0,
  passed_filter integer DEFAULT 0,
  inserted integer DEFAULT 0,
  updated integer DEFAULT 0,
  failed integer DEFAULT 0,
  skipped integer DEFAULT 0,
  error_message text,
  status text DEFAULT 'running'
);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_type ON pipeline_logs(pipeline_type, started_at DESC);

-- Google Trends tracking
CREATE TABLE IF NOT EXISTS trends_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword text NOT NULL,
  geo text NOT NULL DEFAULT 'AU',
  interest_score integer DEFAULT 0,
  direction text DEFAULT 'stable',
  related_queries jsonb DEFAULT '[]',
  breakout boolean DEFAULT false,
  checked_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trends_keyword ON trends_data(keyword, geo, checked_at DESC);

-- Extend winning_products
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'cj';
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS source_product_id text;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS times_seen_in_scrapes integer DEFAULT 1;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS first_seen_at timestamptz DEFAULT now();
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS last_seen_in_scrape_at timestamptz DEFAULT now();
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS last_verified_at timestamptz DEFAULT now();
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS tiktok_score integer DEFAULT 0;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS amazon_bsr integer DEFAULT 0;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS cross_source_count integer DEFAULT 1;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS saturation_risk text DEFAULT 'medium';
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS tiktok_potential text DEFAULT 'medium';
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS is_aliexpress_choice boolean DEFAULT false;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS search_count integer DEFAULT 0;
-- signal_score, quality_tier, data_sources already added in previous migration
