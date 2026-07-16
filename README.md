# DayLoom / 不秃

> 把长期方向慢慢落实到今天。

DayLoom（中文名：不秃）是一款连接长期目标、日常排期与复盘成长的计划工具。当前正式网页版使用 React、Supabase 和 GitHub Pages，支持账户登录和多设备数据同步。

## 在线使用

[打开 DayLoom / 不秃](https://jessyjiang11.github.io/DayLoom/)

首次使用需要注册账户。每位用户的数据均通过 Supabase Row Level Security 隔离。

## 当前功能

- 人生方向、阶段目标、项目与普通任务组成的目标树
- 目标可独立设置“作为执行项”和“显示在首页”
- 月、周、日三种计划视图与拖拽排期
- 点击日期添加任务，今日小时轴拖选时间段
- 今日重点、收集箱和长期目标卡片
- 日、周、月复盘并保存到云端
- 默认首页、昵称、时区与周起始日设置
- 本地缓存、断网只读与多设备实时更新

## 本地开发

1. 复制 `web/.env.example` 为 `web/.env`。
2. 填写 Supabase Project URL 与 publishable key。
3. 安装依赖并启动：

```powershell
pnpm --dir web install
pnpm --dir web dev
```

访问 `http://localhost:5173/DayLoom/`。

## 数据库

按顺序运行 `supabase/migrations/` 中的 SQL 文件。前端只能使用 publishable key，严禁放入 `service_role` key 或数据库密码。

## 验证

```powershell
pnpm --dir web test
pnpm --dir web lint
pnpm --dir web build
```

早期 v0.3 静态交互原型保留在 `prototype/`，仅用于产品设计追溯。

## 隐私说明

账户邮箱、资料、目标、任务、排期与复盘存储在项目配置的 Supabase 实例中。公开仓库只包含前端代码和数据库结构，不包含用户数据、`service_role` key 或数据库密码。
