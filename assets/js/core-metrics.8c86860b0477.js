import { LEARNING_ITEMS } from "./data-content.70d9a96f7cfa.js";
import { getOverallLessonProgress } from "./data-curriculum.98baf6ecb83d.js";
import { skillKey, getSkillsForType } from "./domain-skills.c2017dff4ab0.js";
import { getSkillTotals, getItemMastery } from "./core-state.41316c0191c0.js";
import { localDateKey, percent, sumDeviceCounters } from "./core-utils.adc6ebb0fb19.js";

export function getDayTotals(state, dateKey) {
  return sumDeviceCounters(state.activity?.[dateKey]?.devices || {});
}

export function getLifetimeTotals(state) {
  return sumDeviceCounters(state.lifetime?.devices || {});
}

export function getCurrentStreak(state, now = new Date()) {
  const cursor = new Date(now);
  const today = getDayTotals(state, localDateKey(cursor));
  if (today.correct + today.wrong === 0) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (streak < 3660) {
    const totals = getDayTotals(state, localDateKey(cursor));
    if (totals.correct + totals.wrong === 0) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getLongestStreak(state) {
  const dates = Object.keys(state.activity || {}).filter(date => {
    const x = getDayTotals(state, date);
    return x.correct + x.wrong > 0;
  }).sort();
  if (!dates.length) return 0;
  let longest = 1, current = 1;
  for (let i = 1; i < dates.length; i += 1) {
    const prev = new Date(`${dates[i - 1]}T12:00:00`);
    const cur = new Date(`${dates[i]}T12:00:00`);
    const diff = Math.round((cur - prev) / 86400000);
    if (diff === 1) current += 1;
    else current = 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

export function getTypeProgress(state, type) {
  const items = LEARNING_ITEMS.filter(item => item.type === type && type !== "sentence");
  let mastered = 0, learning = 0, unseen = 0;
  let masterySum = 0;
  for (const item of items) {
    const skills = getSkillsForType(type);
    const reviewed = skills.some(skill => {
      const t = getSkillTotals(state.skills?.[skillKey(item.id, skill)]);
      return t.correct + t.wrong > 0;
    });
    const mastery = getItemMastery(state, item);
    masterySum += mastery;
    if (!reviewed) unseen += 1;
    else if (mastery >= 4) mastered += 1;
    else learning += 1;
  }
  return {
    total: items.length,
    mastered,
    learning,
    unseen,
    percent: items.length ? Math.round((masterySum / (items.length * 5)) * 100) : 0
  };
}

export function getN5Completion(state) {
  const weights = {
    kana: 0.15,
    vocabulary: 0.28,
    grammar: 0.20,
    kanji: 0.15,
    reading: 0.11,
    listening: 0.11
  };
  const domains = Object.keys(weights).map(type => ({ type, ...getTypeProgress(state, type) }));
  const masteryPercent = Math.round(domains.reduce((sum, domain) => sum + domain.percent * weights[domain.type], 0));
  const lessons = getOverallLessonProgress(state.curriculum?.completedLessons || []);
  const percent = Math.round(masteryPercent * 0.72 + lessons.percent * 0.28);
  return { percent, masteryPercent, lessonPercent: lessons.percent, lessons, domains };
}

export function getTodaySummary(state) {
  const totals = getDayTotals(state, localDateKey());
  const total = totals.correct + totals.wrong;
  return { ...totals, total, accuracy: percent(totals.correct, total) };
}

export function getYearStudyDays(state, year = new Date().getFullYear()) {
  return Object.keys(state.activity || {}).filter(date => date.startsWith(`${year}-`)).filter(date => {
    const totals = getDayTotals(state, date);
    return totals.correct + totals.wrong > 0;
  }).length;
}
