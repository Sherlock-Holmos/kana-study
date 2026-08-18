# v15 发布检查清单

1. `npm run verify` 必须通过。
2. `CONTENT-QUALITY-REPORT.md` 必须生成且 pedagogy tags 完整。
3. `build-manifest.json`、`version.json`、`index.html` 与 `sw.js` 必须来自同一次 build。
4. 生产入口不得直接引用 `src/`。
5. 旧 v14 数据加载后必须自动迁移到 schema 13。
6. 首次 schema 13 云端同步必须执行 safe full sync，之后允许 incremental upsert。
7. Reset 必须设置 `resetRequested`，防止旧云端 rows 在下一次登录时复活。
8. Assessment 结果不得直接修改 SRS mastery/stability。
9. Audio Layer 未配置真实音频时必须明确使用 TTS fallback。
10. 自动内容校验不得表述为专业教师审校。
