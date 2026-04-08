-- user_favourites — per-user saved product list
-- Run this in the Supabase Dashboard SQL Editor (the project does not expose
-- the `exec_sql` RPC, so apply it manually).

CREATE TABLE IF NOT EXISTS user_favourites (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id    text        NOT NULL,
  product_title text,
  price_aud     numeric,
  sold_count    integer,
  winning_score numeric,
  category      text,
  image_url     text,
  product_url   text,
  saved_at      timestamptz DEFAULT now(),
  notes         text,
  UNIQUE (user_id, product_id)
);

ALTER TABLE user_favourites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_select ON user_favourites;
CREATE POLICY own_select ON user_favourites
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS own_insert ON user_favourites;
CREATE POLICY own_insert ON user_favourites
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS own_delete ON user_favourites;
CREATE POLICY own_delete ON user_favourites
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_user_favourites_user ON user_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favourites_saved_at ON user_favourites(user_id, saved_at DESC);
