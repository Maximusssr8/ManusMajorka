-- Server-backed alerts — moves alerts from localStorage to Supabase
-- so the cron can evaluate them and fire emails via Resend.

CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,          -- 'score' | 'new' | 'price' | 'trending'
  condition_value TEXT NOT NULL,     -- e.g. '80' for score threshold, 'Kitchen' for category
  email TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_alerts_user_idx ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS user_alerts_enabled_idx ON user_alerts(enabled) WHERE enabled = true;

ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role full access" ON user_alerts;
CREATE POLICY "service role full access" ON user_alerts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users manage own alerts" ON user_alerts;
CREATE POLICY "users manage own alerts" ON user_alerts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alert history — log of fired notifications
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES user_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  product_id UUID,
  product_title TEXT,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alert_history_user_idx ON alert_history(user_id);
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service role full access" ON alert_history;
CREATE POLICY "service role full access" ON alert_history FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "users read own history" ON alert_history;
CREATE POLICY "users read own history" ON alert_history FOR SELECT USING (auth.uid() = user_id);
