import { KANA_ITEMS } from "../data/kana.js";
import { getDirectionTotals, getItemMastery, getItemReviewCount } from "./state.js";
import { localDateKey, percent, sumDeviceCounters } from "./utils.js";

export function getDayTotals(state, dateKey) {
  return sumDeviceCounters(state.activity?.[dateKey]?.devices || {});
}

export function getLifetimeTotals(state) {
  return sumDeviceCounters(state.lifetime?.devices || {});
}

export function getCurrentStreak(state, now = new Date()) {
  const todayKey = localDateKey(now);
  const today = getDayTotals(state, todayKey);
  const cursor = new Date(now);
  if (today.correct + today.wrong === 0) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (streak < 3650) {
    const totals = getDayTotals(state, localDateKey(cursor));
    if (totals.correct + totals.wrong === 0) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getLongestStreak(state, days = 3650) {
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - days + 1);
  let longest = 0;
  let current = 0;
  for (let i = 0; i < days; i += 1) {
    const totals = getDayTotals(state, localDateKey(cursor));
    if (totals.correct + totals.wrong > 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return longest;
}

export function getYearStudyDays(state, year = new Date().getFullYear()) {
  return Object.keys(state.activity || {}).filter(key => {
    if (!key.startsWith(`${year}-`)) return false;
    const totals = getDayTotals(state, key);
    return totals.correct + totals.wrong > 0;
  }).length;
}

export function getMasterySummary(state, items = KANA_ITEMS) {
  let mastered = 0;
  let learning = 0;
  let unseen = 0;
  let recognitionSum = 0;
  let recallSum = 0;
  let reviewedItems = 0;

  for (const item of items) {
    const itemState = state.items[item.id];
    const reviews = getItemReviewCount(itemState);
    const recognition = Number(itemState?.recognition?.mastery || 0);
    const recall = Number(itemState?.recall?.mastery || 0);
    recognitionSum += recognition;
    recallSum += recall;
    if (reviews === 0) unseen += 1;
    else if (recognition >= 4 && recall >= 4) mastered += 1;
    else learning += 1;
    if (reviews > 0) reviewedItems += 1;
  }

  const total = items.length || 1;
  return {
    mastered,
    learning,
    unseen,
    reviewedItems,
    total: items.length,
    overallPercent: Math.round(((recognitionSum + recallSum) / (total * 10)) * 100),
    recognitionPercent: Math.round((recognitionSum / (total * 5)) * 100),
    recallPercent: Math.round((recallSum / (total * 5)) * 100)
  };
}

export function getItemDetailMetrics(state, itemId) {
  const itemState = state.items[itemId];
  const recognitionCounts = getDirectionTotals(itemState?.recognition);
  const recallCounts = getDirectionTotals(itemState?.recall);
  const correct = recognitionCounts.correct + recallCounts.correct;
  const wrong = recognitionCounts.wrong + recallCounts.wrong;
  const total = correct + wrong;
  return {
    overallMastery: getItemMastery(itemState),
    recognitionMastery: Number(itemState?.recognition?.mastery || 0),
    recallMastery: Number(itemState?.recall?.mastery || 0),
    correct,
    wrong,
    total,
    accuracy: percent(correct, total),
    lastReviewedAt: [itemState?.recognition?.lastReviewedAt, itemState?.recall?.lastReviewedAt]
      .filter(Boolean)
      .sort()
      .at(-1) || null,
    nextReviewAt: [itemState?.recognition?.nextReviewAt, itemState?.recall?.nextReviewAt]
      .filter(Boolean)
      .sort()
      .at(0) || null
  };
}
