import test from "node:test";
import assert from "node:assert/strict";
import { KANA_ITEMS } from "../src/data/kana.js";
import { VOCABULARY_ITEMS } from "../src/data/vocabulary.js";
import { GRAMMAR_ITEMS } from "../src/data/grammar.js";
import { SENTENCE_ITEMS } from "../src/data/sentences.js";
import { CURRICULUM } from "../src/data/curriculum.js";

test("content corpus has substantial kana, vocabulary, grammar and sentence data", () => {
  assert.equal(KANA_ITEMS.length, 208);
  assert.ok(VOCABULARY_ITEMS.length >= 120);
  assert.ok(GRAMMAR_ITEMS.length >= 30);
  assert.ok(SENTENCE_ITEMS.length >= 40);
  assert.ok(CURRICULUM.length >= 50);
});

test("all content ids are unique", () => {
  const all = [...KANA_ITEMS, ...VOCABULARY_ITEMS, ...GRAMMAR_ITEMS, ...SENTENCE_ITEMS];
  assert.equal(new Set(all.map(item => item.id)).size, all.length);
});
