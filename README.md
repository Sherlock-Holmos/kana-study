# Japanese Study v15.0.0

面向中文学习者的 N5 自适应日语学习系统。v15 的定位是 **N5 Learning Quality**：冻结主要产品架构，把重点从“继续增加功能类型”转向学习调度、能力诊断、测验质量、音频抽象、内容治理与同步可靠性。

## v15 核心

- Adaptive Planner 2.0：根据到期风险、近期错题、薄弱项、近期正确率和学习强度生成今日计划。
- Review Debt：复习积压不会一次全部压给用户，而是按风险分批消化。
- Ability Profile：把能力拆到词汇主动产出、助词、动词变形、汉字读音、阅读细节、听力时间/数字等子能力。
- Assessment 2.0：阶段测验与 SRS 分离，尽量避免连续测验重复同一题，并给出能力级诊断。
- Audio Layer：支持真实音频 URL；未配置时安全回退到浏览器 ja-JP Web Speech。
- Incremental Sync：记录 dirty skill/date/session；首次 v15 同步为完整同步，之后只上传变化项。
- 内容治理：`CONTENT_SCHEMA_VERSION`、`CONTENT_RELEASE`、pedagogy tags 与 `npm run content:report`。
- Hashed Production Build：生产 ES Modules、CSS、Manifest 与图标继续使用内容哈希，避免跨版本缓存混用。

## 内容规模

当前仍以经过自动结构校验的 N5 核心语料为主：假名、词汇、语法、汉字、例句、阅读、听力和 76 节课程。自动校验不等于专业教师人工审校，`CONTENT-QUALITY-REPORT.md` 会明确显示审核状态。

## 本地验证

```bash
npm run verify
```

流程：内容报告 → hashed build → 静态检查 → Node 单元测试 → app smoke → production module graph smoke → HTTP smoke。

## 部署

这是静态站点。运行 `npm run build` 后，将整个仓库推送到 GitHub Pages 即可。`index.html` 会引用当前构建的 hashed assets。

## Supabase

v15 Data Schema 为 13。现有 v12 规范化表继续兼容；`supabase/schema-v15.sql` 提供可选的独立学习画像表。当前前端为了兼容旧项目，会同时把 v15 学习画像写入 `user_learning_meta.meta.v15`。

## 音频

听力内容支持：

```js
item.audio = {
  normal: "./assets/audio/example-normal.mp3",
  slow: "./assets/audio/example-slow.mp3"
}
```

如果未配置音频文件，播放器自动回退到 Web Speech API。项目不会把浏览器 TTS 标记为真人录音。
