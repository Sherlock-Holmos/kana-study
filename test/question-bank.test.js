import test from "node:test";
import assert from "node:assert/strict";
import { LEARNING_ITEMS } from "../src/data/content.js";
import { QUESTION_BANK, getQuestionBankStats } from "../src/assessment/question-bank.js";
import { createAssessmentSession } from "../src/assessment/engine.js";
import { createDefaultState } from "../src/core/state.js";

test("question bank separates assessment variants from learning items", () => {
  const ids = new Set(QUESTION_BANK.map(q => q.questionId));
  assert.equal(ids.size, QUESTION_BANK.length);
  assert.ok(QUESTION_BANK.length > LEARNING_ITEMS.filter(i => i.type !== "sentence").length);
  assert.ok(QUESTION_BANK.every(q => q.itemId && q.skill && q.variantType && q.difficulty >= 1 && q.difficulty <= 5));
  assert.ok(getQuestionBankStats().byType.vocabulary > 0);
});

test("assessment v3 queues explicit question-bank variants", () => {
  const session = createAssessmentSession("diagnostic-n5", createDefaultState());
  assert.equal(session.blueprintVersion, 3);
  assert.equal(session.questionBankVersion, 2);
  assert.ok(session.queue.every(q => q.questionId && q.variantType));
});
