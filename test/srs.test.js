import test from "node:test";
import assert from "node:assert/strict";
import { createDirectionState } from "../src/core/state.js";
import { updateDirectionAfterAnswer } from "../src/learning/srs.js";

test("correct answers schedule a future review and increment device counter", () => {
  const now = Date.UTC(2026, 7, 18, 0, 0, 0);
  const next = updateDirectionAfterAnswer(createDirectionState(), true, "dev-a", now);
  assert.equal(next.counters["dev-a"].correct, 1);
  assert.equal(next.lastResult, "correct");
  assert.ok(Date.parse(next.nextReviewAt) > now);
});

test("wrong answers reduce mastery and schedule a short review", () => {
  const state = { ...createDirectionState(), mastery: 4, stabilityDays: 8 };
  const now = Date.UTC(2026, 7, 18, 0, 0, 0);
  const next = updateDirectionAfterAnswer(state, false, "dev-a", now);
  assert.equal(next.mastery, 3);
  assert.equal(next.lapseCount, 1);
  assert.equal(next.counters["dev-a"].wrong, 1);
  assert.equal(Date.parse(next.nextReviewAt) - now, 10 * 60 * 1000);
});
