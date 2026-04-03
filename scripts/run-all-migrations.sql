-- ============================================================
-- MAJORKA — ALL PENDING MIGRATIONS (run once in Supabase SQL Editor)
-- https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new
-- ============================================================

-- ── MIGRATION 1: opportunity_score column ───────────────────
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS opportunity_score integer;

UPDATE winning_products
SET opportunity_score = CASE
  WHEN real_orders_count >= 100000 THEN 95
  WHEN real_orders_count >= 50000  THEN 90
  WHEN real_orders_count >= 10000  THEN 80
  WHEN real_orders_count >= 5000   THEN 70
  WHEN real_orders_count >= 1000   THEN 60
  WHEN real_orders_count >= 500    THEN 50
  WHEN real_orders_count >= 100    THEN 40
  ELSE 30
END
WHERE is_active = true;

-- ── MIGRATION 2: pipeline infrastructure tables ─────────────
CREATE TABLE IF NOT EXISTS apify_run_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id text NOT NULL UNIQUE,
  actor text NOT NULL,
  source text NOT NULL,
  dataset_id text,
  status text DEFAULT 'running',
  retry_count integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  items_collected integer DEFAULT 0,
  error_message text
);
CREATE INDEX IF NOT EXISTS idx_arq_status ON apify_run_queue(status, started_at);

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

ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'cj';
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
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS search_count integer DEFAULT 0;

-- ── MIGRATION 3: waitlist tables ─────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  feature text NOT NULL DEFAULT 'general',
  name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email, feature)
);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='waitlist' AND policyname='Public insert to waitlist') THEN
    CREATE POLICY "Public insert to waitlist" ON waitlist FOR INSERT WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ads_manager_waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ads_manager_waitlist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ads_manager_waitlist' AND policyname='Insert only') THEN
    CREATE POLICY "Insert only" ON ads_manager_waitlist FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── MIGRATION 4: discord_user_id column ──────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_user_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_discord_user_id ON users (discord_user_id) WHERE discord_user_id IS NOT NULL;

-- ── VERIFY: check everything was created ─────────────────────
SELECT 'opportunity_score' as check_name, count(*)::text as result FROM information_schema.columns WHERE table_name='winning_products' AND column_name='opportunity_score'
UNION ALL SELECT 'apify_run_queue', count(*)::text FROM information_schema.tables WHERE table_name='apify_run_queue'
UNION ALL SELECT 'pipeline_logs', count(*)::text FROM information_schema.tables WHERE table_name='pipeline_logs'
UNION ALL SELECT 'waitlist', count(*)::text FROM information_schema.tables WHERE table_name='waitlist'
UNION ALL SELECT 'ads_manager_waitlist', count(*)::text FROM information_schema.tables WHERE table_name='ads_manager_waitlist'
UNION ALL SELECT 'discord_user_id', count(*)::text FROM information_schema.columns WHERE table_name='users' AND column_name='discord_user_id'
UNION ALL SELECT 'opp_score_backfilled', count(*)::text FROM winning_products WHERE opportunity_score IS NOT NULL AND is_active=true;
