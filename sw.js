const CACHE_NAME = "japanese-study-v12";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/app.css?v=12",
  "./css/responsive.css?v=12",
  "./manifest.webmanifest?v=12",
  "./icons/icon.svg?v=12",
  "./icons/icon-192.png?v=12",
  "./icons/icon-512.png?v=12",
  "./src/app.js?v=12",
  "./src/app.js",
  "./src/components/heatmap.js",
  "./src/core/constants.js",
  "./src/core/metrics.js",
  "./src/core/state.js",
  "./src/core/storage.js",
  "./src/core/utils.js",
  "./src/data/content-meta.js",
  "./src/data/content.js",
  "./src/data/curriculum.js",
  "./src/data/grammar.js",
  "./src/data/japanese-lessons.js",
  "./src/data/kana-curriculum.js",
  "./src/data/kana.js",
  "./src/data/kanji.js",
  "./src/data/lesson-meta.js",
  "./src/data/listening.js",
  "./src/data/n5-grammar-extra.js",
  "./src/data/n5-lessons-extra.js",
  "./src/data/n5-sentences-extra.js",
  "./src/data/n5-vocabulary-extra.js",
  "./src/data/reading.js",
  "./src/data/sentences.js",
  "./src/data/vocabulary.js",
  "./src/domain/skills.js",
  "./src/learning/evidence.js",
  "./src/learning/exercises.js",
  "./src/learning/planner.js",
  "./src/learning/session.js",
  "./src/learning/srs.js",
  "./src/review/selectors.js",
  "./src/sync/merge.js",
  "./src/sync/supabase.js",
  "./src/ui/modals.js",
  "./src/views/home.js",
  "./src/views/learn.js",
  "./src/views/library.js",
  "./src/views/progress.js",
  "./src/views/review.js",
  "./src/views/study.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
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
    if (request.mode === "navigate") {
      const fallback = await cache.match("./index.html");
      if (fallback) return fallback;
    }
    throw error;
  }
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
  const isDocument = request.mode === "navigate" || request.destination === "document";
  const isCode = request.destination === "script" || request.destination === "style" || url.pathname.endsWith(".js") || url.pathname.endsWith(".css");
  const isStaticMedia = ["image", "font"].includes(request.destination);
  if (isDocument || isCode) { event.respondWith(networkFirst(request)); return; }
  if (isStaticMedia) { event.respondWith(cacheFirst(request)); return; }
  event.respondWith(networkFirst(request));
});
