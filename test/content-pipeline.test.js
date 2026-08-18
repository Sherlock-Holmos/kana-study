import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../content/generated/manifest.json", import.meta.url), "utf8"));

test("content pipeline emits independently versioned JSON bundles", () => {
  assert.equal(manifest.release, "n5-2026.08-v16");
  assert.equal(manifest.schemaVersion, 1);
  assert.ok(manifest.totals.vocabulary > 0);
  assert.ok(manifest.questionBank.total > 1000);
  assert.ok(manifest.files.questions.sha256.length === 64);
});
