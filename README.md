# Kana Study v9.0

一个纯静态、可直接部署到 GitHub Pages 的日语假名学习系统。v9 将原来的“五十音抽认卡”升级为完整学习闭环：课程 → 学习会话 → 双向掌握度 → SRS 复习 → 假名表 → 长期进度。

## 主要功能

- 5 个一级页面：首页 / 学习 / 复习 / 假名表 / 进度
- 平假名与片假名，各 104 个可训练项目
  - 46 个基础清音
  - 25 个浊音 / 半浊音
  - 33 个拗音
- 促音与长音规则课
- 课程制学习：认识 → 识别 → 主动回忆 → 混合测试
- 每个假名分开记录：
  - recognition：假名 → 罗马音
  - recall：罗马音 → 假名
- 自定义 SRS 调度：稳定度、难度、连续正确、lapse、下次复习时间
- 答错后约 3–5 题短期重现，最多再强化 2 次
- 到期复习 / 薄弱强化 / 最近 14 天错题 / 自由复习
- Session 总结：题数、正确率、用时、错题
- 假名详情：两个方向掌握度、累计表现、最近/下次复习、单项专项练习
- 365 天 GitHub 风格学习活跃度热力图
- 每日目标、连续学习、累计统计
- Supabase Auth + `user_progress` JSONB 云同步
- 游客 / 账号数据隔离与首次登录迁移
- v5/v8 旧数据自动迁移为 v9 Schema
- JSON 导出 / 导入（合并而非直接覆盖）
- PWA / 离线 App Shell
- ES Modules
- Node 内置测试 + GitHub Actions CI

## 项目结构

```text
kana-study/
├── index.html
├── CNAME
├── manifest.webmanifest
├── sw.js
├── package.json
├── css/
├── icons/
├── src/
│   ├── core/
│   ├── data/
│   ├── learning/
│   ├── review/
│   ├── sync/
│   ├── components/
│   ├── views/
│   └── ui/
├── test/
├── scripts/
├── supabase/schema.sql
└── .github/workflows/ci.yml
```

## 本地运行

因为 v9 使用原生 ES Modules，不要直接双击 `index.html` 用 `file://` 打开。任选一个本地静态服务器：

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000/`。

## 检查

```bash
npm run check
npm test
```

项目没有构建步骤，也不需要安装 npm 依赖。

## Supabase

沿用现有 Supabase 项目与 `public.user_progress` 表。若从零部署，可执行：

```text
supabase/schema.sql
```

浏览器内只使用 Publishable Key；不要把 `service_role` / secret key 放进仓库。

## GitHub Pages

仓库仍可直接从根目录发布。`CNAME` 保留为：

```text
nihongo.jokersh.site
```

## v9 数据模型

顶层 `schemaVersion` 为 `9`。核心结构：

```json
{
  "schemaVersion": 9,
  "settings": {},
  "curriculum": {},
  "items": {},
  "activity": {},
  "lifetime": {},
  "sessions": [],
  "activeSession": null,
  "meta": {}
}
```

每个假名的两个方向单独记录 SRS 状态，并使用设备级单调计数器降低多设备合并时丢计数的风险。
