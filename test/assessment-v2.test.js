import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../src/core/state.js";
import { createAssessmentSession, summarizeAssessment } from "../src/assessment/engine.js";

test("assessment v3 uses question bank and avoids recent variants and avoids recent questions when possible", () => {
  const state = createDefaultState();
  const first = createAssessmentSession("diagnostic-n5", state);
  first.completedAt = new Date().toISOString();
  first.results = first.queue.map(q => ({ itemId: q.itemId, skill: q.skill, questionId: q.questionId, correct: true }));
  state.sessions.push(first);
  const second = createAssessmentSession("diagnostic-n5", state);
  const overlap = second.queue.filter(q => first.results.some(r => r.questionId === q.questionId)).length;
  assert.equal(second.blueprintVersion, 3);
  assert.equal(second.questionBankVersion, 2);
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
