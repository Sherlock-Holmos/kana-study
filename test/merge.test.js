import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../src/core/state.js";
import { skillKey } from "../src/domain/skills.js";
import { mergeStates } from "../src/sync/merge.js";

test("multi-device counters merge by per-device maximum", () => {
  const a = createDefaultState();
  const b = createDefaultState();
  const key = skillKey("vocab:mizu", "meaning");
  a.skills[key].counters = { phone: { correct: 3, wrong: 1 } };
  b.skills[key].counters = { phone: { correct: 2, wrong: 2 }, pc: { correct: 4, wrong: 0 } };
  const merged = mergeStates(a,b);
  assert.deepEqual(merged.skills[key].counters.phone, { correct: 3, wrong: 2 });
  assert.deepEqual(merged.skills[key].counters.pc, { correct: 4, wrong: 0 });
});
