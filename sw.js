const CACHE_NAME = "kana-study-v9";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest?v=9",
  "./icons/icon.svg?v=9",
  "./icons/icon-192.png?v=9",
  "./icons/icon-512.png?v=9",
  "./css/app.css?v=9",
  "./css/responsive.css?v=9",
  "./src/app.js?v=9",
  "./src/core/constants.js",
  "./src/core/utils.js",
  "./src/core/state.js",
  "./src/core/storage.js",
  "./src/core/metrics.js",
  "./src/data/kana.js",
  "./src/data/curriculum.js",
  "./src/learning/answer.js",
  "./src/learning/srs.js",
  "./src/learning/session.js",
  "./src/review/selectors.js",
  "./src/sync/merge.js",
  "./src/sync/supabase.js",
  "./src/components/heatmap.js",
  "./src/components/kana-grid.js",
  "./src/views/home.js",
  "./src/views/study.js",
  "./src/views/review.js",
  "./src/views/kana.js",
  "./src/views/progress.js",
  "./src/ui/modals.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(CORE_ASSETS.map(url => cache.add(url))))
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

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (url.origin === self.location.origin || url.hostname === "cdn.jsdelivr.net") {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }))
    );
  }
});
