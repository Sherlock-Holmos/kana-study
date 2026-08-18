import { KANA_ITEMS } from "./data-kana.2364181fadb6.js";
import { VOCABULARY_ITEMS } from "./data-vocabulary.8e5f72acba34.js";
import { N5_VOCABULARY_EXTRA } from "./data-n5-vocabulary-extra.4d1828bfbf11.js";
import { GRAMMAR_ITEMS } from "./data-grammar.5fe2e1bd0899.js";
import { N5_GRAMMAR_EXTRA } from "./data-n5-grammar-extra.12e166eefb7e.js";
import { SENTENCE_ITEMS } from "./data-sentences.dabdcee89dc7.js";
import { N5_SENTENCES_EXTRA } from "./data-n5-sentences-extra.7313d59900f1.js";
import { KANJI_ITEMS } from "./data-kanji.fb8e24051fa4.js";
import { READING_ITEMS } from "./data-reading.bb2262b2a1ae.js";
import { LISTENING_ITEMS } from "./data-listening.fd7388a6e722.js";
import { enrichContentItem } from "./data-content-meta.ed7e62fb17b2.js";

const normalizedKana = KANA_ITEMS.map(item => ({
  ...item,
  type: "kana",
  title: item.kana,
  subtitle: item.roman,
  level: "kana",
  tags: [item.script, item.category, item.row]
}));

export const ALL_VOCABULARY_ITEMS = [...VOCABULARY_ITEMS, ...N5_VOCABULARY_EXTRA];
export const ALL_GRAMMAR_ITEMS = [...GRAMMAR_ITEMS, ...N5_GRAMMAR_EXTRA];
export const ALL_SENTENCE_ITEMS = [...SENTENCE_ITEMS, ...N5_SENTENCES_EXTRA];

const rawItems = [
  ...normalizedKana,
  ...ALL_VOCABULARY_ITEMS,
  ...ALL_GRAMMAR_ITEMS,
  ...KANJI_ITEMS,
  ...ALL_SENTENCE_ITEMS,
  ...READING_ITEMS,
  ...LISTENING_ITEMS
];

export const LEARNING_ITEMS = rawItems.map(enrichContentItem);
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
  if (item.type === "vocabulary") return `${item.expression} ${item.reading} ${item.meanings.join(" ")} ${(item.tags || []).join(" ")}`;
  if (item.type === "grammar") return `${item.pattern} ${item.meanings.join(" ")} ${(item.formation || []).join(" ")} ${item.explanation || ""}`;
  if (item.type === "kanji") return `${item.character} ${(item.onReadings || []).join(" ")} ${(item.kunReadings || []).join(" ")} ${(item.meanings || []).join(" ")} ${(item.examples || []).join(" ")}`;
  if (item.type === "sentence") return `${item.jp} ${item.reading} ${item.zh}`;
  if (item.type === "reading") return `${item.title} ${item.passage} ${item.translation || ""}`;
  if (item.type === "listening") return `${item.title} ${item.transcript} ${item.translation || ""}`;
  return JSON.stringify(item);
}
