const CACHE_NAME = "kana-study-v7";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/base.css?v=7",
  "./css/auth.css?v=7",
  "./css/study.css?v=7",
  "./css/progress.css?v=7",
  "./css/responsive.css?v=7",
  "./js/config.js?v=7",
  "./js/auth-sync.js?v=7",
  "./js/kana-data.js?v=7",
  "./js/progress.js?v=7",
  "./js/study.js?v=7",
  "./js/ui.js?v=7",
  "./js/data-tools.js?v=7",
  "./js/app.js?v=7",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
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
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => {
        const network = fetch(request)
          .then(response => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);

        return cached || network;
      })
  );
});
