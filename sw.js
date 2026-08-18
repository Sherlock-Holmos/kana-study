const CACHE_NAME = "japanese-study-v14-f83a6b23e834b85a";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/css/app.73d4d400cb0f.css",
  "./assets/manifest.29423720046c.webmanifest",
  "./assets/icons/icon.f8cd6d005cff.svg",
  "./assets/icons/icon-192.0779a5c0b4f7.png",
  "./assets/icons/icon-512.a6d6029da115.png",
  "./assets/js/app.555523387331.js",
  "./assets/js/assessment-catalog.7a36ad5487ea.js",
  "./assets/js/assessment-engine.7b432894af53.js",
  "./assets/js/components-heatmap.f7ab327e2fe0.js",
  "./assets/js/core-constants.4ada7fdea3dc.js",
  "./assets/js/core-metrics.8c86860b0477.js",
  "./assets/js/core-state.41316c0191c0.js",
  "./assets/js/core-storage.0e69db69d3c7.js",
  "./assets/js/core-utils.adc6ebb0fb19.js",
  "./assets/js/data-content-meta.ed7e62fb17b2.js",
  "./assets/js/data-content-quality.3ae61d57d08e.js",
  "./assets/js/data-content.70d9a96f7cfa.js",
  "./assets/js/data-curriculum.98baf6ecb83d.js",
  "./assets/js/data-grammar.5fe2e1bd0899.js",
  "./assets/js/data-japanese-lessons.0aac25c50006.js",
  "./assets/js/data-kana-curriculum.223fe632cd67.js",
  "./assets/js/data-kana.2364181fadb6.js",
  "./assets/js/data-kanji.fb8e24051fa4.js",
  "./assets/js/data-lesson-meta.c6c043ee377d.js",
  "./assets/js/data-listening.fd7388a6e722.js",
  "./assets/js/data-n5-grammar-extra.12e166eefb7e.js",
  "./assets/js/data-n5-lessons-extra.4a4c51dfa1da.js",
  "./assets/js/data-n5-sentences-extra.7313d59900f1.js",
  "./assets/js/data-n5-vocabulary-extra.4d1828bfbf11.js",
  "./assets/js/data-reading.bb2262b2a1ae.js",
  "./assets/js/data-sentences.dabdcee89dc7.js",
  "./assets/js/data-vocabulary.8e5f72acba34.js",
  "./assets/js/domain-skills.c2017dff4ab0.js",
  "./assets/js/learning-evidence.34745eac8dca.js",
  "./assets/js/learning-exercises.3b48223d4eba.js",
  "./assets/js/learning-planner.250bfde3d520.js",
  "./assets/js/learning-session.ad0a5a1b91ef.js",
  "./assets/js/learning-srs.149e40519c9a.js",
  "./assets/js/review-selectors.053f072b157e.js",
  "./assets/js/sync-merge.6c3e40956c25.js",
  "./assets/js/sync-supabase.58ed90000a53.js",
  "./assets/js/ui-modals.8ceac1730df2.js",
  "./assets/js/views-home.b7d5d935050f.js",
  "./assets/js/views-learn.27657b22f97e.js",
  "./assets/js/views-library.10f634bdf6b8.js",
  "./assets/js/views-progress.931a8b711e89.js",
  "./assets/js/views-review.3d9043119e71.js",
  "./assets/js/views-study.fd7e62e6f084.js"
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
