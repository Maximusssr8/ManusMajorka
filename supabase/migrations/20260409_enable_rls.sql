-- ═══════════════════════════════════════════════════════════════════════════
-- Enable Row Level Security across every public table + sane policies
--
-- URGENT — run this ONCE in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new
--
-- Why: RLS is currently OFF on public tables. A probe with the anon key
-- returned 200/206 for shopify_connections (OAuth access tokens!),
-- aliexpress_tokens, user_subscriptions, subscribers, user_profiles,
-- generated_stores, and usage_tracking. Any anon caller with the project
-- URL can read and write all of these.
--
-- What this does: enables RLS on every table used by the app + creates
-- policies. Idempotent — can be re-run safely.
--
-- Server code (Express routes) uses the service_role key via
-- server/_core/supabase.ts::getSupabaseAdmin() — service_role BYPASSES
-- RLS by design, so server routes won't break. Client-side reads that
-- go direct to Supabase via the anon key need explicit SELECT policies
-- below.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── HELPER: a function to enable RLS idempotently ───────────────────────
CREATE OR REPLACE FUNCTION _majorka_enable_rls(tbl regclass)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Skipping missing table: %', tbl;
END$$;

-- ─── PRODUCT CATALOG — public read, service write ────────────────────────
-- product_rank_snapshots is created further down (CREATE TABLE IF NOT EXISTS)
-- and its policy applied there.
DO $$
DECLARE
  t text;
  public_read_tables text[] := ARRAY[
    'winning_products',
    'trend_signals',
    'aliexpress_categories',
    'au_suppliers'
  ];
BEGIN
  FOREACH t IN ARRAY public_read_tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS "%1$s_public_read" ON %1$I', t);
      EXECUTE format(
        'CREATE POLICY "%1$s_public_read" ON %1$I FOR SELECT TO anon, authenticated USING (true)',
        t
      );
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Skipping missing table: %', t;
    END;
  END LOOP;
END$$;

-- ─── USER DATA — owner-only ──────────────────────────────────────────────
-- Every row has a user_id column; users can only see/modify their own.
-- Service role bypasses these.

DO $$
DECLARE
  t text;
  user_tables text[] := ARRAY[
    'user_profiles',
    'user_subscriptions',
    'user_alerts',
    'user_watchlist',
    'user_search_history',
    'user_preferences',
    'user_onboarding',
    'user_niche_signals',
    'daily_product_subs',
    'usage_tracking',
    'saved_outputs',
    'chat_messages',
    'generated_stores',
    'generation_jobs',
    'shopify_connections',
    'meta_connections',
    'aliexpress_tokens',
    'marketplace_profiles',
    'ad_campaigns',
    'store_orders',
    'store_products',
    'shop_intelligence',
    'competitor_watchlist',
    'shopify_product_catalog'
  ];
BEGIN
  FOREACH t IN ARRAY user_tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS "%1$s_owner_all" ON %1$I', t);
      EXECUTE format(
        'CREATE POLICY "%1$s_owner_all" ON %1$I FOR ALL TO authenticated USING (user_id::text = auth.uid()::text) WITH CHECK (user_id::text = auth.uid()::text)',
        t
      );
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Skipping missing table: %', t;
      WHEN undefined_column THEN
        -- Table exists but has no user_id column — enable RLS with deny-all
        -- so the anon key can't touch it.
        BEGIN
          EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
          EXECUTE format('DROP POLICY IF EXISTS "%1$s_owner_all" ON %1$I', t);
          RAISE NOTICE 'Table % has no user_id column — RLS enabled, no public policies (service role only)', t;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not enable RLS on %: %', t, SQLERRM;
        END;
    END;
  END LOOP;
END$$;

-- ─── INFRASTRUCTURE TABLES — service role only ───────────────────────────
-- No policies added = no rows visible to anon/authenticated clients,
-- only service_role can read/write. This is the safest default.
ALTER TABLE IF EXISTS apify_cache        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS apify_run_queue    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pipeline_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS raw_scrape_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS trends_data        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_search_cache ENABLE ROW LEVEL SECURITY;

-- search_cache is queried directly from the client (WinningProducts.tsx)
-- so it needs a public SELECT policy. Writes still require service role.
ALTER TABLE IF EXISTS search_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "search_cache_public_read" ON search_cache;
CREATE POLICY "search_cache_public_read"
  ON search_cache FOR SELECT
  TO anon, authenticated USING (true);

-- ─── WAITLIST / EMAIL CAPTURE — public insert, owner-only read ──────────
-- Marketing landing pages POST here with the anon key.
ALTER TABLE IF EXISTS waitlist    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_public_insert" ON waitlist;
CREATE POLICY "waitlist_public_insert"
  ON waitlist FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "subscribers_public_insert" ON subscribers;
CREATE POLICY "subscribers_public_insert"
  ON subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ─── PROFILES (if separate from user_profiles) ──────────────────────────
DO $$
BEGIN
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "profiles_owner_all" ON profiles;
  CREATE POLICY "profiles_owner_all" ON profiles
    FOR ALL TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
EXCEPTION WHEN undefined_table THEN
  NULL;
END$$;

-- ─── RANK SNAPSHOT TABLE — create if missing (Radar feature) ────────────
CREATE TABLE IF NOT EXISTS product_rank_snapshots (
  product_id text PRIMARY KEY,
  rank integer NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE product_rank_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_rank_snapshots_public_read" ON product_rank_snapshots;
CREATE POLICY "product_rank_snapshots_public_read"
  ON product_rank_snapshots FOR SELECT
  TO anon, authenticated USING (true);

-- ─── AUDIT: list every public table with its RLS status ────────────────
-- Run this part separately after applying the migration to verify:
--
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY rowsecurity ASC, tablename;
--
-- Anything with rowsecurity = false still needs ALTER TABLE ... ENABLE
-- ROW LEVEL SECURITY added above.

DROP FUNCTION IF EXISTS _majorka_enable_rls(regclass);

COMMIT;
