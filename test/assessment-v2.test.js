import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../src/core/state.js";
import { createAssessmentSession, summarizeAssessment } from "../src/assessment/engine.js";

test("assessment v2 records blueprint version and avoids recent questions when possible", () => {
  const state = createDefaultState();
  const first = createAssessmentSession("diagnostic-n5", state);
  first.completedAt = new Date().toISOString();
  first.results = first.queue.map(q => ({ itemId: q.itemId, skill: q.skill, correct: true }));
  state.sessions.push(first);
  const second = createAssessmentSession("diagnostic-n5", state);
  const overlap = second.queue.filter(q => first.results.some(r => r.itemId === q.itemId)).length;
  assert.equal(second.blueprintVersion, 2);
  assert.ok(overlap < second.queue.length);
});

test("assessment summary includes ability-level diagnosis", () => {
  const state = createDefaultState();
  const session = createAssessmentSession("diagnostic-n5", state);
  session.results = session.queue.map((q, i) => ({ itemId: q.itemId, skill: q.skill, correct: i % 2 === 0 }));
  session.completedAt = new Date().toISOString();
  const summary = summarizeAssessment(session);
  assert.ok(Object.keys(summary.abilities).length > 0);
});
