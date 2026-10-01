import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { attractions } from "../app/attractions.mjs";
import {
  CATEGORY_COLORS,
  FALLBACK_CATEGORY_COLOR,
  MAX_SPLIT_BANDS,
  categoryBandBackground,
  categoryColor,
  isMultiCategory,
  orderCategories,
  placeCategoryBackground,
  placeCategoryStyle,
} from "../app/category-colors.mjs";
import { CATEGORIES } from "../app/place-index.mjs";

const balamNah = attractions.find(({ id }) => id === "balam-nah-felipe-carrillo-puerto");
const market = attractions.find(({ id }) => id === "mercado-felipe-carrillo-puerto");
const sanctuary = attractions.find(({ id }) => id === "santuario-de-la-cruz-parlante-fcp");

test("deterministic category color mapping for all canonical place categories", () => {
  const expected = {
    nature: "#47775b",
    culture: "#914e70",
    food: "#a75030",
    lodging: "#536c98",
    tours: "#77663d",
  };

  assert.deepEqual(CATEGORY_COLORS, expected);
  assert.equal("all" in CATEGORY_COLORS, false);

  for (const [id, hex] of Object.entries(expected)) {
    assert.equal(categoryColor(id), hex, `categoryColor("${id}") must match expected hex`);
  }

  // All 5 category colors must be distinct.
  assert.equal(new Set(Object.values(CATEGORY_COLORS)).size, 5);
});

test("deterministic ordering of bands follows canonical sequence from CATEGORIES", () => {
  assert.deepEqual(orderCategories(["lodging", "nature"]), ["nature", "lodging"]);
  assert.deepEqual(
    orderCategories(["tours", "food", "culture", "nature"]),
    ["nature", "culture", "food", "tours"],
  );

  // Duplicate categories are deduplicated; unknown categories and "all" are excluded.
  assert.deepEqual(
    orderCategories(["all", "lodging", "nature", "unknown", "lodging"]),
    ["nature", "lodging"],
  );

  assert.deepEqual(orderCategories(null), []);
  assert.deepEqual(orderCategories(undefined), []);
  assert.deepEqual(orderCategories([]), []);
});

test("split-band style generation for multi-category places", () => {
  // 2 categories => 2 horizontal bands (50% each)
  const twoBands = categoryBandBackground(["nature", "lodging"]);
  assert.equal(twoBands, "linear-gradient(180deg, #47775b 0% 50%, #536c98 50% 100%)");

  // Input order does not affect output (deterministic)
  assert.equal(categoryBandBackground(["lodging", "nature"]), twoBands);

  // 3 categories => 3 horizontal bands (33.333% each)
  const threeBands = categoryBandBackground(["nature", "culture", "food"]);
  assert.equal(
    threeBands,
    "linear-gradient(180deg, #47775b 0% 33.333%, #914e70 33.333% 66.667%, #a75030 66.667% 100%)",
  );

  // Balam-Nah is a real multi-category destination (nature primary, lodging secondary)
  assert.ok(balamNah, "Balam-Nah must exist in attractions");
  assert.equal(isMultiCategory(balamNah), true);
  assert.equal(
    placeCategoryBackground(balamNah),
    "linear-gradient(180deg, #47775b 0% 50%, #536c98 50% 100%)",
  );
  assert.deepEqual(placeCategoryStyle(balamNah), {
    background: "linear-gradient(180deg, #47775b 0% 50%, #536c98 50% 100%)",
  });
});

test("single-category fallback behavior preserves solid category colors", () => {
  assert.ok(market, "Market place record must exist");
  assert.equal(isMultiCategory(market), false);
  assert.equal(placeCategoryBackground(market), CATEGORY_COLORS.food);
  assert.deepEqual(placeCategoryStyle(market), { background: CATEGORY_COLORS.food });

  assert.ok(sanctuary, "Sanctuary place record must exist");
  assert.equal(isMultiCategory(sanctuary), false);
  assert.equal(placeCategoryBackground(sanctuary), CATEGORY_COLORS.culture);
  assert.deepEqual(placeCategoryStyle(sanctuary), { background: CATEGORY_COLORS.culture });

  // Single category array input
  assert.equal(categoryBandBackground(["nature"]), CATEGORY_COLORS.nature);
  assert.equal(categoryBandBackground(["tours"]), CATEGORY_COLORS.tours);

  // Empty or invalid category inputs fall back to default nature color
  assert.equal(categoryBandBackground([]), FALLBACK_CATEGORY_COLOR);
  assert.equal(categoryBandBackground(["all"]), FALLBACK_CATEGORY_COLOR);
  assert.equal(categoryBandBackground(["non-existent"]), FALLBACK_CATEGORY_COLOR);
  assert.equal(categoryColor("all"), FALLBACK_CATEGORY_COLOR);
  assert.equal(categoryColor("not-a-category"), FALLBACK_CATEGORY_COLOR);
  assert.equal(placeCategoryBackground(null), FALLBACK_CATEGORY_COLOR);
  assert.equal(placeCategoryBackground({}), FALLBACK_CATEGORY_COLOR);
});

test("caps horizontal split bands to MAX_SPLIT_BANDS to prevent overly thin stripes", () => {
  assert.equal(MAX_SPLIT_BANDS, 4);
  const allCategories = ["nature", "culture", "food", "lodging", "tours"];
  const cappedBackground = categoryBandBackground(allCategories);

  // Must only include 4 bands (25% each)
  assert.match(cappedBackground, /0% 25%/);
  assert.match(cappedBackground, /25% 50%/);
  assert.match(cappedBackground, /50% 75%/);
  assert.match(cappedBackground, /75% 100%/);
  // The 5th category (tours, #77663d) is capped out
  assert.equal(cappedBackground.includes(CATEGORY_COLORS.tours), false);
});

test("places index entries correctly compute multi-category status and split styling", () => {
  const index = JSON.parse(
    readFileSync(new URL("../public/data/places-index.json", import.meta.url), "utf8"),
  );
  const multiPlaces = index.filter(isMultiCategory);
  assert.ok(multiPlaces.length >= 1, "At least one multi-category place exists in places-index.json");
  for (const place of multiPlaces) {
    const bg = placeCategoryBackground(place);
    assert.match(bg, /^linear-gradient\(180deg,/);
    const style = placeCategoryStyle(place);
    assert.equal(style.background, bg);
  }

  const singlePlaces = index.filter((p) => !isMultiCategory(p));
  assert.ok(singlePlaces.length >= 1, "Single-category places exist in places-index.json");
  for (const place of singlePlaces) {
    const bg = placeCategoryBackground(place);
    assert.equal(bg, CATEGORY_COLORS[place.category]);
    const style = placeCategoryStyle(place);
    assert.equal(style.background, CATEGORY_COLORS[place.category]);
  }
});

