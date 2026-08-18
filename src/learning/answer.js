import { KANA_BY_ID } from "../data/kana.js";

export function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function getAcceptedAnswers(itemId, direction) {
  const item = KANA_BY_ID[itemId];
  if (!item) return [];
  if (direction === "recall") return [item.kana];
  return item.aliases || [item.roman];
}

export function isAnswerCorrect(itemId, direction, value) {
  const normalized = normalizeAnswer(value);
  if (!normalized) return false;
  return getAcceptedAnswers(itemId, direction)
    .map(normalizeAnswer)
    .includes(normalized);
}
