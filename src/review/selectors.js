import { KANA_ITEMS } from "../data/kana.js";
import { getDirectionTotals } from "../core/state.js";
import { parseTime } from "../core/utils.js";

const DIRECTIONS = ["recognition", "recall"];

function pairsForState(state) {
  const pairs = [];
  for (const item of KANA_ITEMS) {
    const itemState = state.items[item.id];
    if (!itemState) continue;
    for (const direction of DIRECTIONS) {
      const progress = itemState[direction];
      const counts = getDirectionTotals(progress);
      pairs.push({ item, direction, progress, counts });
    }
  }
  return pairs;
}

export function getDuePairs(state, now = Date.now(), limit = 40) {
  return pairsForState(state)
    .filter(entry => {
      const total = entry.counts.correct + entry.counts.wrong;
      const due = parseTime(entry.progress.nextReviewAt);
      return total > 0 && due > 0 && due <= now;
    })
    .sort((a, b) => parseTime(a.progress.nextReviewAt) - parseTime(b.progress.nextReviewAt))
    .slice(0, limit);
}

export function weakScore(entry) {
  const total = entry.counts.correct + entry.counts.wrong;
  if (!total) return -Infinity;
  const errorRate = entry.counts.wrong / total;
  const recencyPenalty = entry.progress.lastResult === "wrong" ? 2 : 0;
  const masteryPenalty = 5 - Number(entry.progress.mastery || 0);
  const lapseBoost = Math.min(3, Number(entry.progress.lapseCount || 0) * 0.35);
  return masteryPenalty + errorRate * 4 + recencyPenalty + lapseBoost;
}

export function getWeakPairs(state, limit = 24) {
  return pairsForState(state)
    .filter(entry => entry.counts.correct + entry.counts.wrong > 0)
    .map(entry => ({ ...entry, score: weakScore(entry) }))
    .filter(entry => entry.score >= 3.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getRecentMistakePairs(state, now = Date.now(), days = 14, limit = 24) {
  const threshold = now - days * 86400000;
  return pairsForState(state)
    .filter(entry =>
      entry.progress.lastResult === "wrong" &&
      parseTime(entry.progress.lastReviewedAt) >= threshold
    )
    .sort((a, b) => parseTime(b.progress.lastReviewedAt) - parseTime(a.progress.lastReviewedAt))
    .slice(0, limit);
}

export function getUnseenPairsForItems(state, itemIds, direction = "recognition") {
  return itemIds
    .map(itemId => {
      const item = KANA_ITEMS.find(candidate => candidate.id === itemId);
      if (!item) return null;
      const progress = state.items[itemId]?.[direction];
      return { item, direction, progress };
    })
    .filter(Boolean);
}
