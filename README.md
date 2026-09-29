# FCPqrooDirectoryServices

Spanish-first, bilingual (ES/EN) tourist map for Felipe Carrillo Puerto, Quintana Roo. The map
has no external basemap: it draws the regional highways from `public/regional-highways.geojson`
over a warm cream background, with terracotta roads on a cream casing and dark-brown road labels
that appear once the visitor zooms in. Roads with usable `NOMBRE` values are labelled; blank,
`N/D`, `N/A` and code-like values are skipped. The QGIS working files remain in the repository root.

- **City start:** the map opens on the town of Felipe Carrillo Puerto (`FCP_VIEW_BOUNDS` in
  `app/map-view.mjs`, about 5 km across), not the whole state. Panning is limited to the
  surrounding region (`FCP_MAX_BOUNDS`), so nearby communities stay reachable, and the
  "Volver a Felipe Carrillo Puerto" / "Back to Felipe Carrillo Puerto" button returns to the
  town. Zoom goes up to level 20 for a close road view.
- **Language toggle:** the ES/EN buttons next to the heading switch the heading, instructions,
  legend, filters, reset button and attraction popups between Spanish (default) and English.
  UI strings live in `app/i18n.mjs`; attraction names, descriptions and category labels are
  `{ es, en }` objects in `app/attractions.mjs`.
- **Demo attractions:** the six category-colored pins are **demo placeholders with approximate
  locations**, not verified destinations. They are marked `status: "unverified"` and
  `locationAccuracy: "approximate"`, drawn with a dashed border, labelled "Demo" in both
  languages, and their popups say directions are unavailable. A directions link is shown only
  when an entry has `status: "verified"`, `locationAccuracy: "exact"` and an `https://`
  `directionsUrl`; set those only after confirming the real destination and coordinates. The
  category buttons filter markers locally without a server.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm test` for the road-label, map-view, attraction and translation tests.

## Deploy to Hostinger

Run `npm run build` and upload the contents of `out/` to the site's document root (for example,
`public_html/`). This is a static Next.js export: the GeoJSON is included at
`/regional-highways.geojson`, and no Node.js server, map API token or external tile service is
required, so the map also works without an internet connection.
