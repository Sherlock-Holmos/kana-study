import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState, sanitizeState } from "../src/core/state.js";
import { skillKey } from "../src/domain/skills.js";

test("default state contains multi-skill vocabulary and grammar progress", () => {
  const state = createDefaultState();
  assert.ok(state.skills[skillKey("vocab:taberu", "meaning")]);
  assert.ok(state.skills[skillKey("vocab:taberu", "reading")]);
  assert.ok(state.skills[skillKey("vocab:taberu", "production")]);
  assert.ok(state.skills[skillKey("grammar:teiru", "meaning")]);
  assert.ok(state.skills[skillKey("grammar:teiru", "application")]);
});

test("v9 kana state migrates into v10 skill map", () => {
  const v9 = {
    schemaVersion: 9,
    settings: { dailyGoal: 50 },
    curriculum: { completedLessons: ["hira-basic-a"] },
    items: {
      "hiragana:あ": {
        recognition: { mastery: 4, counters: { d: { correct: 5, wrong: 1 } } },
        recall: { mastery: 2, counters: { d: { correct: 2, wrong: 2 } } }
      }
    },
    activity: {}, lifetime: { devices: {} }, sessions: []
  };
  const state = sanitizeState(v9);
  assert.equal(state.schemaVersion, 10);
  assert.equal(state.settings.dailyGoal, 50);
  assert.equal(state.skills[skillKey("hiragana:あ", "recognition")].mastery, 4);
  assert.equal(state.skills[skillKey("hiragana:あ", "recall")].mastery, 2);
});
