import postgres from '/Users/maximus/ManusMajorka/node_modules/postgres/src/index.js';

const sql = postgres({
  host: 'db.ievekuazsjbdrltsdksn.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: 'Romania1992!Chicken.',
  ssl: { rejectUnauthorized: false },
});

try {
  console.log('Creating user_subscriptions table...');
  await sql`
    CREATE TABLE IF NOT EXISTS public.user_subscriptions (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      stripe_customer_id text,
      stripe_subscription_id text,
      plan text DEFAULT 'free',
      status text DEFAULT 'active',
      current_period_end timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(user_id)
    )
  `;
  console.log('✅ user_subscriptions created');

  await sql`ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY`;

  // Drop policies if exist, then recreate
  await sql`DROP POLICY IF EXISTS "Users can read own subscription" ON public.user_subscriptions`;
  await sql`DROP POLICY IF EXISTS "Service role full access" ON public.user_subscriptions`;

  await sql`
    CREATE POLICY "Users can read own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id)
  `;
  await sql`
    CREATE POLICY "Service role full access" ON public.user_subscriptions
    FOR ALL TO service_role USING (true)
  `;
  console.log('✅ RLS policies set on user_subscriptions');

  console.log('Creating usage_tracking table...');
  await sql`
    CREATE TABLE IF NOT EXISTS public.usage_tracking (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      tool_name text NOT NULL,
      used_at timestamptz DEFAULT now(),
      date date DEFAULT CURRENT_DATE
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS usage_tracking_user_date ON public.usage_tracking(user_id, date)`;
  console.log('✅ usage_tracking created');

  // Also add updated_at trigger function
  await sql`
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `;
  await sql`DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions`;
  await sql`
    CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column()
  `;
  console.log('✅ updated_at trigger set');

  console.log('\n🎉 All tables created successfully!');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
