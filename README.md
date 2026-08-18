# Japanese Study v10

一个从 Kana Study 重构而来的离线优先日语学习系统。产品层不再把“假名、词汇、语法”做成三个互不相关的小工具，而是使用统一的课程、技能、练习、SRS、Session 和进度模型。

## 当前包含

- 208 个假名训练项：平假名 104 + 片假名 104
- 135 个基础词汇
- 36 条 N5 / N4 入门语法
- 40 条关联例句
- 58 节课程
  - 42 节假名课程/规则课
  - 16 节综合日语课程
- 统一 SRS：假名、词汇、语法共享调度引擎
- 多技能掌握度
  - 假名：识别 / 主动回忆
  - 词汇：词义 / 读音 / 中→日
  - 语法：理解 / 应用
- 到期复习、薄弱强化、最近 14 天错题
- 错题 3–5 题后短期重现
- 课程 Session、完成总结
- 内容库：假名 / 词汇 / 语法搜索与详情
- GitHub 风格 365 天学习活跃度
- PWA / 离线缓存
- Supabase 登录和多设备同步
- v8 / v9 学习记录迁移
- 数据导入 / 导出
- GitHub Actions 自动检查与测试

> 当前项目已经完成“完整学习平台”的代码结构，但内容语料不是完整 JLPT N1 全量词库/语法库。当前内置的是可实际使用的 N5 主体 + N4 入门种子内容。后续扩充内容只需新增 `src/data/` 数据，不需要再次推翻学习引擎。

## 一级页面

- 首页：今日目标、待复习、推荐课程、能力概览
- 学习：课程路线
- 复习：到期 / 薄弱 / 最近错题 / 分类专项
- 内容库：假名 / 词汇 / 语法
- 进度：总览 / 能力 / 365 天活跃度

答题过程使用独立的 `#study` 页面，不占主导航名额。

## 项目结构

```text
japanese-study/
├── index.html
├── manifest.webmanifest
├── sw.js
├── CNAME
├── css/
├── icons/
├── schemas/
├── src/
│   ├── core/
│   ├── data/
│   ├── domain/
│   ├── learning/
│   ├── review/
│   ├── sync/
│   ├── components/
│   ├── ui/
│   └── views/
├── supabase/
├── scripts/
├── test/
└── .github/workflows/
```

## 本地检查

只需要 Node.js 22+：

```bash
npm run verify
```

等价于：

```bash
npm run check
npm test
```

项目本身仍是纯静态站点，不需要 npm build。

## Supabase

### 推荐：v10 规范化表

在 Supabase SQL Editor 执行：

```text
supabase/schema-v10.sql
```

会创建：

- `user_settings`
- `user_course_progress`
- `user_item_progress`
- `user_daily_stats`
- `user_learning_meta`
- `study_sessions`

并开启 RLS，每个用户只能访问自己的记录。

### 兼容旧项目

如果你暂时没有执行 `schema-v10.sql`，代码会自动回退到旧的：

```text
public.user_progress
```

因此可以先直接部署，再决定什么时候执行数据库升级。

当规范化表存在但还没有数据时，应用会继续读取旧 `user_progress`；下一次同步会写入 v10 表，从而完成渐进迁移。

## 部署

这是 GitHub Pages 兼容的静态项目。保持仓库根目录发布即可。

自定义域名仍使用：

```text
nihongo.jokersh.site
```

## 内容扩展

核心内容位于：

```text
src/data/vocabulary.js
src/data/grammar.js
src/data/sentences.js
src/data/japanese-lessons.js
```

内容约束参考：

```text
schemas/vocabulary.schema.json
schemas/grammar.schema.json
schemas/lesson.schema.json
```

`scripts/check.mjs` 会验证：

- ID 是否重复
- 课程引用是否存在
- 例句引用的词汇/语法是否存在
- ES Module 相对 import 是否存在
- 所有 JS 是否能通过语法检查

因此后续可以让 Agent 批量扩充 N5/N4/N3 内容，同时由 CI 阻止明显的数据结构错误进入 main。

## 数据模型

学习进度不是一个 `mastery` 数字，而是按技能维度存储，例如：

```text
vocab:taberu::meaning
vocab:taberu::reading
vocab:taberu::production

grammar:teiru::meaning
grammar:teiru::application

hiragana:し::recognition
hiragana:し::recall
```

每个技能独立保存：

```text
mastery
stabilityDays
difficulty
correctStreak
lapseCount
lastResult
lastReviewedAt
nextReviewAt
counters
```

这使以后加入汉字、听力、阅读时无需再重写 SRS。
