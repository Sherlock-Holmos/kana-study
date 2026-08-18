import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { LEARNING_ITEMS } from "../src/data/content.js";
import { CONTENT_RELEASE, CONTENT_SCHEMA_VERSION } from "../src/core/constants.js";

const byType = {};
let reviewed = 0, validated = 0, lowConfidence = 0, missingAbilities = 0, missingTopics = 0;
for (const item of LEARNING_ITEMS) {
  byType[item.type] = (byType[item.type] || 0) + 1;
  if (item.reviewStatus === "reviewed") reviewed += 1;
  if (item.reviewStatus === "automated-validated") validated += 1;
  if (Number(item.confidence || 0) < 0.8) lowConfidence += 1;
  if (!(item.pedagogy?.abilities || []).length && item.type !== "sentence") missingAbilities += 1;
  if (!(item.pedagogy?.topics || []).length) missingTopics += 1;
}
const lines = [
  "# Content Quality Report", "", `- Release: ${CONTENT_RELEASE}`, `- Content schema: ${CONTENT_SCHEMA_VERSION}`,
  `- Total items: ${LEARNING_ITEMS.length}`, `- Reviewed: ${reviewed}`, `- Automated validated: ${validated}`,
  `- Confidence < 0.80: ${lowConfidence}`, `- Missing ability tags: ${missingAbilities}`, `- Missing topic tags: ${missingTopics}`, "",
  "## By type", "", ...Object.entries(byType).sort().map(([type,count]) => `- ${type}: ${count}`), "",
  "## Release gate", "", `- Pedagogy tags complete: ${missingAbilities === 0 && missingTopics === 0 ? "PASS" : "FAIL"}`,
  "- Automated validation is not equivalent to professional Japanese-teacher review.", ""
];
writeFileSync(resolve("CONTENT-QUALITY-REPORT.md"), lines.join("\n"));
mkdirSync(resolve("content"), { recursive: true });
writeFileSync(resolve("content", "release.json"), JSON.stringify({
  release: CONTENT_RELEASE,
  schemaVersion: CONTENT_SCHEMA_VERSION,
  generatedAt: new Date().toISOString(),
  totals: byType,
  review: { reviewed, automatedValidated: validated, lowConfidence, missingAbilities, missingTopics }
}, null, 2) + "\n");
console.log(lines.join("\n"));
