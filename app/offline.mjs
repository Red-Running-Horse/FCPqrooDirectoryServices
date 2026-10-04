// Client-side offline storage and manifest management for FCPqrooDirectoryServices.
// Manages the shared offline map cache (app shell, road GeoJSON, place index) and
// individually saved place details.

import { guideOfflineResources } from "./tourist-guide.mjs";

export const CACHE_VERSION = "v1";
export const SHARED_CACHE_NAME = `fcp-shared-${CACHE_VERSION}`;
export const PLACES_CACHE_NAME = `fcp-places-${CACHE_VERSION}`;
export const SHARED_CACHE_PREFIX = "fcp-shared-";
export const PLACES_CACHE_PREFIX = "fcp-places-";
export const SAVED_PLACES_STORAGE_KEY = "fcp_saved_places";
export const OFFLINE_MAP_STATUS_KEY = "fcp_offline_map_ready";

export const DEFAULT_SHARED_ASSETS = [
  "/",
  "/regional-highways.geojson",
  "/data/places-index.json",
  ...guideOfflineResources(),
  "/icon.png",
  "/apple-icon.png",
];

// Feature detection for Service Worker and Cache Storage APIs
export function isOfflineSupported() {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    ("caches" in window || typeof caches !== "undefined") &&
    "serviceWorker" in navigator
  );
}

// Collects all unique same-origin app shell URLs required for offline use:
// base assets, scripts, stylesheets, and performance-logged static chunks.
// Excludes place detail files, service worker script, and external URLs.
export function collectAppShellUrls({
  document = typeof window !== "undefined"
    ? window.document || globalThis.document
    : null,
  performanceEntries = typeof window !== "undefined" &&
  (window.performance || globalThis.performance)?.getEntriesByType
    ? (window.performance || globalThis.performance).getEntriesByType("resource")
    : [],
  location = typeof window !== "undefined"
    ? window.location
    : { origin: "https://fcpqroo.mx", pathname: "/" },
  baseAssets = DEFAULT_SHARED_ASSETS,
} = {}) {
  const origin = location?.origin || "https://fcpqroo.mx";
  const urls = new Set();

  for (const asset of baseAssets) {
    try {
      const parsed = new URL(asset, origin);
      urls.add(parsed.pathname);
    } catch {
      // ignore invalid
    }
  }

  if (location?.pathname && location.pathname !== "/") {
    try {
      const parsed = new URL(location.pathname, origin);
      urls.add(parsed.pathname);
    } catch {
      // ignore invalid
    }
  }

  if (document) {
    const elements =
      document.querySelectorAll?.("script[src], link[rel='stylesheet'], link[rel*='icon']") ?? [];
    for (const el of elements) {
      const raw =
        el.getAttribute?.("src") ||
        el.getAttribute?.("href") ||
        el.src ||
        el.href;
      if (!raw) continue;
      try {
        const parsed = new URL(raw, origin);
        if (
          parsed.origin === origin &&
          !parsed.pathname.startsWith("/data/places/") &&
          parsed.pathname !== "/sw.js"
        ) {
          urls.add(parsed.pathname);
        }
      } catch {
        // ignore invalid URL
      }
    }
  }

  if (Array.isArray(performanceEntries)) {
    for (const entry of performanceEntries) {
      const name = typeof entry === "string" ? entry : entry?.name;
      if (!name) continue;
      try {
        const parsed = new URL(name, origin);
        if (
          parsed.origin === origin &&
          (parsed.pathname.startsWith("/_next/") ||
            parsed.pathname.endsWith(".js") ||
            parsed.pathname.endsWith(".css") ||
            parsed.pathname.endsWith(".png") ||
            parsed.pathname.endsWith(".svg") ||
            parsed.pathname.endsWith(".geojson") ||
            parsed.pathname === "/data/places-index.json") &&
          !parsed.pathname.startsWith("/data/places/") &&
          parsed.pathname !== "/sw.js"
        ) {
          urls.add(parsed.pathname);
        }
      } catch {
        // ignore invalid URL
      }
    }
  }

  return Array.from(urls).sort();
}

// Register service worker safely in browser
export async function registerServiceWorker() {
  if (!isOfflineSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch (err) {
    console.warn("Service worker registration failed:", err);
    return null;
  }
}

// Caches the shared offline map assets. Reports progress and throws on any failed request,
// ensuring "ready" is never reported until all assets are cached.
export async function saveSharedMap({
  urls = null,
  document = typeof window !== "undefined" ? window.document : null,
  performanceEntries = typeof window !== "undefined" && window.performance?.getEntriesByType
    ? window.performance.getEntriesByType("resource")
    : [],
  location = typeof window !== "undefined" ? window.location : null,
  onProgress = null,
  cacheStorage = typeof window !== "undefined" ? window.caches : null,
  fetchFn = typeof fetch !== "undefined" ? fetch : null,
  storage = typeof localStorage !== "undefined" ? localStorage : null,
} = {}) {
  if (!cacheStorage || !fetchFn) {
    throw new Error("Offline storage not supported in this environment");
  }

  const manifest = urls ?? collectAppShellUrls({ document, performanceEntries, location });
  const cache = await cacheStorage.open(SHARED_CACHE_NAME);
  const total = manifest.length;
  let current = 0;

  for (const url of manifest) {
    const response = await fetchFn(url, { cache: "reload" });
    if (!response.ok) {
      throw new Error(`Failed to fetch required offline asset: ${url} (status: ${response.status})`);
    }
    await cache.put(url, response);
    current += 1;
    if (onProgress) {
      onProgress({ current, total });
    }
  }

  if (storage) {
    storage.setItem(OFFLINE_MAP_STATUS_KEY, "ready");
  }

  return { ready: true, count: total };
}

// Re-caches the shared offline map assets with network-fresh copies
export async function updateSharedMap(options = {}) {
  return await saveSharedMap(options);
}

// Removes the shared offline map cache without removing individually saved places
export async function removeSharedMap({
  cacheStorage = typeof window !== "undefined" ? window.caches : null,
  storage = typeof localStorage !== "undefined" ? localStorage : null,
} = {}) {
  if (storage) {
    storage.removeItem(OFFLINE_MAP_STATUS_KEY);
  }
  if (!cacheStorage) return false;
  return await cacheStorage.delete(SHARED_CACHE_NAME);
}

// Checks if the shared offline map is currently cached and complete
export async function isSharedMapReady({
  cacheStorage = typeof window !== "undefined" ? window.caches : null,
  storage = typeof localStorage !== "undefined" ? localStorage : null,
} = {}) {
  if (!cacheStorage) return false;
  try {
    const hasCache = await cacheStorage.has(SHARED_CACHE_NAME);
    if (!hasCache) return false;
    const cache = await cacheStorage.open(SHARED_CACHE_NAME);
    const highways = await cache.match("/regional-highways.geojson");
    const index = await cache.match("/data/places-index.json");
    const ready = Boolean(highways && index);
    if (!ready && storage) {
      storage.removeItem(OFFLINE_MAP_STATUS_KEY);
    }
    return ready;
  } catch {
    return false;
  }
}

// Saved places (individual place details) management
export function getSavedPlaceIds(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(SAVED_PLACES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isPlaceSaved(id, storage = typeof localStorage !== "undefined" ? localStorage : null) {
  return getSavedPlaceIds(storage).includes(id);
}

export async function savePlaceOffline(
  id,
  {
    placeData = null,
    cacheStorage = typeof window !== "undefined" ? window.caches : null,
    fetchFn = typeof fetch !== "undefined" ? fetch : null,
    storage = typeof localStorage !== "undefined" ? localStorage : null,
  } = {},
) {
  if (!cacheStorage) {
    throw new Error("Offline storage not supported in this environment");
  }
  const url = `/data/places/${encodeURIComponent(id)}.json`;
  const cache = await cacheStorage.open(PLACES_CACHE_NAME);

  if (placeData) {
    const response = new Response(JSON.stringify(placeData), {
      headers: { "Content-Type": "application/json" },
    });
    await cache.put(url, response);
  } else if (fetchFn) {
    const response = await fetchFn(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch place detail: ${url} (status: ${response.status})`);
    }
    await cache.put(url, response);
  } else {
    throw new Error("No place data or fetch function provided");
  }

  if (storage) {
    const saved = new Set(getSavedPlaceIds(storage));
    saved.add(id);
    storage.setItem(SAVED_PLACES_STORAGE_KEY, JSON.stringify(Array.from(saved)));
  }
  return true;
}

export async function removePlaceOffline(
  id,
  {
    cacheStorage = typeof window !== "undefined" ? window.caches : null,
    storage = typeof localStorage !== "undefined" ? localStorage : null,
  } = {},
) {
  if (cacheStorage) {
    const url = `/data/places/${encodeURIComponent(id)}.json`;
    const cache = await cacheStorage.open(PLACES_CACHE_NAME);
    await cache.delete(url);
  }
  if (storage) {
    const saved = new Set(getSavedPlaceIds(storage));
    saved.delete(id);
    storage.setItem(SAVED_PLACES_STORAGE_KEY, JSON.stringify(Array.from(saved)));
  }
  return true;
}

export function getSavedPlacesList(
  placesIndex = [],
  storage = typeof localStorage !== "undefined" ? localStorage : null,
) {
  const savedIds = new Set(getSavedPlaceIds(storage));
  return placesIndex.filter((place) => savedIds.has(place.id));
}

// Clean up old shared caches from previous versions without deleting saved places or unrelated caches
export async function cleanupOldCaches(cacheStorage = typeof window !== "undefined" ? window.caches : null) {
  if (!cacheStorage) return [];
  const keys = await cacheStorage.keys();
  const deleted = [];
  for (const key of keys) {
    if (key.startsWith(SHARED_CACHE_PREFIX) && key !== SHARED_CACHE_NAME) {
      await cacheStorage.delete(key);
      deleted.push(key);
    }
  }
  return deleted;
}

// Storage estimate helper
export async function getStorageEstimate() {
  if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
      };
    } catch {
      return null;
    }
  }
  return null;
}
