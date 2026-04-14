-- Migration: extend pipeline_logs with fields required by the Apify pintostudio
-- pipeline. The base table (id / started_at / status / error_message) already
-- exists from scripts/pipeline-schema.sql. We add idempotent ALTERs for the
-- columns the new pipeline writes so existing rows continue to work.
--
-- Status values used by the new pipeline:
--   'running'  — in-flight
--   'success'  — >= 500 rows added+updated
--   'partial'  — some sources errored OR inserted < 500 but > 0
--   'error'    — zero rows landed
--
-- RLS: service-role writes, admin-token-gated reads. The server process uses
-- SERVICE_ROLE so it bypasses RLS; we still enable RLS so the anon key cannot
-- read run metadata (some rows include error messages).

ALTER TABLE IF EXISTS pipeline_logs
  ADD COLUMN IF NOT EXISTS finished_at        timestamptz,
  ADD COLUMN IF NOT EXISTS duration_ms        integer,
  ADD COLUMN IF NOT EXISTS products_added     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS products_updated   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS products_rejected  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_breakdown   jsonb   DEFAULT '{}'::jsonb;

-- Allow new status values ('partial') in addition to existing ones.
-- No CHECK constraint is declared in the original schema, so nothing to drop.

CREATE INDEX IF NOT EXISTS idx_pipeline_logs_status
  ON pipeline_logs (status, started_at DESC);

-- Enable RLS. Service-role (used by the server) bypasses this.
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;

-- Drop any previous permissive policies before recreating (idempotent).
DROP POLICY IF EXISTS pipeline_logs_service_all ON pipeline_logs;
DROP POLICY IF EXISTS pipeline_logs_admin_select ON pipeline_logs;

-- Admin read policy: any caller that can authenticate as the `service_role`
-- implicitly passes RLS. The admin HTTP endpoints gate on ADMIN_TOKEN in app
-- code, not RLS, so we only need a no-op policy for anon denial (RLS enabled
-- with no policy blocks all access, which is what we want).
