import test from "node:test";
import assert from "node:assert/strict";
import { createReviewSession, recordQuizResult } from "../src/learning/session.js";
import { KANA_BY_ID } from "../src/data/kana.js";

test("wrong answers are reinserted into the short-term replay queue", () => {
  const item = KANA_BY_ID["hiragana:し"];
  const pairs = Array.from({ length: 6 }, () => ({ item, direction: "recognition" }));
  const session = createReviewSession("weak", pairs, "test");
  const before = session.queue.length;
  const next = recordQuizResult(session, false, "si");
  assert.equal(next.queue.length, before);
  assert.ok(next.queue.some(entry => entry.replayCount === 1));
  assert.equal(next.results.length, 1);
});
