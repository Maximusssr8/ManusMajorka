-- Store Builder V3 Schema
-- Run in Supabase SQL Editor

-- Extend generated_stores with new columns
ALTER TABLE generated_stores ADD COLUMN IF NOT EXISTS mode text DEFAULT 'ai';
ALTER TABLE generated_stores ADD COLUMN IF NOT EXISTS niche text;
ALTER TABLE generated_stores ADD COLUMN IF NOT EXISTS target_market text;
ALTER TABLE generated_stores ADD COLUMN IF NOT EXISTS tone text;
ALTER TABLE generated_stores ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366F1';
ALTER TABLE generated_stores ADD COLUMN IF NOT EXISTS generated_copy jsonb;
ALTER TABLE generated_stores ADD COLUMN IF NOT EXISTS subdomain text UNIQUE;
ALTER TABLE generated_stores ADD COLUMN IF NOT EXISTS custom_domain text;
ALTER TABLE generated_stores ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;
ALTER TABLE generated_stores ADD COLUMN IF NOT EXISTS selected_products jsonb DEFAULT '[]';

-- Store products (for marketplace listings + AI store products)
CREATE TABLE IF NOT EXISTS store_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES generated_stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  images jsonb DEFAULT '[]',
  price_aud numeric(10,2),
  compare_at_price numeric(10,2),
  cost_price_aud numeric(10,2),
  inventory_qty integer DEFAULT 0,
  sku text,
  status text DEFAULT 'active',
  majorka_product_id uuid,
  shopify_product_id text,
  bullet_points jsonb DEFAULT '[]',
  category text,
  shipping_type text DEFAULT 'standard',
  shipping_rate numeric(10,2),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_products_store ON store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_store_products_user ON store_products(user_id);

-- Marketplace orders
CREATE TABLE IF NOT EXISTS store_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES generated_stores(id),
  seller_user_id uuid NOT NULL,
  buyer_email text NOT NULL,
  buyer_name text NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric(10,2),
  platform_fee numeric(10,2),
  stripe_fee numeric(10,2),
  net_seller_payout numeric(10,2),
  status text DEFAULT 'pending',
  stripe_payment_intent_id text,
  shipping_address jsonb,
  tracking_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_orders_seller ON store_orders(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_store ON store_orders(store_id);

-- Marketplace seller profiles
CREATE TABLE IF NOT EXISTS marketplace_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  banner_url text,
  total_sales integer DEFAULT 0,
  total_revenue numeric(10,2) DEFAULT 0,
  stripe_connect_account_id text,
  payout_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_profiles_username ON marketplace_profiles(username);

-- RLS policies
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own store products') THEN
    CREATE POLICY "Users manage own store products" ON store_products FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Sellers see own orders') THEN
    CREATE POLICY "Sellers see own orders" ON store_orders FOR SELECT USING (auth.uid() = seller_user_id);
  END IF;
END $$;

ALTER TABLE marketplace_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read profiles') THEN
    CREATE POLICY "Public read profiles" ON marketplace_profiles FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own profile') THEN
    CREATE POLICY "Users manage own profile" ON marketplace_profiles FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
