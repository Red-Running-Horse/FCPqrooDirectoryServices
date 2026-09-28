# FCPqrooDirectoryServices

Spanish-first map for Felipe Carrillo Puerto, Quintana Roo. The map displays the regional highways from `public/regional-highways.geojson` and labels roads with usable `NOMBRE` values at street-level zoom. The QGIS working files remain in the repository root.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm test` for the road-label filter tests.

## Deploy to Hostinger

Run `npm run build` and upload the contents of `out/` to the site's document root (for example, `public_html/`). This is a static Next.js export: the GeoJSON is included at `/regional-highways.geojson`, and no Node.js server or map API token is required. The OpenStreetMap background tiles require an internet connection.
