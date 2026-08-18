import { KANA_ITEMS } from "./kana.js";
import { VOCABULARY_ITEMS } from "./vocabulary.js";
import { N5_VOCABULARY_EXTRA } from "./n5-vocabulary-extra.js";
import { GRAMMAR_ITEMS } from "./grammar.js";
import { N5_GRAMMAR_EXTRA } from "./n5-grammar-extra.js";
import { SENTENCE_ITEMS } from "./sentences.js";
import { N5_SENTENCES_EXTRA } from "./n5-sentences-extra.js";
import { KANJI_ITEMS } from "./kanji.js";
import { READING_ITEMS } from "./reading.js";
import { LISTENING_ITEMS } from "./listening.js";
import { enrichContentItem } from "./content-meta.js";
import { enrichPedagogy } from "./pedagogy.js";

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

export const LEARNING_ITEMS = rawItems.map(enrichContentItem).map(enrichPedagogy);
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
