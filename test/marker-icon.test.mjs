import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { attractions } from "../app/attractions.mjs";
import { CATEGORY_COLORS, categoryColor } from "../app/category-colors.mjs";
import { GLYPH_MARKER_SIZE, LOGO_MARKER_SIZE, markerIconView } from "../app/marker-icon.mjs";

const selvaMorena = attractions.find(({ id }) => id === "selva-morena");
const market = attractions.find(({ id }) => id === "mercado-felipe-carrillo-puerto");

test("a place with markerLogo renders its logo in a 36px marker", () => {
  const view = markerIconView(selvaMorena);
  assert.equal(view.kind, "logo");
  assert.equal(view.logo, "/img/markers/selva-morena-logo.svg");
  assert.match(view.html, /<img class="attraction-marker__logo" src="\/img\/markers\/selva-morena-logo\.svg"/);
  assert.deepEqual(view.size, [LOGO_MARKER_SIZE, LOGO_MARKER_SIZE]);
  assert.deepEqual(view.anchor, [LOGO_MARKER_SIZE / 2, LOGO_MARKER_SIZE / 2]);
});

test("a place without markerLogo falls back to the category glyph at the classic 32px size", () => {
  const view = markerIconView(market);
  assert.equal(view.kind, "glyph");
  assert.equal(view.logo, null);
  assert.match(view.html, /<svg/);
  assert.ok(!view.html.includes("<img"), "no logo image in the glyph marker");
  assert.deepEqual(view.size, [GLYPH_MARKER_SIZE, GLYPH_MARKER_SIZE]);
  assert.deepEqual(view.anchor, [GLYPH_MARKER_SIZE / 2, GLYPH_MARKER_SIZE / 2]);
});

test("blank or missing markerLogo values take the glyph path", () => {
  for (const markerLogo of [null, undefined, "", "   "]) {
    assert.equal(markerIconView({ ...selvaMorena, markerLogo }).kind, "glyph", JSON.stringify(markerLogo));
  }
});

test("the logo marker ring carries the place's primary category color", () => {
  assert.equal(selvaMorena.category, "lodging");
  assert.equal(markerIconView(selvaMorena).ringColor, CATEGORY_COLORS.lodging);
  assert.equal(markerIconView(selvaMorena).ringColor, categoryColor("lodging"));
  assert.equal(markerIconView({ ...market, category: "food" }).ringColor, CATEGORY_COLORS.food);
  assert.equal(markerIconView({ category: "bogus" }).ringColor, CATEGORY_COLORS.nature, "unknown category falls back to nature");
});

test("the Selva Morena logo asset exists in public/ and the record points at it", () => {
  const asset = new URL("../public/img/markers/selva-morena-logo.svg", import.meta.url);
  assert.ok(existsSync(asset), "public/img/markers/selva-morena-logo.svg must exist");
  assert.equal(selvaMorena.markerLogo, "/img/markers/selva-morena-logo.svg");
  // Only Selva Morena carries the field so far.
  const carriers = attractions.filter((place) => place.markerLogo);
  assert.deepEqual(carriers.map(({ id }) => id), ["selva-morena"]);
  // The marker pipeline is CSS-class based: the logo modifier and ring variable
  // must stay in sync between the view model, the map and the styles.
  const map = readFileSync(new URL("../app/highway-map.js", import.meta.url), "utf8");
  assert.match(map, /markerIconView\(attraction\)/);
  assert.match(map, /attraction-marker--logo/);
  assert.match(map, /--marker-ring-color/);
  const css = readFileSync(new URL("../app/style.css", import.meta.url), "utf8");
  assert.match(css, /\.attraction-marker--logo\s*\{[^}]*var\(--marker-ring-color/s);
});

test("the committed index carries markerLogo so first paint can render it", () => {
  const index = JSON.parse(readFileSync(new URL("../public/data/places-index.json", import.meta.url), "utf8"));
  const entry = index.find(({ id }) => id === "selva-morena");
  assert.equal(entry.markerLogo, "/img/markers/selva-morena-logo.svg");
  assert.ok(
    index.every((place) => Object.hasOwn(place, "markerLogo") === Boolean(place.markerLogo)),
    "markerLogo appears only when set",
  );
});
