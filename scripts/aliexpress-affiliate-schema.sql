-- AliExpress Affiliate API token storage
CREATE TABLE IF NOT EXISTS public.aliexpress_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  app_key text NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  refresh_expires_at timestamptz,
  account_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS (service_role only)
ALTER TABLE public.aliexpress_tokens ENABLE ROW LEVEL SECURITY;
-- No authenticated user policies — service_role only

-- AliExpress categories cache
CREATE TABLE IF NOT EXISTS public.aliexpress_categories (
  category_id bigint PRIMARY KEY,
  category_name text NOT NULL,
  parent_category_id bigint,
  is_hot boolean DEFAULT false,
  synced_at timestamptz DEFAULT now()
);

ALTER TABLE public.aliexpress_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_ae_categories" ON public.aliexpress_categories
  FOR SELECT TO authenticated USING (true);

-- Add affiliate-specific columns to winning_products if not exist
ALTER TABLE public.winning_products
  ADD COLUMN IF NOT EXISTS affiliate_url text,
  ADD COLUMN IF NOT EXISTS commission_rate text,
  ADD COLUMN IF NOT EXISTS hot_product_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ae_category_id text;
