import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkGeoJson, MAX_GEOJSON_BYTES } from "../scripts/check-performance-budgets.mjs";

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
  assert.match(initialMarkup, /<div className="map-workspace__map">\s*<div ref=\{container\} className="map"/);
  assert.match(initialMarkup, /<div className="map-workspace__portal">\s*<PlacePortal/);
  assert.match(initialMarkup, /<section className="listing-references"[\s\S]*\{references\.map\(/);
  assert.match(portal, /!view\.selected\s*\?\s*\(\s*<p className="place-portal__prompt">/);
});
