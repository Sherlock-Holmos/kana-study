# Japanese Study v16.0.0

面向中文学习者的 N5 自适应日语学习系统。v16 的定位是 **N5 Production Complete**：在 v15 的 Adaptive Planner、Ability Profile、Assessment 2.0、Audio Layer 和增量同步基础上，补齐独立 Question Bank、内容发布管线、口语跟读基础、Audio 3.0 fallback、Schema 14 和真实浏览器 E2E 工作流。

## v16 核心变化

- **Question Bank 2.0**：学习内容和测验题目不再是一一绑定。当前 1067 个学习内容生成 2351 个独立 question variants，具有 `questionId / skill / variantType / difficulty / abilities / topics`。
- **Assessment 3.0**：阶段测验按 question variant 组卷，最近题目去重基于 `questionId`，而不是只基于 itemId；测验结果继续与 SRS 分离。
- **Speaking Foundation**：综合课程中的例句自动插入 Shadowing 卡片。支持播放原句、慢速播放、浏览器麦克风录音、即时回听和“完成 / 需要再练”自评。
- **隐私边界**：口语录音只存在当前页面内存与 Blob URL，不写 localStorage，不上传 Supabase，不伪造自动发音分数。
- **Audio 3.0**：音频仓库支持 listening / sentence / vocabulary 的固定音频 URL；没有固定音频时继续使用 Web Speech API fallback。
- **Content Pipeline 2.0**：`npm run content:build` 生成独立 JSON release bundles，包括 vocabulary、grammar、kanji、reading、listening、sentence、kana 和 `question-bank.json`。
- **Content Release**：`n5-2026.08-v16`，与 App Version 和 Data Schema 解耦。
- **Data Schema 14**：新增 `speaking` 学习统计，v15 Schema 13 自动迁移。
- **Cloud meta v16**：Planner / Ability / Assessment / Speaking / Sync 写入 `user_learning_meta.meta.v16`，加载时继续兼容 v15 meta。
- **生产构建**：继续使用内容哈希 ES Module graph，避免新旧模块缓存混用。
- **Browser E2E**：加入 Playwright desktop/mobile 测试与 GitHub Actions `Browser E2E` workflow。

## 当前内容规模

- 假名：208
- 词汇：487
- 语法：95
- 汉字：118
- 例句：111
- 阅读：24
- 听力：24
- 课程：76
- 阶段测验：6
- Question variants：2351

## 本地验证

```bash
npm run verify
```

完整验证顺序：

```text
content:build
→ content:report
→ build
→ check
→ unit tests
→ source smoke
→ production module graph smoke
→ HTTP smoke
```

真实浏览器 E2E 需要 Playwright：

```bash
npm install --no-save @playwright/test@1.55.0
npx playwright install chromium
npm run e2e
```

GitHub Actions 会在 `e2e.yml` 中自动安装 Chromium 并执行 desktop/mobile E2E。

## Supabase

Data Schema 为 14，但现有 v12/v15 规范化表仍然兼容。v16 的新增口语统计存入 `user_learning_meta.meta.v16`，不需要为了 v16 强制新建表。

`supabase/schema-v16.sql` 保留可选的 `user_learning_profiles` 扩展定义。不要把 service-role key 放进前端。

## 内容质量说明

自动 Schema、引用、Pedagogy tags、Question Bank 和构建校验通过，不代表 1067 条日语内容已经由专业教师逐条人工审校。当前 `CONTENT-QUALITY-REPORT.md` 会明确区分 automated validation 和 human review。

## 音频说明

v16 完成了固定音频资源层和 Shadowing 交互，但仓库没有伪造“真人录音包”。当前没有 `item.audio.normal` 的条目会使用浏览器 Web Speech API。以后补充真人/高质量 TTS 音频只需要给内容条目增加 audio URL，不需要重写播放器。
