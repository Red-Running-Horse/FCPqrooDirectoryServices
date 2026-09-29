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

const market = attractions.find(({ id }) => id === "mercado-felipe-carrillo-puerto");

test("attractions have complete, distinct, bilingual, in-bounds data", () => {
  assert.ok(attractions.length >= 1);
  assert.equal(new Set(attractions.map(({ id }) => id)).size, attractions.length);
  const categories = new Set(CATEGORIES.map(({ id }) => id));
  for (const attraction of attractions) {
    assert.ok(attraction.id);
    for (const language of ["es", "en"]) {
      assert.ok(attraction.name[language] && attraction.description[language], `${attraction.id} ${language}`);
    }
    assert.ok(categories.has(attraction.category) && attraction.category !== "all");
    assert.ok(["verified", "unverified", "unavailable"].includes(attraction.status));
    assert.ok(["exact", "approximate"].includes(attraction.locationAccuracy));
    assert.ok(inside(FCP_MAX_BOUNDS, attraction), `${attraction.id} dentro del límite regional`);
    assert.ok(attraction.directionsUrl === null || attraction.directionsUrl.startsWith("https://"));
  }
});

test("no demo placeholder points remain", () => {
  for (const attraction of attractions) {
    assert.doesNotMatch(attraction.id, /demo/i);
    assert.doesNotMatch(attraction.name.es, /demo/i);
    assert.doesNotMatch(attraction.name.en, /demo/i);
  }
});

test("the physically confirmed market is exact, verified and in the town view", () => {
  assert.ok(market);
  assert.equal(market.category, "food");
  assert.equal(market.status, "verified");
  assert.equal(market.locationAccuracy, "exact");
  assert.equal(isVerified(market), true);
  assert.equal(market.latitude, 19.580894458770345);
  assert.equal(market.longitude, -88.04402730793707);
  assert.equal(directionsUrlFor(market), "https://maps.app.goo.gl/zJbo8V1rE4ZmYT537");
  assert.ok(inside(FCP_VIEW_BOUNDS, market));
});

test("directions are only offered for verified destinations", () => {
  for (const attraction of attractions) {
    if (!isVerified(attraction)) assert.equal(directionsUrlFor(attraction), null);
  }

  const url = "https://www.openstreetmap.org/?mlat=19.58&mlon=-88.04";
  const base = { directionsUrl: url, locationAccuracy: "exact" };
  assert.equal(directionsUrlFor({ ...base, status: "verified" }), url);
  assert.equal(directionsUrlFor({ ...base, status: "unverified" }), null);
  assert.equal(directionsUrlFor({ ...base, status: "verified", locationAccuracy: "approximate" }), null);
  assert.equal(directionsUrlFor({ ...base, status: "verified", directionsUrl: "http://example.com" }), null);
  assert.equal(directionsUrlFor({ ...base, status: "verified", directionsUrl: null }), null);
});

test("categories filter locally (empty categories allowed) and All restores every attraction", () => {
  assert.deepEqual(CATEGORIES.map(({ id }) => id), ["all", "nature", "culture", "food", "lodging", "tours"]);
  for (const { id, label } of CATEGORIES) {
    assert.ok(label.es && label.en, `${id} bilingüe`);
    const filtered = filterAttractions(id);
    assert.ok(filtered.every(({ category }) => id === "all" || category === id));
  }
  assert.deepEqual(filterAttractions("all"), attractions);
  assert.ok(filterAttractions("food").includes(market));
});
