begin;

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text,
  timezone text not null default 'Asia/Shanghai',
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  onboarding_mode text check (onboarding_mode in ('sample', 'blank')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_id uuid,
  kind text not null check (kind in ('direction', 'goal', 'project', 'task')),
  title text not null check (char_length(title) between 1 and 240),
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'abandoned')),
  sort_order numeric not null default 0,
  is_important boolean not null default false,
  is_focus boolean not null default false,
  schedule_granularity text check (schedule_granularity in ('month', 'week', 'day', 'time')),
  schedule_date date,
  schedule_start_time time,
  schedule_period_start date,
  schedule_period_end date,
  duration_minutes smallint check (duration_minutes between 1 and 1440),
  version bigint not null default 1 check (version > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_id_user_unique unique (id, user_id),
  constraint items_parent_owned foreign key (parent_id, user_id)
    references public.items(id, user_id) on delete cascade,
  constraint items_schedule_period_order check (
    schedule_period_end is null or schedule_period_start is null or schedule_period_end >= schedule_period_start
  ),
  constraint items_schedule_shape check (
    (schedule_granularity is null and schedule_date is null and schedule_start_time is null
      and schedule_period_start is null and schedule_period_end is null)
    or (schedule_granularity = 'month' and schedule_period_start is not null and schedule_period_end is not null
      and schedule_date is null and schedule_start_time is null)
    or (schedule_granularity = 'week' and schedule_period_start is not null and schedule_period_end is not null
      and schedule_date is null and schedule_start_time is null)
    or (schedule_granularity = 'day' and schedule_date is not null and schedule_start_time is null
      and schedule_period_start is null and schedule_period_end is null)
    or (schedule_granularity = 'time' and schedule_date is not null and schedule_start_time is not null
      and schedule_period_start is null and schedule_period_end is null)
  )
);

create table public.schedule_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null,
  from_schedule jsonb not null default '{}'::jsonb check (jsonb_typeof(from_schedule) = 'object'),
  to_schedule jsonb not null default '{}'::jsonb check (jsonb_typeof(to_schedule) = 'object'),
  reason text check (reason is null or char_length(reason) <= 500),
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_changes_item_owned foreign key (item_id, user_id)
    references public.items(id, user_id) on delete cascade
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text not null default '#587895' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_id_user_unique unique (id, user_id)
);

create table public.item_tags (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (item_id, tag_id),
  constraint item_tags_item_owned foreign key (item_id, user_id)
    references public.items(id, user_id) on delete cascade,
  constraint item_tags_tag_owned foreign key (tag_id, user_id)
    references public.tags(id, user_id) on delete cascade
);

create table public.period_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('day', 'week', 'month')),
  period_start date not null,
  focus_text text not null default '' check (char_length(focus_text) <= 1000),
  note_text text not null default '' check (char_length(note_text) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_type, period_start)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('day', 'week', 'month')),
  period_start date not null,
  summary text not null default '' check (char_length(summary) <= 4000),
  went_well text not null default '' check (char_length(went_well) <= 4000),
  blocked text not null default '' check (char_length(blocked) <= 4000),
  next_step text not null default '' check (char_length(next_step) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_type, period_start)
);

create index items_user_id_idx on public.items(user_id);
create index items_parent_id_idx on public.items(parent_id) where parent_id is not null;
create index items_schedule_date_idx on public.items(user_id, schedule_date) where schedule_date is not null;
create index items_schedule_period_start_idx on public.items(user_id, schedule_period_start)
  where schedule_period_start is not null;
create index items_active_sort_idx on public.items(user_id, sort_order) where deleted_at is null;
create index schedule_changes_user_id_idx on public.schedule_changes(user_id);
create index schedule_changes_item_id_idx on public.schedule_changes(item_id);
create index schedule_changes_changed_at_idx on public.schedule_changes(user_id, changed_at desc);
create index tags_user_id_idx on public.tags(user_id);
create unique index tags_user_name_unique_idx on public.tags(user_id, lower(name));
create index item_tags_user_id_idx on public.item_tags(user_id);
create index item_tags_tag_id_idx on public.item_tags(tag_id);
create index period_notes_user_period_idx on public.period_notes(user_id, period_type, period_start);
create index reviews_user_period_idx on public.reviews(user_id, period_type, period_start);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_item_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger items_touch_version before update on public.items
for each row execute function public.touch_item_version();
create trigger schedule_changes_touch_updated_at before update on public.schedule_changes
for each row execute function public.touch_updated_at();
create trigger tags_touch_updated_at before update on public.tags
for each row execute function public.touch_updated_at();
create trigger item_tags_touch_updated_at before update on public.item_tags
for each row execute function public.touch_updated_at();
create trigger period_notes_touch_updated_at before update on public.period_notes
for each row execute function public.touch_updated_at();
create trigger reviews_touch_updated_at before update on public.reviews
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, '新用户'), '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on table public.profiles, public.items, public.schedule_changes, public.tags,
  public.item_tags, public.period_notes, public.reviews from public, anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles, public.items, public.schedule_changes,
  public.tags, public.item_tags, public.period_notes, public.reviews to authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.items enable row level security;
alter table public.items force row level security;
alter table public.schedule_changes enable row level security;
alter table public.schedule_changes force row level security;
alter table public.tags enable row level security;
alter table public.tags force row level security;
alter table public.item_tags enable row level security;
alter table public.item_tags force row level security;
alter table public.period_notes enable row level security;
alter table public.period_notes force row level security;
alter table public.reviews enable row level security;
alter table public.reviews force row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'items', 'schedule_changes', 'tags', 'item_tags', 'period_notes', 'reviews'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_select_own', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      table_name || '_insert_own', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name || '_update_own', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_delete_own', table_name
    );
  end loop;
end;
$$;

revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.touch_item_version() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

commit;
