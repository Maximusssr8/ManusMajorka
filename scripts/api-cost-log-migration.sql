-- Majorka — Claude API cost logging
-- Records every Anthropic call for per-feature cost attribution.

CREATE TABLE IF NOT EXISTS api_cost_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feature text NOT NULL,
  user_id uuid,
  input_tokens integer,
  output_tokens integer,
  cache_creation_input_tokens integer,
  cache_read_input_tokens integer,
  model text,
  estimated_cost_usd numeric(10,6),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_cost_log_created ON api_cost_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_cost_log_feature_day ON api_cost_log((created_at::date), feature);
CREATE INDEX IF NOT EXISTS idx_api_cost_log_user ON api_cost_log(user_id, created_at DESC);

ALTER TABLE api_cost_log ENABLE ROW LEVEL SECURITY;
