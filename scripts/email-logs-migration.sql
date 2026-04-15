-- email-logs-migration.sql
-- Delivery log for transactional + digest emails. Used by /api/cron/daily-digest
-- to dedupe per user per day (Engagement Director).

create table if not exists public.email_logs (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid references auth.users(id) on delete cascade,
  type     text not null,
  sent_at  timestamptz default now(),
  status   text default 'sent',
  error    text
);

create index if not exists idx_email_logs_user_type_day
  on public.email_logs (user_id, type, (sent_at::date));

alter table public.email_logs enable row level security;

-- No user-level policy required — writes/reads happen via SERVICE_ROLE on the server.
-- Deliberately omit FOR ALL so RLS denies direct access from the anon client.

-- Lightweight user_preferences table (minimal — only what daily-digest needs).
-- Additive; safe if the table already exists with richer columns.
create table if not exists public.user_preferences (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email_digest  boolean default true,
  digest_frequency text default 'daily' check (digest_frequency in ('daily','weekly','never')),
  updated_at    timestamptz default now()
);

alter table public.user_preferences add column if not exists email_digest boolean default true;
alter table public.user_preferences add column if not exists digest_frequency text default 'daily';
alter table public.user_preferences add column if not exists updated_at timestamptz default now();

alter table public.user_preferences enable row level security;

drop policy if exists "Users manage own preferences" on public.user_preferences;
create policy "Users manage own preferences" on public.user_preferences
  for all using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);
