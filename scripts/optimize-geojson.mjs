// Shrinks the published road data by keeping only the feature properties the map reads.
//
// This is an opt-in maintenance step (`npm run optimize:geojson`), not part of `npm run build`:
// the optimized file is committed, so the build never rewrites the source. Re-run it after
// exporting a fresh GeoJSON from the QGIS working files in the repository root.
//
// Nothing else changes: the collection shape (`type`, `name`, `crs`), every feature, the feature
// order, the geometry type and every coordinate value are preserved. The dropped attributes
// (fid, ID_RED, CODIGO, LONGITUD, ...) stay in regional-highways.gpkg.
//
// Usage:
//   node scripts/optimize-geojson.mjs            rewrite public/regional-highways.geojson
//   node scripts/optimize-geojson.mjs --check    report whether it is already optimized

import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// app/highway-map.js reads only these two feature properties: NOMBRE, passed to roadLabel()
// in app/road-label.mjs for the label text, and TIPO_VIAL, passed to labelTier() in
// app/map-view.mjs for the label tier. Add a key here before a consumer starts using it.
export const REQUIRED_PROPERTIES = ["TIPO_VIAL", "NOMBRE"];

export function optimizeGeoJson(collection) {
  return {
    ...collection,
    features: collection.features.map((feature) => {
      const properties = {};
      for (const key of REQUIRED_PROPERTIES) {
        if (feature.properties && key in feature.properties) properties[key] = feature.properties[key];
      }
      return { ...feature, properties };
    }),
  };
}

const target = new URL("../public/regional-highways.geojson", import.meta.url);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const before = readFileSync(target, "utf8");
  const after = JSON.stringify(optimizeGeoJson(JSON.parse(before)));
  const beforeBytes = Buffer.byteLength(before);
  const afterBytes = Buffer.byteLength(after);
  const saved = beforeBytes - afterBytes;
  const report = `${beforeBytes} -> ${afterBytes} bytes (${((saved / beforeBytes) * 100).toFixed(1)}% smaller)`;

  if (process.argv.includes("--check")) {
    if (before === after) {
      console.log(`public/regional-highways.geojson is already optimized (${afterBytes} bytes)`);
    } else {
      console.error(`public/regional-highways.geojson is not optimized: ${report}`);
      process.exitCode = 1;
    }
  } else {
    writeFileSync(target, after);
    console.log(`public/regional-highways.geojson: ${report}`);
  }
}
