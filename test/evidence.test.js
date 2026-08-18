import test from "node:test";
import assert from "node:assert/strict";
import { getAnswerEvidence } from "../src/learning/evidence.js";

test("active production provides stronger evidence than multiple choice recognition", () => {
  const production = getAnswerEvidence({ kind: "typing" }, { skill: "production", stage: "vocab-production" }, { responseMs: 5000 });
  const choice = getAnswerEvidence({ kind: "choice" }, { skill: "meaning", stage: "vocab-meaning" }, { responseMs: 5000 });
  assert.ok(production > choice);
});

test("reinforcement replay is discounted", () => {
  const first = getAnswerEvidence({ kind: "typing" }, { skill: "recall", stage: "recall", replayCount: 0 }, { responseMs: 5000 });
  const replay = getAnswerEvidence({ kind: "typing" }, { skill: "recall", stage: "reinforce", replayCount: 1 }, { responseMs: 5000 });
  assert.ok(replay < first);
});
