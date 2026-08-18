import test from "node:test";
import assert from "node:assert/strict";
import { getContentQualitySummary, CONTENT_REVIEW_STATUSES } from "../src/data/content-quality.js";
import { LEARNING_ITEMS } from "../src/data/content.js";

test("all published learning content exposes recognized review metadata", () => {
  for (const item of LEARNING_ITEMS) {
    assert.ok(item.source);
    assert.ok(CONTENT_REVIEW_STATUSES.includes(item.reviewStatus));
    assert.ok(Number(item.contentVersion) >= 1);
    assert.ok(Number(item.confidence) > 0 && Number(item.confidence) <= 1);
  }
});

test("content quality summary is explicit about automated vs human review", () => {
  const summary = getContentQualitySummary("vocabulary");
  assert.ok(summary.total >= 450);
  assert.equal(summary.sourceMissing, 0);
  assert.equal(summary.total, Object.values(summary.statuses).reduce((a, b) => a + b, 0));
  assert.ok(summary.averageConfidence > 0 && summary.averageConfidence <= 100);
});
