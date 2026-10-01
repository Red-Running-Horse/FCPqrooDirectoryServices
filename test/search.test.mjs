import assert from "node:assert/strict";
import test from "node:test";
import {
  attractions,
  categorySummary,
  filterAttractions,
  matchesSearch,
  placeCategories,
} from "../app/attractions.mjs";

const market = attractions.find(({ id }) => id === "mercado-felipe-carrillo-puerto");

const museum = {
  id: "museum-test",
  name: { es: "Museo de la Guerra de Castas", en: "Caste War Museum" },
  category: "culture",
};

test("search matches Spanish names, case-insensitively and trimmed", () => {
  assert.equal(matchesSearch(museum, "museo"), true);
  assert.equal(matchesSearch(museum, "  GUERRA  "), true);
  assert.ok(filterAttractions("all", "mercado").includes(market));
  assert.ok(filterAttractions("all", "  MERCADO público ").includes(market));
});

test("search matches English names", () => {
  assert.equal(matchesSearch(museum, "caste war"), true);
  assert.ok(filterAttractions("all", "Public Market").includes(market));
});

test("search matches category labels in Spanish and English", () => {
  assert.equal(matchesSearch(museum, "cultura"), true);
  assert.equal(matchesSearch(museum, "Culture"), true);
  assert.ok(filterAttractions("all", "comida").includes(market));
  assert.ok(filterAttractions("all", "FOOD").includes(market));
  assert.equal(matchesSearch(museum, "comida"), false);
});

test("search combines with the selected category", () => {
  assert.ok(filterAttractions("food", "mercado").includes(market));
  assert.deepEqual(filterAttractions("culture", "mercado"), []);
  for (const place of filterAttractions("food", "market")) assert.equal(place.category, "food");
});

test("an empty or blank search restores the category results", () => {
  for (const category of ["all", "nature", "culture", "food", "lodging", "tours"]) {
    const expected = attractions.filter(
      (place) => category === "all" || placeCategories(place).includes(category),
    );
    assert.deepEqual(filterAttractions(category, ""), expected, category);
    assert.deepEqual(filterAttractions(category, "   "), expected, category);
    assert.deepEqual(filterAttractions(category), expected, category);
  }
  assert.equal(matchesSearch(museum, ""), true);
  assert.equal(matchesSearch(museum, undefined), true);
});

test("a place with a secondary category is found by both category labels, once", () => {
  const balamNah = attractions.find(({ id }) => id === "balam-nah-felipe-carrillo-puerto");
  for (const query of ["naturaleza", "Nature", "hospedaje", "LODGING"]) {
    const results = filterAttractions("all", query);
    assert.equal(results.filter(({ id }) => id === balamNah.id).length, 1, query);
  }
  assert.equal(matchesSearch(balamNah, "cultura"), false);
  assert.equal(categorySummary(balamNah, "es"), "Naturaleza · Hospedaje");
  assert.equal(categorySummary(balamNah, "en"), "Nature · Lodging");
  assert.equal(categorySummary(museum, "es"), "Cultura");
});

test("a query without matches returns no results", () => {
  assert.deepEqual(filterAttractions("all", "zzz-no-such-place"), []);
  assert.equal(matchesSearch(museum, "zzz-no-such-place"), false);
  assert.equal(matchesSearch({ id: "x", category: "unknown", name: {} }, "museo"), false);
});
