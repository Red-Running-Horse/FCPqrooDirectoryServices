import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { collectReferencedAssets, hashedName, versionAssets } from "../scripts/version-assets.mjs";

const root = new URL("..", import.meta.url).pathname;

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "asset-versioning-"));
  mkdirSync(join(dir, "app"), { recursive: true });
  mkdirSync(join(dir, "public/img"), { recursive: true });
  mkdirSync(join(dir, "out/img"), { recursive: true });
  return dir;
}

test("asset discovery finds the real referenced public assets", () => {
  const refs = collectReferencedAssets(root);
  assert.ok(refs.includes("/img/fcp-letters.webp"), "hero letters are discovered");
  assert.ok(refs.includes("/promo/selvamorena_1280_720.webp"), "promo banners are discovered");
  assert.ok(refs.every((ref) => ref.startsWith("/") && !ref.includes("..")));
});

test("hashedName is content-addressed and keeps the directory and extension", () => {
  const first = hashedName("/img/fcp-letters.webp", Buffer.from("a"));
  const same = hashedName("/img/fcp-letters.webp", Buffer.from("a"));
  const changed = hashedName("/img/fcp-letters.webp", Buffer.from("b"));
  assert.match(first, /^\/img\/fcp-letters\.[0-9a-f]{8}\.webp$/);
  assert.equal(first, same, "same content → same name");
  assert.notEqual(first, changed, "changed content → new name");
});

test("versionAssets copies the hashed file and rewrites built references", () => {
  const dir = fixture();
  try {
    const content = Buffer.from("fake-webp-bytes");
    writeFileSync(join(dir, "public/img/a.webp"), content);
    writeFileSync(join(dir, "public/img/unreferenced.webp"), content);
    writeFileSync(join(dir, "app/data.mjs"), 'export const banner = "/img/a.webp";\n');
    // The static export: the original asset copy plus built text files.
    writeFileSync(join(dir, "out/img/a.webp"), content);
    writeFileSync(join(dir, "out/index.html"), '<img src="/img/a.webp"><meta property="og:image" content="https://fcpqroo.mx/img/a.webp">');
    writeFileSync(join(dir, "out/app.js"), 'const a="/img/a.webp",b="/img/a.webp";');

    const report = versionAssets({ root: dir, outDir: join(dir, "out") });
    assert.equal(report.length, 1, "only referenced assets are versioned");
    const { assetPath, hashed, rewritten } = report[0];
    assert.equal(assetPath, "/img/a.webp");
    assert.match(hashed, /^\/img\/a\.[0-9a-f]{8}\.webp$/);
    assert.ok(rewritten >= 2, "html and js both rewritten");

    // Hashed file exists next to the untouched original, with identical bytes.
    assert.deepEqual(readFileSync(join(dir, "out", hashed)), content);
    assert.deepEqual(readFileSync(join(dir, "out/img/a.webp")), content, "original export copy stays");

    const html = readFileSync(join(dir, "out/index.html"), "utf8");
    const js = readFileSync(join(dir, "out/app.js"), "utf8");
    assert.ok(!html.includes("/img/a.webp") && html.includes(hashed), "html references rewritten");
    assert.equal((js.match(new RegExp(hashed.replace(/[/.]/g, "\\$&"), "g")) ?? []).length, 2, "every js occurrence rewritten");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("versionAssets fails loudly on a missing referenced asset", () => {
  const dir = fixture();
  try {
    writeFileSync(join(dir, "app/data.mjs"), 'export const banner = "/img/missing.webp";\n');
    assert.throws(() => versionAssets({ root: dir, outDir: join(dir, "out") }), /missing from public/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("versionAssets refuses an asset nobody references", () => {
  const dir = fixture();
  try {
    writeFileSync(join(dir, "public/img/a.webp"), Buffer.from("x"));
    writeFileSync(join(dir, "app/data.mjs"), 'export const banner = "/img/a.webp";\n');
    assert.throws(() => versionAssets({ root: dir, outDir: join(dir, "out") }), /No built file references/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the build pipeline runs asset versioning after the export", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.scripts.build, "next build --webpack && node scripts/version-assets.mjs");
  assert.ok(existsSync(new URL("../scripts/version-assets.mjs", import.meta.url)));
});
