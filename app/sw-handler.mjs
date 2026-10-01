// Core routing and cache logic for the service worker.
// Kept in a pure ES module so that service-worker behavior can be comprehensively
// tested in Node.js without needing a browser runtime.

import {
  PLACES_CACHE_NAME,
  SHARED_CACHE_NAME,
  SHARED_CACHE_PREFIX,
} from "./offline.mjs";

export async function handleServiceWorkerFetch({
  request,
  caches,
  fetchFn = fetch,
  origin = typeof location !== "undefined" ? location.origin : "https://fcpqroo.mx",
}) {
  const method = request.method || "GET";
  if (method !== "GET") {
    return fetchFn(request);
  }

  const url = new URL(request.url, origin);

  // External requests (e.g. streaming radio, external APIs) bypass cache completely
  if (url.origin !== origin) {
    return fetchFn(request);
  }

  // Navigation requests: Network-first, fall back to cached app shell (/) when offline
  if (request.mode === "navigate") {
    try {
      const networkResponse = await fetchFn(request);
      if (networkResponse && networkResponse.ok) {
        return networkResponse;
      }
    } catch {
      // network failure (offline/airplane mode)
    }
    const cached =
      (await caches.match("/")) || (await caches.match("/index.html"));
    if (cached) return cached;
    throw new Error("Offline and no cached app shell available");
  }

  // Place details: Check individually saved places cache first.
  // If not in cache and network fails, return a 504 offline response promptly rather than hanging.
  if (url.pathname.startsWith("/data/places/")) {
    try {
      const placesCache = await caches.open(PLACES_CACHE_NAME);
      const cached = await placesCache.match(request);
      if (cached) return cached;
    } catch {
      // cache access error
    }

    try {
      return await fetchFn(request);
    } catch {
      return new Response(
        JSON.stringify({
          error: "offline_unavailable",
          message: "Place detail is not cached for offline use",
        }),
        {
          status: 504,
          statusText: "Gateway Timeout (Offline Unavailable)",
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // Shared app-shell and map assets: check cache first, then network
  try {
    const cached = await caches.match(request);
    if (cached) return cached;
  } catch {
    // cache access error
  }

  return await fetchFn(request);
}

export async function handleServiceWorkerActivate({ caches }) {
  if (!caches) return [];
  const keys = await caches.keys();
  const deleted = [];
  for (const key of keys) {
    if (key.startsWith(SHARED_CACHE_PREFIX) && key !== SHARED_CACHE_NAME) {
      await caches.delete(key);
      deleted.push(key);
    }
  }
  return deleted;
}
