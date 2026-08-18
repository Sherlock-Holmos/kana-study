import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../src/core/state.js";
import { buildDailyPlan, applyPlanSnapshot } from "../src/learning/planner.js";
import { skillKey } from "../src/domain/skills.js";

test("planner v2 reports review debt instead of forcing every overdue item", () => {
  const state = createDefaultState();
  let n = 0;
  for (const key of Object.keys(state.skills)) {
    if (n++ >= 70) break;
    state.skills[key].counters = { d: { correct: 2, wrong: 1 } };
    state.skills[key].nextReviewAt = "2020-01-01T00:00:00.000Z";
  }
  const plan = buildDailyPlan(state, "standard");
  assert.ok(plan.reviewDebt > 0);
  assert.ok(plan.reviewCount < plan.dueTotal);
});

test("planner snapshot persists debt and adaptive budget", () => {
  const state = createDefaultState();
  const plan = buildDailyPlan(state, "light");
  applyPlanSnapshot(state, plan);
  assert.equal(state.planner.lastPlan.version, 2);
  assert.equal(state.planner.reviewDebt.remaining, plan.reviewDebt);
});
