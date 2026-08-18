-- Japanese Study v15 optional extension.
-- Existing v12 normalized tables remain compatible.
-- This table is optional; the current frontend also stores the profile in user_learning_meta.meta.v15.
create table if not exists public.user_learning_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ability_profile jsonb not null default '{}'::jsonb,
  planner_state jsonb not null default '{}'::jsonb,
  diagnostic_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_learning_profiles enable row level security;
drop policy if exists "users read own learning profile" on public.user_learning_profiles;
create policy "users read own learning profile" on public.user_learning_profiles for select using (auth.uid() = user_id);
drop policy if exists "users write own learning profile" on public.user_learning_profiles;
create policy "users write own learning profile" on public.user_learning_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
