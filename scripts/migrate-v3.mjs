#!/usr/bin/env node
// Run: node scripts/migrate-v3.mjs
// Prints SQL to run in Supabase SQL Editor

const SQL = `
-- Add columns to winning_products
ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS revenue_trend numeric[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS revenue_growth_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_unit_price_aud numeric DEFAULT 0;

-- Update avg_unit_price_aud
UPDATE winning_products SET avg_unit_price_aud = price_aud WHERE avg_unit_price_aud = 0;

-- Update revenue_growth_pct
UPDATE winning_products SET revenue_growth_pct =
  CASE
    WHEN winning_score >= 85 THEN 25 + (winning_score - 85) * 2
    WHEN winning_score >= 75 THEN 10 + (winning_score - 75) * 1.5
    WHEN winning_score >= 65 THEN (winning_score - 65) * 1.0
    ELSE -15 + (winning_score - 50) * 0.7
  END;

-- Generate revenue_trend arrays
UPDATE winning_products SET revenue_trend =
  CASE
    WHEN 'VIRAL' = ANY(tags) THEN ARRAY[
      (est_monthly_revenue_aud * 0.65)::numeric,
      (est_monthly_revenue_aud * 0.72)::numeric,
      (est_monthly_revenue_aud * 0.78)::numeric,
      (est_monthly_revenue_aud * 0.84)::numeric,
      (est_monthly_revenue_aud * 0.91)::numeric,
      (est_monthly_revenue_aud * 0.96)::numeric,
      (est_monthly_revenue_aud * 1.0)::numeric
    ]
    WHEN winning_score >= 80 THEN ARRAY[
      (est_monthly_revenue_aud * 0.80)::numeric,
      (est_monthly_revenue_aud * 0.85)::numeric,
      (est_monthly_revenue_aud * 0.88)::numeric,
      (est_monthly_revenue_aud * 0.91)::numeric,
      (est_monthly_revenue_aud * 0.95)::numeric,
      (est_monthly_revenue_aud * 0.98)::numeric,
      (est_monthly_revenue_aud * 1.0)::numeric
    ]
    ELSE ARRAY[
      (est_monthly_revenue_aud * 0.95)::numeric,
      (est_monthly_revenue_aud * 0.97)::numeric,
      (est_monthly_revenue_aud * 0.94)::numeric,
      (est_monthly_revenue_aud * 0.98)::numeric,
      (est_monthly_revenue_aud * 0.96)::numeric,
      (est_monthly_revenue_aud * 0.99)::numeric,
      (est_monthly_revenue_aud * 1.0)::numeric
    ]
  END;

-- Create video_intelligence table
CREATE TABLE IF NOT EXISTS video_intelligence (
  id uuid default gen_random_uuid() primary key,
  platform text default 'tiktok',
  video_title text,
  video_hook text,
  product_name text,
  product_image_url text,
  est_revenue_aud numeric default 0,
  items_sold integer default 0,
  views_count bigint default 0,
  est_roas numeric default 0,
  revenue_trend numeric[] default '{}',
  publish_date date,
  video_url text,
  created_at timestamptz default now()
);

-- Create au_shop_rankings table
CREATE TABLE IF NOT EXISTS au_shop_rankings (
  id uuid default gen_random_uuid() primary key,
  shop_name text,
  shop_logo_url text,
  category text,
  est_monthly_revenue_aud numeric,
  revenue_growth_pct numeric,
  items_sold_monthly integer,
  avg_unit_price_aud numeric,
  top_product_images text[] default '{}',
  revenue_trend numeric[] default '{}',
  shop_type text default 'dropship',
  created_at timestamptz default now()
);

-- Velocity columns for winning_products
ALTER TABLE winning_products
  ADD COLUMN IF NOT EXISTS velocity_label text,
  ADD COLUMN IF NOT EXISTS velocity_score integer,
  ADD COLUMN IF NOT EXISTS peak_in_days integer,
  ADD COLUMN IF NOT EXISTS velocity_curve jsonb,
  ADD COLUMN IF NOT EXISTS velocity_confidence text;
`;

console.log('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
console.log('\u2551  Majorka V3 Migration SQL                  \u2551');
console.log('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D');
console.log('');
console.log('Run this at: https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new');
console.log('');
console.log(SQL);
console.log('\nAfter running, execute: node scripts/seed-v3.mjs to populate the new tables.\n');
