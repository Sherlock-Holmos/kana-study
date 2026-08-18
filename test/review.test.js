import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../src/core/state.js";
import { skillKey } from "../src/domain/skills.js";
import { getDuePairs, getRecentMistakePairs } from "../src/review/selectors.js";

test("review selectors work across vocabulary skills", () => {
  const state = createDefaultState();
  const key = skillKey("vocab:taberu", "meaning");
  state.skills[key] = {
    ...state.skills[key],
    lastResult: "wrong",
    lastReviewedAt: new Date().toISOString(),
    nextReviewAt: new Date(Date.now() - 1000).toISOString(),
    counters: { d: { correct: 1, wrong: 1 } }
  };
  assert.ok(getDuePairs(state).some(pair => pair.item.id === "vocab:taberu" && pair.skill === "meaning"));
  assert.ok(getRecentMistakePairs(state).some(pair => pair.item.id === "vocab:taberu"));
});
