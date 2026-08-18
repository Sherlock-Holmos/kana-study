import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMA_VERSION } from "../src/core/constants.js";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(project, "src");
const assetsRoot = join(project, "assets");
const jsOut = join(assetsRoot, "js");
const cssOut = join(assetsRoot, "css");
const iconOut = join(assetsRoot, "icons");
const packageJson = JSON.parse(readFileSync(join(project, "package.json"), "utf8"));
const APP_VERSION = String(packageJson.version || "0.0.0");
const APP_MAJOR = APP_VERSION.split(".")[0] || "0";

for (const dir of [assetsRoot, jsOut, cssOut, iconOut]) mkdirSync(dir, { recursive: true });

function hashText(value, length = 12) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function hashBuffer(value, length = 12) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function posix(value) {
  return value.split(sep).join("/");
}

function writeIfChanged(path, content) {
  if (existsSync(path) && readFileSync(path).equals(Buffer.isBuffer(content) ? content : Buffer.from(content))) return;
  writeFileSync(path, content);
}

const moduleCache = new Map();
const active = new Set();
const importSpecPattern = /((?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)["'])(\.[^"']+)(["'])/g;

function buildModule(absPath) {
  absPath = resolve(absPath);
  if (moduleCache.has(absPath)) return moduleCache.get(absPath);
  if (active.has(absPath)) throw new Error(`发现循环模块依赖：${relative(srcRoot, absPath)}`);
  if (!existsSync(absPath)) throw new Error(`模块不存在：${absPath}`);
  active.add(absPath);

  let source = readFileSync(absPath, "utf8");
  const specs = [...source.matchAll(importSpecPattern)].map(match => match[2]);
  const replacements = new Map();

  for (const spec of specs) {
    const depPath = resolve(dirname(absPath), spec);
    if (!depPath.startsWith(srcRoot + sep) && depPath !== srcRoot) {
      throw new Error(`不允许构建 src 外部相对模块：${spec} (${relative(project, absPath)})`);
    }
    const dep = buildModule(depPath);
    replacements.set(spec, `./${dep.fileName}`);
  }

  source = source.replace(importSpecPattern, (full, prefix, spec, suffix) => {
    const next = replacements.get(spec);
    return next ? `${prefix}${next}${suffix}` : full;
  });

  const rel = posix(relative(srcRoot, absPath));
  const stem = rel.replace(/\.js$/i, "").replace(/[^A-Za-z0-9_-]+/g, "-");
  const digest = hashText(source);
  const fileName = `${stem}.${digest}.js`;
  const outPath = join(jsOut, fileName);
  writeIfChanged(outPath, source);

  const result = { source: rel, fileName, href: `./assets/js/${fileName}`, digest };
  moduleCache.set(absPath, result);
  active.delete(absPath);
  return result;
}

const app = buildModule(join(srcRoot, "app.js"));

const css = [
  readFileSync(join(project, "css", "app.css"), "utf8"),
  readFileSync(join(project, "css", "responsive.css"), "utf8")
].join("\n\n/* responsive.css */\n\n");
const cssDigest = hashText(css);
const cssName = `app.${cssDigest}.css`;
writeIfChanged(join(cssOut, cssName), css);
const cssHref = `./assets/css/${cssName}`;

const icons = {};
for (const name of ["icon.svg", "icon-192.png", "icon-512.png"]) {
  const sourcePath = join(project, "icons", name);
  const data = readFileSync(sourcePath);
  const ext = extname(name);
  const base = name.slice(0, -ext.length);
  const digest = hashBuffer(data);
  const outName = `${base}.${digest}${ext}`;
  copyFileSync(sourcePath, join(iconOut, outName));
  icons[name] = `./assets/icons/${outName}`;
}

const manifestObject = {
  name: `Japanese Study v${APP_MAJOR} · 日语学习系统`,
  short_name: "Japanese Study",
  description: "N5 Production Ready：今日计划、课程、独立阶段测验、SRS 2.0、假名、词汇、语法、汉字、阅读、听力与云端同步。生产资源使用内容哈希避免跨版本模块混用。",
  start_url: "./#home",
  scope: "./",
  display: "standalone",
  background_color: "#f6f7fb",
  theme_color: "#f6f7fb",
  icons: [
    { src: icons["icon-192.png"], sizes: "192x192", type: "image/png" },
    { src: icons["icon-512.png"], sizes: "512x512", type: "image/png" }
  ]
};
const manifestText = JSON.stringify(manifestObject, null, 2) + "\n";
const manifestDigest = hashText(manifestText);
const manifestName = `manifest.${manifestDigest}.webmanifest`;
writeIfChanged(join(assetsRoot, manifestName), manifestText);
// 保留稳定 manifest，兼容仍持有旧 index.html 的客户端。
writeIfChanged(join(project, "manifest.webmanifest"), manifestText);
const manifestHref = `./assets/${manifestName}`;

const modules = [...moduleCache.values()].sort((a, b) => a.source.localeCompare(b.source));
const buildSeed = JSON.stringify({
  appVersion: APP_VERSION,
  dataSchemaVersion: SCHEMA_VERSION,
  app: app.digest,
  css: cssDigest,
  manifest: manifestDigest,
  modules: modules.map(item => [item.source, item.digest]),
  icons
});
const buildId = hashText(buildSeed, 16);

const template = readFileSync(join(project, "index.template.html"), "utf8");
const index = template
  .replaceAll("__APP_ENTRY__", app.href)
  .replaceAll("__CSS__", cssHref)
  .replaceAll("__MANIFEST__", manifestHref)
  .replaceAll("__ICON_SVG__", icons["icon.svg"])
  .replaceAll("__ICON_192__", icons["icon-192.png"])
  .replaceAll("__BUILD_ID__", buildId);
writeIfChanged(join(project, "index.html"), index);

const immutableAssets = [
  cssHref,
  manifestHref,
  ...Object.values(icons),
  ...modules.map(item => item.href)
];

const sw = `const CACHE_NAME = "japanese-study-v${APP_MAJOR}-${buildId}";\n` +
`const APP_SHELL = ${JSON.stringify(["./", "./index.html", ...immutableAssets], null, 2)};\n\n` +
`self.addEventListener("install", event => {\n` +
`  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));\n` +
`});\n\n` +
`self.addEventListener("activate", event => {\n` +
`  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("japanese-study-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));\n` +
`});\n\n` +
`async function networkFirst(request) {\n` +
`  const cache = await caches.open(CACHE_NAME);\n` +
`  try {\n` +
`    const response = await fetch(request);\n` +
`    if (response.ok) await cache.put(request, response.clone());\n` +
`    return response;\n` +
`  } catch (error) {\n` +
`    const cached = await cache.match(request);\n` +
`    if (cached) return cached;\n` +
`    if (request.mode === "navigate") return (await cache.match("./index.html")) || Response.error();\n` +
`    throw error;\n` +
`}\n\n` +
`async function cacheFirst(request) {\n` +
`  const cache = await caches.open(CACHE_NAME);\n` +
`  const cached = await cache.match(request);\n` +
`  if (cached) return cached;\n` +
`  const response = await fetch(request);\n` +
`  if (response.ok) await cache.put(request, response.clone());\n` +
`  return response;\n` +
`}\n\n` +
`self.addEventListener("fetch", event => {\n` +
`  const request = event.request;\n` +
`  if (request.method !== "GET") return;\n` +
`  const url = new URL(request.url);\n` +
`  if (url.origin !== self.location.origin) return;\n` +
`  const immutable = url.pathname.includes("/assets/");\n` +
`  if (immutable) { event.respondWith(cacheFirst(request)); return; }\n` +
`  event.respondWith(networkFirst(request));\n` +
`});\n`;
writeIfChanged(join(project, "sw.js"), sw);

const buildManifest = {
  appVersion: APP_VERSION,
  dataSchemaVersion: SCHEMA_VERSION,
  buildId,
  entry: app.href,
  stylesheet: cssHref,
  webmanifest: manifestHref,
  icons,
  modules: Object.fromEntries(modules.map(item => [item.source, item.href])),
  generatedAt: new Date().toISOString()
};
writeIfChanged(join(project, "build-manifest.json"), JSON.stringify(buildManifest, null, 2) + "\n");
writeIfChanged(join(project, "version.json"), JSON.stringify({ version: APP_VERSION, buildId, dataSchemaVersion: SCHEMA_VERSION }, null, 2) + "\n");

console.log(`Version: ${APP_VERSION}`);
console.log(`Build ID: ${buildId}`);
console.log(`Entry: ${app.href}`);
console.log(`CSS: ${cssHref}`);
console.log(`Modules: ${modules.length}`);
console.log("Hashed production build: OK");
