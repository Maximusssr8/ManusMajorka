-- ── Ships-to-AU migration ───────────────────────────────────
-- Adds a ships_to_au boolean flag on winning_products so the AU-first
-- filter can exclude products that don't ship to Australia without
-- relying on ad-hoc heuristics on the application side.
--
-- Apply via: pnpm db:migrate
--   (or psql $DATABASE_URL -f scripts/ships-to-au-migration.sql)

ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS ships_to_au boolean DEFAULT true;

-- Partial index: we almost always query `WHERE ships_to_au = true`,
-- so a partial index is cheaper than a full boolean index.
CREATE INDEX IF NOT EXISTS idx_winning_products_ships_to_au
  ON winning_products (ships_to_au)
  WHERE ships_to_au = true;
