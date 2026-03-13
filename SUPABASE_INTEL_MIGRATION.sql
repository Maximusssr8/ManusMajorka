-- ============================================================
-- Majorka Intelligence Suite — One-time DB setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Creator Intelligence table
CREATE TABLE IF NOT EXISTS public.au_creators (
  id                       uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
  username                 text             NOT NULL,
  display_name             text,
  avatar_url               text,
  follower_count           integer          DEFAULT 0,
  gmv_30d_aud              numeric          DEFAULT 0,
  gmv_growth_rate          numeric          DEFAULT 0,
  items_sold_30d           integer          DEFAULT 0,
  avg_video_views          integer          DEFAULT 0,
  engagement_rate          numeric          DEFAULT 0,
  top_categories           text[]           DEFAULT '{}',
  commission_rate          numeric          DEFAULT 15,
  creator_conversion_ratio numeric          DEFAULT 0,
  tiktok_url               text,
  is_verified              boolean          DEFAULT false,
  location                 text             DEFAULT 'Australia',
  revenue_sparkline        jsonb            DEFAULT '[]',
  scraped_at               timestamptz      DEFAULT now(),
  UNIQUE(username)
);
ALTER TABLE public.au_creators ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "ac_pub" ON public.au_creators FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "ac_svc" ON public.au_creators FOR ALL TO service_role USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Video Intelligence table
CREATE TABLE IF NOT EXISTS public.trending_videos (
  id                     uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
  video_title            text,
  creator_username       text,
  product_name           text,
  thumbnail_url          text,
  tiktok_video_url       text,
  views                  integer          DEFAULT 0,
  likes                  integer          DEFAULT 0,
  gmv_driven_aud         numeric          DEFAULT 0,
  items_sold_from_video  integer          DEFAULT 0,
  engagement_rate        numeric          DEFAULT 0,
  hook_type              text,
  category               text,
  published_at           timestamptz,
  scraped_at             timestamptz      DEFAULT now()
);
ALTER TABLE public.trending_videos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "tv_pub" ON public.trending_videos FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "tv_svc" ON public.trending_videos FOR ALL TO service_role USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Category Rankings table
CREATE TABLE IF NOT EXISTS public.category_rankings (
  id                    uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name         text             NOT NULL UNIQUE,
  total_products        integer          DEFAULT 0,
  total_gmv_aud         numeric          DEFAULT 0,
  revenue_growth_rate   numeric          DEFAULT 0,
  top_product_title     text,
  avg_price_aud         numeric          DEFAULT 0,
  creator_count         integer          DEFAULT 0,
  competition_level     text             DEFAULT 'medium',
  trend                 text             DEFAULT 'growing',
  au_opportunity_score  integer          DEFAULT 75,
  updated_at            timestamptz      DEFAULT now()
);
ALTER TABLE public.category_rankings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cr_pub" ON public.category_rankings FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "cr_svc" ON public.category_rankings FOR ALL TO service_role USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Competitor Watchlist table (user-scoped)
CREATE TABLE IF NOT EXISTS public.competitor_watchlist (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid         REFERENCES auth.users(id) ON DELETE CASCADE,
  query       text         NOT NULL,
  notes       text,
  created_at  timestamptz  DEFAULT now(),
  UNIQUE(user_id, query)
);
ALTER TABLE public.competitor_watchlist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cw_own" ON public.competitor_watchlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "cw_svc" ON public.competitor_watchlist FOR ALL TO service_role USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ✅ Done creating tables. Now run the seed data:
-- After running this file, POST to https://www.majorka.io/api/internal/run-intel-migration
-- with header: x-migration-secret: majorka-intel-2026
-- This will seed all 3 tables (15 creators, 12 videos, 8 categories).

SELECT 'Tables created successfully ✅' AS status;
