import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { labelTier } from "../app/map-view.mjs";
import { mergeRoadSegments, roadLabel } from "../app/road-label.mjs";
import { REQUIRED_PROPERTIES, optimizeGeoJson } from "../scripts/optimize-geojson.mjs";

const source = readFileSync(new URL("../public/regional-highways.geojson", import.meta.url), "utf8");
const data = JSON.parse(source);

test("keeps the collection shape Leaflet loads", () => {
  assert.equal(data.type, "FeatureCollection");
  assert.equal(data.name, "regional-highways");
  assert.equal(data.crs.properties.name, "urn:ogc:def:crs:OGC:1.3:CRS84");
  assert.ok(Array.isArray(data.features));
});

// Counts of the current QGIS export. They guard against features or joins being lost by an
// optimization step; update them deliberately when regional-highways.gpkg is re-exported.
const FEATURE_COUNT = 5114;
const SHARED_ENDPOINTS = 3091;

test("keeps every exported road feature with a drawable LineString", () => {
  assert.equal(data.features.length, FEATURE_COUNT);
  for (const feature of data.features) {
    assert.equal(feature.type, "Feature");
    assert.equal(feature.geometry.type, "LineString");
    assert.ok(feature.geometry.coordinates.length >= 2);
    for (const point of feature.geometry.coordinates) {
      assert.equal(point.length, 2);
      const [lng, lat] = point;
      assert.ok(Number.isFinite(lng) && lng > -90 && lng < -86, String(lng));
      assert.ok(Number.isFinite(lat) && lat > 18 && lat < 22, String(lat));
    }
  }
});

test("keeps only the properties the map and labels read", () => {
  for (const feature of data.features) {
    assert.deepEqual(Object.keys(feature.properties), REQUIRED_PROPERTIES);
    assert.equal(typeof feature.properties.NOMBRE, "string");
    assert.equal(typeof feature.properties.TIPO_VIAL, "string");
  }
  assert.equal(data.features.filter(({ properties }) => roadLabel(properties.NOMBRE)).length > 0, true);
  assert.equal(
    data.features.some(({ properties }) => labelTier(properties.TIPO_VIAL) === "street"),
    true,
  );
  assert.equal(
    data.features.some(({ properties }) => labelTier(properties.TIPO_VIAL) === "highway"),
    true,
  );
});

test("keeps the shared endpoints that join street pieces into labelled chains", () => {
  const key = ([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`;
  const ends = new Map();
  for (const { geometry } of data.features) {
    for (const point of [geometry.coordinates[0], geometry.coordinates.at(-1)]) {
      ends.set(key(point), (ends.get(key(point)) ?? 0) + 1);
    }
  }
  const shared = [...ends.values()].filter((count) => count > 1).length;
  assert.equal(shared, SHARED_ENDPOINTS);

  const segments = data.features
    .map(({ properties, geometry }) => ({
      name: roadLabel(properties.NOMBRE),
      group: labelTier(properties.TIPO_VIAL),
      coordinates: geometry.coordinates,
    }))
    .filter(({ name }) => name);
  const chains = mergeRoadSegments(segments);
  assert.ok(chains.length > 0, "named roads still produce label chains");
  assert.ok(chains.length < segments.length, "pieces still join into longer chains");
  assert.ok(chains[0].coordinates.length > 2);
});

test("stays optimized: re-running the optimizer changes nothing", () => {
  assert.equal(JSON.stringify(optimizeGeoJson(data)), source);
});
