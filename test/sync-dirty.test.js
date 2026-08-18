import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../src/core/state.js";
import { markDateDirty, markSessionDirty, markSkillDirty, clearDirtyState } from "../src/sync/dirty-tracker.js";

test("dirty tracker deduplicates incremental sync keys", () => {
  const state = createDefaultState();
  state.sync.fullSyncRequired = false;
  markSkillDirty(state, "a"); markSkillDirty(state, "a");
  markDateDirty(state, "2026-08-18"); markSessionDirty(state, "s1");
  assert.deepEqual(state.sync.dirtySkillKeys, ["a"]);
  clearDirtyState(state);
  assert.equal(state.sync.dirtySkillKeys.length, 0);
  assert.equal(state.sync.fullSyncRequired, false);
});
