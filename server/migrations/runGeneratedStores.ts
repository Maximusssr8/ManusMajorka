/**
 * generated_stores migration — uses Supabase REST API (no direct DB connection needed).
 * Safe to call on every startup; idempotent via IF NOT EXISTS.
 */

export async function runGeneratedStoresMigration(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[migration] generated_stores: missing Supabase credentials — skipping');
    return;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const sql = `
    CREATE TABLE IF NOT EXISTS public.generated_stores (
      id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      store_name        text,
      niche             text,
      template          text,
      blueprint         jsonb,
      html              text,
      shopify_product_id text,
      pushed_at         timestamptz,
      created_at        timestamptz DEFAULT now()
    );
    ALTER TABLE public.generated_stores ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'generated_stores'
          AND policyname = 'Users own their stores'
      ) THEN
        CREATE POLICY "Users own their stores"
          ON public.generated_stores FOR ALL
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
      END IF;
    END $$;
  `;

  try {
    // Try exec_sql RPC first (may not exist on all projects)
    const rpc = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sql }),
    });

    if (rpc.ok) {
      console.log('[migration] generated_stores: table created/verified via exec_sql RPC');
      return;
    }

    // RPC not available — check if table already exists via REST
    const check = await fetch(`${supabaseUrl}/rest/v1/generated_stores?limit=1`, {
      headers,
    });

    if (check.ok || check.status === 200) {
      console.log('[migration] generated_stores: table already exists ✓');
    } else if (check.status === 404 || check.status === 406) {
      // Table doesn't exist and we can't create it via REST DDL
      // This is non-fatal — feature degrades gracefully (saves are skipped)
      console.warn(
        '[migration] generated_stores: table not found and exec_sql RPC unavailable.',
        'Please run this SQL in Supabase dashboard → SQL Editor:',
        'CREATE TABLE IF NOT EXISTS public.generated_stores (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, store_name text, niche text, template text, blueprint jsonb, html text, shopify_product_id text, pushed_at timestamptz, created_at timestamptz DEFAULT now()); ALTER TABLE public.generated_stores ENABLE ROW LEVEL SECURITY;'
      );
    } else {
      console.warn('[migration] generated_stores: unexpected status', check.status);
    }
  } catch (err) {
    // Never block startup
    console.warn('[migration] generated_stores error (non-fatal):', String(err).slice(0, 120));
  }
}
