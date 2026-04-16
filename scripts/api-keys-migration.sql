-- API Keys table for Majorka V1 Public API
-- Stores SHA-256 hashed keys linked to user accounts with per-key rate limits.

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash text UNIQUE NOT NULL,
  plan text DEFAULT 'builder' CHECK (plan IN ('builder', 'scale')),
  rate_limit integer DEFAULT 100,
  is_active boolean DEFAULT true,
  label text,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can manage their own keys through the authenticated client.
-- Server-side operations use SERVICE_ROLE which bypasses RLS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users manage own keys'
  ) THEN
    CREATE POLICY "Users manage own keys" ON api_keys
      FOR ALL USING (user_id::text = auth.uid()::text);
  END IF;
END
$$;
