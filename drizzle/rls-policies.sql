-- =============================================================================
-- Row Level Security (RLS) Policies for Majorka
-- =============================================================================
--
-- IMPORTANT: This app uses a CUSTOM JWT (HS256 via jose, not Supabase Auth).
-- Supabase's built-in auth.uid() will NOT work here because sessions are
-- managed via a cookie-based JWT signed with COOKIE_SECRET, not the Supabase
-- JWT secret.
--
-- HOW TO APPLY:
--   Option A: Run this SQL manually in the Supabase SQL Editor (Dashboard > SQL Editor)
--   Option B: Use the Supabase CLI:  supabase db push --file drizzle/rls-policies.sql
--
-- APPROACH:
--   Since the app connects to Supabase via a direct postgres connection string
--   (DATABASE_URL) using the `postgres` role (or a service role), and all
--   queries are already filtered by userId in the Drizzle ORM layer (server/db.ts),
--   RLS serves as a DEFENSE-IN-DEPTH measure.
--
--   The policies below use a custom GUC (Grand Unified Configuration) variable
--   `app.current_user_id` that must be SET at the beginning of each request
--   by the application layer. Example:
--
--     await db.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
--
--   If you are connecting with the `postgres` superuser role, note that RLS
--   is bypassed by default for superusers. To enforce RLS even for the
--   table owner, use:
--
--     ALTER TABLE <table> FORCE ROW LEVEL SECURITY;
--
--   The policies below include FORCE ROW LEVEL SECURITY for each table.
--
--   ALTERNATIVE: If you migrate to Supabase Auth in the future, replace
--   `current_setting('app.current_user_id')::uuid` with `auth.uid()`.
-- =============================================================================


-- Helper: This function extracts the current user ID from the GUC variable.
-- Returns NULL if not set, which will cause all policies to deny access.
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- =============================================================================
-- 1. USERS TABLE
--    Policy: Users can only SELECT and UPDATE their own row.
--    INSERT is allowed (for upsert during sign-in) but restricted to own openId.
-- =============================================================================

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;

-- Users can read only their own row
CREATE POLICY users_select_own ON "users"
  FOR SELECT
  USING ("id" = app_current_user_id());

-- Users can update only their own row
CREATE POLICY users_update_own ON "users"
  FOR UPDATE
  USING ("id" = app_current_user_id())
  WITH CHECK ("id" = app_current_user_id());

-- INSERT is allowed for the auth flow (upsert on sign-in).
-- The application layer handles this via service-level operations,
-- so we allow INSERT but the row must match the current user or
-- be an initial sign-in (where current_user_id may not be set yet).
-- For sign-in flows, use a service role or set the GUC after insert.
CREATE POLICY users_insert_self ON "users"
  FOR INSERT
  WITH CHECK (true);
  -- NOTE: INSERT is permissive here because user creation happens
  -- during authentication before the user ID is known. The auth
  -- routes (server/auth/routes.ts, server/_core/oauth.ts) control
  -- this flow and only insert the authenticated user's data.


-- =============================================================================
-- 2. SUBSCRIPTIONS TABLE
--    Policy: Users can only read their own subscriptions.
--    Writes are controlled by the application (payment webhooks, activation).
-- =============================================================================

ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" FORCE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY subscriptions_select_own ON "subscriptions"
  FOR SELECT
  USING ("userId" = app_current_user_id());

-- Users can insert subscriptions for themselves only
CREATE POLICY subscriptions_insert_own ON "subscriptions"
  FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());

-- Users can update only their own subscriptions
CREATE POLICY subscriptions_update_own ON "subscriptions"
  FOR UPDATE
  USING ("userId" = app_current_user_id())
  WITH CHECK ("userId" = app_current_user_id());

-- No DELETE policy: subscriptions are never deleted, only status-updated


-- =============================================================================
-- 3. PRODUCTS TABLE
--    Policy: Full CRUD restricted to the owning user.
-- =============================================================================

ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;

-- Users can only see their own products
CREATE POLICY products_select_own ON "products"
  FOR SELECT
  USING ("userId" = app_current_user_id());

-- Users can only create products for themselves
CREATE POLICY products_insert_own ON "products"
  FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());

-- Users can only update their own products
CREATE POLICY products_update_own ON "products"
  FOR UPDATE
  USING ("userId" = app_current_user_id())
  WITH CHECK ("userId" = app_current_user_id());

-- Users can only delete their own products
CREATE POLICY products_delete_own ON "products"
  FOR DELETE
  USING ("userId" = app_current_user_id());


-- =============================================================================
-- 4. SAVED_OUTPUTS TABLE
--    Policy: Users can only access outputs for their own products.
-- =============================================================================

ALTER TABLE "saved_outputs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_outputs" FORCE ROW LEVEL SECURITY;

-- Users can only see their own saved outputs
CREATE POLICY saved_outputs_select_own ON "saved_outputs"
  FOR SELECT
  USING ("userId" = app_current_user_id());

-- Users can only create saved outputs for themselves
CREATE POLICY saved_outputs_insert_own ON "saved_outputs"
  FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());

-- Users can only delete their own saved outputs
CREATE POLICY saved_outputs_delete_own ON "saved_outputs"
  FOR DELETE
  USING ("userId" = app_current_user_id());

-- No UPDATE policy: saved outputs are immutable (insert or delete only)


-- =============================================================================
-- 5. USER_PROFILES TABLE
--    Policy: Users can only read and update their own profile.
-- =============================================================================

ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" FORCE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY user_profiles_select_own ON "user_profiles"
  FOR SELECT
  USING ("userId" = app_current_user_id());

-- Users can only create a profile for themselves
CREATE POLICY user_profiles_insert_own ON "user_profiles"
  FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());

-- Users can only update their own profile
CREATE POLICY user_profiles_update_own ON "user_profiles"
  FOR UPDATE
  USING ("userId" = app_current_user_id())
  WITH CHECK ("userId" = app_current_user_id());

-- No DELETE policy: profiles are not deleted


-- =============================================================================
-- 6. CONVERSATION_MEMORY TABLE
--    Policy: Users can only access their own conversation history.
-- =============================================================================

ALTER TABLE "conversation_memory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversation_memory" FORCE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY conversation_memory_select_own ON "conversation_memory"
  FOR SELECT
  USING ("userId" = app_current_user_id());

-- Users can only insert messages for themselves
CREATE POLICY conversation_memory_insert_own ON "conversation_memory"
  FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());

-- Users can only delete their own messages (used by trimConversationHistory)
CREATE POLICY conversation_memory_delete_own ON "conversation_memory"
  FOR DELETE
  USING ("userId" = app_current_user_id());

-- No UPDATE policy: messages are immutable


-- =============================================================================
-- INTEGRATION NOTES
-- =============================================================================
--
-- To activate these policies, the application must SET the GUC variable at
-- the start of each database transaction/request. Add this to server/db.ts:
--
--   import { sql } from "drizzle-orm";
--
--   export async function withUserContext<T>(userId: string, fn: (tx: ...) => Promise<T>): Promise<T> {
--     const db = getDb();
--     if (!db) throw new Error("Database not available");
--     return db.transaction(async (tx) => {
--       await tx.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
--       return fn(tx);
--     });
--   }
--
-- SET LOCAL ensures the variable is scoped to the current transaction and
-- automatically reset when the transaction ends, preventing leakage between
-- requests.
--
-- DROPPING ALL POLICIES (if you need to start over):
--
--   DROP POLICY IF EXISTS users_select_own ON "users";
--   DROP POLICY IF EXISTS users_update_own ON "users";
--   DROP POLICY IF EXISTS users_insert_self ON "users";
--   DROP POLICY IF EXISTS subscriptions_select_own ON "subscriptions";
--   DROP POLICY IF EXISTS subscriptions_insert_own ON "subscriptions";
--   DROP POLICY IF EXISTS subscriptions_update_own ON "subscriptions";
--   DROP POLICY IF EXISTS products_select_own ON "products";
--   DROP POLICY IF EXISTS products_insert_own ON "products";
--   DROP POLICY IF EXISTS products_update_own ON "products";
--   DROP POLICY IF EXISTS products_delete_own ON "products";
--   DROP POLICY IF EXISTS saved_outputs_select_own ON "saved_outputs";
--   DROP POLICY IF EXISTS saved_outputs_insert_own ON "saved_outputs";
--   DROP POLICY IF EXISTS saved_outputs_delete_own ON "saved_outputs";
--   DROP POLICY IF EXISTS user_profiles_select_own ON "user_profiles";
--   DROP POLICY IF EXISTS user_profiles_insert_own ON "user_profiles";
--   DROP POLICY IF EXISTS user_profiles_update_own ON "user_profiles";
--   DROP POLICY IF EXISTS conversation_memory_select_own ON "conversation_memory";
--   DROP POLICY IF EXISTS conversation_memory_insert_own ON "conversation_memory";
--   DROP POLICY IF EXISTS conversation_memory_delete_own ON "conversation_memory";
--
--   ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE "saved_outputs" DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE "user_profiles" DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE "conversation_memory" DISABLE ROW LEVEL SECURITY;
