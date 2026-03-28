-- Monthly usage tracking per user
CREATE TABLE IF NOT EXISTS usage_tracking (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL,
  feature      text NOT NULL,
  month        text NOT NULL, -- 'YYYY-MM'
  count        integer NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, feature, month)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month ON usage_tracking(user_id, month);

-- Store count (not monthly — lifetime per user)
CREATE TABLE IF NOT EXISTS user_stores (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL,
  name       text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_stores_user ON user_stores(user_id);
