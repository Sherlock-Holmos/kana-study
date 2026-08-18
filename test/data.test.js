import test from "node:test";
import assert from "node:assert/strict";
import { KANA_ITEMS, KANA_BY_ID } from "../src/data/kana.js";
import { CURRICULUM } from "../src/data/curriculum.js";

test("dataset contains 104 trainable items per script with unique ids", () => {
  assert.equal(KANA_ITEMS.filter(item => item.script === "hiragana").length, 104);
  assert.equal(KANA_ITEMS.filter(item => item.script === "katakana").length, 104);
  assert.equal(new Set(KANA_ITEMS.map(item => item.id)).size, KANA_ITEMS.length);
});

test("curriculum contains 21 lessons per script", () => {
  assert.equal(CURRICULUM.filter(item => item.script === "hiragana").length, 21);
  assert.equal(CURRICULUM.filter(item => item.script === "katakana").length, 21);
});

test("romaji aliases are scoped to the correct kana", () => {
  assert.ok(KANA_BY_ID["hiragana:を"].aliases.includes("wo"));
  assert.ok(!KANA_BY_ID["hiragana:お"].aliases.includes("wo"));
  assert.ok(KANA_BY_ID["hiragana:じ"].aliases.includes("zi"));
  assert.ok(!KANA_BY_ID["hiragana:ぢ"].aliases.includes("zi"));
});
