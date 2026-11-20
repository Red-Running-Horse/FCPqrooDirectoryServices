import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkGeoJson, MAX_GEOJSON_BYTES } from "../scripts/check-performance-budgets.mjs";
import events from "../app/events.mjs";
import { attractions } from "../app/attractions.mjs";

const roadFile = new URL("../public/regional-highways.geojson", import.meta.url);
const source = readFileSync(roadFile);

test("the committed road file is inside the measured budget and remains optimized", () => {
  assert.deepEqual(checkGeoJson(source), { bytes: source.length, errors: [] });
  const before = readFileSync(roadFile);
  assert.match(execFileSync(process.execPath, [
    fileURLToPath(new URL("../scripts/check-performance-budgets.mjs", import.meta.url)),
  ], { encoding: "utf8" }), new RegExp(`${source.length} / ${MAX_GEOJSON_BYTES} bytes`));
  assert.deepEqual(readFileSync(roadFile), before, "checking must not rewrite the payload");
});

test("budget and optimizer failures give independent, actionable errors without rewriting data", () => {
  const tooLarge = checkGeoJson(source, source.length - 1);
  assert.match(tooLarge.errors.join("\n"), /above the .*byte budget; review the road export/);
  const unoptimized = Buffer.from(JSON.stringify({ type: "FeatureCollection", features: [
    { type: "Feature", properties: { NOMBRE: "Road", extra: "unused" }, geometry: null },
  ] }));
  assert.match(checkGeoJson(unoptimized).errors.join("\n"), /not optimized; run npm run optimize:geojson/);
  assert.match(checkGeoJson(Buffer.from("{")).errors.join("\n"), /invalid GeoJSON JSON/);
});

test("event flyer assets exist under public/img/eventos, are WebP and within the byte budget", () => {
  // Optional field — permissive until wired: only records carrying an image
  // are checked, so the suite stays green with zero flyers and bites the
  // moment one is wired without its asset.
  const MAX_EVENT_IMAGE_BYTES = 150 * 1024; // 150 KB per flyer
  const withImage = events.filter((event) => event.image?.url);
  for (const event of withImage) {
    assert.ok(
      event.image.url.startsWith("/img/eventos/"),
      `${event.id}: flyer must live under /img/eventos/ (same-origin, cacheable)`,
    );
    assert.ok(event.image.url.endsWith(".webp"), `${event.id}: flyer must be WebP`);
    const file = new URL(`../public${event.image.url}`, import.meta.url);
    assert.ok(existsSync(file), `${event.id}: ${event.image.url} must exist under public/img/eventos/`);
    const { size } = statSync(file);
    assert.ok(
      size <= MAX_EVENT_IMAGE_BYTES,
      `${event.id}: ${event.image.url} is ${size} bytes — above the ${MAX_EVENT_IMAGE_BYTES}-byte flyer budget`,
    );
  }
});

test("the map reserves responsive height before roads or details arrive", () => {
  const css = readFileSync(new URL("../app/style.css", import.meta.url), "utf8");
  const baseMap = css.match(/\.map\s*\{([^{}]*)\}/)?.[1];
  const mobileMap = css.match(/@media\s*\(max-width:\s*[^)]*\)\s*\{\s*\.map\s*\{([^{}]*)\}/)?.[1];
  assert.ok(baseMap, "map needs a base layout rule");
  assert.match(baseMap, /(?:^|;)\s*height:\s*clamp\(\s*\d+px\s*,\s*\d+vh\s*,\s*\d+px\s*\)/);
  assert.ok(mobileMap, "map needs a small-screen layout rule");
  assert.match(mobileMap, /(?:^|;)\s*height:\s*\d+vh\s*;/);
  assert.match(mobileMap, /(?:^|;)\s*min-height:\s*[3-9]\d{2}px\s*;/);
});

test("the map workspace, portal placeholder and listing references are present without detail fetches", () => {
  const page = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
  const map = readFileSync(new URL("../app/highway-map.js", import.meta.url), "utf8");
  const portal = readFileSync(new URL("../app/place-portal.js", import.meta.url), "utf8");
  assert.match(page, /import placesIndex from ["']\.\.\/public\/data\/places-index\.json["']/);
  assert.match(page, /<HighwayMap placesIndex=\{placesIndex\}/);
  assert.match(map, /const references = listingReferences\(placesIndex\)/);
  assert.match(map, /const selectedPlaceView = detail \?\? places\.find\([^;]+ \?\? null;/);
  const initialMarkup = map.slice(map.indexOf('      <div className="map-container map-workspace">'));
  assert.match(initialMarkup, /<div className="map-workspace__map">\s*<div className="map-wrapper">\s*<div ref=\{container\} className="map"/);
  assert.match(initialMarkup, /<div className="map-workspace__portal">\s*<PlacePortal/);
  assert.match(initialMarkup, /<section className="listing-references"[\s\S]*\{filteredReferences\.map\(/);
  assert.match(portal, /!view\.selected\s*\?\s*\(\s*<p className="place-portal__prompt">/);
});

test("place photo assets exist under public/img/lugares and are within the byte budget", () => {
  // Optional field — permissive until wired (same rule as the event flyers):
  // only records carrying photos are checked.
  const MAX_PHOTO_BYTES = 150 * 1024; // 150 KB per photo
  const withPhotos = attractions.filter((a) => (a.photos ?? []).length > 0);
  for (const a of withPhotos) {
    for (const p of a.photos) {
      const file = new URL(`../public${p.url}`, import.meta.url);
      assert.ok(existsSync(file), `${a.id}: ${p.url} must exist under public/img/lugares/`);
      const { size } = statSync(file);
      assert.ok(
        size <= MAX_PHOTO_BYTES,
        `${a.id}: ${p.url} is ${size} bytes — above the ${MAX_PHOTO_BYTES}-byte place-photo budget`,
      );
    }
  }
});
