import assert from "node:assert/strict";
import test from "node:test";
import {
  attractions,
  CATEGORIES,
  directionsUrlFor,
  filterAttractions,
  isVerified,
} from "../app/attractions.mjs";
import { FCP_MAX_BOUNDS, FCP_VIEW_BOUNDS } from "../app/map-view.mjs";

function inside(bounds, { latitude, longitude }) {
  return (
    latitude >= bounds[0][0] &&
    latitude <= bounds[1][0] &&
    longitude >= bounds[0][1] &&
    longitude <= bounds[1][1]
  );
}

test("demo attractions have complete, distinct, bilingual, in-bounds data", () => {
  assert.ok(attractions.length >= 5 && attractions.length <= 10);
  assert.equal(new Set(attractions.map(({ id }) => id)).size, attractions.length);
  const categories = new Set(CATEGORIES.map(({ id }) => id));
  for (const attraction of attractions) {
    assert.ok(attraction.id);
    for (const language of ["es", "en"]) {
      assert.ok(attraction.name[language] && attraction.description[language], `${attraction.id} ${language}`);
    }
    assert.ok(categories.has(attraction.category) && attraction.category !== "all");
    assert.ok(["verified", "unverified"].includes(attraction.status));
    assert.ok(["exact", "approximate"].includes(attraction.locationAccuracy));
    assert.ok(inside(FCP_MAX_BOUNDS, attraction), `${attraction.id} dentro del límite regional`);
    assert.ok(attraction.directionsUrl === null || attraction.directionsUrl.startsWith("https://"));
  }
});

test("the six demo attractions are marked unverified and approximate, and sit in the town view", () => {
  assert.equal(attractions.length, 6);
  for (const attraction of attractions) {
    assert.equal(attraction.status, "unverified");
    assert.equal(attraction.locationAccuracy, "approximate");
    assert.equal(isVerified(attraction), false);
    assert.match(attraction.name.es, /demo/i);
    assert.match(attraction.name.en, /demo/i);
    assert.match(attraction.description.es, /aproximada/i);
    assert.match(attraction.description.en, /approximate/i);
    assert.ok(inside(FCP_VIEW_BOUNDS, attraction), `${attraction.id} visible en la vista inicial`);
  }
});

test("directions are only offered for verified destinations", () => {
  for (const attraction of attractions) assert.equal(directionsUrlFor(attraction), null);

  const url = "https://www.openstreetmap.org/?mlat=19.58&mlon=-88.04";
  const base = { directionsUrl: url, locationAccuracy: "exact" };
  assert.equal(directionsUrlFor({ ...base, status: "verified" }), url);
  assert.equal(directionsUrlFor({ ...base, status: "unverified" }), null);
  assert.equal(directionsUrlFor({ ...base, status: "verified", locationAccuracy: "approximate" }), null);
  assert.equal(directionsUrlFor({ ...base, status: "verified", directionsUrl: "http://example.com" }), null);
  assert.equal(directionsUrlFor({ ...base, status: "verified", directionsUrl: null }), null);
});

test("all categories filter locally and All restores every attraction", () => {
  assert.deepEqual(CATEGORIES.map(({ id }) => id), ["all", "nature", "culture", "food", "lodging", "tours"]);
  for (const { id, label } of CATEGORIES) {
    assert.ok(label.es && label.en, `${id} bilingüe`);
    const filtered = filterAttractions(id);
    assert.ok(filtered.length > 0);
    assert.ok(filtered.every(({ category }) => id === "all" || category === id));
  }
  assert.deepEqual(filterAttractions("all"), attractions);
});
