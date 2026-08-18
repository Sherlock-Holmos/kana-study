import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

class FakeClassList { toggle() {} }
class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.dataset = {};
    this.hidden = false;
    this.innerHTML = "";
    this.classList = new FakeClassList();
    this.listeners = new Map();
  }
  addEventListener(type, callback) { this.listeners.set(type, callback); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
}

const root = new FakeElement("viewRoot");
const modalRoot = new FakeElement("modalRoot");
const accountTrigger = new FakeElement("accountTrigger");
const settingsTrigger = new FakeElement("settingsTrigger");
const syncBadge = new FakeElement("syncBadge");
const navButtons = ["home", "learn", "review", "library", "progress"].map(route => {
  const element = new FakeElement();
  element.dataset.route = route;
  return element;
});
const documentListeners = new Map();
const windowListeners = new Map();
const documentStub = {
  getElementById(id) { return { viewRoot: root, modalRoot, accountTrigger, settingsTrigger, syncBadge }[id] || null; },
  querySelectorAll(selector) { return selector === "[data-route]" ? navButtons : []; },
  querySelector() { return null; },
  addEventListener(type, callback) { documentListeners.set(type, callback); },
  createElement() { return new FakeElement(); },
  body: { appendChild() {} }
};
const storage = new Map();
const localStorageStub = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};
const locationStub = { hash: "#home", reload() {} };
const windowStub = { addEventListener(type, callback) { windowListeners.set(type, callback); } };
Object.assign(globalThis, {
  document: documentStub,
  window: windowStub,
  localStorage: localStorageStub,
  location: locationStub,
  confirm: () => true,
  alert: () => {},
  requestAnimationFrame: callback => callback()
});
Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(resolve(project, "build-manifest.json"), "utf8"));
const entryPath = resolve(project, manifest.entry.replace(/^\.\//, ""));
await import(`${pathToFileURL(entryPath).href}?dist-smoke=${Date.now()}`);
await new Promise(resolvePromise => setTimeout(resolvePromise, 0));

assert.match(root.innerHTML, /今天学什么/, "生产构建首页应成功渲染");
assert.ok(documentListeners.has("click"), "生产构建应绑定全局路由事件代理");
const routeTrigger = { dataset: { route: "learn" } };
documentListeners.get("click")({ target: { closest(selector) { return selector === "[data-route]" ? routeTrigger : null; } } });
assert.equal(locationStub.hash, "#learn", "生产构建导航应更新 hash");
windowListeners.get("hashchange")?.();
assert.match(root.innerHTML, /N5 诊断与阶段测验/, "生产构建学习页应包含阶段测验入口");

console.log(`Production module graph smoke: ${manifest.buildId} OK`);
