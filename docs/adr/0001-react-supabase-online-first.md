# ADR-0001：React + Supabase 的在线优先架构

## 状态

已接受（2026-07-16）

## 背景

DayLoom / 不秃 v0.3 是纯 HTML、CSS、JavaScript 的本地交互原型。v0.4 需要提供邮箱注册登录、个人资料、跨设备云端保存、多设备实时更新，并为未来 SwiftUI iOS App 和 Tauri Windows 客户端保留同一套数据后端。

项目处于个人学习与早期 MVP 阶段，需要尽量使用免费额度，避免自建服务器，同时必须保证不同用户的数据在数据库层隔离。

## 决策

- 保留 `prototype/` 作为 v0.3 对照，在 `web/` 新建 React + TypeScript + Vite 正式应用。
- 使用 Supabase Auth、PostgreSQL、Realtime 和 Row Level Security。
- v0.4 采用“在线优先 + 实时更新”：联网时云端为权威数据源；本地只缓存最近成功读取的数据；离线可查看但不允许修改。
- 每张业务表保存 `user_id`，启用 RLS，并使用 `(select auth.uid()) = user_id` 策略及 `user_id` 索引。
- Web 与未来 iOS/Windows 客户端共享账户、数据库结构和权限，不共享 UI 代码。
- 网页使用 GitHub Pages，Supabase URL 与 publishable/anon key 通过构建环境注入；任何 `service_role` 密钥禁止进入前端或 GitHub 仓库。

## 后果

### 正面

- 不需要维护自建 API 服务器即可获得登录、数据库与实时同步。
- PostgreSQL 适合目标父子关系、标签、排期和复盘统计。
- RLS 在数据库层隔离用户，前端错误不会直接暴露全库数据。
- `supabase-js` 与 `supabase-swift` 可以访问相同的数据模型。
- React 组件化和 TypeScript 类型适合继续扩展复杂交互。

### 负面

- 免费 Supabase 项目闲置后可能暂停，恢复时会产生等待。
- GitHub Pages 只能托管前端，不能隐藏管理密钥或执行可信服务端代码。
- React、TypeScript、RLS 与实时订阅增加前期学习成本。
- v0.4 不支持断网编辑；完整离线冲突合并留到后续版本。

### 中性

- iOS 使用 SwiftUI 重做界面，但复用数据契约和权限规则。
- 未来需要 AI、定时任务或可信后台逻辑时，再引入 Supabase Edge Functions。

## 备选方案

### Firebase Auth + Firestore

登录容易、免费额度充足，但目标树、关联标签、排期历史和统计更适合关系型数据；Firestore Security Rules 还会引入另一套规则语言。

### 自建 Node.js API + PostgreSQL

学习深度更高、控制力更强，但当前需要额外承担服务器费用、部署、鉴权、日志、备份和安全维护，超出早期 MVP 的必要范围。

### 继续使用原生 JavaScript

短期迁移少，但现有 `app.mjs` 已承担大量页面、状态和交互逻辑，继续叠加登录和同步会显著增加维护风险。

## 参考

- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- https://supabase.com/docs/reference/swift/introduction

