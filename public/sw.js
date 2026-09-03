/* Minimal, hand-rolled service worker (no Workbox/next-pwa - this repo's
   dev script runs Turbopack, which those tools don't reliably support, and
   Turbopack's per-build content hashes make a hardcoded precache list a
   maintenance trap anyway). Runtime-caches same-origin GETs only; every
   cross-origin request (the API backend, Google, etc.) always goes straight
   to the network, untouched, so dashboard/review data is never served stale
   from cache. */

const CACHE_VERSION = "v1";
const CACHE_NAME = `qr-review-${CACHE_VERSION}`;
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever intercept same-origin GETs. Cross-origin (API backend, Google
  // review links, font/CDN hosts) and non-GET requests pass straight through.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Page navigations: network-first, falling back to the cache (so a
  // previously-visited page still opens offline), then to the app shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Static assets (hashed Next.js chunks, fonts, icons): cache-first, then
  // fill the cache from the network in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
