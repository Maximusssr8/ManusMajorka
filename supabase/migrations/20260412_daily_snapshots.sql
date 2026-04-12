CREATE TABLE IF NOT EXISTS product_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day DATE NOT NULL,
  total_products INTEGER NOT NULL DEFAULT 0,
  hot_products INTEGER NOT NULL DEFAULT 0,
  avg_score NUMERIC(5,2) DEFAULT 0,
  new_products INTEGER NOT NULL DEFAULT 0,
  top_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (day)
);
CREATE INDEX IF NOT EXISTS snapshots_day_idx ON product_daily_snapshots(day);
ALTER TABLE product_daily_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access" ON product_daily_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "authenticated read" ON product_daily_snapshots FOR SELECT USING (true);
