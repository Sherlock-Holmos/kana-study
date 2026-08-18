const CACHE_NAME = "japanese-study-v14-de2b2f4a4a95c156";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/css/app.8f75552a3fa7.css",
  "./assets/manifest.29423720046c.webmanifest",
  "./assets/icons/icon.a160406cf98f.svg",
  "./assets/icons/icon-192.0779a5c0b4f7.png",
  "./assets/icons/icon-512.a6d6029da115.png",
  "./assets/js/app.777783100ba7.js",
  "./assets/js/assessment-catalog.d76cdcd41424.js",
  "./assets/js/assessment-engine.a8066b1e5f90.js",
  "./assets/js/components-heatmap.9726064fd025.js",
  "./assets/js/core-constants.e6543be44c91.js",
  "./assets/js/core-metrics.c232ee133a48.js",
  "./assets/js/core-state.5c7346cbbc32.js",
  "./assets/js/core-storage.f881100d77ce.js",
  "./assets/js/core-utils.8125d8a6489d.js",
  "./assets/js/data-content-meta.8804320e4bcf.js",
  "./assets/js/data-content-quality.a38185e58f15.js",
  "./assets/js/data-content.f6876516c78d.js",
  "./assets/js/data-curriculum.9d44927613fd.js",
  "./assets/js/data-grammar.57d117f22945.js",
  "./assets/js/data-japanese-lessons.bbe9286a60c2.js",
  "./assets/js/data-kana-curriculum.78f3b2343c5a.js",
  "./assets/js/data-kana.c1a6e5ad54af.js",
  "./assets/js/data-kanji.91117e2eb55e.js",
  "./assets/js/data-lesson-meta.cb4c39fa0a27.js",
  "./assets/js/data-listening.97d25052c268.js",
  "./assets/js/data-n5-grammar-extra.7c4071e43c19.js",
  "./assets/js/data-n5-lessons-extra.a94fdd16adbc.js",
  "./assets/js/data-n5-sentences-extra.932b0fd2313d.js",
  "./assets/js/data-n5-vocabulary-extra.04d78753ecb7.js",
  "./assets/js/data-reading.43d7002cf45f.js",
  "./assets/js/data-sentences.79372e47d160.js",
  "./assets/js/data-vocabulary.33d85588f815.js",
  "./assets/js/domain-skills.1fb627364197.js",
  "./assets/js/learning-evidence.02abc8e807a7.js",
  "./assets/js/learning-exercises.0c776c567e85.js",
  "./assets/js/learning-planner.5b7def9d56a6.js",
  "./assets/js/learning-session.875c0a1782d0.js",
  "./assets/js/learning-srs.91571fd5ab94.js",
  "./assets/js/review-selectors.f04a915250b2.js",
  "./assets/js/sync-merge.c499da44fea5.js",
  "./assets/js/sync-supabase.45773bc32714.js",
  "./assets/js/ui-modals.ccd7a90ee1fe.js",
  "./assets/js/views-home.d3a83a06ae86.js",
  "./assets/js/views-learn.bbc24f7d76f3.js",
  "./assets/js/views-library.d18c69c38fa6.js",
  "./assets/js/views-progress.55023b8b02c4.js",
  "./assets/js/views-review.bdecb90b8dc8.js",
  "./assets/js/views-study.98b586dda144.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("japanese-study-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return (await cache.match("./index.html")) || Response.error();
    throw error;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const immutable = url.pathname.includes("/assets/");
  if (immutable) { event.respondWith(cacheFirst(request)); return; }
  event.respondWith(networkFirst(request));
});
