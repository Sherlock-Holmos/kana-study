const SOURCE_LABEL = "Japanese Study 内置内容";

export function enrichContentItem(item) {
  const type = item.type || "unknown";
  const versionByType = {
    kana: 2,
    vocabulary: 2,
    grammar: 2,
    kanji: 2,
    sentence: 2,
    reading: 2,
    listening: 2
  };
  return {
    ...item,
    source: item.source || SOURCE_LABEL,
    reviewStatus: item.reviewStatus || "automated-validated",
    contentVersion: Number(item.contentVersion || versionByType[type] || 1),
    confidence: Number(item.confidence || (type === "kana" ? 0.98 : 0.86))
  };
}
