import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { attractions } from "../app/attractions.mjs";
import { clearPlaceDetailCache, loadPlaceDetail, loadPlaceIndex, placeDetailUrl } from "../app/place-data.mjs";
import { CATEGORIES, filterPlaces, isVerified } from "../app/place-index.mjs";
import { placePopup, placePortal } from "../app/place-portal.mjs";
import { INDEX_FIELDS, buildPlaceData, placeDetail, placeIndexEntry } from "../scripts/build-place-data.mjs";

const dataDirectory = new URL("../public/data/", import.meta.url);
const committedIndex = JSON.parse(readFileSync(new URL("places-index.json", dataDirectory), "utf8"));

function committedDetail(id) {
  return JSON.parse(readFileSync(new URL(`places/${id}.json`, dataDirectory), "utf8"));
}

test("user-provided coordinates remain approximate and unverified in source and static data", () => {
  const corrections = new Map([
    ["museo-de-la-ciudad-felipe-carrillo-puerto", [19.57802448542231, -88.04537970768848]],
    ["casa-de-la-cultura-felipe-carrillo-puerto", [19.578167300889525, -88.0453221173923]],
    ["plaza-civica-parque-de-las-palapas-monumento-felipe-carrillo-puerto", [19.578135173994557, -88.0460485056746]],
    ["iglesia-de-san-servacio-felipe-carrillo-puerto", [19.577906662241222, -88.0456236548112]],
    ["pila-de-los-azotes-felipe-carrillo-puerto", [19.577544356982212, -88.0456050409815]],
    ["santuario-de-la-cruz-parlante-fcp", [19.580684047331296, -88.04887785463087]],
  ]);
  for (const [id, [latitude, longitude]] of corrections) {
    const source = attractions.find((place) => place.id === id);
    const index = committedIndex.find((place) => place.id === id);
    const detail = committedDetail(id);
    assert.ok(source, id);
    assert.ok(index, id);
    for (const place of [source, index]) {
      assert.equal(place.latitude, latitude, id);
      assert.equal(place.longitude, longitude, id);
      assert.equal(place.status, "unverified", id);
      assert.equal(place.locationAccuracy, "approximate", id);
    }
    assert.match(source.coordinateSource, /User-provided coordinates; not independently GPS-verified/, id);
    assert.equal(detail.coordinateSource, source.coordinateSource, id);
  }
});

test("the committed index and detail files match the source records", () => {
  const { index, details } = buildPlaceData(attractions);

  assert.deepEqual(committedIndex, index);
  assert.equal(
    readdirSync(new URL("places/", dataDirectory)).filter((name) => name.endsWith(".json")).length,
    attractions.length,
  );
  for (const attraction of attractions) {
    assert.deepEqual(committedDetail(attraction.id), details.get(attraction.id), attraction.id);
  }
});

test("the index carries only the fields the first paint needs", () => {
  assert.equal(committedIndex.length, attractions.length);
  for (const entry of committedIndex) {
    // secondaryCategories is optional: only places with one carry it.
    const expectedFields = INDEX_FIELDS.filter(
      (field) => field !== "secondaryCategories" || "secondaryCategories" in entry,
    );
    assert.deepEqual(Object.keys(entry).sort(), expectedFields.sort());
    assert.match(entry.id, /^[a-z0-9][a-z0-9-]*$/);
    assert.ok(Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude));
    assert.ok(CATEGORIES.some(({ id }) => id === entry.category) && entry.category !== "all");
    for (const secondary of entry.secondaryCategories ?? []) {
      assert.ok(CATEGORIES.some(({ id }) => id === secondary) && secondary !== "all");
      assert.notEqual(secondary, entry.category);
    }
    assert.ok(entry.name.es && entry.name.en);
    assert.ok(["verified", "unverified", "unavailable"].includes(entry.status));
    assert.ok(["exact", "approximate"].includes(entry.locationAccuracy));
  }
  // The heavy portal fields stay out of the initial payload.
  const serialized = JSON.stringify(committedIndex);
  for (const key of ["description", "verificationNote", "fullDescriptionEs", "address"]) {
    assert.doesNotMatch(serialized, new RegExp(`"${key}"`), key);
  }
});

test("an index entry plus its detail file reproduces the source record", () => {
  for (const attraction of attractions) {
    const entry = committedIndex.find(({ id }) => id === attraction.id);
    assert.deepEqual({ ...entry, ...committedDetail(attraction.id) }, attraction, attraction.id);
    for (const language of ["es", "en"]) {
      assert.deepEqual(
        placePortal({ ...entry, ...committedDetail(attraction.id) }, language),
        placePortal(attraction, language),
      );
    }
  }
});

test("markers, filtering, search and popups work from the index alone", () => {
  for (const language of ["es", "en"]) {
    for (const entry of committedIndex) {
      const source = attractions.find(({ id }) => id === entry.id);
      assert.deepEqual(placePopup(entry, language), placePopup(source, language));
      assert.equal(isVerified(entry), isVerified(source));
    }
  }
  assert.deepEqual(
    filterPlaces(committedIndex, "food", "mercado").map(({ id }) => id),
    ["mercado-felipe-carrillo-puerto"],
  );
  assert.deepEqual(filterPlaces(committedIndex, "culture", "mercado"), []);
  assert.equal(filterPlaces(committedIndex, "all", "").length, committedIndex.length);
});

test("the generator names the duplicate when two places share an id", () => {
  const place = { id: "twice", category: "culture" };
  assert.throws(() => buildPlaceData([place, place]), /Duplicate place id: twice/);
});

test("the generator rejects ids that are unsafe as file names or URL segments", () => {
  for (const id of ["../escape", "Upper Case", "with/slash", ""]) {
    assert.throws(() => placeIndexEntry({ id, category: "culture" }), /Unsafe place id/, id);
    assert.throws(() => placeDetail({ id, category: "culture" }), /Unsafe place id/, id);
  }
});

function stubFetch(handler) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push(url);
    return handler(url, options);
  };
  return { calls, restore: () => (globalThis.fetch = original) };
}

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

test("the client loads the index, then each detail on demand and only once", async () => {
  clearPlaceDetailCache();
  const fetched = stubFetch((url) =>
    jsonResponse(url === "/data/places-index.json" ? committedIndex : { id: "mercado-felipe-carrillo-puerto" }),
  );

  try {
    const index = await loadPlaceIndex();
    assert.equal(index.length, committedIndex.length);
    assert.deepEqual(fetched.calls, ["/data/places-index.json"]);

    const first = await loadPlaceDetail("mercado-felipe-carrillo-puerto");
    const second = await loadPlaceDetail("mercado-felipe-carrillo-puerto");
    assert.equal(first, second, "the cached detail is reused");
    assert.deepEqual(fetched.calls, [
      "/data/places-index.json",
      "/data/places/mercado-felipe-carrillo-puerto.json",
    ]);
  } finally {
    fetched.restore();
  }
});

test("detail URLs escape the id and failures reject instead of caching", async () => {
  clearPlaceDetailCache();
  assert.equal(placeDetailUrl("a/b"), "/data/places/a%2Fb.json");

  const fetched = stubFetch(() => ({ ok: false, status: 404 }));
  try {
    await assert.rejects(loadPlaceDetail("missing-place"), /Place detail request failed: 404/);
    await assert.rejects(loadPlaceIndex(), /Place index request failed: 404/);
  } finally {
    fetched.restore();
  }

  const recovered = stubFetch(() => jsonResponse({ id: "missing-place" }));
  try {
    assert.deepEqual(await loadPlaceDetail("missing-place"), { id: "missing-place" });
  } finally {
    recovered.restore();
  }
});

test("a cancelled selection stops waiting but keeps the shared request usable", async () => {
  clearPlaceDetailCache();
  let release;
  const fetched = stubFetch(
    () => new Promise((resolve) => (release = () => resolve(jsonResponse({ id: "mercado-felipe-carrillo-puerto" })))),
  );

  try {
    const controller = new AbortController();
    const cancelled = loadPlaceDetail("mercado-felipe-carrillo-puerto", controller.signal);
    // Reselecting the same place while it loads reuses the in-flight request.
    const kept = loadPlaceDetail("mercado-felipe-carrillo-puerto");
    controller.abort();
    await assert.rejects(cancelled, (cause) => cause.name === "AbortError");

    release();
    assert.deepEqual(await kept, { id: "mercado-felipe-carrillo-puerto" });
    assert.deepEqual(await loadPlaceDetail("mercado-felipe-carrillo-puerto"), {
      id: "mercado-felipe-carrillo-puerto",
    });
    assert.equal(fetched.calls.length, 1, "one request per place");

    const alreadyAborted = new AbortController();
    alreadyAborted.abort();
    await assert.rejects(
      loadPlaceDetail("mercado-felipe-carrillo-puerto", alreadyAborted.signal),
      (cause) => cause.name === "AbortError",
    );
  } finally {
    fetched.restore();
    clearPlaceDetailCache();
  }
});

test("loadPlaceDetail falls back to cache storage when network fetch fails", async () => {
  clearPlaceDetailCache();
  const mockPlace = { id: "cached-place", name: { es: "Lugar en caché" } };

  // Setup mock caches
  const originalCaches = globalThis.caches;
  globalThis.caches = {
    match: async (url) => {
      if (url === "/data/places/cached-place.json") {
        return {
          ok: true,
          status: 200,
          json: async () => mockPlace,
        };
      }
      return null;
    },
  };

  const fetched = stubFetch(async () => {
    throw new TypeError("Network error (offline)");
  });

  try {
    const result = await loadPlaceDetail("cached-place");
    assert.deepEqual(result, mockPlace);

    // Unsaved place fails when network is offline and not in cache
    await assert.rejects(
      loadPlaceDetail("unsaved-place"),
      /Network error \(offline\)/,
    );
  } finally {
    fetched.restore();
    globalThis.caches = originalCaches;
    clearPlaceDetailCache();
  }
});

