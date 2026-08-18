# Japanese Study v14.0.0

面向中文学习者的静态日语学习系统。v14 的定位是 **N5 Production Ready**：保留 v13 的内容哈希生产构建，同时把“课程学习”和“能力验证”拆开，增加独立阶段测验、内容治理透明度、账号恢复与 PWA 更新提示。

## v14 新增

### 1. 独立诊断 / 阶段测验

内置 6 组测验：

- N5 入门诊断
- 假名阶段测验
- N5 基础表达测验
- N5 核心汉字测验
- 阅读与听力阶段测验
- N5 综合能力模拟

测验特点：

- 测验结果不写入 SRS mastery / stability。
- 答题后不即时显示正确答案，避免后续题目受到提示污染。
- 错题不会像学习 Session 一样自动插回 3～5 题后重做。
- 结束后按学习域统计正确率，并独立保存在 Session 历史中。
- “进度 → 测验”可以查看各测验最新成绩与最近历史。
- 每个阶段测验显示基于课程完成度的“建议准备度”，但不做强制锁课。

这些测验是站内能力检查，不宣称等同于 JLPT 官方模拟题或成绩预测。

### 2. 内容治理透明化

内容库会明确显示：

- 总条目数
- 自动校验数量
- 人工审校数量
- 平均内容置信度

`automated-validated` 只表示 ID、引用、Schema、答案合法性等自动检查通过，不等于语言学专业人工审校。规则见：

```text
docs/content-governance.md
```

### 3. 账号生命周期补强

Supabase Auth 新增：

- 忘记密码邮件
- PASSWORD_RECOVERY 回调
- 设置新密码
- 已登录用户修改密码
- 手动“立即同步”

密码重置需要在 Supabase Auth Redirect URLs 中允许生产站点地址。

### 4. PWA 更新提示

生产资源继续使用内容哈希。新 Service Worker 接管旧页面时，应用会显示：

```text
新版本已就绪 · [刷新更新]
```

避免用户长期保持旧 JS 运行实例却不知道站点已经升级。

### 5. 生产验证进一步加强

```bash
npm run verify
```

执行：

```text
npm run build
npm run check
npm test
npm run smoke
npm run smoke:dist
npm run smoke:http
```

其中：

- `smoke`：启动源码应用模块并验证首页 / 导航 / 阶段测验入口。
- `smoke:dist`：真实加载 `build-manifest.json` 指向的哈希生产模块图。
- `smoke:http`：启动本地 HTTP Server，并逐个请求当前构建的 HTML、SW、manifest、CSS、icon 和所有生产 JS，确认 HTTP 资源路径全部返回 200。

## 生产构建

项目仍保持零 npm 运行/构建依赖。`scripts/build.mjs` 使用 Node.js 标准库完成：

```text
src/**/*.js
      ↓
assets/js/<module>.<sha256>.js

css/*.css
      ↓
assets/css/app.<sha256>.css
```

构建器同时生成：

- `index.html`
- `sw.js`
- `manifest.webmanifest`
- `build-manifest.json`
- `version.json`

生产 `index.html` 不直接加载 `src/**/*.js`，避免跨版本模块混用。

## 当前学习能力

- 今日计划：轻松 / 标准 / 强化
- 教学化课程元数据
- SRS 2.0 和记忆证据权重
- 假名 / 词汇 / 语法 / 汉字 / 阅读 / 听力
- 听力正常 / 慢速播放，答后才显示原文
- N5 学习完成度
- 独立诊断与阶段测验
- 内容质量元数据
- Supabase 本地 + 云端同步
- 密码恢复与修改
- PWA 离线缓存与版本更新提示
- v5/v8/v9/v10/v11 数据迁移到 schemaVersion 12

## 内容规模

- 假名：208
- 词汇：487
- 语法：95
- 汉字：118
- 例句：111
- 阅读：24
- 听力：24
- 课程：76
- 诊断 / 阶段测验：6

## 版本与数据库

```text
App Version: 14.0.0
Data Schema: 12
```

v14 新增的测验历史直接复用现有 `study_sessions.payload` 保存，因此不需要修改 Supabase 表结构。

继续使用：

```text
supabase/schema-v12.sql
```

浏览器端只使用 Supabase publishable/anon key，不要放置 service-role key。

## 开发与发布

修改源码后：

```bash
npm run verify
```

生产生成文件应与源码一起提交：

```text
index.html
sw.js
manifest.webmanifest
build-manifest.json
version.json
assets/
```

完整发布检查见：

```text
docs/release-checklist.md
```

## 当前限制

- 听力仍使用浏览器 Web Speech API，而不是固定真人录音或高质量音频资产。
- 大部分内置内容目前属于 `automated-validated`，不是逐条专业教师人工审校。
- N5 综合能力模拟是站内抽样能力测试，不是 JLPT 官方题库。
- 当前自动化包含生产模块图与 HTTP 资源测试；本执行环境中的系统 Chromium 因 DBus/zygote 环境无法稳定完成真实 headless DOM 测试，因此没有把该项虚报为通过。
