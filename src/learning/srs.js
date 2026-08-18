import { MAX_MASTERY } from "../core/constants.js";
import { clamp, nowIso } from "../core/utils.js";

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function scheduleReview(directionState, isCorrect, now = Date.now()) {
  const next = {
    ...directionState,
    counters: { ...(directionState.counters || {}) }
  };

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

  const previousReviews = Object.values(next.counters || {}).reduce(
    (sum, counts) => sum + Number(counts?.correct || 0) + Number(counts?.wrong || 0),
    0
  );

  next.correctStreak = Number(next.correctStreak || 0) + 1;
  next.difficulty = clamp(Number(next.difficulty || 3) - 0.08, 1, 5);

  const baseStability = Number(next.stabilityDays || 0);
  const growth = 1.55 + (5 - next.difficulty) * 0.08;
  next.stabilityDays = baseStability > 0
    ? clamp(baseStability * growth + 0.15, 0.02, 120)
    : previousReviews <= 1 ? 0.33 : 1;

  if (next.correctStreak >= 2 || next.stabilityDays >= 1) {
    next.mastery = Math.min(MAX_MASTERY, Number(next.mastery || 0) + 1);
    next.correctStreak = 0;
  }

  let intervalMs;
  if (next.mastery <= 0) intervalMs = 60 * MINUTE;
  else if (next.mastery === 1) intervalMs = 8 * HOUR;
  else intervalMs = Math.max(1, next.stabilityDays) * DAY;

  next.nextReviewAt = new Date(now + intervalMs).toISOString();
  return next;
}

export function updateDirectionAfterAnswer(directionState, isCorrect, deviceId, now = Date.now()) {
  const withCounter = {
    ...directionState,
    counters: { ...(directionState.counters || {}) }
  };
  withCounter.counters[deviceId] ||= { correct: 0, wrong: 0 };
  withCounter.counters[deviceId] = { ...withCounter.counters[deviceId] };
  withCounter.counters[deviceId][isCorrect ? "correct" : "wrong"] += 1;
  return scheduleReview(withCounter, isCorrect, now);
}

export function createManualMastery(mastery, updatedAt = nowIso()) {
  return {
    mastery: clamp(Number(mastery || 0), 0, MAX_MASTERY),
    updatedAt
  };
}
