-- ─────────────────────────────────────────────────────────────────────
-- Majorka RLS migration
-- Run in Supabase SQL Editor (or via psql connected as postgres/owner).
-- Cannot be applied via PostgREST — DDL is not exposed.
--
-- Tables confirmed to have a `user_id` column (2026-04-08 audit):
--   user_alerts            (4 rows)
--   shopify_connections    (0 rows)
--   generated_stores       (1 row)
--   user_preferences       (0 rows)
--
-- winning_products is shared/public — read-only for authenticated users.
-- Service-role keys (used in cron/pipeline routes) bypass RLS by design.
-- ─────────────────────────────────────────────────────────────────────

-- winning_products — shared product data, authenticated read-only
ALTER TABLE public.winning_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_all" ON public.winning_products;
CREATE POLICY "authenticated_read_all"
  ON public.winning_products
  FOR SELECT
  TO authenticated
  USING (true);

-- ─── user_alerts ─────────────────────────────────────────────────────
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_select" ON public.user_alerts;
DROP POLICY IF EXISTS "own_insert" ON public.user_alerts;
DROP POLICY IF EXISTS "own_update" ON public.user_alerts;
DROP POLICY IF EXISTS "own_delete" ON public.user_alerts;

CREATE POLICY "own_select" ON public.user_alerts
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "own_insert" ON public.user_alerts
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "own_update" ON public.user_alerts
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "own_delete" ON public.user_alerts
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON public.user_alerts (user_id);

-- ─── shopify_connections ─────────────────────────────────────────────
ALTER TABLE public.shopify_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_select" ON public.shopify_connections;
DROP POLICY IF EXISTS "own_insert" ON public.shopify_connections;
DROP POLICY IF EXISTS "own_update" ON public.shopify_connections;
DROP POLICY IF EXISTS "own_delete" ON public.shopify_connections;

CREATE POLICY "own_select" ON public.shopify_connections
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "own_insert" ON public.shopify_connections
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "own_update" ON public.shopify_connections
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "own_delete" ON public.shopify_connections
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_shopify_connections_user_id ON public.shopify_connections (user_id);

-- ─── generated_stores ────────────────────────────────────────────────
ALTER TABLE public.generated_stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_select" ON public.generated_stores;
DROP POLICY IF EXISTS "own_insert" ON public.generated_stores;
DROP POLICY IF EXISTS "own_update" ON public.generated_stores;
DROP POLICY IF EXISTS "own_delete" ON public.generated_stores;

CREATE POLICY "own_select" ON public.generated_stores
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "own_insert" ON public.generated_stores
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "own_update" ON public.generated_stores
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "own_delete" ON public.generated_stores
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_generated_stores_user_id ON public.generated_stores (user_id);

-- ─── user_preferences ────────────────────────────────────────────────
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_select" ON public.user_preferences;
DROP POLICY IF EXISTS "own_insert" ON public.user_preferences;
DROP POLICY IF EXISTS "own_update" ON public.user_preferences;
DROP POLICY IF EXISTS "own_delete" ON public.user_preferences;

CREATE POLICY "own_select" ON public.user_preferences
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "own_insert" ON public.user_preferences
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "own_update" ON public.user_preferences
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "own_delete" ON public.user_preferences
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences (user_id);

-- ─────────────────────────────────────────────────────────────────────
-- Verification — run after applying:
--   SELECT schemaname, tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--     AND tablename IN ('winning_products','user_alerts','shopify_connections','generated_stores','user_preferences');
-- ─────────────────────────────────────────────────────────────────────
