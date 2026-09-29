# FCPqrooDirectoryServices

Spanish-first tourist map for Felipe Carrillo Puerto, Quintana Roo. The map has no external
basemap: it draws the regional highways from `public/regional-highways.geojson` over a warm cream
background, with terracotta roads on a cream casing and dark-brown road labels that appear once the
visitor zooms in. Roads with usable `NOMBRE` values are labelled; blank, `N/D`, `N/A` and
code-like values are skipped. The view opens on the Felipe Carrillo Puerto area and panning is
limited to the surrounding region. The QGIS working files remain in the repository root.
The map supports zoom up to level 20 for a closer road view. Its six category-colored attraction
pins are **demo placeholders**, not verified destinations: their coordinates and details must be
checked before visiting. Edit `app/attractions.mjs` to replace them with verified entries; only
add a directions URL after confirming the destination. The local category buttons filter markers
without a server, and popup directions links appear only for entries with a URL.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm test` for the road-label, map-view and attraction tests.

## Deploy to Hostinger

Run `npm run build` and upload the contents of `out/` to the site's document root (for example,
`public_html/`). This is a static Next.js export: the GeoJSON is included at
`/regional-highways.geojson`, and no Node.js server, map API token or external tile service is
required, so the map also works without an internet connection.
