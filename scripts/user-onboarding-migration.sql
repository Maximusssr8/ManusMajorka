-- user-onboarding-migration.sql
-- Onboarding checklist state (v3 — Engagement Director).
-- Additive: the table may already exist with a v2 shape. We add the v3 columns
-- via IF NOT EXISTS so this is safe to run against both fresh and upgraded dbs.
-- RLS: user_id::text = auth.uid()::text (Majorka UUID cast pattern).

create table if not exists public.user_onboarding (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade unique,
  profile_complete  boolean default false,
  first_search      boolean default false,
  first_save        boolean default false,
  first_brief       boolean default false,
  store_connected   boolean default false,
  completed_at      timestamptz,
  created_at        timestamptz default now()
);

-- v2 → v3 additive columns (idempotent).
alter table public.user_onboarding add column if not exists profile_complete boolean default false;
alter table public.user_onboarding add column if not exists first_search boolean default false;
alter table public.user_onboarding add column if not exists first_save boolean default false;
alter table public.user_onboarding add column if not exists first_brief boolean default false;
alter table public.user_onboarding add column if not exists store_connected boolean default false;
alter table public.user_onboarding add column if not exists completed_at timestamptz;
alter table public.user_onboarding add column if not exists created_at timestamptz default now();

create unique index if not exists user_onboarding_user_id_unique on public.user_onboarding (user_id);

alter table public.user_onboarding enable row level security;

drop policy if exists "Users manage own onboarding" on public.user_onboarding;
create policy "Users manage own onboarding" on public.user_onboarding
  for all using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);
