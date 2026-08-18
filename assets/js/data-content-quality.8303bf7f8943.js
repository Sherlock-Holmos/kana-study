import { LEARNING_ITEMS } from "./data-content.ca0adfcb296c.js";

export const CONTENT_REVIEW_STATUSES = ["draft", "automated-validated", "human-reviewed", "published"];

export function getContentQualitySummary(type = null) {
  const items = LEARNING_ITEMS.filter(item => item.type !== "sentence" && (!type || item.type === type));
  const statuses = Object.fromEntries(CONTENT_REVIEW_STATUSES.map(status => [status, 0]));
  let confidenceTotal = 0;
  let versionTotal = 0;
  let sourceMissing = 0;
  for (const item of items) {
    statuses[item.reviewStatus] = (statuses[item.reviewStatus] || 0) + 1;
    confidenceTotal += Number(item.confidence || 0);
    versionTotal += Number(item.contentVersion || 1);
    if (!item.source) sourceMissing += 1;
  }
  return {
    total: items.length,
    statuses,
    averageConfidence: items.length ? Math.round(confidenceTotal / items.length * 100) : 0,
    averageVersion: items.length ? Number((versionTotal / items.length).toFixed(1)) : 0,
    humanReviewed: (statuses["human-reviewed"] || 0) + (statuses.published || 0),
    automatedValidated: statuses["automated-validated"] || 0,
    sourceMissing
  };
}
