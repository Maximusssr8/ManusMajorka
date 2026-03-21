// Run: APIFY_API_KEY=xxx node scripts/apify-scrape-local.mjs
// Or set in .env.local and run via: node -r dotenv/config scripts/apify-scrape-local.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ievekuazsjbdrltsdksn.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const APIFY_TOKEN = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
const ACTOR = 'apify~web-scraper';

if (!APIFY_TOKEN) { console.error('Set APIFY_API_KEY env var'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('Apify AliExpress scraper — run with env vars set');
// Implementation in server/lib/apifyAliExpress.ts
