import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeState } from "../src/core/state.js";
import { skillKey } from "../src/domain/skills.js";

test("v5-style hiragana progress migrates into v15 skills", () => {
  const legacy = {
    stats: { correct: 10, wrong: 2 },
    kanaStats: {
      "し": {
        correct: 6,
        wrong: 2,
        mastery: 3,
        streak: 1,
        lastResult: "wrong",
        lastReviewedAt: "2026-08-18T00:00:00.000Z",
        nextReviewAt: "2026-08-18T01:00:00.000Z"
      }
    },
    dailyCounters: {
      "2026-08-18": { legacyDevice: { correct: 3, wrong: 1 } }
    }
  };

  const state = sanitizeState(legacy);
  assert.equal(state.schemaVersion, 13);

  const recognition = state.skills[skillKey("hiragana:し", "recognition")];
  const recall = state.skills[skillKey("hiragana:し", "recall")];
  assert.equal(recognition.mastery, 3);
  assert.equal(recall.mastery, 3);
  assert.equal(state.activity["2026-08-18"].devices.legacyDevice.correct, 3);
});

test("legacy autoAdvance on/off string becomes a boolean", () => {
  assert.equal(sanitizeState({ autoAdvance: "off" }).settings.autoAdvance, false);
  assert.equal(sanitizeState({ autoAdvance: "on" }).settings.autoAdvance, true);
});
