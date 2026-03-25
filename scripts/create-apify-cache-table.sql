CREATE TABLE IF NOT EXISTS apify_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS apify_cache_key_idx ON apify_cache(cache_key);
CREATE INDEX IF NOT EXISTS apify_cache_expires_idx ON apify_cache(expires_at);
