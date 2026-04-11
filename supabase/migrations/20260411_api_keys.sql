-- Developer API keys + usage tracking.
-- Backs /api/api-keys CRUD and the /v1/* public API surface.

-- ── api_keys ─────────────────────────────────────────────────────────────
-- One row per key. We store ONLY the sha256 hash of the raw secret so a
-- database breach can't leak live keys. The full key is shown to the user
-- exactly once at creation time and never retrievable thereafter.
CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  prefix        TEXT NOT NULL,                  -- e.g. 'mk_live_abc12345' (first 16 chars, safe to show)
  key_hash      TEXT NOT NULL UNIQUE,           -- sha256 hex
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  request_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS api_keys_user_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role full access" ON api_keys;
CREATE POLICY "service role full access"
  ON api_keys FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users read own api keys" ON api_keys;
CREATE POLICY "users read own api keys"
  ON api_keys FOR SELECT USING (auth.uid() = user_id);

-- ── api_usage ────────────────────────────────────────────────────────────
-- Rolled-up per-key, per-day counters. Keeps the table small enough that
-- rate-limit lookups stay O(1). We don't log every request; the middleware
-- increments the current-day row on every hit.
CREATE TABLE IF NOT EXISTS api_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id      UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day         DATE NOT NULL,
  month       TEXT NOT NULL,                    -- YYYY-MM for cheap per-month queries
  count       INTEGER NOT NULL DEFAULT 0,
  last_path   TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key_id, day)
);

CREATE INDEX IF NOT EXISTS api_usage_user_month_idx ON api_usage(user_id, month);
CREATE INDEX IF NOT EXISTS api_usage_key_day_idx ON api_usage(key_id, day);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role full access" ON api_usage;
CREATE POLICY "service role full access"
  ON api_usage FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users read own api usage" ON api_usage;
CREATE POLICY "users read own api usage"
  ON api_usage FOR SELECT USING (auth.uid() = user_id);
