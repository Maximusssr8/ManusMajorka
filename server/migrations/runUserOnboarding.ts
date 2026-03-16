/**
 * user_onboarding migration — REST API pattern (no direct DB).
 */

export async function runUserOnboardingMigration(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[migration] user_onboarding: missing Supabase credentials — skipping');
    return;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // Check if table exists
  const check = await fetch(`${supabaseUrl}/rest/v1/user_onboarding?limit=1`, { headers }).catch(() => null);

  if (check?.ok || check?.status === 200) {
    console.log('[migration] user_onboarding: table already exists ✓');
    return;
  }

  // Try exec_sql RPC (may not be available)
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
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_onboarding'
          AND policyname = 'Users own their onboarding'
      ) THEN
        CREATE POLICY "Users own their onboarding"
          ON public.user_onboarding FOR ALL
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
      END IF;
    END $$;
  `;

  try {
    const rpc = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sql }),
    });
    if (rpc.ok) {
      console.log('[migration] user_onboarding: created via exec_sql RPC');
    } else {
      console.warn('[migration] user_onboarding: exec_sql unavailable — manual SQL needed');
      console.warn('[migration] Run in Supabase SQL Editor: CREATE TABLE IF NOT EXISTS public.user_onboarding (user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY, scouted_product bool DEFAULT false, generated_store bool DEFAULT false, connected_shopify bool DEFAULT false, pushed_to_shopify bool DEFAULT false, completed_at timestamptz, created_at timestamptz DEFAULT now()); ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;');
    }
  } catch (err) {
    console.warn('[migration] user_onboarding error (non-fatal):', String(err).slice(0, 120));
  }
}
