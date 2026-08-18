import test from "node:test";
import assert from "node:assert/strict";
import { buildExercise, isExerciseAnswerCorrect } from "../src/learning/exercises.js";

test("kanji supports meaning and reading exercises", () => {
  const meaning = buildExercise("kanji:日", "meaning");
  const reading = buildExercise("kanji:日", "reading");
  assert.equal(meaning.kind, "choice");
  assert.equal(reading.kind, "typing");
  assert.ok(isExerciseAnswerCorrect(reading, "にち"));
});

test("reading exercise exposes passage and valid answer", () => {
  const exercise = buildExercise("reading:n5-01", "comprehension");
  assert.equal(exercise.kind, "reading-choice");
  assert.match(exercise.passage, /日本語/);
  assert.ok(isExerciseAnswerCorrect(exercise, exercise.answerLabel));
});

test("listening exercise keeps audio text separate from the question", () => {
  const exercise = buildExercise("listening:n5-01", "comprehension");
  assert.equal(exercise.kind, "listening-choice");
  assert.match(exercise.audioText, /電車/);
  assert.ok(isExerciseAnswerCorrect(exercise, exercise.answerLabel));
});
