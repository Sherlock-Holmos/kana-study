import test from "node:test";
import assert from "node:assert/strict";
import { createLessonSession, recordSpeakingResult } from "../src/learning/session.js";
import { getAudioText } from "../src/audio/repository.js";
import { getLearningItem } from "../src/data/content.js";

test("integrated lessons include shadowing entries when example sentences exist", () => {
  const candidates = ["jp-n5-01", "jp-n5-02", "jp-n5-03", "jp-n5-04"];
  let session = null;
  for (const id of candidates) {
    try {
      const value = createLessonSession(id);
      if (value.queue.some(entry => entry.kind === "speaking")) { session = value; break; }
    } catch {}
  }
  if (!session) {
    // Find the first lesson indirectly by scanning known v15 integrated lesson ids is intentionally avoided;
    // this assertion keeps the feature contract explicit if curriculum ids change.
    assert.fail("No integrated lesson with speaking entries was found");
  }
  const index = session.queue.findIndex(entry => entry.kind === "speaking");
  session.queue = session.queue.slice(index);
  const next = recordSpeakingResult(session, "done", { durationMs: 3200 });
  assert.equal(next.speakingResults.length, 1);
  assert.equal(next.speakingResults[0].durationMs, 3200);
});

test("audio fallback can speak sentence Japanese text", () => {
  const sentence = getLearningItem("sentence:s001");
  if (sentence) assert.ok(getAudioText(sentence).length > 0);
});
