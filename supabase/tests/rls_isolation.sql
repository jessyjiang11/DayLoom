begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'dayloom-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'dayloom-b@example.test');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select lives_ok(
  $$insert into public.items (id, kind, title)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'task', '用户 A 的任务')$$,
  '用户 A 可以创建自己的任务'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select lives_ok(
  $$insert into public.items (id, kind, title)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'task', '用户 B 的任务')$$,
  '用户 B 可以创建自己的任务'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select is(
  (select count(*) from public.items),
  1::bigint,
  '用户 A 只能读取自己的任务'
);

select is(
  (select count(*) from public.items where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  0::bigint,
  '用户 A 无法读取用户 B 的任务'
);

select is(
  (with changed as (
    update public.items set title = '越权修改'
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    returning 1
  ) select count(*) from changed),
  0::bigint,
  '用户 A 无法修改用户 B 的任务'
);

select is(
  (with removed as (
    delete from public.items
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    returning 1
  ) select count(*) from removed),
  0::bigint,
  '用户 A 无法删除用户 B 的任务'
);

select throws_ok(
  $$insert into public.items (user_id, kind, title)
    values ('22222222-2222-4222-8222-222222222222', 'task', '伪造归属')$$,
  '42501',
  null,
  '用户 A 无法伪造用户 B 的 user_id'
);

select throws_ok(
  $$insert into public.items (user_id, parent_id, kind, title)
    values (
      '11111111-1111-4111-8111-111111111111',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'task',
      '跨账户子任务'
    )$$,
  '23503',
  null,
  '任务不能挂到其他用户的父目标下'
);

select * from finish();
rollback;
