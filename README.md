# Kana Study（模块化版）

这是从原来的单文件 `index.html` 拆分出来的版本。功能逻辑保持不变，仍然是纯静态站点，可以直接部署到 GitHub Pages，不需要 Node.js、Vite、Vue 或 React。

## 目录结构

```text
kana-study/
├── index.html
├── README.md
├── css/
│   ├── base.css
│   ├── auth.css
│   ├── study.css
│   └── responsive.css
└── js/
    ├── config.js
    ├── kana-data.js
    ├── progress.js
    ├── auth-sync.js
    ├── study.js
    └── app.js
```

## 文件职责

- `index.html`：只保留页面结构、CSS 引用和 JS 加载顺序。
- `css/base.css`：基础重置、页面容器、标题和主面板。
- `css/auth.css`：账号按钮、登录/注册弹窗、同步状态 UI。
- `css/study.css`：设置区、假名范围、抽认卡、输入答题、统计等学习 UI。
- `css/responsive.css`：hover、手机、横屏、桌面大屏、减少动画等响应式规则。
- `js/config.js`：Supabase 项目地址、Publishable Key 和客户端初始化。
- `js/kana-data.js`：46 个基础平假名及罗马音/记忆提示数据。
- `js/progress.js`：学习状态、localStorage、状态版本迁移、快照、合并基础、DOM 引用。
- `js/auth-sync.js`：注册、登录、退出、账号隔离、Supabase 云同步、游客迁移、离线补同步。
- `js/study.js`：随机/加权抽题、测试方向、输入答案判定、掌握度、间隔复习、统计展示。
- `js/app.js`：所有页面事件绑定和程序初始化入口。

## 重要：脚本加载顺序

`index.html` 中脚本必须保持下面顺序：

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="./js/config.js"></script>
<script src="./js/auth-sync.js"></script>
<script src="./js/kana-data.js"></script>
<script src="./js/progress.js"></script>
<script src="./js/study.js"></script>
<script src="./js/app.js"></script>
```

当前版本使用传统浏览器脚本共享全局作用域，并保持原单文件中的代码执行顺序，目的是在不重写业务逻辑的情况下完成低风险拆分。因此不要给这些本地脚本加 `type="module"`，也不要随意改变顺序。

## 本地测试

不要直接双击 `index.html` 作为长期开发方式。建议在项目根目录启动一个静态 HTTP 服务：

```bash
python -m http.server 8080
```

然后访问：

```text
http://localhost:8080/
```

如果本地登录受到 Supabase URL 白名单限制，可继续用 GitHub Pages 地址测试账号功能。

## GitHub Pages 部署

保持仓库根目录就是上述结构，提交即可：

```bash
git add .
git commit -m "refactor: split app into modular files"
git push
```

GitHub Pages 继续从 `main / root` 发布即可。

## 后续维护建议

以后修改功能时优先按职责定位文件：

- 假名内容或助记词 → `js/kana-data.js`
- 答题、掌握度、抽题策略 → `js/study.js`
- localStorage、状态迁移 → `js/progress.js`
- 登录、Supabase、跨设备同步 → `js/auth-sync.js`
- 按钮点击、表单事件、初始化 → `js/app.js`
- 样式 → 对应 `css/*.css`

如果项目继续扩大，下一阶段再把这些传统脚本升级为 ES Modules（`import/export`）并补自动测试，不建议这次拆分同时大幅重写同步逻辑。
