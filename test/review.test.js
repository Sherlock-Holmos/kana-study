import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../src/core/state.js";
import { getDuePairs, getRecentMistakePairs, getWeakPairs } from "../src/review/selectors.js";

test("selectors distinguish due, weak and recent mistake directions", () => {
  const state = createDefaultState();
  const progress = state.items["hiragana:し"].recognition;
  progress.counters.dev = { correct: 1, wrong: 3 };
  progress.mastery = 1;
  progress.lapseCount = 3;
  progress.lastResult = "wrong";
  progress.lastReviewedAt = "2026-08-17T00:00:00.000Z";
  progress.nextReviewAt = "2026-08-17T01:00:00.000Z";
  const now = Date.UTC(2026, 7, 18, 0, 0, 0);
  assert.ok(getDuePairs(state, now).some(pair => pair.item.id === "hiragana:し" && pair.direction === "recognition"));
  assert.ok(getWeakPairs(state).some(pair => pair.item.id === "hiragana:し"));
  assert.ok(getRecentMistakePairs(state, now).some(pair => pair.item.id === "hiragana:し"));
});
