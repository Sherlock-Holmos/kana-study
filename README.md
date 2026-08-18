# Japanese Study v11

Japanese Study 是一个纯静态、可部署到 GitHub Pages 的日语学习系统。v11 将 v10 的「假名 + 词汇 + 语法」平台扩展为面向 N5 核心学习路线的六域学习系统：

- 假名：平假名 / 片假名、清音、浊音/半浊音、拗音
- 词汇：N5 核心词汇与生活场景扩展
- 语法：N5 核心语法 + 少量 N4 入门衔接
- 汉字：N5 常用核心汉字
- 阅读：短篇 N5 阅读理解
- 听力：基于 Web Speech API 的日语合成语音理解题

> 说明：JLPT 官方并不发布唯一、封闭的 N5 词汇/语法清单。本项目的“N5”表示面向 N5 入门能力的核心覆盖，不声称是官方题库或官方完整清单。

## v11 内容规模

运行 `npm run check` 会打印当前实际内容数量。当前版本包含：

- 208 个可训练假名项
- 487 个词汇项
- 95 个语法项
- 118 个汉字项
- 111 条例句
- 24 篇阅读理解
- 24 组听力理解
- 76 节课程（包含 42 节假名课程和综合日语课程）

## 学习模型

所有内容统一进入 Skill / SRS 模型：

- 假名：识别、主动回忆
- 词汇：词义、读音、中→日产出
- 语法：理解、应用
- 汉字：意义、读音
- 阅读：理解
- 听力：理解

每个技能独立维护：

- mastery
- stabilityDays
- difficulty
- correctStreak
- lapseCount
- lastReviewedAt
- nextReviewAt
- 多设备计数器

## 页面结构

- 首页：今日目标、到期复习、推荐课程、六域能力概览
- 学习：课程路线
- 复习：到期、薄弱、最近错题、六域专项复习
- 内容库：假名 / 词汇 / 语法 / 汉字 / 阅读 / 听力
- 进度：总览、六域能力、365 天学习热力图

## 听力

听力题使用浏览器 `SpeechSynthesis` / Web Speech API 合成 `ja-JP` 日语语音。

- Chrome / Edge / Safari 的可用音色取决于操作系统
- 没有安装日语语音时，浏览器可能使用默认声音或无法播放
- 听力题在提交答案前不显示原文，提交后会显示原文和参考译意

## 数据与 Supabase

v11 的用户学习数据 Schema 版本为 `11`。

现有 v5 / v8 / v9 / v10 本地数据会经过 `sanitizeState()` 迁移到 v11；新增加的词汇、语法、汉字、阅读和听力 Skill 会自动使用默认状态补齐。

Supabase 规范化表使用通用 `skill_key + progress JSONB`，因此 v10 表结构已经能够保存 v11 新内容类型，不强制迁移数据库。

仓库同时提供：

- `supabase/schema-v11.sql`：推荐的规范化表结构
- `supabase/schema.sql`：旧 `user_progress` 兼容表

如果规范化表不存在，前端仍会回退到旧 `user_progress` 快照。

## 本地验证

需要 Node.js 22（CI 使用 Node 22）：

```bash
npm run verify
```

它会执行：

```text
npm run check
npm test
npm run smoke
```

覆盖：

- JS 语法
- ES Module 文件引用
- 内容 ID 唯一性
- 课程内容引用
- N5 六域最低内容规模
- 阅读 / 听力正确答案合法性
- Service Worker App Shell 引用
- 数据迁移
- SRS
- 多设备合并
- 错题短期重现
- 汉字 / 阅读 / 听力题型
- 首页启动与全局导航 Smoke Test

## 部署

项目无需构建工具。直接把仓库根目录部署到 GitHub Pages 即可。

当前项目保留：

```text
CNAME -> nihongo.jokersh.site
```

部署更新后如果浏览器仍显示旧页面，可先进行一次强制刷新。v11 的 Service Worker Cache 名称为 `japanese-study-v11`，代码和 HTML 使用 network-first，避免旧模块与新模块混用导致白屏。

## 项目结构

```text
src/
├── app.js
├── components/
├── core/
├── data/
│   ├── kana.js
│   ├── vocabulary.js
│   ├── n5-vocabulary-extra.js
│   ├── grammar.js
│   ├── n5-grammar-extra.js
│   ├── kanji.js
│   ├── sentences.js
│   ├── n5-sentences-extra.js
│   ├── reading.js
│   ├── listening.js
│   ├── japanese-lessons.js
│   ├── n5-lessons-extra.js
│   └── curriculum.js
├── domain/
├── learning/
├── review/
├── sync/
├── ui/
└── views/
```

## 后续扩展

当前架构已经可以继续增加：

- N4 / N3 内容包
- 真人音频替代 Web Speech API
- 更丰富的听力题型
- 长篇阅读
- 汉字书写训练
- 阅读语法标注
- 发音/口语训练

这些扩展不需要再次推翻 Skill / SRS / Session / Supabase 主架构。
