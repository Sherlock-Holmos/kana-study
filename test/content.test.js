import test from "node:test";
import assert from "node:assert/strict";
import { KANA_ITEMS } from "../src/data/kana.js";
import { ALL_VOCABULARY_ITEMS, ALL_GRAMMAR_ITEMS, ALL_SENTENCE_ITEMS, LEARNING_ITEMS } from "../src/data/content.js";
import { KANJI_ITEMS } from "../src/data/kanji.js";
import { READING_ITEMS } from "../src/data/reading.js";
import { LISTENING_ITEMS } from "../src/data/listening.js";
import { CURRICULUM } from "../src/data/curriculum.js";

test("v11 corpus covers N5 core domains", () => {
  assert.equal(KANA_ITEMS.length, 208);
  assert.ok(ALL_VOCABULARY_ITEMS.length >= 450);
  assert.ok(ALL_GRAMMAR_ITEMS.length >= 90);
  assert.ok(KANJI_ITEMS.length >= 100);
  assert.ok(ALL_SENTENCE_ITEMS.length >= 100);
  assert.ok(READING_ITEMS.length >= 20);
  assert.ok(LISTENING_ITEMS.length >= 20);
  assert.ok(CURRICULUM.length >= 70);
});

test("all learning content ids are unique", () => {
  assert.equal(new Set(LEARNING_ITEMS.map(item => item.id)).size, LEARNING_ITEMS.length);
});

test("reading and listening answers are valid options", () => {
  for (const item of [...READING_ITEMS, ...LISTENING_ITEMS]) assert.ok(item.options.includes(item.answer), item.id);
});
