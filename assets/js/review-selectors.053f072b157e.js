import { LEARNING_ITEM_BY_ID } from "./data-content.70d9a96f7cfa.js";
import { parseSkillKey } from "./domain-skills.c2017dff4ab0.js";
import { getSkillTotals } from "./core-state.41316c0191c0.js";
import { parseTime } from "./core-utils.adc6ebb0fb19.js";

function pairFromEntry(key, skillState) {
  const { itemId, skill } = parseSkillKey(key);
  const item = LEARNING_ITEM_BY_ID[itemId];
  return item ? { item, skill, skillState } : null;
}

export function getDuePairs(state, now = Date.now(), limit = 60, type = null) {
  return Object.entries(state.skills || {})
    .map(([key, skillState]) => pairFromEntry(key, skillState))
    .filter(Boolean)
    .filter(pair => !type || pair.item.type === type)
    .filter(pair => {
      const totals = getSkillTotals(pair.skillState);
      const due = parseTime(pair.skillState.nextReviewAt);
      return totals.correct + totals.wrong > 0 && due > 0 && due <= now;
    })
    .sort((a, b) => parseTime(a.skillState.nextReviewAt) - parseTime(b.skillState.nextReviewAt))
    .slice(0, limit);
}

export function getWeakPairs(state, limit = 48, type = null) {
  return Object.entries(state.skills || {})
    .map(([key, skillState]) => pairFromEntry(key, skillState))
    .filter(Boolean)
    .filter(pair => !type || pair.item.type === type)
    .map(pair => {
      const totals = getSkillTotals(pair.skillState);
      const total = totals.correct + totals.wrong;
      const errorRate = total ? totals.wrong / total : 0;
      const score = (5 - Number(pair.skillState.mastery || 0)) * 2 + errorRate * 5 + Number(pair.skillState.lastResult === "wrong") * 3;
      return { ...pair, total, score };
    })
    .filter(pair => pair.total >= 2 && pair.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getRecentMistakePairs(state, now = Date.now(), days = 14, limit = 48, type = null) {
  const cutoff = now - days * 86400000;
  return Object.entries(state.skills || {})
    .map(([key, skillState]) => pairFromEntry(key, skillState))
    .filter(Boolean)
    .filter(pair => !type || pair.item.type === type)
    .filter(pair => pair.skillState.lastResult === "wrong" && parseTime(pair.skillState.lastReviewedAt) >= cutoff)
    .sort((a, b) => parseTime(b.skillState.lastReviewedAt) - parseTime(a.skillState.lastReviewedAt))
    .slice(0, limit);
}
