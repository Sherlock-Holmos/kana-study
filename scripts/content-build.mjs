import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { LEARNING_ITEMS } from "../src/data/content.js";
import { QUESTION_BANK } from "../src/assessment/question-bank.js";
import { CONTENT_RELEASE, CONTENT_SCHEMA_VERSION } from "../src/core/constants.js";
import { getAudioCoverage } from "../src/audio/repository.js";

const root = resolve("content", "generated");
rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });

function stableJson(value) { return JSON.stringify(value, null, 2) + "\n"; }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(name, value) {
  const text = stableJson(value);
  writeFileSync(resolve(root, name), text);
  return { file: `content/generated/${name}`, sha256: sha(text), bytes: Buffer.byteLength(text) };
}

const byType = {};
for (const item of LEARNING_ITEMS) (byType[item.type] ||= []).push(item);
const files = {};
for (const [type, items] of Object.entries(byType)) files[type] = write(`${type}.json`, items);
files.questions = write("question-bank.json", QUESTION_BANK);

const manifest = {
  release: CONTENT_RELEASE,
  schemaVersion: CONTENT_SCHEMA_VERSION,
  generatedAt: new Date().toISOString(),
  totals: Object.fromEntries(Object.entries(byType).map(([type, items]) => [type, items.length])),
  questionBank: { total: QUESTION_BANK.length },
  audio: getAudioCoverage(LEARNING_ITEMS),
  files
};
write("manifest.json", manifest);
console.log(`Content release: ${CONTENT_RELEASE}`);
console.log(`Content items: ${LEARNING_ITEMS.length}`);
console.log(`Question variants: ${QUESTION_BANK.length}`);
console.log(`Generated bundles: ${Object.keys(files).length + 1}`);
