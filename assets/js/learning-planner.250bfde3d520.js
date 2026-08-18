import { TYPE_LABELS } from "./core-constants.4ada7fdea3dc.js";
import { getRecommendedLesson } from "./data-curriculum.98baf6ecb83d.js";
import { getDuePairs, getWeakPairs } from "./review-selectors.053f072b157e.js";

export const DAILY_PLAN_MODES = {
  light: { label: "轻松", reviewLimit: 10, weakLimit: 2, includeLessonThreshold: 5, minuteFloor: 8 },
  standard: { label: "标准", reviewLimit: 18, weakLimit: 4, includeLessonThreshold: 18, minuteFloor: 15 },
  intensive: { label: "强化", reviewLimit: 30, weakLimit: 8, includeLessonThreshold: Infinity, minuteFloor: 28 }
};

function uniquePairs(pairs) {
  const seen = new Set();
  return pairs.filter(pair => {
    const key = `${pair.item.id}::${pair.skill}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function countByType(pairs) {
  const result = {};
  for (const pair of pairs) result[pair.item.type] = (result[pair.item.type] || 0) + 1;
  return result;
}

export function buildDailyPlan(state, requestedMode = null) {
  const mode = requestedMode || state.settings?.dailyPlanMode || "standard";
  const config = DAILY_PLAN_MODES[mode] || DAILY_PLAN_MODES.standard;
  const dueAll = getDuePairs(state, Date.now(), 999);
  const duePairs = dueAll.slice(0, config.reviewLimit);
  const dueKeys = new Set(duePairs.map(pair => `${pair.item.id}::${pair.skill}`));
  const weakPairs = getWeakPairs(state, 999)
    .filter(pair => !dueKeys.has(`${pair.item.id}::${pair.skill}`))
    .slice(0, config.weakLimit);
  const reviewPairs = uniquePairs([...duePairs, ...weakPairs]);
  const nextLesson = getRecommendedLesson(state.curriculum?.completedLessons || []);
  const includeLesson = Boolean(nextLesson) && (mode === "intensive" || dueAll.length <= config.includeLessonThreshold);
  const estimatedMinutes = Math.max(
    config.minuteFloor,
    Math.round(reviewPairs.length * 0.38 + (includeLesson ? Number(nextLesson?.estimatedMinutes || 10) : 0))
  );
  const byType = countByType(reviewPairs);
  return {
    mode,
    label: config.label,
    dueTotal: dueAll.length,
    reviewPairs,
    reviewCount: reviewPairs.length,
    byType,
    nextLesson,
    includeLesson,
    estimatedMinutes,
    description: includeLesson
      ? `${reviewPairs.length} 项复习 + ${nextLesson.title}`
      : reviewPairs.length
        ? `${reviewPairs.length} 项复习，完成后再继续新课`
        : nextLesson ? `直接进入 ${nextLesson.title}` : "今天以薄弱内容巩固为主"
  };
}

export function formatPlanBreakdown(plan) {
  return Object.entries(plan.byType || {})
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${TYPE_LABELS[type] || type} ${count}`)
    .join(" · ") || "暂无到期复习";
}
