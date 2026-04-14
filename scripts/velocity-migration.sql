-- ── Velocity tracking migration ─────────────────────────────
-- Adds 7-day sold_count velocity snapshots so Home "Velocity Leaders"
-- can rank products by recent momentum instead of cumulative orders.
--
-- Apply via: psql $DATABASE_URL -f scripts/velocity-migration.sql
--   (or paste into Supabase SQL editor)

ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS sold_count_7d_ago integer;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS velocity_7d integer DEFAULT 0;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS sold_count_snapshot_at timestamptz;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

-- Backfill so freshness badges don't show NULL for existing rows
UPDATE winning_products
   SET last_seen_at = COALESCE(last_seen_at, last_seen_in_scrape_at, updated_at, created_at)
 WHERE last_seen_at IS NULL;

-- Seed snapshot for existing rows (velocity_7d stays 0 until next cron tick).
UPDATE winning_products
   SET sold_count_7d_ago = COALESCE(sold_count_7d_ago, sold_count),
       sold_count_snapshot_at = COALESCE(sold_count_snapshot_at, now())
 WHERE sold_count_7d_ago IS NULL;

CREATE INDEX IF NOT EXISTS idx_winning_products_velocity_7d
  ON winning_products (velocity_7d DESC NULLS LAST);
