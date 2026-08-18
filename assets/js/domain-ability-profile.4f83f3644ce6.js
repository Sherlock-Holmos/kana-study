import { LEARNING_ITEM_BY_ID, LEARNING_ITEMS } from "./data-content.ca0adfcb296c.js";
import { getSkillTotals } from "./core-state.eb7a969a6233.js";
import { parseSkillKey } from "./domain-skills.fac520b144fa.js";

function percent(correct, total) { return total > 0 ? Math.round(correct / total * 100) : 0; }
function add(bucket, key, correct, wrong, evidence = 0) {
  bucket[key] ||= { correct: 0, wrong: 0, evidence: 0, total: 0, percent: 0 };
  bucket[key].correct += correct;
  bucket[key].wrong += wrong;
  bucket[key].evidence += evidence;
  bucket[key].total += correct + wrong;
}

export function buildAbilityProfile(state) {
  const abilities = {};
  const topics = {};

  for (const [key, skillState] of Object.entries(state.skills || {})) {
    const { itemId, skill } = parseSkillKey(key);
    const item = LEARNING_ITEM_BY_ID[itemId];
    if (!item) continue;
    const totals = getSkillTotals(skillState);
    const total = totals.correct + totals.wrong;
    if (!total) continue;
    const allTags = item.pedagogy?.abilities || [`${item.type}.${skill}`];
    const direct = allTags.filter(tag => tag.endsWith(`.${skill}`));
    const diagnostic = allTags.filter(tag => !["recognition","recall","meaning","reading","production","application","comprehension"].some(name => tag.endsWith(`.${name}`)));
    const tags = [...new Set([...(direct.length ? direct : [`${item.type}.${skill}`]), ...diagnostic])];
    const topicTags = item.pedagogy?.topics || ["general"];
    for (const tag of tags) add(abilities, tag, totals.correct, totals.wrong, Number(skillState.evidenceScore || 0));
    for (const tag of topicTags) add(topics, tag, totals.correct, totals.wrong, Number(skillState.evidenceScore || 0));
  }

  // Assessments are lower-frequency but stronger evidence; blend them without touching SRS.
  for (const session of state.sessions || []) {
    if (session?.type !== "assessment" || !session.completedAt) continue;
    for (const result of session.results || []) {
      const item = LEARNING_ITEM_BY_ID[result.itemId];
      if (!item) continue;
      const allTags = item.pedagogy?.abilities || [`${item.type}.${result.skill}`];
      const direct = allTags.filter(tag => tag.endsWith(`.${result.skill}`));
      const diagnostic = allTags.filter(tag => !["recognition","recall","meaning","reading","production","application","comprehension"].some(name => tag.endsWith(`.${name}`)));
      const tags = [...new Set([...(direct.length ? direct : [`${item.type}.${result.skill}`]), ...diagnostic])];
      const topicTags = item.pedagogy?.topics || ["general"];
      for (const tag of tags) add(abilities, tag, result.correct ? 2 : 0, result.correct ? 0 : 2, 1.4);
      for (const tag of topicTags) add(topics, tag, result.correct ? 2 : 0, result.correct ? 0 : 2, 1.4);
    }
  }

  for (const bucket of [abilities, topics]) {
    for (const entry of Object.values(bucket)) entry.percent = percent(entry.correct, entry.total);
  }

  const weakestAbilities = Object.entries(abilities)
    .filter(([, value]) => value.total >= 3)
    .sort((a, b) => a[1].percent - b[1].percent || b[1].total - a[1].total)
    .slice(0, 4);
  const weakestTopics = Object.entries(topics)
    .filter(([, value]) => value.total >= 3)
    .sort((a, b) => a[1].percent - b[1].percent || b[1].total - a[1].total)
    .slice(0, 3);

  const recommendations = [
    ...weakestAbilities.slice(0, 2).map(([key, value]) => ({ kind: "ability", key, percent: value.percent, message: `强化 ${key}（当前约 ${value.percent}%）` })),
    ...weakestTopics.slice(0, 1).map(([key, value]) => ({ kind: "topic", key, percent: value.percent, message: `主题「${key}」近期表现较弱（${value.percent}%）` }))
  ];

  return { generatedAt: new Date().toISOString(), abilities, topics, recommendations };
}

export function abilityLabel(key) {
  const labels = {
    "kana.recognition": "假名识别", "kana.recall": "假名主动回忆",
    "vocabulary.meaning": "词义识别", "vocabulary.reading": "词汇读音", "vocabulary.production": "词汇主动产出",
    "grammar.meaning": "语法理解", "grammar.application": "语法应用", "grammar.particles": "助词", "grammar.verb-forms": "动词变形",
    "kanji.meaning": "汉字字义", "kanji.reading": "汉字读音",
    "reading.detail": "阅读细节", "reading.main-idea": "阅读主旨", "reading.numeric-detail": "阅读数字/时间",
    "listening.detail": "听力细节", "listening.time-number": "听力时间/数字", "listening.location": "听力地点", "listening.conversation": "对话理解"
  };
  return labels[key] || key;
}

export function getItemsForAbility(abilityKey) {
  return LEARNING_ITEMS.filter(item => (item.pedagogy?.abilities || []).includes(abilityKey));
}
