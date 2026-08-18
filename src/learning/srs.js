import { MAX_MASTERY } from "../core/constants.js";
import { clamp } from "../core/utils.js";

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function updateSkillAfterAnswer(skillState, isCorrect, deviceId, now = Date.now(), quality = 1) {
  const next = { ...skillState, counters: { ...(skillState?.counters || {}) } };
  next.counters[deviceId] ||= { correct: 0, wrong: 0 };
  next.counters[deviceId] = { ...next.counters[deviceId] };
  next.counters[deviceId][isCorrect ? "correct" : "wrong"] += 1;
  next.updatedAt = new Date(now).toISOString();
  next.lastReviewedAt = next.updatedAt;
  next.lastResult = isCorrect ? "correct" : "wrong";

  if (!isCorrect) {
    next.correctStreak = 0;
    next.lapseCount = Number(next.lapseCount || 0) + 1;
    next.mastery = Math.max(0, Number(next.mastery || 0) - 1);
    next.difficulty = clamp(Number(next.difficulty || 3) + 0.35, 1, 5);
    next.stabilityDays = Math.max(10 / 1440, Number(next.stabilityDays || 0) * 0.35);
    next.nextReviewAt = new Date(now + 10 * MINUTE).toISOString();
    return next;
  }

  next.correctStreak = Number(next.correctStreak || 0) + 1;
  next.difficulty = clamp(Number(next.difficulty || 3) - 0.08 * quality, 1, 5);
  const base = Number(next.stabilityDays || 0);
  const growth = 1.45 + (5 - next.difficulty) * 0.1 + 0.15 * quality;
  next.stabilityDays = base > 0 ? clamp(base * growth + 0.15, 0.02, 180) : 0.33;
  if (next.correctStreak >= 2 || next.stabilityDays >= 1) {
    next.mastery = Math.min(MAX_MASTERY, Number(next.mastery || 0) + 1);
    next.correctStreak = 0;
  }
  let interval = next.mastery <= 0 ? HOUR : next.mastery === 1 ? 8 * HOUR : Math.max(1, next.stabilityDays) * DAY;
  next.nextReviewAt = new Date(now + interval).toISOString();
  return next;
}
