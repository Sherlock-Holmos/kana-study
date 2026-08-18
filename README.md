# Japanese Study v13

面向中文学习者的静态日语学习系统。v13 的重点不是继续扩内容类型，而是解决生产部署中的 ES Module 跨版本混用问题，并把 v12 的 N5 学习体验做成可稳定发布的静态构建。

## v13 重点：稳定生产构建

此前源码由浏览器直接加载 `src/**/*.js`。即使入口带 `?v=12`，内部模块 URL 仍然固定，例如 `src/core/metrics.js`。在 Service Worker、浏览器 HTTP Cache 或 CDN 缓存存在时，可能出现“新版 home.js + 旧版 metrics.js”的混合模块图，导致整个应用启动失败。

v13 改为零运行时依赖的内容哈希构建：

```text
src/app.js
src/core/metrics.js
src/views/home.js
        ↓ npm run build
assets/js/app.<hash>.js
assets/js/core-metrics.<hash>.js
assets/js/views-home.<hash>.js
```

生产 `index.html` 只引用哈希产物，不再直接加载 `src/`。模块依赖也全部被重写为对应内容哈希文件，因此一次构建天然形成一致的 Module Graph。

## 为什么没有引入运行时构建依赖

项目仍然保持零 npm 依赖。`scripts/build.mjs` 使用 Node.js 标准库完成：

- ES Module 依赖图遍历
- 相对 import 重写
- SHA-256 内容哈希命名
- CSS 合并与哈希
- PWA icon / manifest 哈希
- `index.html` 生成
- Service Worker 生成
- build manifest 生成

这使 GitHub Actions 和本地构建都不需要额外下载 Vite/Rollup/esbuild，同时具备本项目需要的 hashed-assets 行为。

## 缓存策略

- `index.html`：network-first
- `sw.js`：浏览器注册时 `updateViaCache: "none"`
- `/assets/**`：内容哈希 URL，cache-first
- Service Worker cache name：`japanese-study-v13-<buildId>`
- 新 Service Worker 激活时清理旧 `japanese-study-*` Cache Storage
- 构建器不会主动删除旧哈希资源，允许 CDN 中仍存活的旧 `index.html` 在过渡期继续找到其资源

## 回归保护

`npm run verify` 现在执行：

```text
npm run build
npm run check
npm test
npm run smoke
npm run smoke:dist
```

其中 `smoke:dist` 会真正 import `build-manifest.json` 指向的生产入口，并加载完整的哈希 ES Module 图。类似“home.js 导入了 getN5Completion，但 metrics.js 没有对应 export”的问题会在 CI 中直接失败，而不是部署后才白屏。

## v12 学习能力全部保留

- 今日计划：轻松 / 标准 / 强化
- 教学化课程元数据
- SRS 2.0 和记忆证据权重
- 假名 / 词汇 / 语法 / 汉字 / 阅读 / 听力
- 听力正常 / 慢速播放与答后原文
- N5 学习完成度
- 内容治理元数据
- Supabase 本地 + 云端进度同步
- v5/v8/v9/v10/v11 数据迁移到 schemaVersion 12

应用版本是 `13.0.0`，学习数据 schema 仍为 `12`，因为 v13 没有破坏性修改用户数据结构。

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

## 开发与发布

修改 `src/`、`css/`、`icons/` 或 `index.template.html` 后运行：

```bash
npm run verify
```

`npm run build` 会生成/更新：

```text
index.html
sw.js
manifest.webmanifest
build-manifest.json
version.json
assets/
```

这些生产文件应一并提交到 Git。GitHub Pages 仍然直接部署仓库根目录，不要求把 Pages 改成独立的 Node/Vite 构建服务。

对于本次已经打包好的发布包，生产文件已经预构建，可以直接提交。

## Supabase

数据库继续兼容 v12：

```text
supabase/schema-v12.sql
```

浏览器中只使用 Supabase publishable/anon key，不要放置 service role key。

## 主要目录

```text
src/                 可维护源码
css/                 源样式
icons/               源图标
index.template.html  HTML 源模板
scripts/build.mjs    内容哈希生产构建器
assets/              GitHub Pages 实际加载的哈希资源
index.html           生成后的生产入口
sw.js                生成后的生产 Service Worker
build-manifest.json  当前生产构建映射
version.json         版本与 buildId
```

## 当前限制

- 听力仍使用浏览器 Web Speech API，而不是人工录音或固定高质量音频资产。
- 内容已通过结构与引用自动校验，但不等同于逐条专业语言学人工审校。
- `N5 学习完成度` 是站内学习指标，不代表 JLPT 官方成绩预测。
