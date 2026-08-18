import assert from "node:assert/strict";

class FakeClassList {
  toggle() {}
}

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.dataset = {};
    this.hidden = false;
    this.innerHTML = "";
    this.classList = new FakeClassList();
    this.listeners = new Map();
  }
  addEventListener(type, callback) {
    this.listeners.set(type, callback);
  }
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
  getElementById(id) {
    return { viewRoot: root, modalRoot, accountTrigger, settingsTrigger, syncBadge }[id] || null;
  },
  querySelectorAll(selector) {
    return selector === "[data-route]" ? navButtons : [];
  },
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
const windowStub = {
  addEventListener(type, callback) { windowListeners.set(type, callback); }
};

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

await import(`../src/app.js?smoke=${Date.now()}`);
await new Promise(resolve => setTimeout(resolve, 0));

assert.match(root.innerHTML, /今天学什么/, "首页应该在启动后完成动态渲染");
assert.ok(documentListeners.has("click"), "应该通过 document 事件代理绑定全局 data-route 导航");

const routeTrigger = { dataset: { route: "learn" } };
documentListeners.get("click")({
  target: {
    closest(selector) { return selector === "[data-route]" ? routeTrigger : null; }
  }
});
assert.equal(locationStub.hash, "#learn", "点击顶部/底部 data-route 后应该更新 hash");

windowListeners.get("hashchange")?.();
assert.match(root.innerHTML, /课程路线/, "hashchange 后应该渲染学习页");

console.log("Browserless app smoke: home render + delegated navigation OK");
