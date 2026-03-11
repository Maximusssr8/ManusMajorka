-- Storefront tables migration
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  stripe_account_id TEXT,
  meta_ad_account_id TEXT,
  meta_pixel_id TEXT,
  brand_color_primary TEXT DEFAULT '#000000',
  brand_color_secondary TEXT DEFAULT '#ffffff',
  logo_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS storefront_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price TEXT,
  compare_price TEXT,
  published BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  storefront_product_id UUID REFERENCES storefront_products(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_address JSONB,
  stripe_payment_intent TEXT,
  amount TEXT,
  status TEXT DEFAULT 'pending',
  fulfillment_status TEXT DEFAULT 'unfulfilled',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS Policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stores' AND policyname='Users manage own store') THEN
    CREATE POLICY "Users manage own store" ON stores FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='storefront_products' AND policyname='Public can view published products') THEN
    CREATE POLICY "Public can view published products" ON storefront_products FOR SELECT USING (published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='storefront_products' AND policyname='Store owners manage products') THEN
    CREATE POLICY "Store owners manage products" ON storefront_products FOR ALL USING (
      store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Store owners view orders') THEN
    CREATE POLICY "Store owners view orders" ON orders FOR SELECT USING (
      store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Insert orders publicly') THEN
    CREATE POLICY "Insert orders publicly" ON orders FOR INSERT WITH CHECK (true);
  END IF;
END $$;
