-- Scraper monitoring table
CREATE TABLE IF NOT EXISTS scrape_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,
  run_at timestamptz DEFAULT now(),
  products_scraped integer DEFAULT 0,
  products_added integer DEFAULT 0,
  products_filtered integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  status text DEFAULT 'success'
);

CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON scrape_logs(source);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_run_at ON scrape_logs(run_at DESC);
