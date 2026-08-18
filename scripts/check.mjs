import { execFileSync } from "node:child_process";
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { KANA_ITEMS } from "../src/data/kana.js";
import { ALL_VOCABULARY_ITEMS, ALL_GRAMMAR_ITEMS, ALL_SENTENCE_ITEMS, LEARNING_ITEMS } from "../src/data/content.js";
import { KANJI_ITEMS } from "../src/data/kanji.js";
import { READING_ITEMS } from "../src/data/reading.js";
import { LISTENING_ITEMS } from "../src/data/listening.js";
import { CURRICULUM } from "../src/data/curriculum.js";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, result = []) {
  if (!existsSync(dir)) return result;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, result);
    else result.push(path);
  }
  return result;
}

const jsFiles = walk(join(project, "src")).filter(path => path.endsWith(".js"));
jsFiles.push(...walk(join(project, "test")).filter(path => path.endsWith(".js")));
jsFiles.push(...walk(join(project, "scripts")).filter(path => path.endsWith(".mjs")));
for (const file of jsFiles) execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function uniqueIds(items, label) {
  const ids = items.map(item => item.id);
  assert(new Set(ids).size === ids.length, `${label} 存在重复 ID`);
}

uniqueIds(KANA_ITEMS, "假名");
uniqueIds(ALL_VOCABULARY_ITEMS, "词汇");
uniqueIds(ALL_GRAMMAR_ITEMS, "语法");
uniqueIds(ALL_SENTENCE_ITEMS, "例句");
uniqueIds(KANJI_ITEMS, "汉字");
uniqueIds(READING_ITEMS, "阅读");
uniqueIds(LISTENING_ITEMS, "听力");
uniqueIds(CURRICULUM, "课程");
uniqueIds(LEARNING_ITEMS, "全部学习内容");

assert(KANA_ITEMS.length === 208, "假名训练项应保持 208");
assert(ALL_VOCABULARY_ITEMS.length >= 450, "N5 词汇核心库应至少 450 项");
assert(ALL_GRAMMAR_ITEMS.length >= 90, "N5/N4 入门语法库应至少 90 项");
assert(KANJI_ITEMS.length >= 100, "N5 核心汉字应至少 100 项");
assert(ALL_SENTENCE_ITEMS.length >= 100, "例句应至少 100 条");
assert(READING_ITEMS.length >= 20, "N5 阅读应至少 20 篇");
assert(LISTENING_ITEMS.length >= 20, "N5 听力应至少 20 组");
assert(CURRICULUM.length >= 70, "课程总数应至少 70 节");


for (const item of LEARNING_ITEMS) {
  assert(item.source, `${item.id} 缺少 source`);
  assert(item.reviewStatus, `${item.id} 缺少 reviewStatus`);
  assert(Number(item.contentVersion) >= 1, `${item.id} 缺少 contentVersion`);
  assert(Number(item.confidence) > 0 && Number(item.confidence) <= 1, `${item.id} confidence 非法`);
}
for (const lesson of CURRICULUM) {
  assert(Array.isArray(lesson.objectives) && lesson.objectives.length > 0, `课程 ${lesson.id} 缺少 objectives`);
  assert(Array.isArray(lesson.prerequisites), `课程 ${lesson.id} prerequisites 非法`);
  assert(Number(lesson.estimatedMinutes) > 0, `课程 ${lesson.id} estimatedMinutes 非法`);
  assert(Number(lesson.masteryRequirement) >= 50 && Number(lesson.masteryRequirement) <= 100, `课程 ${lesson.id} masteryRequirement 非法`);
}

for (const item of [...READING_ITEMS, ...LISTENING_ITEMS]) {
  assert(item.options.includes(item.answer), `${item.id} 的正确答案必须存在于选项中`);
}

const contentIds = new Set(LEARNING_ITEMS.map(item => item.id));
for (const sentence of ALL_SENTENCE_ITEMS) {
  for (const id of [...(sentence.vocabulary || []), ...(sentence.grammar || [])]) assert(contentIds.has(id), `例句 ${sentence.id} 引用了不存在的 ${id}`);
}
for (const lesson of CURRICULUM) {
  for (const id of [
    ...(lesson.itemIds || []),
    ...(lesson.vocabulary || []),
    ...(lesson.grammar || []),
    ...(lesson.kanji || []),
    ...(lesson.sentences || []),
    ...(lesson.reading || []),
    ...(lesson.listening || [])
  ]) assert(contentIds.has(id), `课程 ${lesson.id} 引用了不存在的 ${id}`);
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

const sw = readFileSync(join(project, "sw.js"), "utf8");
for (const match of sw.matchAll(/"(\.\/[^"?]+)(?:\?[^\"]*)?"/g)) {
  const candidate = match[1];
  if (["./", "./index.html"].includes(candidate)) continue;
  const target = resolve(project, candidate);
  assert(existsSync(target), `Service Worker 引用了不存在的资源 ${candidate}`);
}

console.log(`JS syntax: ${jsFiles.length} files OK`);
console.log(`Kana: ${KANA_ITEMS.length}`);
console.log(`Vocabulary: ${ALL_VOCABULARY_ITEMS.length}`);
console.log(`Grammar: ${ALL_GRAMMAR_ITEMS.length}`);
console.log(`Kanji: ${KANJI_ITEMS.length}`);
console.log(`Sentences: ${ALL_SENTENCE_ITEMS.length}`);
console.log(`Reading: ${READING_ITEMS.length}`);
console.log(`Listening: ${LISTENING_ITEMS.length}`);
console.log(`Lessons: ${CURRICULUM.length}`);
console.log("Content references: OK");
