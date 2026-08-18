import test from "node:test";
import assert from "node:assert/strict";
import { ASSESSMENT_DEFINITIONS } from "../src/assessment/catalog.js";
import { createAssessmentSession, summarizeAssessment, getAssessmentReadiness } from "../src/assessment/engine.js";
import { createDefaultState } from "../src/core/state.js";
import { recordQuizResult } from "../src/learning/session.js";

test("assessment catalog provides diagnostic, checkpoints and a comprehensive mock", () => {
  assert.ok(ASSESSMENT_DEFINITIONS.some(item => item.kind === "diagnostic"));
  assert.ok(ASSESSMENT_DEFINITIONS.some(item => item.kind === "checkpoint"));
  assert.ok(ASSESSMENT_DEFINITIONS.some(item => item.kind === "mock"));
  assert.equal(new Set(ASSESSMENT_DEFINITIONS.map(item => item.id)).size, ASSESSMENT_DEFINITIONS.length);
});

test("assessment session follows blueprint question count", () => {
  for (const definition of ASSESSMENT_DEFINITIONS) {
    const session = createAssessmentSession(definition.id);
    const expected = Object.values(definition.blueprint).reduce((sum, value) => sum + value, 0);
    assert.equal(session.type, "assessment");
    assert.equal(session.queue.length, expected);
    assert.ok(session.queue.every(entry => entry.kind === "quiz" && entry.stage === "assessment"));
  }
});

test("assessment wrong answers are not replayed when allowReplay is false", () => {
  const session = createAssessmentSession("diagnostic-n5");
  const initialLength = session.queue.length;
  const next = recordQuizResult(session, false, "", { allowReplay: false, responseMs: 1200 });
  assert.equal(next.queue.length, initialLength - 1);
  assert.equal(next.results.length, 1);
  assert.equal(next.results[0].correct, false);
});

test("assessment summary calculates pass result and domain breakdown", () => {
  let session = createAssessmentSession("diagnostic-n5");
  const total = session.queue.length;
  while (session.queue.length) session = recordQuizResult(session, true, "ok", { allowReplay: false, responseMs: 800 });
  const summary = summarizeAssessment(session);
  assert.equal(summary.total, total);
  assert.equal(summary.accuracy, 100);
  assert.equal(summary.passed, true);
  assert.ok(Object.keys(summary.domains).length >= 5);
});

test("diagnostic is always ready while checkpoints reflect course completion", () => {
  const state = createDefaultState();
  const diagnostic = ASSESSMENT_DEFINITIONS.find(item => item.id === "diagnostic-n5");
  const final = ASSESSMENT_DEFINITIONS.find(item => item.id === "mock-n5-core");
  assert.equal(getAssessmentReadiness(state, diagnostic).percent, 100);
  assert.equal(getAssessmentReadiness(state, diagnostic).ready, true);
  assert.ok(getAssessmentReadiness(state, final).percent < 70);
});
