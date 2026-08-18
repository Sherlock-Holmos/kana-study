# 内容治理规则

Japanese Study v14 明确区分“结构正确”和“语言内容已被专业审校”。

## reviewStatus

- `draft`：尚未通过自动内容检查。
- `automated-validated`：ID、引用、Schema、答案合法性等自动检查通过；不代表语言学人工审校。
- `human-reviewed`：必须由真实人工审校后才能设置。Agent 不得自行把内容标记为该状态。
- `published`：人工审校并通过发布检查的稳定内容。

## 必填元数据

每个正式 LearningItem 应具有：

- `source`
- `reviewStatus`
- `contentVersion`
- `confidence`

其中 `confidence` 是内容维护指标，不是学习者成绩，也不是语言学正确率保证。

## 修改内容时

1. 不改变已有稳定 ID，除非内容实体本身发生语义替换。
2. 修改释义、读音、答案或解释时递增 `contentVersion`。
3. 自动生成/修改的内容默认回到 `automated-validated`，除非有人重新完成审校。
4. 阅读/听力必须保证 `answer` 存在于 `options`。
5. 课程中引用的词汇、语法、汉字、例句、阅读、听力 ID 必须存在。
6. 提交前运行 `npm run verify`。
