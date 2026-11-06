// Post-build asset versioning for the static export.
//
// Why not import images through the bundler (the standard Next mechanism)?
// app/events.mjs — the data records that reference the promo banners — is
// imported directly by the node --test suite, and Node cannot resolve `.webp`
// imports. Keeping the data module environment-agnostic is a hard constraint,
// so versioning happens here, after `next build`:
//
//   1. discover public/ assets referenced from app source ("/promo/…", "/img/…",
//      "/og/…" string literals in data records and code),
//   2. copy each to "<name>.<content-hash><ext>" next to the original in out/,
//   3. rewrite the logical references to the hashed URL in every built text
//      file (SSR'd HTML, JS chunks, JSON).
//
// A changed image at the same logical name gets a new URL, so service workers
// and browser caches never serve the stale copy. In dev (no build step) the
// logical paths keep working untouched.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ASSET_REF = /\/(?:promo|img|og|social)\/[A-Za-z0-9._-]+\.(?:webp|png|jpe?g)/g;
const SOURCE_DIRS = ["app"];
const TEXT_EXT = new Set([".html", ".js", ".css", ".json", ".txt", ".xml", ".webmanifest"]);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

// Public asset paths referenced from app source (data records + code), sorted
// for deterministic builds. A reference that resolves to no file on disk is a
// broken record and fails loudly in versionAssets, not here.
export function collectReferencedAssets(root) {
  const refs = new Set();
  for (const dir of SOURCE_DIRS) {
    const absolute = join(root, dir);
    if (!existsSync(absolute)) continue;
    for (const file of walk(absolute)) {
      if (!/\.(?:mjs|js)$/.test(file)) continue;
      for (const match of readFileSync(file, "utf8").matchAll(ASSET_REF)) refs.add(match[0]);
    }
  }
  return [...refs].sort();
}

export function hashedName(assetPath, content) {
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 8);
  const ext = extname(assetPath);
  const base = assetPath.slice(assetPath.lastIndexOf("/") + 1, -ext.length);
  return `${dirname(assetPath)}/${base}.${hash}${ext}`;
}

// Hashes and rewrites one build. Returns [{ assetPath, hashed, rewritten }] —
// one entry per referenced asset. Throws when a referenced asset is missing
// from public/ or when no built file references it.
export function versionAssets({ root, outDir }) {
  const report = [];
  for (const assetPath of collectReferencedAssets(root)) {
    const source = join(root, "public", assetPath);
    if (!existsSync(source)) {
      throw new Error(`Referenced asset missing from public/: ${assetPath}`);
    }
    const hashed = hashedName(assetPath, readFileSync(source));
    const target = join(outDir, hashed);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);

    let rewritten = 0;
    let alreadyHashed = 0;
    for (const file of walk(outDir)) {
      if (!TEXT_EXT.has(extname(file))) continue;
      const text = readFileSync(file, "utf8");
      if (text.includes(assetPath)) {
        writeFileSync(file, text.split(assetPath).join(hashed));
        rewritten += 1;
      } else if (text.includes(hashed)) {
        alreadyHashed += 1;
      }
    }
    if (rewritten === 0 && alreadyHashed === 0) {
      throw new Error(`No built file references ${assetPath}; refusing to ship an unreferenced hashed copy`);
    }
    report.push({ assetPath, hashed, rewritten });
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const report = versionAssets({ root, outDir: join(root, "out") });
  for (const { assetPath, hashed, rewritten } of report) {
    console.log(`${assetPath} -> ${hashed} (${rewritten} built files rewritten)`);
  }
  console.log(`asset versioning: ${report.length} assets`);
}
