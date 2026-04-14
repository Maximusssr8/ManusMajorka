-- academy-progress-migration.sql
-- Tracks which Academy lessons each user has completed (server-side, cross-device).
-- RLS: user_id::text = auth.uid()::text (Majorka UUID cast pattern).

create table if not exists public.academy_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  lesson_id    text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists academy_progress_user_idx on public.academy_progress (user_id);
create index if not exists academy_progress_lesson_idx on public.academy_progress (lesson_id);

alter table public.academy_progress enable row level security;

drop policy if exists "academy_progress_select_own" on public.academy_progress;
create policy "academy_progress_select_own" on public.academy_progress
  for select using (user_id::text = auth.uid()::text);

drop policy if exists "academy_progress_insert_own" on public.academy_progress;
create policy "academy_progress_insert_own" on public.academy_progress
  for insert with check (user_id::text = auth.uid()::text);

drop policy if exists "academy_progress_delete_own" on public.academy_progress;
create policy "academy_progress_delete_own" on public.academy_progress
  for delete using (user_id::text = auth.uid()::text);

-- Lightweight tip-of-the-week store used by the weekly digest.
create table if not exists public.maya_tips (
  id         uuid primary key default gen_random_uuid(),
  tip        text not null,
  active     bool not null default true,
  created_at timestamptz not null default now()
);
