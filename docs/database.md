# DayLoom 数据库说明

## 数据保存在哪里

正式版使用 Supabase PostgreSQL。每个账户拥有自己的目标、任务、排期、标签、周期笔记和复盘。`prototype/` 中的本地演示数据不会自动上传。

## 表与用途

| 表 | 用途 |
|---|---|
| `profiles` | 昵称、时区、每周开始日与首次使用状态 |
| `items` | 人生方向、阶段目标、项目和普通任务 |
| `schedule_changes` | 延期与重新排期历史 |
| `tags` / `item_tags` | 用户标签和任务关联 |
| `period_notes` | 本周重点、本周一句话等周期意图 |
| `reviews` | 日、周、月复盘 |

## 个人数据隔离

每张业务表都启用并强制执行 Row Level Security（RLS）。登录用户只能对 `user_id = auth.uid()` 的记录进行读取、创建、修改和删除。父目标、任务与标签的外键同时校验 `user_id`，防止把自己的数据关联到另一个账户。

前端只使用 Project URL 和 publishable/anon key。`service_role`、数据库密码和账户密码不得写入仓库、网页环境变量或 GitHub Pages。

## 应用迁移

1. 在 Supabase 创建项目。
2. 使用 Supabase CLI 连接项目。
3. 执行 `supabase db push` 应用 `supabase/migrations/`。
4. 使用本地 Supabase 执行 `supabase test db` 验证 `supabase/tests/rls_isolation.sql`。
5. 将 Project URL 和 publishable key 放入本地 `web/.env`；该文件已被 Git 忽略。

在未安装 Supabase CLI 或未连接测试项目时，不要把迁移直接应用到生产数据。首次上线前必须在空项目完成 RLS 隔离测试。
