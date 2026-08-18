import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../src/core/state.js";
import { mergeStates } from "../src/sync/merge.js";

test("merge keeps maximum per-device counters and unions completed lessons", () => {
  const a = createDefaultState();
  const b = createDefaultState();
  a.lifetime.devices.dev = { correct: 5, wrong: 1 };
  b.lifetime.devices.dev = { correct: 3, wrong: 4 };
  a.curriculum.completedLessons = ["hira-basic-a"];
  b.curriculum.completedLessons = ["hira-basic-ka"];
  const merged = mergeStates(a, b);
  assert.deepEqual(merged.lifetime.devices.dev, { correct: 5, wrong: 4 });
  assert.deepEqual(new Set(merged.curriculum.completedLessons), new Set(["hira-basic-a", "hira-basic-ka"]));
});
