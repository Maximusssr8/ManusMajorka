# Supabase RLS Notes

## Required RLS Policies (run in Supabase Dashboard SQL Editor)

### user_subscriptions table
```sql
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### users table
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

**DO NOT run these automatically** — Max must review and apply via Supabase dashboard.
