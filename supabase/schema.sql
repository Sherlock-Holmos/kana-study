create table if not exists public.user_progress (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,
  progress jsonb not null
    default '{}'::jsonb,
  updated_at timestamptz not null
    default now()
);

alter table public.user_progress enable row level security;

grant select, insert, update on public.user_progress to authenticated;

drop policy if exists "users can read own progress" on public.user_progress;
create policy "users can read own progress"
on public.user_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users can insert own progress" on public.user_progress;
create policy "users can insert own progress"
on public.user_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "users can update own progress" on public.user_progress;
create policy "users can update own progress"
on public.user_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
