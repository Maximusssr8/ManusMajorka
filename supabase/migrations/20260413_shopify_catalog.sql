-- Shopify product catalog — stores synced products from connected stores.
-- Used by /api/shopify/sync and /api/shopify/catalog.

CREATE TABLE IF NOT EXISTS shopify_product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shopify_product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  price_aud NUMERIC(10,2) DEFAULT 0,
  image_url TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, shopify_product_id)
);

CREATE INDEX IF NOT EXISTS shopify_catalog_user_idx ON shopify_product_catalog(user_id);
ALTER TABLE shopify_product_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role full access" ON shopify_product_catalog;
CREATE POLICY "service role full access" ON shopify_product_catalog FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users read own catalog" ON shopify_product_catalog;
CREATE POLICY "users read own catalog" ON shopify_product_catalog FOR SELECT USING (auth.uid() = user_id);
