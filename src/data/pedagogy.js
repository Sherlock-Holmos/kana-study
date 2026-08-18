import { CONTENT_RELEASE, CONTENT_SCHEMA_VERSION } from "../core/constants.js";

function uniq(values) { return [...new Set(values.filter(Boolean))]; }
function text(item) { return `${item.title || ""} ${(item.tags || []).join(" ")} ${item.question || ""} ${item.pattern || ""} ${item.expression || ""}`.toLowerCase(); }

function topicTags(item) {
  const raw = text(item);
  const topics = [];
  const rules = [
    ["time", /时间|時|朝|昼|夜|曜日|分|時|week|morning|evening/],
    ["travel", /旅行|駅|電車|飛行|空港|切符|交通|京都|東京/],
    ["food", /食|飲|料理|レストラン|スーパー|買い物|购物|店/],
    ["school", /学校|大学|先生|学生|教室|図書館/],
    ["family", /家族|父|母|兄|姉|弟|妹/],
    ["daily-life", /生活|毎日|朝|家|部屋|仕事|会社/],
    ["health", /病院|薬|熱|体|健康/],
    ["weather", /天気|雨|晴|雪|寒|暖/]
  ];
  for (const [tag, pattern] of rules) if (pattern.test(raw)) topics.push(tag);
  if (!topics.length) topics.push("general");
  return uniq(topics);
}

function abilityTags(item) {
  const type = item.type;
  if (type === "kana") return ["kana.recognition", "kana.recall"];
  if (type === "vocabulary") return ["vocabulary.meaning", "vocabulary.reading", "vocabulary.production"];
  if (type === "grammar") {
    const tags = ["grammar.meaning", "grammar.application"];
    const raw = text(item);
    if (/助词|助詞|～は|～が|～を|～に|～で|～へ|～と|～も/.test(raw)) tags.push("grammar.particles");
    if (/て|动词|動詞|ます|ない|た形|辞書形/.test(raw)) tags.push("grammar.verb-forms");
    return uniq(tags);
  }
  if (type === "kanji") return ["kanji.meaning", "kanji.reading"];
  if (type === "reading") {
    const tags = ["reading.detail"];
    if (/何時|何分|いくら|何曜日|いくつ/.test(item.question || "")) tags.push("reading.numeric-detail");
    else tags.push("reading.main-idea");
    return uniq(tags);
  }
  if (type === "listening") {
    const tags = ["listening.detail"];
    if (/何時|何分|いくら|いくつ|何本|何枚/.test(item.question || "")) tags.push("listening.time-number");
    if (/どこ|何階|場所/.test(item.question || "")) tags.push("listening.location");
    else tags.push("listening.conversation");
    return uniq(tags);
  }
  return [];
}

export function enrichPedagogy(item) {
  return {
    ...item,
    pedagogy: {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      release: CONTENT_RELEASE,
      topics: uniq([...(item.pedagogy?.topics || []), ...topicTags(item)]),
      abilities: uniq([...(item.pedagogy?.abilities || []), ...abilityTags(item)])
    }
  };
}
