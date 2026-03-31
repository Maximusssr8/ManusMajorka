-- Extend winning_products for multi-source signal tracking
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS signal_score integer DEFAULT 0;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS quality_tier text DEFAULT 'emerging';
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS data_sources jsonb DEFAULT '[]';
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS tiktok_shop_signal boolean DEFAULT false;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS amazon_signal boolean DEFAULT false;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS meta_ad_signal boolean DEFAULT false;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS cross_validated_at timestamptz;

-- Index for quality tier filtering
CREATE INDEX IF NOT EXISTS idx_wp_signal_score ON winning_products(signal_score DESC);
CREATE INDEX IF NOT EXISTS idx_wp_quality_tier ON winning_products(quality_tier);

-- Extended scrape_logs (replace old version)
DROP TABLE IF EXISTS scrape_logs;
CREATE TABLE scrape_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,
  run_at timestamptz DEFAULT now(),
  products_scraped integer DEFAULT 0,
  products_passed_filter integer DEFAULT 0,
  products_added integer DEFAULT 0,
  products_updated integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  status text DEFAULT 'success',
  duration_seconds integer
);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON scrape_logs(source);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_run_at ON scrape_logs(run_at DESC);
