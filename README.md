# Kana Study

一个纯静态的五十音学习工具，使用 GitHub Pages 部署、Supabase Auth / Postgres 保存账号学习进度。

## 当前信息架构

应用保留单页加载，但拆成两个一级页面视图：

- **学习**：只保留抽认卡、答题、即时反馈、今日简要状态。
- **进度**：总体掌握度、累计结果、46 个假名掌握矩阵、薄弱假名、最近 7 天历史。

低频功能不再占用学习页面：

- **学习设置**：测试方向、抽取方式、作答方式、学习范围、重置记录。
- **账号弹窗**：登录、注册、同步状态、退出。

## 项目结构

```text
kana-study/
├── index.html
├── README.md
├── css/
│   ├── base.css
│   ├── auth.css
│   ├── study.css
│   ├── progress.css
│   └── responsive.css
└── js/
    ├── config.js
    ├── auth-sync.js
    ├── kana-data.js
    ├── progress.js
    ├── study.js
    ├── ui.js
    └── app.js
```

## 文件职责

- `index.html`：页面骨架、学习视图、进度视图、设置/账号弹窗。
- `css/base.css`：全局布局、主导航、基础样式。
- `css/auth.css`：账号入口和认证弹窗。
- `css/study.css`：学习页、答题、学习设置弹窗。
- `css/progress.css`：学习进度页、掌握矩阵、历史记录。
- `css/responsive.css`：移动端底部导航、底部设置抽屉、横屏和桌面适配。
- `js/progress.js`：状态结构、本地存储、迁移与合并。
- `js/study.js`：抽题、答题、掌握度、统计计算。
- `js/ui.js`：学习/进度页面切换、设置弹窗、进度页渲染。
- `js/auth-sync.js`：Supabase 登录、游客迁移和云同步。
- `js/app.js`：事件绑定和应用初始化。

## URL

- `#study`：学习页
- `#progress`：进度页

使用 hash 切换，因此 GitHub Pages 不需要额外路由配置。

## 部署

仍然是纯 HTML/CSS/JavaScript 项目，直接推送到 GitHub Pages 的发布分支即可。

```bash
git add .
git commit -m "refactor: separate study and progress views"
git push
```

## 数据兼容

这次只调整 UI / 信息架构，没有修改 `STORAGE_VERSION = 4`、Supabase `user_progress` 表结构或账号/游客存储键。已有学习记录可以继续使用。
