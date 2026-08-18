# Content governance

Japanese Study v15 明确区分“结构正确”和“语言内容已被专业审校”。

内容条目包含：

- `source`
- `reviewStatus`
- `confidence`
- `contentVersion`
- `pedagogy.schemaVersion`
- `pedagogy.release`
- `pedagogy.topics`
- `pedagogy.abilities`

当前 `automated-validated` 仅表示 schema、引用、ID、答案选项和代码层检查通过，不表示专业日语教师已逐条审校。

发布前运行：

```bash
npm run content:report
```

输出 `CONTENT-QUALITY-REPORT.md` 和 `content/release.json`。
