-- Japanese Study v12 normalized progress schema. Generic skill_key + JSON progress supports SRS evidence, response timing and all learning domains.
-- Japanese Study v10 normalized user-learning schema.
-- Safe to run alongside the legacy public.user_progress table.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_course_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_lessons text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.user_item_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_key text not null,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_key)
);

create table if not exists public.user_daily_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  devices jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, study_date)
);

create table if not exists public.user_learning_meta (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lifetime jsonb not null default '{"devices":{}}'::jsonb,
  active_session jsonb,
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  primary key (user_id, session_id)
);

alter table public.user_settings enable row level security;
alter table public.user_course_progress enable row level security;
alter table public.user_item_progress enable row level security;
alter table public.user_daily_stats enable row level security;
alter table public.user_learning_meta enable row level security;
alter table public.study_sessions enable row level security;

grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.user_course_progress to authenticated;
grant select, insert, update, delete on public.user_item_progress to authenticated;
grant select, insert, update, delete on public.user_daily_stats to authenticated;
grant select, insert, update, delete on public.user_learning_meta to authenticated;
grant select, insert, update, delete on public.study_sessions to authenticated;

-- Each table is private to auth.uid().
do $$
declare
  tbl text;
begin
  foreach tbl in array array['user_settings','user_course_progress','user_item_progress','user_daily_stats','user_learning_meta','study_sessions']
  loop
    execute format('drop policy if exists "users own rows" on public.%I', tbl);
    execute format('create policy "users own rows" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', tbl);
  end loop;
end $$;
