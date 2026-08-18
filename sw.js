const CACHE_NAME = "japanese-study-v16-2458ff03b8028a2a";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/css/app.e0dd3afae1c7.css",
  "./assets/manifest.fb69faca2961.webmanifest",
  "./assets/icons/icon.a160406cf98f.svg",
  "./assets/icons/icon-192.0779a5c0b4f7.png",
  "./assets/icons/icon-512.a6d6029da115.png",
  "./assets/js/app.1655b4be43fd.js",
  "./assets/js/assessment-catalog.d76cdcd41424.js",
  "./assets/js/assessment-engine.536ea1564f84.js",
  "./assets/js/assessment-question-bank.67c2f3b4b079.js",
  "./assets/js/audio-player.6a663d9b8027.js",
  "./assets/js/audio-repository.944737c7d4c9.js",
  "./assets/js/audio-speech-fallback.bc9fe2d4f493.js",
  "./assets/js/components-heatmap.e2fd4d0bf1cd.js",
  "./assets/js/core-constants.f0296b234e4d.js",
  "./assets/js/core-metrics.d077df0c4cff.js",
  "./assets/js/core-state.eb7a969a6233.js",
  "./assets/js/core-storage.9659b271c055.js",
  "./assets/js/core-utils.8125d8a6489d.js",
  "./assets/js/data-content-meta.8804320e4bcf.js",
  "./assets/js/data-content-quality.8303bf7f8943.js",
  "./assets/js/data-content.ca0adfcb296c.js",
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
  "./assets/js/data-pedagogy.c5506a681c7c.js",
  "./assets/js/data-reading.43d7002cf45f.js",
  "./assets/js/data-sentences.79372e47d160.js",
  "./assets/js/data-vocabulary.33d85588f815.js",
  "./assets/js/domain-ability-profile.4f83f3644ce6.js",
  "./assets/js/domain-skills.fac520b144fa.js",
  "./assets/js/learning-evidence.02abc8e807a7.js",
  "./assets/js/learning-exercises.54d284966f30.js",
  "./assets/js/learning-planner.c7bf002a9751.js",
  "./assets/js/learning-session.114e86581491.js",
  "./assets/js/learning-srs.7012747feb1a.js",
  "./assets/js/review-selectors.e65fcdbbcf1e.js",
  "./assets/js/speaking-recorder.321c3e597dc5.js",
  "./assets/js/sync-dirty-tracker.75c38edc3fa5.js",
  "./assets/js/sync-merge.2e59aea3eded.js",
  "./assets/js/sync-supabase.c6e84dae622e.js",
  "./assets/js/ui-modals.ebbfb0f0ed83.js",
  "./assets/js/views-home.694196da7d0a.js",
  "./assets/js/views-learn.4d5acbf8171e.js",
  "./assets/js/views-library.e38b7fc495c8.js",
  "./assets/js/views-progress.7739d02d1c8a.js",
  "./assets/js/views-review.d093e77243dc.js",
  "./assets/js/views-study.398eb1a19f8c.js"
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
