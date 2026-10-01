// Splits the committed place records in app/attractions.mjs into the two static payloads the
// client loads: a lightweight marker index and one detail file per place.
//
// This is an opt-in maintenance step (`npm run generate:places`), not part of `npm run build`:
// the generated files are committed, so the build never rewrites tracked sources. Re-run it
// after editing app/attractions.mjs.
//
//   public/data/places-index.json   every mappable place, index fields only (INDEX_FIELDS)
//   public/data/places/<id>.json    the remaining fields of one place (descriptions, address,
//                                   hours, contact, verification metadata, ...)
//
// Spreading an index entry and its detail file reproduces the source record exactly, so
// placePortal(), placePopup(), filtering and translation keep reading the same values.
//
// Usage:
//   node scripts/build-place-data.mjs            rewrite public/data
//   node scripts/build-place-data.mjs --check    report whether the committed files are current

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { attractions } from "../app/attractions.mjs";

// Everything the first paint needs: marker placement and style, filtering, search, marker
// titles and the popup summary. Add a key here only when initial rendering requires it.
export const INDEX_FIELDS = [
  "id",
  "category",
  "secondaryCategories",
  "latitude",
  "longitude",
  "status",
  "locationAccuracy",
  "name",
];

// Ids become file names and URL segments, so keep them to a conservative slug alphabet.
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

export function safePlaceId(id) {
  if (typeof id !== "string" || !SAFE_ID.test(id)) {
    throw new Error(`Unsafe place id: ${JSON.stringify(id)}`);
  }
  return id;
}

export function placeIndexEntry(place) {
  const entry = {};
  for (const key of INDEX_FIELDS) {
    if (key in place) entry[key] = place[key];
  }
  entry.id = safePlaceId(place.id);
  return entry;
}

// Everything the index leaves out, plus the id so a detail file identifies itself.
export function placeDetail(place) {
  const detail = { id: safePlaceId(place.id) };
  for (const [key, value] of Object.entries(place)) {
    if (!INDEX_FIELDS.includes(key)) detail[key] = value;
  }
  return detail;
}

export function buildPlaceData(places) {
  const index = places.map(placeIndexEntry);
  const details = new Map();
  for (const place of places) {
    const id = safePlaceId(place.id);
    if (details.has(id)) throw new Error(`Duplicate place id: ${id}`);
    details.set(id, placeDetail(place));
  }
  return { index, details };
}

const dataDirectory = new URL("../public/data/", import.meta.url);
const placesDirectory = new URL("places/", dataDirectory);
const indexFile = new URL("places-index.json", dataDirectory);

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function detailFile(id) {
  return new URL(`${safePlaceId(id)}.json`, placesDirectory);
}

function read(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function committedDetailNames() {
  try {
    return readdirSync(placesDirectory).filter((name) => name.endsWith(".json")).sort();
  } catch {
    return [];
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { index, details } = buildPlaceData(attractions);
  const expected = new Map([[indexFile, serialize(index)]]);
  for (const [id, detail] of details) expected.set(detailFile(id), serialize(detail));

  if (process.argv.includes("--check")) {
    const stale = [...expected].filter(([file, contents]) => read(file) !== contents);
    const extra = committedDetailNames().filter((name) => !details.has(name.replace(/\.json$/, "")));
    if (stale.length === 0 && extra.length === 0) {
      console.log(`public/data is current (${index.length} places)`);
    } else {
      for (const [file] of stale) console.error(`stale: ${file.pathname}`);
      for (const name of extra) console.error(`unexpected: public/data/places/${name}`);
      console.error("public/data is out of date: run `npm run generate:places`");
      process.exitCode = 1;
    }
  } else {
    mkdirSync(placesDirectory, { recursive: true });
    for (const name of committedDetailNames()) {
      if (!details.has(name.replace(/\.json$/, ""))) rmSync(new URL(name, placesDirectory));
    }
    for (const [file, contents] of expected) writeFileSync(file, contents);
    const indexBytes = Buffer.byteLength(expected.get(indexFile));
    const detailBytes = [...expected]
      .filter(([file]) => file.href !== indexFile.href)
      .reduce((total, [, contents]) => total + Buffer.byteLength(contents), 0);
    console.log(
      `public/data: index ${indexBytes} bytes, ${details.size} detail files ${detailBytes} bytes`,
    );
  }
}
