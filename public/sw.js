/* Service Worker for FCPqroo Directory Services */
const CACHE_VERSION = "v1";
const SHARED_CACHE_NAME = `fcp-shared-${CACHE_VERSION}`;
const PLACES_CACHE_NAME = `fcp-places-${CACHE_VERSION}`;
const SHARED_CACHE_PREFIX = "fcp-shared-";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key.startsWith(SHARED_CACHE_PREFIX) && key !== SHARED_CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // External requests bypass the service worker
  if (url.origin !== self.location.origin) return;

  // Navigation requests: try network, fall back to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match("/")
          .then((cached) => cached || caches.match("/index.html")),
      ),
    );
    return;
  }

  // Place details: check places cache, otherwise try network or prompt 504 offline fallback
  if (url.pathname.startsWith("/data/places/")) {
    event.respondWith(
      caches.open(PLACES_CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).catch(
            () =>
              new Response(
                JSON.stringify({
                  error: "offline_unavailable",
                  message: "Place detail is not cached for offline use",
                }),
                {
                  status: 504,
                  statusText: "Gateway Timeout (Offline Unavailable)",
                  headers: { "Content-Type": "application/json" },
                },
              ),
          );
        }),
      ),
    );
    return;
  }

  // Same-origin static assets: check cache first, then fetch
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request);
    }),
  );
});
