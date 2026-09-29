import assert from "node:assert/strict";
import test from "node:test";
import { attractions, CATEGORIES, filterAttractions } from "../app/attractions.mjs";
import { FCP_MAX_BOUNDS } from "../app/map-view.mjs";

test("demo attractions have complete, distinct, in-bounds data", () => {
  assert.ok(attractions.length >= 5 && attractions.length <= 10);
  assert.equal(new Set(attractions.map(({ id }) => id)).size, attractions.length);
  const categories = new Set(CATEGORIES.map(({ id }) => id));
  for (const attraction of attractions) {
    assert.ok(attraction.id && attraction.name && attraction.description);
    assert.ok(categories.has(attraction.category) && attraction.category !== "all");
    assert.ok(["verified", "placeholder"].includes(attraction.status));
    assert.ok(attraction.latitude >= FCP_MAX_BOUNDS[0][0] && attraction.latitude <= FCP_MAX_BOUNDS[1][0]);
    assert.ok(attraction.longitude >= FCP_MAX_BOUNDS[0][1] && attraction.longitude <= FCP_MAX_BOUNDS[1][1]);
    assert.ok(attraction.directionsUrl === null || attraction.directionsUrl.startsWith("https://"));
    if (attraction.status === "placeholder") assert.match(attraction.name, /demo/i);
  }
});

test("all categories filter locally and All restores every attraction", () => {
  assert.deepEqual(CATEGORIES.map(({ id }) => id), ["all", "nature", "culture", "food", "lodging", "tours"]);
  for (const { id } of CATEGORIES) {
    const filtered = filterAttractions(id);
    assert.ok(filtered.length > 0);
    assert.ok(filtered.every(({ category }) => id === "all" || category === id));
  }
  assert.deepEqual(filterAttractions("all"), attractions);
});
