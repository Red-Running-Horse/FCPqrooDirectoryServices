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

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm test` for the road-label, map-view, attraction, category-icon, marker-popup, selected-place panel and translation tests.

## Deploy to Hostinger

Run `npm run build` and upload the contents of `out/` to the site's document root (for example,
`public_html/`). This is a static Next.js export: the GeoJSON is included at
`/regional-highways.geojson`, and no Node.js server, map API token or external tile service is
required, so the map also works without an internet connection.
