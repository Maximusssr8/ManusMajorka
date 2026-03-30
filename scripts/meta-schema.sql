-- Ads Manager V2 — Database Schema
-- Run in Supabase SQL Editor

-- Meta Business connections
CREATE TABLE IF NOT EXISTS meta_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  ad_account_id text,
  ad_account_name text,
  pixel_id text,
  business_id text,
  webhook_id text,
  connected_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meta_connections_user ON meta_connections(user_id);

-- Shopify product catalog sync
CREATE TABLE IF NOT EXISTS shopify_product_catalog (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  shopify_product_id text NOT NULL,
  title text,
  price_aud numeric,
  image_url text,
  product_url text,
  inventory_status text DEFAULT 'active',
  synced_at timestamptz DEFAULT now(),
  UNIQUE(user_id, shopify_product_id)
);
CREATE INDEX IF NOT EXISTS idx_shopify_catalog_user ON shopify_product_catalog(user_id);

-- Ad campaigns
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  meta_campaign_id text,
  name text NOT NULL,
  objective text DEFAULT 'OUTCOME_SALES',
  status text DEFAULT 'draft',
  daily_budget_aud numeric,
  product_ids jsonb DEFAULT '[]',
  targeting jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user ON ad_campaigns(user_id);
