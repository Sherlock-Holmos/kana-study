import { execFileSync } from "node:child_process";
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { KANA_ITEMS } from "../src/data/kana.js";
import { VOCABULARY_ITEMS } from "../src/data/vocabulary.js";
import { GRAMMAR_ITEMS } from "../src/data/grammar.js";
import { SENTENCE_ITEMS } from "../src/data/sentences.js";
import { CURRICULUM } from "../src/data/curriculum.js";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, result = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, result);
    else result.push(path);
  }
  return result;
}

const jsFiles = walk(join(project, "src")).filter(path => path.endsWith(".js"));
jsFiles.push(...walk(join(project, "test")).filter(path => path.endsWith(".js")));
for (const file of jsFiles) execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function uniqueIds(items, label) {
  const ids = items.map(item => item.id);
  assert(new Set(ids).size === ids.length, `${label} 存在重复 ID`);
}
uniqueIds(KANA_ITEMS, "假名");
uniqueIds(VOCABULARY_ITEMS, "词汇");
uniqueIds(GRAMMAR_ITEMS, "语法");
uniqueIds(SENTENCE_ITEMS, "例句");
uniqueIds(CURRICULUM, "课程");

const contentIds = new Set([...KANA_ITEMS, ...VOCABULARY_ITEMS, ...GRAMMAR_ITEMS, ...SENTENCE_ITEMS].map(item => item.id));
for (const sentence of SENTENCE_ITEMS) {
  for (const id of [...(sentence.vocabulary || []), ...(sentence.grammar || [])]) assert(contentIds.has(id), `例句 ${sentence.id} 引用了不存在的 ${id}`);
}
for (const lesson of CURRICULUM) {
  for (const id of [...(lesson.itemIds || []), ...(lesson.vocabulary || []), ...(lesson.grammar || []), ...(lesson.sentences || [])]) assert(contentIds.has(id), `课程 ${lesson.id} 引用了不存在的 ${id}`);
}

const index = readFileSync(join(project, "index.html"), "utf8");
for (const match of index.matchAll(/(?:href|src)="(\.\/[^"?]+)(?:\?[^\"]*)?"/g)) {
  const target = resolve(project, match[1]);
  if (match[1].startsWith("./src") || match[1].startsWith("./css") || match[1].startsWith("./icons") || match[1].startsWith("./manifest")) assert(existsSync(target), `index.html 缺少资源 ${match[1]}`);
}

for (const file of jsFiles.filter(path => path.includes(`${join("src", "")}`))) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    const target = resolve(dirname(file), match[1]);
    assert(existsSync(target), `${relative(project, file)} import 不存在：${match[1]}`);
  }
}

console.log(`JS syntax: ${jsFiles.length} files OK`);
console.log(`Kana: ${KANA_ITEMS.length}`);
console.log(`Vocabulary: ${VOCABULARY_ITEMS.length}`);
console.log(`Grammar: ${GRAMMAR_ITEMS.length}`);
console.log(`Sentences: ${SENTENCE_ITEMS.length}`);
console.log(`Lessons: ${CURRICULUM.length}`);
console.log("Content references: OK");
