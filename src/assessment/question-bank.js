import { LEARNING_ITEMS } from "../data/content.js";
import { getSkillsForType } from "../domain/skills.js";

const BASE_DIFFICULTY = {
  kana: 1,
  vocabulary: 2,
  grammar: 3,
  kanji: 2,
  reading: 3,
  listening: 3
};

function difficultyFor(item, skill) {
  let value = Number(BASE_DIFFICULTY[item.type] || 2);
  if (["production", "application", "recall"].includes(skill)) value += 1;
  if (item.level === "N5" && ["reading", "listening"].includes(item.type)) value += 1;
  return Math.max(1, Math.min(5, value));
}

function variantLabel(item, skill) {
  if (item.type === "vocabulary") return skill === "production" ? "active-production" : skill === "reading" ? "reading-recall" : "meaning-recognition";
  if (item.type === "grammar") return skill === "application" ? "context-application" : "meaning-recognition";
  if (item.type === "kanji") return skill === "reading" ? "reading-recall" : "meaning-recognition";
  if (item.type === "kana") return skill === "recall" ? "romaji-to-kana" : "kana-to-romaji";
  if (item.type === "reading") return "passage-comprehension";
  if (item.type === "listening") return "audio-comprehension";
  return `${skill}-default`;
}

export function createQuestionVariantsForItem(item) {
  if (!item || item.type === "sentence") return [];
  return getSkillsForType(item.type).map(skill => ({
    questionId: `${item.id}::${skill}::${variantLabel(item, skill)}`,
    itemId: item.id,
    type: item.type,
    skill,
    variantType: variantLabel(item, skill),
    difficulty: difficultyFor(item, skill),
    abilities: [...(item.pedagogy?.abilities || [])],
    topics: [...(item.pedagogy?.topics || [])],
    level: item.level || null
  }));
}

export const QUESTION_BANK = LEARNING_ITEMS.flatMap(createQuestionVariantsForItem);
export const QUESTION_BY_ID = Object.fromEntries(QUESTION_BANK.map(question => [question.questionId, question]));

export function getQuestionPool(type = null) {
  return QUESTION_BANK.filter(question => !type || question.type === type);
}

export function getQuestionBankStats() {
  const byType = {};
  const byDifficulty = {};
  for (const question of QUESTION_BANK) {
    byType[question.type] = (byType[question.type] || 0) + 1;
    byDifficulty[question.difficulty] = (byDifficulty[question.difficulty] || 0) + 1;
  }
  return { total: QUESTION_BANK.length, byType, byDifficulty };
}
