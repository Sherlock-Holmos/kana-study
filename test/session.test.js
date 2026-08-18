import test from "node:test";
import assert from "node:assert/strict";
import { createLessonSession, recordQuizResult } from "../src/learning/session.js";

test("integrated Japanese lesson contains intros and quizzes", () => {
  const session = createLessonSession("jp-n5-01");
  assert.ok(session.queue.some(entry => entry.kind === "intro"));
  assert.ok(session.queue.some(entry => entry.kind === "quiz" && entry.skill === "meaning"));
  assert.ok(session.queue.some(entry => entry.kind === "quiz" && entry.skill === "application"));
});

test("wrong quiz is reinserted for short-term reinforcement", () => {
  let session = createLessonSession("hira-basic-a");
  while (session.queue[0]?.kind !== "quiz") session = { ...session, queue: session.queue.slice(1) };
  const before = session.queue.length;
  session = recordQuizResult(session, false, "x");
  assert.equal(session.queue.length, before);
  assert.ok(session.queue.some(entry => entry.stage === "reinforce"));
});
