-- AU warehouse flag — AU Moat Director
-- Set by the pintostudio ingestion pipeline when a listing advertises
-- "Ships from: Australia" or an "AU warehouse" badge. Used by the
-- products page filter + the gold pill on the product card + a +10
-- bonus on the opportunity score at read time.

ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS au_warehouse_available boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_winning_products_au_warehouse
  ON winning_products(au_warehouse_available)
  WHERE au_warehouse_available = true;
