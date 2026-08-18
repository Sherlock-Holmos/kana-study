import { TYPE_LABELS } from "./core-constants.e5356914fc6f.js";
import { getRecommendedLesson } from "./data-curriculum.9d44927613fd.js";
import { buildAbilityProfile, abilityLabel } from "./domain-ability-profile.a275169fd367.js";
import { getDuePairs, getRecentMistakePairs, getWeakPairs } from "./review-selectors.ec1a8b090fb3.js";

export const DAILY_PLAN_MODES = {
  light: { label: "轻松", targetMinutes: 10, reviewLimit: 14, weakLimit: 3, newMultiplier: 0.65 },
  standard: { label: "标准", targetMinutes: 20, reviewLimit: 30, weakLimit: 6, newMultiplier: 1 },
  intensive: { label: "强化", targetMinutes: 35, reviewLimit: 52, weakLimit: 10, newMultiplier: 1.35 }
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
function recentAccuracy(state, sessions = 5) {
  const results = (state.sessions || []).filter(s => s?.type !== "assessment").slice(-sessions).flatMap(s => s.results || []);
  if (!results.length) return 100;
  return Math.round(results.filter(r => r.correct).length / results.length * 100);
}
function risk(pair, now = Date.now()) {
  const skill = pair.skillState || {};
  const due = Date.parse(skill.nextReviewAt || "") || now;
  const overdueDays = Math.max(0, (now - due) / 86400000);
  return overdueDays * 2.2 + Number(skill.lapseCount || 0) * 1.4 + (5 - Number(skill.mastery || 0)) * 1.3 + Number(skill.lastResult === "wrong") * 3;
}
function adaptiveNewCount(state, config, dueTotal, accuracy) {
  const base = Number(state.settings?.newItemsPerDay || 8) * config.newMultiplier;
  let multiplier = 1;
  if (accuracy < 65) multiplier *= 0.45;
  else if (accuracy < 78) multiplier *= 0.72;
  else if (accuracy >= 92) multiplier *= 1.15;
  if (dueTotal > 80) multiplier *= 0.25;
  else if (dueTotal > 40) multiplier *= 0.5;
  else if (dueTotal > 20) multiplier *= 0.75;
  return Math.max(0, Math.min(16, Math.round(base * multiplier)));
}

export function buildDailyPlan(state, requestedMode = null) {
  const now = Date.now();
  const mode = requestedMode || state.settings?.dailyPlanMode || "standard";
  const config = DAILY_PLAN_MODES[mode] || DAILY_PLAN_MODES.standard;
  const dueAll = getDuePairs(state, now, 999).sort((a,b) => risk(b, now) - risk(a, now));
  const mistakes = getRecentMistakePairs(state, now, 14, 999);
  const weak = getWeakPairs(state, 999);
  const priorityPool = uniquePairs([...mistakes, ...dueAll, ...weak]);
  const reviewLimit = Math.min(config.reviewLimit, Math.max(8, Math.round(config.targetMinutes / 0.55)));
  const reviewPairs = priorityPool.slice(0, reviewLimit);
  const accuracy = recentAccuracy(state);
  const adaptiveNewItems = adaptiveNewCount(state, config, dueAll.length, accuracy);
  const nextLesson = getRecommendedLesson(state.curriculum?.completedLessons || []);
  const reviewDebt = Math.max(0, dueAll.length - reviewPairs.filter(pair => dueAll.some(d => d.item.id === pair.item.id && d.skill === pair.skill)).length);
  const includeLesson = Boolean(nextLesson) && adaptiveNewItems > 0 && (dueAll.length < 55 || mode === "intensive");
  const profile = buildAbilityProfile(state);
  const topRecommendation = profile.recommendations?.[0] || null;
  const estimatedMinutes = Math.max(6, Math.round(reviewPairs.length * 0.42 + (includeLesson ? Number(nextLesson?.estimatedMinutes || 10) : 0)));
  const byType = countByType(reviewPairs);

  return {
    version: 2,
    generatedAt: new Date().toISOString(),
    mode,
    label: config.label,
    targetMinutes: config.targetMinutes,
    dueTotal: dueAll.length,
    reviewDebt,
    reviewPairs,
    reviewCount: reviewPairs.length,
    byType,
    recentAccuracy: accuracy,
    adaptiveNewItems,
    nextLesson,
    includeLesson,
    estimatedMinutes,
    abilityFocus: topRecommendation ? { ...topRecommendation, label: abilityLabel(topRecommendation.key) } : null,
    description: includeLesson
      ? `${reviewPairs.length} 项优先复习 + ${nextLesson.title}`
      : reviewPairs.length
        ? `${reviewPairs.length} 项优先复习${reviewDebt ? `，剩余积压 ${reviewDebt} 项会分批消化` : ""}`
        : nextLesson ? `复习压力较低，可进入 ${nextLesson.title}` : "今天以薄弱内容巩固为主"
  };
}

export function applyPlanSnapshot(state, plan) {
  state.planner ||= {};
  state.planner.lastPlan = { ...plan, reviewPairs: (plan.reviewPairs || []).map(pair => ({ itemId: pair.item.id, skill: pair.skill })) };
  state.planner.reviewDebt = { total: plan.dueTotal, remaining: plan.reviewDebt, updatedAt: new Date().toISOString() };
  state.abilityProfile = buildAbilityProfile(state);
  return state;
}

export function formatPlanBreakdown(plan) {
  return Object.entries(plan.byType || {})
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${TYPE_LABELS[type] || type} ${count}`)
    .join(" · ") || "暂无到期复习";
}
