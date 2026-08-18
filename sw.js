const CACHE_NAME = "japanese-study-v15-5ac6df5bdd31ba0e";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/css/app.d78d0c4561e9.css",
  "./assets/manifest.03dd6a25e56a.webmanifest",
  "./assets/icons/icon.a160406cf98f.svg",
  "./assets/icons/icon-192.0779a5c0b4f7.png",
  "./assets/icons/icon-512.a6d6029da115.png",
  "./assets/js/app.d577da5c6767.js",
  "./assets/js/assessment-catalog.d76cdcd41424.js",
  "./assets/js/assessment-engine.9f58416f0021.js",
  "./assets/js/audio-player.0e37a620ec99.js",
  "./assets/js/audio-repository.e47e3564eb71.js",
  "./assets/js/audio-speech-fallback.bc9fe2d4f493.js",
  "./assets/js/components-heatmap.36a14c6d1196.js",
  "./assets/js/core-constants.e5356914fc6f.js",
  "./assets/js/core-metrics.4968c61b3370.js",
  "./assets/js/core-state.4badd8d14e01.js",
  "./assets/js/core-storage.6c1a0aac3550.js",
  "./assets/js/core-utils.8125d8a6489d.js",
  "./assets/js/data-content-meta.8804320e4bcf.js",
  "./assets/js/data-content-quality.1bcb7fe5a6ec.js",
  "./assets/js/data-content.c2d48fc96319.js",
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
  "./assets/js/data-pedagogy.a1f566a2386b.js",
  "./assets/js/data-reading.43d7002cf45f.js",
  "./assets/js/data-sentences.79372e47d160.js",
  "./assets/js/data-vocabulary.33d85588f815.js",
  "./assets/js/domain-ability-profile.a275169fd367.js",
  "./assets/js/domain-skills.cf531db05ff8.js",
  "./assets/js/learning-evidence.02abc8e807a7.js",
  "./assets/js/learning-exercises.8267ead6ba9f.js",
  "./assets/js/learning-planner.8604b6639fe3.js",
  "./assets/js/learning-session.b169d67cf6aa.js",
  "./assets/js/learning-srs.51443710bb7b.js",
  "./assets/js/review-selectors.ec1a8b090fb3.js",
  "./assets/js/sync-dirty-tracker.75c38edc3fa5.js",
  "./assets/js/sync-merge.da7f685371bf.js",
  "./assets/js/sync-supabase.b8bf87a82435.js",
  "./assets/js/ui-modals.113e6d47d791.js",
  "./assets/js/views-home.dab8c1dd0947.js",
  "./assets/js/views-learn.30b4fd78b0c4.js",
  "./assets/js/views-library.44fa58802388.js",
  "./assets/js/views-progress.afc9b25d8117.js",
  "./assets/js/views-review.423ebaa46f17.js",
  "./assets/js/views-study.cbe0bb9936fd.js"
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
