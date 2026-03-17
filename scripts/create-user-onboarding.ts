import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Parse .env.local manually
const envContent = readFileSync('.env.local', 'utf8');
const env: Record<string,string> = {};
for (const line of envContent.split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const idx = line.indexOf('=');
  if (idx > 0) env[line.slice(0,idx).trim()] = line.slice(idx+1).trim();
}

const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log('Checking tables...');

  const tables = ['user_subscriptions', 'generated_stores', 'user_onboarding', 'trend_signals'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`❌ ${t}: ${error.code} — ${error.message.slice(0,80)}`);
    } else {
      console.log(`✅ ${t}: exists (${data?.length ?? 0} rows sampled)`);
    }
  }

  // Try to create user_onboarding via exec_sql rpc
  console.log('\nAttempting to create user_onboarding via rpc...');
  const sql = `
    CREATE TABLE IF NOT EXISTS public.user_onboarding (
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      scouted_product bool DEFAULT false,
      generated_store bool DEFAULT false,
      connected_shopify bool DEFAULT false,
      pushed_to_shopify bool DEFAULT false,
      completed_at timestamptz,
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
  `;
  
  const { error: rpcError } = await supabase.rpc('exec_sql', { sql });
  if (rpcError) {
    console.log('exec_sql not available:', rpcError.message.slice(0,80));
    console.log('\n⚠️  Run this in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new');
    console.log(sql);
  } else {
    console.log('✅ user_onboarding created!');
  }
}

main().catch(console.error);
