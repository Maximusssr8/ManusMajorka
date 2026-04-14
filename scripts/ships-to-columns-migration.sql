-- ── Ships-to columns migration ─────────────────────────────────
-- Adds ships_to_us and ships_to_uk (ships_to_au already exists from an
-- earlier migration). Defaults to true so nothing regresses until the
-- pipeline is wired to compute these from AliExpress shipping templates.
--
-- Apply via: pnpm db:migrate

ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS ships_to_us boolean DEFAULT true;

ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS ships_to_uk boolean DEFAULT true;

-- Partial indexes mirror the ships_to_au pattern — we almost always
-- filter `WHERE ships_to_* = true`.
CREATE INDEX IF NOT EXISTS idx_winning_products_ships_to_us
  ON winning_products (ships_to_us)
  WHERE ships_to_us = true;

CREATE INDEX IF NOT EXISTS idx_winning_products_ships_to_uk
  ON winning_products (ships_to_uk)
  WHERE ships_to_uk = true;
