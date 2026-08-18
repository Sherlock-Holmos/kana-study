import test from "node:test";
import assert from "node:assert/strict";
import { migrateLegacyState } from "../src/core/state.js";

test("v5-style hiragana progress migrates into both directions", () => {
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
  const state = migrateLegacyState(legacy);
  assert.equal(state.schemaVersion, 9);
  assert.equal(state.items["hiragana:し"].recognition.mastery, 3);
  assert.equal(state.items["hiragana:し"].recall.mastery, 3);
  assert.equal(state.activity["2026-08-18"].devices.legacyDevice.correct, 3);
});

test("legacy autoAdvance on/off string becomes a boolean", () => {
  assert.equal(migrateLegacyState({ autoAdvance: "off" }).settings.autoAdvance, false);
  assert.equal(migrateLegacyState({ autoAdvance: "on" }).settings.autoAdvance, true);
});
