import { MAX_MASTERY } from "../core/constants.js";
import { clamp } from "../core/utils.js";

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function updateSkillAfterAnswer(
  skillState,
  isCorrect,
  deviceId,
  now = Date.now(),
  quality = 1,
  responseMs = 0
) {
  const next = { ...skillState, counters: { ...(skillState?.counters || {}) } };
  next.counters[deviceId] ||= { correct: 0, wrong: 0 };
  next.counters[deviceId] = { ...next.counters[deviceId] };
  next.counters[deviceId][isCorrect ? "correct" : "wrong"] += 1;

  const normalizedQuality = clamp(Number(quality || 1), 0.45, 1.25);
  const normalizedResponseMs = Math.max(0, Number(responseMs || 0));
  const previousReviews = Math.max(0, Number(next.reviewCount || 0));
  next.reviewCount = previousReviews + 1;
  next.lastQuality = normalizedQuality;
  next.lastResponseMs = normalizedResponseMs;
  if (normalizedResponseMs > 0) {
    const previousAverage = Math.max(0, Number(next.averageResponseMs || 0));
    next.averageResponseMs = previousReviews > 0
      ? Math.round((previousAverage * previousReviews + normalizedResponseMs) / (previousReviews + 1))
      : normalizedResponseMs;
  }

  next.updatedAt = new Date(now).toISOString();
  next.lastReviewedAt = next.updatedAt;
  next.lastResult = isCorrect ? "correct" : "wrong";
  next.revision = Number(next.revision || 0) + 1;
  next.lastDeviceId = deviceId || null;

  if (!isCorrect) {
    next.correctStreak = 0;
    next.evidenceScore = Math.max(0, Number(next.evidenceScore || 0) * 0.25);
    next.lapseCount = Number(next.lapseCount || 0) + 1;
    next.mastery = Math.max(0, Number(next.mastery || 0) - 1);
    next.difficulty = clamp(Number(next.difficulty || 3) + 0.35, 1, 5);
    next.stabilityDays = Math.max(10 / 1440, Number(next.stabilityDays || 0) * 0.35);
    next.nextReviewAt = new Date(now + 10 * MINUTE).toISOString();
    return next;
  }

  next.correctStreak = Number(next.correctStreak || 0) + 1;
  next.evidenceScore = Number(next.evidenceScore || 0) + normalizedQuality;
  next.difficulty = clamp(Number(next.difficulty || 3) - 0.08 * normalizedQuality, 1, 5);

  const base = Number(next.stabilityDays || 0);
  const growth = 1.38 + (5 - next.difficulty) * 0.1 + 0.2 * normalizedQuality;
  next.stabilityDays = base > 0
    ? clamp(base * growth + 0.12 * normalizedQuality, 0.02, 240)
    : clamp(0.22 + 0.12 * normalizedQuality, 0.2, 0.5);

  if (next.evidenceScore >= 2 || next.stabilityDays >= 1.2) {
    next.mastery = Math.min(MAX_MASTERY, Number(next.mastery || 0) + 1);
    next.evidenceScore = Math.max(0, next.evidenceScore - 2);
    next.correctStreak = 0;
  }

  let interval;
  if (next.mastery <= 0) interval = 60 * MINUTE;
  else if (next.mastery === 1) interval = 8 * HOUR;
  else interval = Math.max(1, next.stabilityDays) * DAY;

  interval *= clamp(0.72 + normalizedQuality * 0.28, 0.82, 1.08);
  next.nextReviewAt = new Date(now + interval).toISOString();
  return next;
}
