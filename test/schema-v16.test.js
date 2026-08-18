import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState, sanitizeState } from "../src/core/state.js";

test("v16 schema adds speaking progress without losing v15 state", () => {
  const old = createDefaultState();
  old.schemaVersion = 13;
  delete old.speaking;
  const next = sanitizeState(old);
  assert.equal(next.schemaVersion, 14);
  assert.deepEqual(next.speaking, { attempts: 0, completed: 0, retry: 0, totalDurationMs: 0, lastPracticedAt: null });
});
