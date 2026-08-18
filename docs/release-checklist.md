# v14 发布检查清单

## 自动验证

```bash
npm run verify
```

必须全部通过：

- hashed production build
- source / built JS syntax
- content reference validation
- assessment definition validation
- unit tests
- browserless application smoke
- hashed production module graph smoke
- local HTTP resource smoke

## GitHub Pages

生产提交必须包含：

- `index.html`
- `sw.js`
- `build-manifest.json`
- `version.json`
- `manifest.webmanifest`
- `assets/`

不要只提交 `src/`。

## Supabase

v14 没有改变数据库表结构，继续使用 `schema-v12.sql`。

账号密码重置依赖 Supabase Auth Redirect URL。生产环境应允许：

```text
https://nihongo.jokersh.site/
```

浏览器端只允许使用 publishable/anon key，不得写入 service-role key。

## 手动冒烟

部署后至少验证：

1. 首页正常显示今日计划。
2. 顶部和移动端导航正常。
3. 学习页能开始 `N5 入门诊断`。
4. 测验作答时不即时显示正确答案，结束后能保存到“进度 → 测验”。
5. 普通学习仍会更新 SRS；阶段测验不会修改 SRS mastery。
6. 内容库能显示“自动校验 / 人工审校”状态统计。
7. 登录后“立即同步”可用。
8. 忘记密码邮件能返回站点并设置新密码。
9. 新 Service Worker 接管旧页面时会出现“新版本已就绪”提示。
