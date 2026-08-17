# Kana Study

一个纯静态的五十音学习工具，使用 GitHub Pages 部署，Supabase Auth / Postgres 同步账号学习进度。

## v6 重点优化

- 学习页与进度页分离，低频设置继续使用弹窗。
- 每日学习目标：20 / 30 / 50 / 100 题，并在学习页显示进度条。
- 到期复习：进度页可直接进入已经到复习时间的假名。
- 薄弱专项：自动选取掌握度较低、近期答错较多的假名集中训练。
- 错题重现：答错的假名会在约 3–5 题后再次出现，不只依赖随机权重。
- 输入模式支持答对后自动进入下一题，可在设置中关闭。
- 最近易错：进度页单独展示近期答错的假名。
- 学习数据导出 / 导入：JSON 备份，导入时与当前身份数据安全合并。
- 云同步状态增加细节和最后同步时间。
- PWA：支持添加到主屏幕；首次在线加载后，静态学习界面可离线打开。
- 数据版本升级到 `STORAGE_VERSION = 5`，旧记录自动兼容。

## 信息架构

```text
五十音学习
├── 学习
│   ├── 抽认卡
│   ├── 即时答题反馈
│   ├── 今日目标
│   └── 专项复习会话
├── 进度
│   ├── 总体掌握度
│   ├── 累计 / 今日结果
│   ├── 46 假名掌握矩阵
│   ├── 到期复习
│   ├── 薄弱假名
│   ├── 最近易错
│   └── 7 天历史
├── 学习设置弹窗
└── 账号弹窗
```

## 项目结构

```text
kana-study/
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

Supabase 表结构不需要修改。新增的每日目标和自动跳题偏好继续保存在 `user_progress.progress` JSON 中。

旧版 v4 数据读取后会按照 v5 结构重新保存，不需要清空 localStorage，也不需要重建 Supabase 表。

导入数据采用合并策略，避免因为导入较旧备份而覆盖另一台设备上更多的学习次数。

## PWA / 离线

应用通过 `sw.js` 缓存本地静态资源。第一次仍需联网打开，使浏览器安装 Service Worker 并缓存资源。

离线时：

- 可以继续学习；
- 学习记录继续保存在 localStorage；
- 登录 / 注册不可用；
- 恢复网络后会继续云同步。

## 部署

仍然是纯 HTML / CSS / JavaScript，无构建步骤。

```bash
git add .
git commit -m "feat: improve review workflow and offline experience"
git push
```

GitHub Pages 继续从 `main` 根目录部署即可。
