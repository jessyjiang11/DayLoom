begin;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'items' and column_name = 'is_actionable'
  ) then
    alter table public.items add column is_actionable boolean not null default true;
    update public.items
    set is_actionable = kind in ('project', 'task');
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'items' and column_name = 'show_on_home'
  ) then
    alter table public.items add column show_on_home boolean not null default false;
  end if;
end;
$$;

create index if not exists items_home_visible_idx
  on public.items (user_id, sort_order)
  where show_on_home and deleted_at is null;

create or replace function public.create_sample_workspace()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  direction_id uuid;
  goal_id uuid;
  project_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if exists (select 1 from public.items where user_id = current_user_id) then
    update public.profiles set onboarding_mode = 'sample' where user_id = current_user_id;
    return false;
  end if;

  insert into public.items (user_id, kind, title, description, status, sort_order, is_actionable, show_on_home)
  values (current_user_id, 'direction', '让计划真正帮助生活', '用更轻松、可调整的方式，把想做的事慢慢变成日常。', 'doing', 100, false, true)
  returning id into direction_id;

  insert into public.items (user_id, parent_id, kind, title, description, status, sort_order, is_actionable)
  values (current_user_id, direction_id, 'goal', '建立适合自己的计划节奏', '先从一周开始尝试，不需要一次做到完美。', 'doing', 100, false)
  returning id into goal_id;

  insert into public.items (user_id, parent_id, kind, title, description, status, sort_order, is_actionable)
  values (current_user_id, goal_id, 'project', '完成我的第一个周计划', '把任务放进本周，再逐渐安排到具体日期。', 'doing', 100, true)
  returning id into project_id;

  insert into public.items (user_id, parent_id, kind, title, description, status, sort_order, is_important, is_actionable)
  values
    (current_user_id, project_id, 'task', '写下这周最想推进的一件事', '', 'todo', 100, true, true),
    (current_user_id, project_id, 'task', '把一项任务拖到合适的日期', '', 'todo', 200, false, true),
    (current_user_id, project_id, 'task', '周末花十分钟做一次复盘', '', 'todo', 300, false, true);

  insert into public.period_notes (user_id, period_type, period_start, focus_text)
  values (current_user_id, 'week', date_trunc('week', current_date)::date, '先做出能坚持的，再慢慢长成理想的样子。')
  on conflict (user_id, period_type, period_start) do nothing;

  update public.profiles set onboarding_mode = 'sample' where user_id = current_user_id;
  return true;
end;
$$;

revoke all on function public.create_sample_workspace() from public, anon;
grant execute on function public.create_sample_workspace() to authenticated;

commit;
