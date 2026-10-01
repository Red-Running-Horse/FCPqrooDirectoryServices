import assert from "node:assert/strict";
import test from "node:test";
import {
  SHARED_CACHE_NAME,
  PLACES_CACHE_NAME,
  collectAppShellUrls,
  saveSharedMap,
  updateSharedMap,
  removeSharedMap,
  isSharedMapReady,
  savePlaceOffline,
  removePlaceOffline,
  isPlaceSaved,
  getSavedPlaceIds,
} from "../app/offline.mjs";
import {
  handleServiceWorkerFetch,
  handleServiceWorkerActivate,
} from "../app/sw-handler.mjs";
import { placePortal } from "../app/place-portal.mjs";
import { uiText } from "../app/i18n.mjs";

class MockCache {
  constructor(name) {
    this.name = name;
    this.store = new Map();
  }

  async match(request) {
    const url = typeof request === "string" ? request : request.url;
    const path = new URL(url, "https://fcp.example.com").pathname;
    return this.store.get(path) ?? this.store.get(url) ?? null;
  }

  async put(request, response) {
    const url = typeof request === "string" ? request : request.url;
    const path = new URL(url, "https://fcp.example.com").pathname;
    this.store.set(path, response);
  }

  async delete(request) {
    const url = typeof request === "string" ? request : request.url;
    const path = new URL(url, "https://fcp.example.com").pathname;
    return this.store.delete(path) || this.store.delete(url);
  }

  async keys() {
    return Array.from(this.store.keys()).map((k) => ({ url: k }));
  }
}

class MockCacheStorage {
  constructor() {
    this.caches = new Map();
  }

  async open(name) {
    if (!this.caches.has(name)) {
      this.caches.set(name, new MockCache(name));
    }
    return this.caches.get(name);
  }

  async match(request) {
    for (const cache of this.caches.values()) {
      const match = await cache.match(request);
      if (match) return match;
    }
    return null;
  }

  async delete(name) {
    return this.caches.delete(name);
  }

  async keys() {
    return Array.from(this.caches.keys());
  }

  async has(name) {
    return this.caches.has(name);
  }
}

class MockLocalStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.get(key) ?? null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }

  removeItem(key) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }
}

function setupMockEnvironment() {
  const origin = "https://fcp.example.com";
  const mockCaches = new MockCacheStorage();
  const mockStorage = new MockLocalStorage();

  const mockWindow = {
    location: { origin },
    caches: mockCaches,
    localStorage: mockStorage,
  };
  globalThis.window = mockWindow;
  globalThis.document = {
    querySelectorAll: () => [
      { src: `${origin}/_next/static/chunks/app/page.js` },
      { href: `${origin}/_next/static/css/app.css` },
      { src: "https://external-tracker.example.com/analytics.js" }, // external script
    ],
  };
  mockWindow.document = globalThis.document;

  globalThis.performance = {
    getEntriesByType: () => [
      { name: `${origin}/_next/static/chunks/leaflet.js` },
      { name: `${origin}/data/places/balam-nah-felipe-carrillo-puerto.json` }, // individual place detail
    ],
  };
  mockWindow.performance = globalThis.performance;

  const mockNavigator = {
    serviceWorker: {
      register: async () => ({ scope: "/" }),
    },
    onLine: true,
  };
  Object.defineProperty(globalThis, "navigator", {
    value: mockNavigator,
    configurable: true,
    writable: true,
  });
  mockWindow.navigator = mockNavigator;

  globalThis.caches = mockCaches;
  globalThis.localStorage = mockStorage;

  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;
    return new Response(JSON.stringify({ mock: true, url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  return { mockCaches, mockStorage, origin };
}

test("collectAppShellUrls selects required static assets and excludes places & external URLs", () => {
  setupMockEnvironment();
  const urls = collectAppShellUrls();

  assert.ok(urls.includes("/"), "includes root path");
  assert.ok(urls.includes("/regional-highways.geojson"), "includes road GeoJSON");
  assert.ok(urls.includes("/data/places-index.json"), "includes place index");
  assert.ok(urls.includes("/_next/static/chunks/app/page.js"), "includes app scripts");
  assert.ok(urls.includes("/_next/static/css/app.css"), "includes app stylesheet");
  assert.ok(urls.includes("/_next/static/chunks/leaflet.js"), "includes loaded webpack chunk");

  // Must exclude individual place details
  assert.ok(
    urls.every((u) => !u.includes("/data/places/")),
    "must not include individual place details in shared manifest"
  );

  // Must exclude external origins
  assert.ok(
    urls.every((u) => new URL(u, "http://localhost:3000").hostname === "localhost"),
    "must only include same-origin resources"
  );
});

test("shared map save, update, and remove lifecycle updates state and caches", async () => {
  const { mockCaches, mockStorage } = setupMockEnvironment();

  assert.equal(await isSharedMapReady(), false, "initially not ready");

  // Save shared map
  let progressEvents = [];
  const saveResult = await saveSharedMap({
    onProgress: (p) => progressEvents.push({ ...p }),
  });

  assert.ok(saveResult.ready, "save reports ready: true");
  assert.ok(saveResult.count >= 3, "saved multiple required assets");
  assert.ok(progressEvents.length > 0, "dispatched progress events");
  assert.equal(progressEvents[progressEvents.length - 1].current, progressEvents[progressEvents.length - 1].total);
  assert.equal(await isSharedMapReady(), true, "isSharedMapReady is true after save");

  const sharedCache = await mockCaches.open(SHARED_CACHE_NAME);
  const roadMatch = await sharedCache.match("/regional-highways.geojson");
  assert.ok(roadMatch, "regional-highways.geojson is cached in shared cache");

  // Update shared map
  progressEvents = [];
  await updateSharedMap({
    onProgress: (p) => progressEvents.push({ ...p }),
  });
  assert.equal(await isSharedMapReady(), true, "still ready after update");

  // Remove shared map
  await removeSharedMap();
  assert.equal(await isSharedMapReady(), false, "not ready after remove");
  assert.equal(await mockCaches.has(SHARED_CACHE_NAME), false, "shared cache deleted");
});

test("per-place save and remove caches only the target place detail", async () => {
  const { mockCaches } = setupMockEnvironment();

  const placeId = "balam-nah-felipe-carrillo-puerto";
  assert.equal(isPlaceSaved(placeId), false);
  assert.deepEqual(getSavedPlaceIds(), []);

  // Save place
  await savePlaceOffline(placeId, {
    placeData: { id: placeId, name: { es: "Balam Nah" } },
  });

  assert.equal(isPlaceSaved(placeId), true);
  assert.deepEqual(getSavedPlaceIds(), [placeId]);

  const placesCache = await mockCaches.open(PLACES_CACHE_NAME);
  const cachedPlace = await placesCache.match(`/data/places/${placeId}.json`);
  assert.ok(cachedPlace, "place detail is in places cache");
  const data = await cachedPlace.json();
  assert.equal(data.id, placeId);

  // Remove place
  await removePlaceOffline(placeId);
  assert.equal(isPlaceSaved(placeId), false);
  assert.deepEqual(getSavedPlaceIds(), []);
  const afterRemove = await placesCache.match(`/data/places/${placeId}.json`);
  assert.equal(afterRemove, null, "place detail removed from cache");
});

test("service worker activate cleans stale shared caches but preserves places and unrelated caches", async () => {
  const { mockCaches } = setupMockEnvironment();
  await mockCaches.open("fcp-shared-v0");
  await mockCaches.open(SHARED_CACHE_NAME);
  await mockCaches.open(PLACES_CACHE_NAME);
  await mockCaches.open("custom-user-cache");

  await handleServiceWorkerActivate({ caches: mockCaches });

  const remaining = await mockCaches.keys();
  assert.ok(!remaining.includes("fcp-shared-v0"), "stale shared cache pruned");
  assert.ok(remaining.includes(SHARED_CACHE_NAME), "current shared cache preserved");
  assert.ok(remaining.includes(PLACES_CACHE_NAME), "places cache preserved");
  assert.ok(remaining.includes("custom-user-cache"), "unrelated cache preserved");
});

test("service worker fetch handles navigation, saved places, and unsaved places offline", async () => {
  const { mockCaches, origin } = setupMockEnvironment();
  const sharedCache = await mockCaches.open(SHARED_CACHE_NAME);
  const placesCache = await mockCaches.open(PLACES_CACHE_NAME);

  await sharedCache.put("/", new Response("<!DOCTYPE html><html>App Shell</html>", { status: 200 }));
  await sharedCache.put("/regional-highways.geojson", new Response('{"type":"FeatureCollection"}', { status: 200 }));
  await placesCache.put("/data/places/saved-place.json", new Response('{"id":"saved-place"}', { status: 200 }));

  // Simulate network offline
  const offlineFetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  // 1. Navigation request while offline -> returns cached app shell
  const navReq = new Request(`${origin}/`);
  Object.defineProperty(navReq, "mode", { value: "navigate" });
  const navRes = await handleServiceWorkerFetch({
    request: navReq,
    caches: mockCaches,
    fetchFn: offlineFetch,
    origin,
  });
  assert.equal(navRes.status, 200);
  assert.match(await navRes.text(), /App Shell/);

  // 2. Saved place detail request while offline -> returns cached detail
  const savedReq = new Request(`${origin}/data/places/saved-place.json`);
  const savedRes = await handleServiceWorkerFetch({
    request: savedReq,
    caches: mockCaches,
    fetchFn: offlineFetch,
    origin,
  });
  assert.equal(savedRes.status, 200);
  const savedJson = await savedRes.json();
  assert.equal(savedJson.id, "saved-place");

  // 3. Unsaved place detail request while offline -> returns immediate 504 without hanging
  const unsavedReq = new Request(`${origin}/data/places/unsaved-place.json`);
  const unsavedRes = await handleServiceWorkerFetch({
    request: unsavedReq,
    caches: mockCaches,
    fetchFn: offlineFetch,
    origin,
  });
  assert.equal(unsavedRes.status, 504);
  const unsavedJson = await unsavedRes.json();
  assert.ok(unsavedJson.error, "returns error payload immediately");

  // 4. Cached highway map data while offline -> returns cached
  const roadReq = new Request(`${origin}/regional-highways.geojson`);
  const roadRes = await handleServiceWorkerFetch({
    request: roadReq,
    caches: mockCaches,
    fetchFn: offlineFetch,
    origin,
  });
  assert.equal(roadRes.status, 200);
});

test("place portal formats offline actions, saved badges, and network notices bilingually", () => {
  const attraction = {
    id: "test-place",
    name: { es: "Lugar de Prueba", en: "Test Place" },
    status: "verified",
    locationAccuracy: "exact",
    category: "nature",
    phone: "+52 983 000 0000",
    website: "https://example.com",
    directionsUrl: "https://maps.google.com/?q=test",
  };

  for (const lang of ["es", "en"]) {
    const portal = placePortal(attraction, lang);
    assert.ok(portal.saveOfflineLabel, "has save offline label");
    assert.ok(portal.removeOfflineLabel, "has remove offline label");
    assert.ok(portal.savedOfflineBadge, "has saved offline badge");
    assert.ok(portal.offlineDetailUnavailable, "has detail unavailable message");
    assert.ok(portal.networkRequiredNote, "has network required notice");
    // Verify badge text does not rely only on color
    assert.match(portal.savedOfflineBadge, /guardado|saved/i);
  }
});

test("all required bilingual offline UI text keys are present and non-empty", () => {
  const requiredKeys = [
    "offlineSaveMap",
    "offlineUpdateMap",
    "offlineRemoveMap",
    "offlineHeading",
    "offlineDescription",
    "offlineSharedMapHeading",
    "offlineSavedPlacesHeading",
    "offlineStatusIdle",
    "offlineStatusPreparing",
    "offlineStatusReady",
    "offlineStatusUpdating",
    "offlineStatusFailed",
    "offlineStatusNotSupported",
    "offlineNoSavedPlaces",
    "offlineStorageNotice",
    "offlineConnectivityNotice",
    "savePlaceOffline",
    "removePlaceOffline",
    "placeSavedBadge",
    "placeUnsavedBadge",
    "offlineDetailUnavailable",
    "networkRequiredNote",
    "offlineManage",
    "offlineViewOnMap",
  ];

  for (const lang of ["es", "en"]) {
    const text = uiText(lang);
    for (const key of requiredKeys) {
      assert.ok(text[key], `Missing key "${key}" for language "${lang}"`);
      assert.ok(typeof text[key] === "string" && text[key].trim().length > 0);
    }
  }
});
