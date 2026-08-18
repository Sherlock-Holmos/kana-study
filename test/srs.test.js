import test from "node:test";
import assert from "node:assert/strict";
import { createSkillState } from "../src/core/state.js";
import { updateSkillAfterAnswer } from "../src/learning/srs.js";

test("correct answer schedules future review and records counter", () => {
  const now = Date.UTC(2026, 7, 18, 0, 0, 0);
  const next = updateSkillAfterAnswer(createSkillState(), true, "dev", now);
  assert.equal(next.counters.dev.correct, 1);
  assert.ok(Date.parse(next.nextReviewAt) > now);
});

test("wrong answer increases lapse and schedules short review", () => {
  const now = Date.UTC(2026, 7, 18, 0, 0, 0);
  const next = updateSkillAfterAnswer(createSkillState(), false, "dev", now);
  assert.equal(next.lapseCount, 1);
  assert.equal(next.counters.dev.wrong, 1);
  assert.ok(Date.parse(next.nextReviewAt) - now <= 11 * 60 * 1000);
});

test("stronger evidence grows stability faster and stores response metrics", () => {
  const now = Date.UTC(2026, 7, 18, 0, 0, 0);
  const weak = updateSkillAfterAnswer(createSkillState(), true, "dev", now, 0.6, 12000);
  const strong = updateSkillAfterAnswer(createSkillState(), true, "dev", now, 1.2, 3500);
  assert.ok(strong.stabilityDays > weak.stabilityDays);
  assert.equal(strong.reviewCount, 1);
  assert.equal(strong.lastResponseMs, 3500);
  assert.ok(strong.averageResponseMs > 0);
});
