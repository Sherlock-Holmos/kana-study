import { execFileSync } from "node:child_process";
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname, sep } from "node:path";
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
function assert(condition, message) { if (!condition) throw new Error(message); }
function uniqueIds(items, label) {
  const ids = items.map(item => item.id);
  assert(new Set(ids).size === ids.length, `${label} 存在重复 ID`);
}

const sourceJs = walk(join(project, "src")).filter(path => path.endsWith(".js"));
const testJs = walk(join(project, "test")).filter(path => path.endsWith(".js"));
const scriptJs = walk(join(project, "scripts")).filter(path => path.endsWith(".mjs"));
const builtJs = walk(join(project, "assets", "js")).filter(path => path.endsWith(".js"));
for (const file of [...sourceJs, ...testJs, ...scriptJs, ...builtJs]) execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });

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
for (const item of [...READING_ITEMS, ...LISTENING_ITEMS]) assert(item.options.includes(item.answer), `${item.id} 的正确答案必须存在于选项中`);

const contentIds = new Set(LEARNING_ITEMS.map(item => item.id));
for (const sentence of ALL_SENTENCE_ITEMS) {
  for (const id of [...(sentence.vocabulary || []), ...(sentence.grammar || [])]) assert(contentIds.has(id), `例句 ${sentence.id} 引用了不存在的 ${id}`);
}
for (const lesson of CURRICULUM) {
  for (const id of [
    ...(lesson.itemIds || []), ...(lesson.vocabulary || []), ...(lesson.grammar || []),
    ...(lesson.kanji || []), ...(lesson.sentences || []), ...(lesson.reading || []), ...(lesson.listening || [])
  ]) assert(contentIds.has(id), `课程 ${lesson.id} 引用了不存在的 ${id}`);
}

for (const file of sourceJs) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["'](\.[^"']+)["']/g)) {
    const target = resolve(dirname(file), match[1]);
    assert(existsSync(target), `${relative(project, file)} import 不存在：${match[1]}`);
  }
}

const buildManifestPath = join(project, "build-manifest.json");
assert(existsSync(buildManifestPath), "缺少 build-manifest.json，请先运行 npm run build");
const buildManifest = JSON.parse(readFileSync(buildManifestPath, "utf8"));
assert(buildManifest.appVersion === "13.0.0", "生产构建版本不是 13.0.0");
assert(/^[0-9a-f]{16}$/.test(buildManifest.buildId), "buildId 格式非法");
for (const href of [buildManifest.entry, buildManifest.stylesheet, buildManifest.webmanifest, ...Object.values(buildManifest.icons), ...Object.values(buildManifest.modules)]) {
  assert(/^\.\/assets\//.test(href), `生产资源不是 assets 哈希资源：${href}`);
  assert(existsSync(resolve(project, href.replace(/^\.\//, ""))), `生产资源不存在：${href}`);
}

assert(builtJs.length >= Object.keys(buildManifest.modules).length, "构建模块数量少于当前 manifest；旧哈希资源允许保留以兼容缓存中的旧 index.html");
const currentBuiltJs = Object.values(buildManifest.modules).map(href => resolve(project, href.replace(/^\.\//, "")));
for (const file of currentBuiltJs) {
  assert(/\.[0-9a-f]{12}\.js$/.test(file), `构建 JS 缺少内容哈希：${relative(project, file)}`);
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["'](\.[^"']+)["']/g)) {
    const target = resolve(dirname(file), match[1]);
    assert(existsSync(target), `生产模块 ${relative(project, file)} import 不存在：${match[1]}`);
    assert(/\.[0-9a-f]{12}\.js$/.test(target), `生产模块仍引用未哈希 JS：${match[1]}`);
  }
}

const index = readFileSync(join(project, "index.html"), "utf8");
assert(!index.includes("./src/"), "生产 index.html 不应直接加载 src 源模块");
assert(!/\?v=\d+/.test(index), "生产 index.html 不应使用手工 ?v= 版本参数");
for (const href of [buildManifest.entry, buildManifest.stylesheet, buildManifest.webmanifest, buildManifest.icons["icon.svg"], buildManifest.icons["icon-192.png"]]) {
  assert(index.includes(href), `index.html 未引用当前构建资源：${href}`);
}

const sw = readFileSync(join(project, "sw.js"), "utf8");
assert(sw.includes(`japanese-study-v13-${buildManifest.buildId}`), "Service Worker cache 名称未绑定 buildId");
assert(sw.includes('url.pathname.includes("/assets/")'), "Service Worker 未对哈希资源使用独立缓存策略");
assert(sw.includes(buildManifest.entry), "Service Worker 未预缓存当前入口模块");
assert(readFileSync(join(project, "src", "app.js"), "utf8").includes('updateViaCache: "none"'), "Service Worker 注册未禁用更新缓存");

console.log(`JS syntax: source ${sourceJs.length}, built ${builtJs.length} files OK`);
console.log(`Kana: ${KANA_ITEMS.length}`);
console.log(`Vocabulary: ${ALL_VOCABULARY_ITEMS.length}`);
console.log(`Grammar: ${ALL_GRAMMAR_ITEMS.length}`);
console.log(`Kanji: ${KANJI_ITEMS.length}`);
console.log(`Sentences: ${ALL_SENTENCE_ITEMS.length}`);
console.log(`Reading: ${READING_ITEMS.length}`);
console.log(`Listening: ${LISTENING_ITEMS.length}`);
console.log(`Lessons: ${CURRICULUM.length}`);
console.log(`Production build: ${buildManifest.buildId}`);
console.log("Content + hashed module graph: OK");
