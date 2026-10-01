import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { listingReferences } from "../app/place-index.mjs";
import { localize, uiText } from "../app/i18n.mjs";

const index = JSON.parse(readFileSync(new URL("../public/data/places-index.json", import.meta.url), "utf8"));

test("homepage references use only available, mappable entries from the committed index", () => {
  const references = listingReferences(index);
  assert.equal(references.length, index.length);
  assert.deepEqual(references.map(({ id }) => id), index.map(({ id }) => id));
  assert.ok(references.every((place) => !("description" in place) && !("address" in place) && !("phone" in place)));
  assert.deepEqual(listingReferences([
    ...index,
    { id: "missing", category: "food", name: { es: "Missing" } },
    { ...index[0], id: "unavailable", status: "unavailable" },
    { ...index[0], id: "no-location", latitude: null },
  ]), references);
});

test("reference names, categories and action labels are available in both languages", () => {
  for (const language of ["es", "en"]) {
    const text = uiText(language);
    assert.ok(text.listingsHeading && text.listingsContext && text.listingsAction);
    for (const entry of listingReferences(index)) {
      assert.ok(localize(entry.name, language));
      assert.ok(text.listingsAction.includes("{name}"));
    }
  }
});

test("homepage passes the generated index to the map for prerendered references", () => {
  const page = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
  const map = readFileSync(new URL("../app/highway-map.js", import.meta.url), "utf8");
  assert.match(page, /places-index\.json/);
  assert.match(page, /<HighwayMap placesIndex=\{placesIndex\}/);
  assert.match(map, /listingReferences\(placesIndex\)/);
  assert.match(map, /onClick=\{\(\) => focusListing\(place\.id\)\}/);
  assert.ok(map.indexOf('<section className="listing-references"') > map.indexOf('<div className="map-workspace__portal"'));
  assert.doesNotMatch(map, /href=\{[^}]*place\.id/);
});
