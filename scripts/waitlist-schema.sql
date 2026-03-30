-- Waitlist table for Meta Ads integration and future features
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  feature text NOT NULL DEFAULT 'general',
  name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email, feature)
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert to waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Also create the ads_manager_waitlist table (separate for easy export)
CREATE TABLE IF NOT EXISTS ads_manager_waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ads_manager_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insert only" ON ads_manager_waitlist
  FOR INSERT WITH CHECK (true);
