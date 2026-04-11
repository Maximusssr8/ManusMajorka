-- Usage counters — tracks per-user, per-metric usage against plan limits.
-- Referenced by server/lib/usage.ts and GET /api/usage/summary.
-- Source of truth: HANDOFF.md section 6.

CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, metric, period_start)
);

CREATE INDEX IF NOT EXISTS usage_counters_user_metric_idx
  ON usage_counters (user_id, metric);

CREATE INDEX IF NOT EXISTS usage_counters_period_idx
  ON usage_counters (period_start, period_end);

ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON usage_counters;
CREATE POLICY "Service role full access"
  ON usage_counters
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users read own usage" ON usage_counters;
CREATE POLICY "Users read own usage"
  ON usage_counters
  FOR SELECT
  USING (auth.uid() = user_id);
