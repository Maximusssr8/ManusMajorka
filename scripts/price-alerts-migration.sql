-- Price drop alerts — AU Moat Director
-- Distinct from the existing `alerts` table: this table is strictly
-- about tracking an original snapshot price per product per user and
-- firing when the live `winning_products.price_aud` drops below the
-- configured threshold. The cron at /api/cron/price-check compares
-- each active row, emails on trigger, then resets so future drops
-- re-notify.

CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_image text,
  original_price numeric(10,2) NOT NULL,
  target_price numeric(10,2),
  alert_type text DEFAULT 'any_drop' CHECK (alert_type IN ('any_drop','percentage','target_price')),
  threshold_percent numeric(5,2),
  status text DEFAULT 'active' CHECK (status IN ('active','triggered','cancelled')),
  triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_active
  ON price_alerts(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_price_alerts_user
  ON price_alerts(user_id);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'price_alerts'
      AND policyname = 'Users manage own alerts'
  ) THEN
    CREATE POLICY "Users manage own alerts" ON price_alerts
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END$$;
