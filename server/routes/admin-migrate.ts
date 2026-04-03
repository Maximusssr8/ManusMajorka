/**
 * TEMPORARY: One-shot migration runner — DELETE after use
 * Protected by SUPABASE_SERVICE_ROLE_KEY exact match
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import pg from 'pg';

const router = Router();
const { Pool } = pg;

// Migration 1: opportunity_score
const M1 = `
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS opportunity_score integer;
UPDATE winning_products
SET opportunity_score = CASE
  WHEN real_orders_count >= 100000 THEN 95
  WHEN real_orders_count >= 50000  THEN 90
  WHEN real_orders_count >= 10000  THEN 80
  WHEN real_orders_count >= 5000   THEN 70
  WHEN real_orders_count >= 1000   THEN 60
  WHEN real_orders_count >= 500    THEN 50
  WHEN real_orders_count >= 100    THEN 40
  ELSE 30
END
WHERE is_active = true;
`;

// Migration 2: pipeline schema
const M2 = `
CREATE TABLE IF NOT EXISTS apify_run_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id text NOT NULL UNIQUE,
  actor text NOT NULL,
  source text NOT NULL,
  dataset_id text,
  status text DEFAULT 'running',
  retry_count integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  items_collected integer DEFAULT 0,
  error_message text
);
CREATE INDEX IF NOT EXISTS idx_arq_status ON apify_run_queue(status, started_at);

CREATE TABLE IF NOT EXISTS raw_scrape_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,
  title text NOT NULL,
  price_usd numeric(10,2) DEFAULT 0,
  price_aud numeric(10,2) DEFAULT 0,
  orders_count integer DEFAULT 0,
  rating numeric(3,2),
  review_count integer DEFAULT 0,
  image_url text,
  product_url text,
  source_product_id text,
  category text,
  extra_data jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  processing_result text,
  scraped_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_raw_scrape_unprocessed ON raw_scrape_results(processed, scraped_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_raw_scrape_source ON raw_scrape_results(source, scraped_at);

CREATE TABLE IF NOT EXISTS pipeline_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_type text NOT NULL,
  source text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_seconds integer,
  raw_collected integer DEFAULT 0,
  passed_filter integer DEFAULT 0,
  inserted integer DEFAULT 0,
  updated integer DEFAULT 0,
  failed integer DEFAULT 0,
  skipped integer DEFAULT 0,
  error_message text,
  status text DEFAULT 'running'
);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_type ON pipeline_logs(pipeline_type, started_at DESC);

CREATE TABLE IF NOT EXISTS trends_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword text NOT NULL,
  geo text NOT NULL DEFAULT 'AU',
  interest_score integer DEFAULT 0,
  direction text DEFAULT 'stable',
  related_queries jsonb DEFAULT '[]',
  breakout boolean DEFAULT false,
  checked_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trends_keyword ON trends_data(keyword, geo, checked_at DESC);

ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'cj';
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS source_product_id text;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS times_seen_in_scrapes integer DEFAULT 1;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS first_seen_at timestamptz DEFAULT now();
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS last_seen_in_scrape_at timestamptz DEFAULT now();
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS last_verified_at timestamptz DEFAULT now();
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS tiktok_score integer DEFAULT 0;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS amazon_bsr integer DEFAULT 0;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS cross_source_count integer DEFAULT 1;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS saturation_risk text DEFAULT 'medium';
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS tiktok_potential text DEFAULT 'medium';
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS is_aliexpress_choice boolean DEFAULT false;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE winning_products ADD COLUMN IF NOT EXISTS search_count integer DEFAULT 0;
`;

// Migration 3: waitlist schema
const M3 = `
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  feature text NOT NULL DEFAULT 'general',
  name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email, feature)
);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='waitlist' AND policyname='Public insert to waitlist') THEN
    CREATE POLICY "Public insert to waitlist" ON waitlist FOR INSERT WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ads_manager_waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ads_manager_waitlist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ads_manager_waitlist' AND policyname='Insert only') THEN
    CREATE POLICY "Insert only" ON ads_manager_waitlist FOR INSERT WITH CHECK (true);
  END IF;
END $$;
`;

// Migration 4: discord_user_id
const M4 = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_user_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_discord_user_id ON users (discord_user_id) WHERE discord_user_id IS NOT NULL;
`;

router.get('/run-migrations', async (req: Request, res: Response) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!token || token !== SERVICE_KEY) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  // Try direct IPv6 DB URL (Vercel supports IPv6; Mac does not)
  // Supabase direct URL: postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres
  const dbUrl = process.env.SUPABASE_DB_DIRECT ||
    `postgresql://postgres:${encodeURIComponent('Romania1992!Chicken.')}@db.ievekuazsjbdrltsdksn.supabase.co:5432/postgres`;
  
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  const results: Record<string, string> = {};

  const runMigration = async (name: string, sql: string) => {
    const client = await pool.connect();
    try {
      await client.query(sql);
      results[name] = '✅ success';
    } catch (e: any) {
      results[name] = `❌ ${e.message}`;
    } finally {
      client.release();
    }
  };

  try {
    await runMigration('1_opportunity_score', M1);
    await runMigration('2_pipeline_schema', M2);
    await runMigration('3_waitlist_schema', M3);
    await runMigration('4_discord_user_id', M4);

    // Verify key outcomes
    const verify = await pool.query(`
      SELECT
        (SELECT count(*) FROM information_schema.columns WHERE table_name='winning_products' AND column_name='opportunity_score') as opp_score_col,
        (SELECT count(*) FROM information_schema.tables WHERE table_name='apify_run_queue') as arq_table,
        (SELECT count(*) FROM information_schema.tables WHERE table_name='waitlist') as waitlist_table,
        (SELECT count(*) FROM information_schema.tables WHERE table_name='pipeline_logs') as pipeline_logs_table,
        (SELECT count(*) FROM information_schema.columns WHERE table_name='users' AND column_name='discord_user_id') as discord_col
    `);
    const v = verify.rows[0];
    results['verification'] = {
      opportunity_score_column: v.opp_score_col === '1' ? '✅ exists' : '❌ missing',
      apify_run_queue_table: v.arq_table === '1' ? '✅ exists' : '❌ missing',
      waitlist_table: v.waitlist_table === '1' ? '✅ exists' : '❌ missing',
      pipeline_logs_table: v.pipeline_logs_table === '1' ? '✅ exists' : '❌ missing',
      discord_user_id_column: v.discord_col === '1' ? '✅ exists' : '❌ missing',
    } as any;

    // Count opportunity_score backfill
    const opp = await pool.query(`SELECT count(*) FROM winning_products WHERE opportunity_score IS NOT NULL AND is_active=true`);
    results['opportunity_score_backfilled'] = `${opp.rows[0].count} rows`;

  } catch (e: any) {
    results['connection_error'] = e.message;
  } finally {
    await pool.end();
  }

  res.json({ migrations: results, ran_at: new Date().toISOString() });
});

export default router;
