# Kana Study

> 本版基于 GitHub `main` 提交 `05ef0829c55021c9a113473ef7ffbb40fa901c44` 重构。

一个纯静态的五十音学习工具，使用 GitHub Pages 部署，Supabase Auth / Postgres 同步账号学习进度。

## v8 信息架构优化

这次不修改学习数据结构，重点重新划分“学习 / 复习 / 查看结果”三种用户任务：

- `学习`：普通学习、当前学习范围、即时反馈、今日目标。
- `复习`：到期复习、薄弱假名、最近错题三个明确入口。
- `进度`：只查看数据，并拆成“总览 / 五十音 / 活跃度”三个二级视图。
- 学习设置和账号继续使用弹窗，不新增低价值一级页面。
- GitHub 风格 365 天学习活跃度热力图保留在“进度 → 活跃度”。
- 专项复习答错后 3–5 题重现的机制保持不变。
- PWA 静态缓存版本升级到 v8。

## 信息架构

```text
五十音学习
├── 学习
│   ├── 抽认卡
│   ├── 即时答题反馈
│   ├── 今日目标
│   └── 学习设置入口
├── 复习
│   ├── 到期复习
│   ├── 薄弱假名
│   └── 最近错题
├── 进度
│   ├── 总览
│   │   ├── 总体掌握度
│   │   ├── 已掌握 / 学习中 / 未学习 / 到期复习
│   │   └── 累计与今日练习表现
│   ├── 五十音
│   │   └── 46 个基础平假名掌握矩阵
│   └── 活跃度
│       └── 过去 365 天 GitHub 风格学习热力图
├── 学习设置弹窗
└── 账号弹窗
```

## 项目结构

```text
kana-study/
├── CNAME
├── index.html
├── README.md
├── manifest.webmanifest
├── sw.js
├── icons/
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── css/
│   ├── base.css
│   ├── auth.css
│   ├── study.css
│   ├── review.css
│   ├── progress.css
│   └── responsive.css
└── js/
    ├── config.js
    ├── auth-sync.js
    ├── kana-data.js
    ├── progress.js
    ├── study.js
    ├── ui.js
    ├── data-tools.js
    └── app.js
```

## 数据兼容

本次没有升级 `STORAGE_VERSION`，仍沿用 v5 学习数据结构，也不需要修改 Supabase 表或 RLS。

账号进度、游客隔离、多设备计数、每日学习记录、复习时间、导入导出和 PWA 离线能力均保留。

## PWA / 离线

应用通过 `sw.js` 缓存本地静态资源。首次仍需联网打开，使浏览器安装 Service Worker 并缓存资源。

离线时可以继续学习，记录写入 localStorage；恢复网络后登录账号会继续同步。

## 部署

仍然是纯 HTML / CSS / JavaScript，无构建步骤。

```bash
git add .
git commit -m "refactor: separate study review and progress flows"
git push
```

GitHub Pages 继续从 `main` 根目录部署即可。当前自定义域名由 `CNAME` 保留。

## 清理旧补丁

当前 GitHub 仓库根目录中的 `apply-heatmap-v7.ps1` 是一次性迁移脚本，不属于运行时项目文件；v8 完整包不再包含它。覆盖项目后可以安全删除该脚本。
