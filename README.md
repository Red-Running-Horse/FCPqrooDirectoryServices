# FCPqrooDirectoryServices

Spanish-first, bilingual (ES/EN) tourist map for Felipe Carrillo Puerto, Quintana Roo. The map
has no external basemap: it draws the regional highways from `public/regional-highways.geojson`
over a warm cream background, with terracotta roads on a cream casing and dark-brown road labels
that appear once the visitor zooms in. Roads with usable `NOMBRE` values are labelled; blank,
`N/D`, `N/A` and code-like values are skipped. Labels sit on sufficiently straight road
centerline segments and rotate to their direction; short, sharply curved or clipped segments
are left unlabelled. Block-long pieces of the same street are joined into one chain before
placement, and overlapping labels are dropped. Regional roads (`Carretera`, `Camino`, `Enlace`)
are labelled from zoom 11 (`LABEL_MIN_ZOOM`) and town streets from zoom 14
(`STREET_LABEL_MIN_ZOOM`). The QGIS working files remain in the repository root.

- **Road data payload:** `public/regional-highways.geojson` keeps every exported feature, its
  order, its `LineString` geometry and every coordinate, but only the two properties the map
  reads: `NOMBRE` (label text) and `TIPO_VIAL` (label tier). Dropping the other 21 QGIS
  attributes took the published file from 4,428,376 to 1,903,435 bytes (57.0% smaller);
  gzip drops from 590,086 to 372,397 bytes and Brotli from 398,480 to 261,216 bytes. The
  optimized file is committed, so `npm run build` never rewrites it. After exporting a fresh
  GeoJSON from `regional-highways.gpkg`, re-run `npm run optimize:geojson` (or
  `node scripts/optimize-geojson.mjs --check` to verify an existing file); the full attribute
  set stays in the GPKG. `test/regional-highways.test.mjs` guards the feature count, geometry,
  retained properties and the shared endpoints that `mergeRoadSegments` joins.
- **City start:** the map opens on the town of Felipe Carrillo Puerto (`FCP_VIEW_BOUNDS` in
  `app/map-view.mjs`, about 5 km across), not the whole state. Panning is limited to the
  surrounding region (`FCP_MAX_BOUNDS`), so nearby communities stay reachable, and the
  "Volver a Felipe Carrillo Puerto" / "Back to Felipe Carrillo Puerto" button returns to the
  town. Zoom goes up to level 20 for a close road view.
- **Language toggle:** the ES/EN buttons next to the heading switch the heading, instructions,
  legend, filters, reset button and the selected-place panel between Spanish (default) and English.
  UI strings live in `app/i18n.mjs`; attraction names, descriptions and category labels are
  `{ es, en }` objects in `app/attractions.mjs`.
- **Category markers:** each pin combines its category color with an inline SVG icon (leaf,
  stepped structure, bowl, house with bed, compass) from `app/category-icons.mjs`; the same
  icons appear on the filter buttons and in the legend. `categoryIconSvg()` falls back to the
  "all" list icon for unknown categories, and the icons are bundled inline, so no icon package
  or CDN is needed. Entries that are not `status: "verified"` with `locationAccuracy: "exact"`
  keep the dashed approximate border, and the selected-place panel says directions are
  unavailable. A directions link is shown only when an entry has `status: "verified"`,
  `locationAccuracy: "exact"` and an `https://` `directionsUrl`; set those only after confirming
  the real destination and coordinates. The category buttons filter markers locally without a
  server.
- **Selected-place panel:** below the map, `app/place-portal.js` shows a prompt until a marker is
  clicked (or focused and activated with Enter). It then shows the name in both languages,
  category, a status badge (verified / approximate / unavailable), description, address, hours,
  contact details, verification note and last-updated date. Directions, Call, WhatsApp and
  Website buttons appear only when that data exists (directions also require a verified, exact
  location). The content is built by `placePortal()` in `app/place-portal.mjs`.
- **Marker popup:** selecting a marker also opens a small in-map popup with the name, category,
  status badge and a "Ver detalles" / "View details" button that jumps to the panel. The panel
  stays the full details view. The popup summary comes from `placePopup()` in `app/place-portal.mjs`.
- **Place data payload:** the map no longer ships every place record in the JavaScript bundle.
  `app/attractions.mjs` stays the committed source of truth, and `npm run generate:places`
  (`scripts/build-place-data.mjs`) splits it into two static payloads under `public/data/`:
  - `public/data/places-index.json` — one entry per place with only the fields the first paint
    needs (`id`, `category`, `latitude`, `longitude`, `status`, `locationAccuracy`, `name`),
    enough for marker placement and style, category filtering, bilingual search, marker titles
    and the popup summary.
  - `public/data/places/<id>.json` — the remaining fields of one place (descriptions, address,
    hours, contact links, verification metadata, last-updated date), fetched only when that
    place is selected.

  Spreading an index entry over its detail file reproduces the source record exactly, so
  `placePortal()` keeps rendering identical content. `app/place-data.mjs` loads the index on
  startup and each detail on demand, caching the request per place so revisiting a place (or
  reselecting it while it loads) issues only one fetch; a cleared or changed selection stops
  waiting for its result without cancelling that shared request, and a failed request
  shows a bilingual notice under the panel while the index summary (name, category, status)
  stays visible. Ids must be lowercase slugs (`^[a-z0-9][a-z0-9-]*$`) because they become file
  names and URL segments; the generator refuses anything else.

  Effect on the initial download: the page chunk drops from 69,917 to 24,401 bytes (65%
  smaller) and the whole `_next/static` output from 1,164,256 to 1,118,740 bytes, in exchange
  for one 3,031-byte index request (761 bytes gzipped). The 62,963 bytes of detail files are
  only fetched one place at a time (~7 KB each) and only when a visitor opens one.

  The generated files are committed, so `npm run build` never rewrites tracked sources; re-run
  `npm run generate:places` after editing `app/attractions.mjs` (or
  `node scripts/build-place-data.mjs --check` to verify the committed files are current).
  `test/place-data.test.mjs` guards the split, the round-trip back to the source records and
  the lazy-loading behavior.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm test` for the road-label, map-view, attraction, category-icon, marker-popup, place-data, selected-place panel and translation tests.

## Deploy to Hostinger

Run `npm run build` and upload the contents of `out/` to the site's document root (for example,
`public_html/`). This is a static Next.js export: the GeoJSON is included at
`/regional-highways.geojson` and the place payloads at `/data/places-index.json` and
`/data/places/<id>.json`, and no Node.js server, map API token or external tile service is
required, so the map also works without an internet connection. Upload the whole `data/`
directory: a missing detail file leaves its place selectable but without panel details.

To automate the same upload, run the manually triggered
[`Deploy static export to Hostinger`](.github/workflows/deploy-hostinger.yml) workflow, which
builds the export on GitHub and copies the contents of `out/` over SSH. See
[DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md) for the required Hostinger SSH setup and the GitHub
secrets and variables it uses.
