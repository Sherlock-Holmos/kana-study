import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../src/core/state.js";
import { skillKey } from "../src/domain/skills.js";
import { buildDailyPlan } from "../src/learning/planner.js";
import { createDailySession } from "../src/learning/session.js";

test("daily planner combines due reviews with a recommended lesson", () => {
  const state = createDefaultState();
  const key = skillKey("vocab:taberu", "meaning");
  state.skills[key].counters = { d: { correct: 2, wrong: 0 } };
  state.skills[key].nextReviewAt = new Date(Date.now() - 1000).toISOString();
  const plan = buildDailyPlan(state, "standard");
  assert.ok(plan.reviewCount >= 1);
  assert.ok(plan.nextLesson);
  assert.equal(plan.nextLesson.id, "hira-basic-a");
  assert.ok(plan.estimatedMinutes > 0);
  const session = createDailySession(plan);
  assert.equal(session.type, "daily");
  assert.ok(session.queue.some(entry => entry.kind === "quiz"));
});

test("light plan limits review load more aggressively than intensive", () => {
  const state = createDefaultState();
  let marked = 0;
  for (const [key, skill] of Object.entries(state.skills)) {
    if (marked >= 40) break;
    skill.counters = { d: { correct: 1, wrong: 0 } };
    skill.nextReviewAt = new Date(Date.now() - 1000).toISOString();
    marked += 1;
  }
  const light = buildDailyPlan(state, "light");
  const intensive = buildDailyPlan(state, "intensive");
  assert.ok(light.reviewCount <= intensive.reviewCount);
  assert.equal(intensive.includeLesson, true);
});
