import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { optimizeGeoJson } from "./optimize-geojson.mjs";

// Measured committed file: 1,903,435 bytes. 2,000,000 allows 96,565 bytes (~5%) of growth.
export const MAX_GEOJSON_BYTES = 2_000_000;
const target = new URL("../public/regional-highways.geojson", import.meta.url);

export function checkGeoJson(source, maxBytes = MAX_GEOJSON_BYTES) {
  const errors = [];
  const bytes = Buffer.byteLength(source);
  if (bytes > maxBytes) {
    errors.push(`regional-highways.geojson is ${bytes} bytes, above the ${maxBytes}-byte budget; review the road export and explicitly revise the measured budget if growth is intentional`);
  }

  try {
    const text = source.toString();
    if (text !== JSON.stringify(optimizeGeoJson(JSON.parse(text)))) {
      errors.push("regional-highways.geojson is not optimized; run npm run optimize:geojson after reviewing the road export");
    }
  } catch (error) {
    errors.push(`regional-highways.geojson is invalid GeoJSON JSON (${error.message}); fix the export and run npm run optimize:geojson`);
  }
  return { bytes, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { bytes, errors } = checkGeoJson(readFileSync(target));
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(`GeoJSON budget and optimization passed: ${bytes} / ${MAX_GEOJSON_BYTES} bytes`);
  }
}
