import { KANA_ITEMS } from "./kana.js";
import { VOCABULARY_ITEMS } from "./vocabulary.js";
import { GRAMMAR_ITEMS } from "./grammar.js";
import { SENTENCE_ITEMS } from "./sentences.js";

const normalizedKana = KANA_ITEMS.map(item => ({
  ...item,
  type: "kana",
  title: item.kana,
  subtitle: item.roman,
  level: "kana",
  tags: [item.script, item.category, item.row]
}));

export const LEARNING_ITEMS = [
  ...normalizedKana,
  ...VOCABULARY_ITEMS,
  ...GRAMMAR_ITEMS,
  ...SENTENCE_ITEMS
];

export const LEARNING_ITEM_BY_ID = Object.fromEntries(LEARNING_ITEMS.map(item => [item.id, item]));

export function getLearningItem(id) {
  return LEARNING_ITEM_BY_ID[id] || null;
}

export function getItemsByType(type) {
  return LEARNING_ITEMS.filter(item => item.type === type);
}

export function getSearchText(item) {
  if (!item) return "";
  if (item.type === "kana") return `${item.kana} ${item.roman} ${item.memory}`;
  if (item.type === "vocabulary") return `${item.expression} ${item.reading} ${item.meanings.join(" ")} ${item.tags.join(" ")}`;
  if (item.type === "grammar") return `${item.pattern} ${item.meanings.join(" ")} ${item.formation.join(" ")} ${item.explanation}`;
  if (item.type === "sentence") return `${item.jp} ${item.reading} ${item.zh}`;
  return JSON.stringify(item);
}
