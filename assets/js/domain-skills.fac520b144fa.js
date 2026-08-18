import { ITEM_TYPES } from "./core-constants.f0296b234e4d.js";

export const SKILLS_BY_TYPE = {
  [ITEM_TYPES.KANA]: ["recognition", "recall"],
  [ITEM_TYPES.VOCABULARY]: ["meaning", "reading", "production"],
  [ITEM_TYPES.GRAMMAR]: ["meaning", "application"],
  [ITEM_TYPES.KANJI]: ["meaning", "reading"],
  [ITEM_TYPES.SENTENCE]: ["comprehension"],
  [ITEM_TYPES.READING]: ["comprehension"],
  [ITEM_TYPES.LISTENING]: ["comprehension"]
};

export function getSkillsForType(type) {
  return SKILLS_BY_TYPE[type] || [];
}

export function skillKey(itemId, skill) {
  return `${itemId}::${skill}`;
}

export function parseSkillKey(key) {
  const marker = key.lastIndexOf("::");
  if (marker < 0) return { itemId: key, skill: "recognition" };
  return { itemId: key.slice(0, marker), skill: key.slice(marker + 2) };
}
