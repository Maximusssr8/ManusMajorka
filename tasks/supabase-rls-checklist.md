# Supabase RLS Checklist

Run these in Supabase SQL Editor to audit RLS status:

## Check which tables have RLS enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

## Check existing policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

## Tables that MUST have RLS + correct policies:

### user_subscriptions
```sql
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role manages subscriptions" ON public.user_subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own subscription" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

### generated_stores
```sql
ALTER TABLE public.generated_stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their stores" ON public.generated_stores
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### user_onboarding
```sql
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their onboarding" ON public.user_onboarding
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### shopify_connections
```sql
ALTER TABLE public.shopify_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their connections" ON public.shopify_connections
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### profiles (if exists)
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```
