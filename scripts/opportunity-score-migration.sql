-- Add opportunity_score column to winning_products
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS opportunity_score integer;

-- Populate based on real_orders_count tiers
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
