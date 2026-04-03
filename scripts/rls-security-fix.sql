-- ============================================================
-- RLS SECURITY FIX — Majorka
-- Run in: https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new
-- 
-- Step 1: Check current RLS status (run this first to see the problem)
-- Step 2: Enable RLS on all tables
-- Step 3: Apply correct policies per table type
-- ============================================================

-- ── STEP 1: AUDIT (read-only, run first) ──────────────────────────────
SELECT 
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COUNT(p.policyname) AS policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.rowsecurity ASC, t.tablename;

-- ── STEP 2: ENABLE RLS ON ALL PUBLIC TABLES ───────────────────────────

ALTER TABLE public.apify_cache             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.au_creators             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_rankings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_watchlist    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_memory     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials_entity      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_entity        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rates                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_stores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migrations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_search_cache    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_outputs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_intelligence       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_connections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_entity              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_plan_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_signals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_videos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_niche_signals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_search_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_videos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_entity          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winning_products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_entity         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows_tags          ENABLE ROW LEVEL SECURITY;

-- n8n internal tables (may not exist — safe to ignore errors)
DO $$ BEGIN
  ALTER TABLE public.tag_entity          ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.webhook_entity      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.execution_entity    ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.workflow_entity     ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.workflows_tags      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.credentials_entity  ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.migrations          ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- ── STEP 3: POLICIES ──────────────────────────────────────────────────
-- NOTE: service_role ALWAYS bypasses RLS — your backend API is safe.
-- These policies control anon + authenticated (frontend) access only.

-- ── 3A: PRODUCT CATALOG — authenticated users can read, service_role writes ──

-- winning_products: authenticated users can read all active products
DROP POLICY IF EXISTS "auth_read_active_products" ON public.winning_products;
CREATE POLICY "auth_read_active_products"
  ON public.winning_products FOR SELECT
  TO authenticated
  USING (is_active = true);

-- trend_signals: authenticated read-only
DROP POLICY IF EXISTS "auth_read_trend_signals" ON public.trend_signals;
CREATE POLICY "auth_read_trend_signals"
  ON public.trend_signals FOR SELECT
  TO authenticated
  USING (true);

-- products (legacy): authenticated read-only
DROP POLICY IF EXISTS "auth_read_products" ON public.products;
CREATE POLICY "auth_read_products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

-- creators: authenticated read-only
DROP POLICY IF EXISTS "auth_read_creators" ON public.creators;
CREATE POLICY "auth_read_creators"
  ON public.creators FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_read_au_creators" ON public.au_creators;
CREATE POLICY "auth_read_au_creators"
  ON public.au_creators FOR SELECT
  TO authenticated
  USING (true);

-- category_rankings: authenticated read-only
DROP POLICY IF EXISTS "auth_read_category_rankings" ON public.category_rankings;
CREATE POLICY "auth_read_category_rankings"
  ON public.category_rankings FOR SELECT
  TO authenticated
  USING (true);

-- trending_videos / viral_videos: authenticated read-only
DROP POLICY IF EXISTS "auth_read_trending_videos" ON public.trending_videos;
CREATE POLICY "auth_read_trending_videos"
  ON public.trending_videos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_read_viral_videos" ON public.viral_videos;
CREATE POLICY "auth_read_viral_videos"
  ON public.viral_videos FOR SELECT
  TO authenticated
  USING (true);

-- shop_intelligence: authenticated read-only
DROP POLICY IF EXISTS "auth_read_shop_intelligence" ON public.shop_intelligence;
CREATE POLICY "auth_read_shop_intelligence"
  ON public.shop_intelligence FOR SELECT
  TO authenticated
  USING (true);

-- fx_rates: authenticated read-only
DROP POLICY IF EXISTS "auth_read_fx_rates" ON public.fx_rates;
CREATE POLICY "auth_read_fx_rates"
  ON public.fx_rates FOR SELECT
  TO authenticated
  USING (true);

-- reports: authenticated read-only
DROP POLICY IF EXISTS "auth_read_reports" ON public.reports;
CREATE POLICY "auth_read_reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (true);


-- ── 3B: USER DATA — users see only their own rows ─────────────────────

-- user_profiles
DROP POLICY IF EXISTS "users_own_profile" ON public.user_profiles;
CREATE POLICY "users_own_profile"
  ON public.user_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_subscriptions
DROP POLICY IF EXISTS "users_own_subscription" ON public.user_subscriptions;
CREATE POLICY "users_own_subscription"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- user_preferences
DROP POLICY IF EXISTS "users_own_preferences" ON public.user_preferences;
CREATE POLICY "users_own_preferences"
  ON public.user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_alerts
DROP POLICY IF EXISTS "users_own_alerts" ON public.user_alerts;
CREATE POLICY "users_own_alerts"
  ON public.user_alerts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_niche_signals
DROP POLICY IF EXISTS "users_own_niche_signals" ON public.user_niche_signals;
CREATE POLICY "users_own_niche_signals"
  ON public.user_niche_signals FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_search_history
DROP POLICY IF EXISTS "users_own_search_history" ON public.user_search_history;
CREATE POLICY "users_own_search_history"
  ON public.user_search_history FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_watchlist / competitor_watchlist
DROP POLICY IF EXISTS "users_own_watchlist" ON public.user_watchlist;
CREATE POLICY "users_own_watchlist"
  ON public.user_watchlist FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_own_competitor_watchlist" ON public.competitor_watchlist;
CREATE POLICY "users_own_competitor_watchlist"
  ON public.competitor_watchlist FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_onboarding
DROP POLICY IF EXISTS "users_own_onboarding" ON public.user_onboarding;
CREATE POLICY "users_own_onboarding"
  ON public.user_onboarding FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- users table
DROP POLICY IF EXISTS "users_own_row" ON public.users;
CREATE POLICY "users_own_row"
  ON public.users FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- marketplace_profiles
DROP POLICY IF EXISTS "users_own_marketplace_profile" ON public.marketplace_profiles;
CREATE POLICY "users_own_marketplace_profile"
  ON public.marketplace_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- shopify_connections
DROP POLICY IF EXISTS "users_own_shopify_connections" ON public.shopify_connections;
CREATE POLICY "users_own_shopify_connections"
  ON public.shopify_connections FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- stores / store_products / store_orders / storefront_products / generated_stores
DROP POLICY IF EXISTS "users_own_stores" ON public.stores;
CREATE POLICY "users_own_stores"
  ON public.stores FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_own_store_products" ON public.store_products;
CREATE POLICY "users_own_store_products"
  ON public.store_products FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_own_store_orders" ON public.store_orders;
CREATE POLICY "users_own_store_orders"
  ON public.store_orders FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_own_storefront_products" ON public.storefront_products;
CREATE POLICY "users_own_storefront_products"
  ON public.storefront_products FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_own_generated_stores" ON public.generated_stores;
CREATE POLICY "users_own_generated_stores"
  ON public.generated_stores FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- orders
DROP POLICY IF EXISTS "users_own_orders" ON public.orders;
CREATE POLICY "users_own_orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- saved_outputs
DROP POLICY IF EXISTS "users_own_saved_outputs" ON public.saved_outputs;
CREATE POLICY "users_own_saved_outputs"
  ON public.saved_outputs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- subscriptions (legacy / Stripe)
DROP POLICY IF EXISTS "users_own_subscriptions" ON public.subscriptions;
CREATE POLICY "users_own_subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- subscribers (email list)
DROP POLICY IF EXISTS "service_role_only_subscribers" ON public.subscribers;
CREATE POLICY "service_role_only_subscribers"
  ON public.subscribers FOR ALL
  TO authenticated
  USING (false);  -- block all authenticated reads; service_role bypasses

-- chat_messages / conversation_memory
DROP POLICY IF EXISTS "users_own_chat_messages" ON public.chat_messages;
CREATE POLICY "users_own_chat_messages"
  ON public.chat_messages FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_own_conversation_memory" ON public.conversation_memory;
CREATE POLICY "users_own_conversation_memory"
  ON public.conversation_memory FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- generation_jobs
DROP POLICY IF EXISTS "users_own_generation_jobs" ON public.generation_jobs;
CREATE POLICY "users_own_generation_jobs"
  ON public.generation_jobs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ── 3C: INTERNAL/SERVICE-ROLE ONLY — block all direct access ─────────

-- These tables are used by the backend only. Block anon + authenticated.
-- service_role key always bypasses RLS so backend is unaffected.

DROP POLICY IF EXISTS "no_direct_access" ON public.usage_tracking;
CREATE POLICY "no_direct_access" ON public.usage_tracking FOR ALL TO authenticated USING (false);
CREATE POLICY "no_direct_access_anon" ON public.usage_tracking FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "no_direct_access" ON public.search_analytics;
CREATE POLICY "no_direct_access" ON public.search_analytics FOR ALL TO authenticated USING (false);

DROP POLICY IF EXISTS "no_direct_access" ON public.product_search_cache;
CREATE POLICY "no_direct_access" ON public.product_search_cache FOR ALL TO authenticated USING (false);

DROP POLICY IF EXISTS "no_direct_access" ON public.search_cache;
CREATE POLICY "no_direct_access" ON public.search_cache FOR ALL TO authenticated USING (false);

DROP POLICY IF EXISTS "no_direct_access" ON public.apify_cache;
CREATE POLICY "no_direct_access" ON public.apify_cache FOR ALL TO authenticated USING (false);

DROP POLICY IF EXISTS "no_direct_access" ON public.task_plan_progress;
CREATE POLICY "no_direct_access" ON public.task_plan_progress FOR ALL TO authenticated USING (false);

-- n8n internal tables — block all direct access
DO $$ BEGIN
  DROP POLICY IF EXISTS "no_direct_access" ON public.tag_entity;
  CREATE POLICY "no_direct_access" ON public.tag_entity FOR ALL TO authenticated USING (false);
  DROP POLICY IF EXISTS "no_direct_access" ON public.webhook_entity;
  CREATE POLICY "no_direct_access" ON public.webhook_entity FOR ALL TO authenticated USING (false);
  DROP POLICY IF EXISTS "no_direct_access" ON public.execution_entity;
  CREATE POLICY "no_direct_access" ON public.execution_entity FOR ALL TO authenticated USING (false);
  DROP POLICY IF EXISTS "no_direct_access" ON public.workflow_entity;
  CREATE POLICY "no_direct_access" ON public.workflow_entity FOR ALL TO authenticated USING (false);
  DROP POLICY IF EXISTS "no_direct_access" ON public.workflows_tags;
  CREATE POLICY "no_direct_access" ON public.workflows_tags FOR ALL TO authenticated USING (false);
  DROP POLICY IF EXISTS "no_direct_access" ON public.credentials_entity;
  CREATE POLICY "no_direct_access" ON public.credentials_entity FOR ALL TO authenticated USING (false);
  DROP POLICY IF EXISTS "no_direct_access" ON public.migrations;
  CREATE POLICY "no_direct_access" ON public.migrations FOR ALL TO authenticated USING (false);
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- ── STEP 4: VERIFY — run after applying ───────────────────────────────
SELECT 
  t.tablename,
  t.rowsecurity AS rls_on,
  COUNT(p.policyname) AS policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.rowsecurity ASC, t.tablename;
