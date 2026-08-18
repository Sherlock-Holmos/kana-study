# Japanese Study v12

面向中文学习者的静态日语学习系统。项目可直接部署到 GitHub Pages，Supabase 用于可选的账号与云端进度同步。

## v12 重点

- 今日计划：轻松 / 标准 / 强化三档，自动组合到期复习、薄弱强化与推荐课程。
- 教学化课程：每节课都有学习目标、预计用时、难度、前置关系与掌握目标。
- SRS 2.0：不同题型提供不同强度的记忆证据，主动产出高于四选一；同时记录作答耗时、平均耗时与证据分值。
- 听力流程：正常 / 慢速播放，作答前不展示原文，提交后才显示原文与译意。
- N5 学习完成度：综合课程完成度与假名、词汇、语法、汉字、阅读、听力六大领域掌握度。
- 内容治理：运行时为内容补齐 source / reviewStatus / contentVersion / confidence，并在 CI 中校验。
- 兼容旧数据：v5/v8/v9/v10/v11 状态均通过 `sanitizeState()` 升级到 schemaVersion 12。

## 内容规模

- 假名：208
- 词汇：487
- 语法：95
- 汉字：118
- 例句：111
- 阅读：24
- 听力：24
- 课程：76

这些内容是项目内置 N5 核心语料，不宣称是 JLPT 官方封闭题库。

## 本地验证

```bash
npm run verify
```

会执行：

```text
npm run check
npm test
npm run smoke
```

## 部署

纯静态项目，无构建步骤。将仓库推送到 GitHub Pages 即可。

自定义域名由根目录 `CNAME` 控制。

## Supabase

项目优先使用规范化进度表；如果这些表不存在，会回退到旧版 `public.user_progress` 快照。

新项目可执行：

```text
supabase/schema-v12.sql
```

浏览器中只允许使用 Supabase publishable/anon key，不要放置 service role key。

## 主要目录

```text
src/
├── core/          状态、指标、存储
├── data/          学习内容与课程
├── domain/        Skill 模型
├── learning/      Exercise、SRS、Daily Planner、Session
├── review/        到期/薄弱/错题筛选
├── sync/          Supabase 与多设备合并
├── ui/            弹窗
└── views/         页面渲染
```

## 当前限制

- 听力仍使用浏览器 Web Speech API，而不是人工录音或固定高质量音频资产。
- 内容已经通过结构和引用自动校验，但不等同于逐条人工语言学审校。
- `N5 学习完成度` 是站内学习指标，不代表 JLPT 官方成绩预测。
