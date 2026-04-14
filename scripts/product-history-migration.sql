-- ── Product history migration ──────────────────────────────────
-- Daily snapshot table that powers the real Sparkline in the
-- Products detail drawer. Populated by the /api/cron/snapshot-history
-- cron at 02:00 UTC. Idempotent per (product_id, snapshot_date).
--
-- Apply via: pnpm db:migrate

CREATE TABLE IF NOT EXISTS public.product_history (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL,
  snapshot_at    timestamptz NOT NULL DEFAULT now(),
  snapshot_date  date GENERATED ALWAYS AS ((snapshot_at AT TIME ZONE 'UTC')::date) STORED,
  sold_count     bigint,
  winning_score  numeric,
  velocity_7d    numeric
);

CREATE INDEX IF NOT EXISTS idx_product_history_product_snapshot
  ON public.product_history (product_id, snapshot_at DESC);

-- One snapshot per product per UTC day — cheap duplicate guard that
-- PostgREST upsert(onConflict='product_id,snapshot_date') can target.
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_history_product_day
  ON public.product_history (product_id, snapshot_date);
