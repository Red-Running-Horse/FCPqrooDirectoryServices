import assert from "node:assert/strict";
import { closeSync, existsSync, openSync, readFileSync, readSync } from "node:fs";
import test from "node:test";

// /guia contract — bilingual by design ("el español guía"): Spanish renders as
// the primary copy, English as a clearly secondary muted span (.guide-es /
// .guide-en); place mentions deep-link into the map (/?lugar=<place-id>);
// external links sanitize; images are lazy, rounded, bilingual-alt.
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const page = read("../app/guia/page.js");
const theme = read("../app/maya-theme.css");

test("bilingual differentiation: ES primary, EN muted secondary in its own span", () => {
  // Every language span carries its class and lang attribute.
  assert.match(page, /const Es = \(\{ children \}\) => <span className="guide-es" lang="es">/, "ES span component");
  assert.match(page, /const En = \(\{ children \}\) => <span className="guide-en" lang="en">/, "EN span component");

  // The muted treatment: charcoal-soft, ~88% size, compact leading.
  const en = theme.match(/\.guide-en\s*\{([^}]*)\}/)?.[1];
  assert.ok(en, ".guide-en rule exists");
  assert.match(en, /color:\s*var\(--charcoal-soft\)/, "EN reads muted");
  assert.match(en, /font-size:\s*0\.8[0-9]em/, "EN ~85–90% of the ES size");
  assert.match(en, /line-height:\s*1\.5/, "compact leading");
  const es = theme.match(/\.guide-es\s*\{([^}]*)\}/)?.[1];
  assert.match(es, /color:\s*var\(--charcoal\)/, "ES stays charcoal, full size");

  // EN appears throughout the copy — headings, paragraphs, captions.
  const enUses = (page.match(/<En>/g) ?? []).length;
  assert.ok(enUses >= 15, `structured EN segments across the guide (found ${enUses})`);

  // The old mashed "ES / EN" single-paragraph pattern is gone: headings no
  // longer join both languages with " / " inside one text node.
  assert.doesNotMatch(page, /\?\s*\/\s*Why visit/, "no more slash-mashed headings");
});

test("place mentions deep-link into the map with verified ids", () => {
  const ids = [
    "mercado-felipe-carrillo-puerto",
    "el-tekaxeno-mercado-fcp",
    "restaurante-epico",
    "selva-morena",
    "casa-saastal",
    "hotel-tihosuco-colonial",
  ];
  for (const id of ids) {
    assert.ok(page.includes(`{placeLink("${id}",`), `${id} deep link wired`);
  }
  const deepLinks = page.match(/\/?\?lugar=\$\{id\}/g) ?? [];
  assert.equal(deepLinks.length, 1, "one placeLink helper builds all deep links");
});

test("external links are sanitized (new tab, noopener) and internal ones same-tab", () => {
  const externals = page.match(/<a\s+href="https?:\/\/[^>]*>/g) ?? [];
  assert.ok(externals.length >= 2, "Booking + Selva Morena site links");
  for (const tag of externals) {
    assert.match(tag, /target="_blank"/, `${tag} opens a new tab`);
    assert.match(tag, /rel="noopener noreferrer"/, `${tag} drops the opener`);
  }
  const internals = page.match(/<a\s+href="\/[^"]*"[^>]*>/g) ?? [];
  assert.ok(internals.length >= 2, "back link + /eventos stay in the tab");
  for (const tag of internals) {
    assert.doesNotMatch(tag, /target="_blank"/, `${tag} internal links stay in the tab`);
  }
});

// Minimal WebP dimension reader (VP8 / VP8L / VP8X), no dependencies.
function webpSize(url) {
  const fd = openSync(url);
  try {
    const head = Buffer.alloc(64);
    readSync(fd, head, 0, 64, 0);
    assert.equal(head.toString("latin1", 0, 4), "RIFF", "RIFF container");
    assert.equal(head.toString("latin1", 8, 12), "WEBP", "WebP payload");
    const fourcc = head.toString("latin1", 12, 16);
    if (fourcc === "VP8X") {
      return {
        width: 1 + (head[24] | (head[25] << 8) | (head[26] << 16)),
        height: 1 + (head[27] | (head[28] << 8) | (head[29] << 16)),
      };
    }
    if (fourcc === "VP8 ") {
      return { width: head[26] | ((head[27] & 0x3f) << 8), height: head[28] | ((head[29] & 0x3f) << 8) };
    }
    if (fourcc === "VP8L") {
      const bits = head.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    throw new Error(`unknown webp chunk ${fourcc}`);
  } finally {
    closeSync(fd);
  }
}

test("guide images: lazy, sized, bilingual alt, rounded like the cards, on disk", () => {
  const imgs = page.match(/<img[\s\S]*?\/>/g) ?? [];
  const guideImgs = imgs.filter((tag) => tag.includes('src="/img/guia/'));
  assert.equal(guideImgs.length, 2, "exactly two tasteful additions (max 3)");

  const figure = theme.match(/\.guide-figure img\s*\{([^}]*)\}/)?.[1];
  assert.match(figure, /border-radius:\s*var\(--radius-card\)/, "corners match the cards");
  assert.doesNotMatch(page, /<img(?:(?!\/>)[\s\S])*?(selva_morena|FCP_events_places)/, "sources come from public/img/guia, not the repo folders");

  for (const tag of guideImgs) {
    assert.match(tag, /loading="lazy"/, "lazy-loaded");
    assert.match(tag, /decoding="async"/);
    assert.match(tag, /alt="[^"]* \/ [^"]*"/, "bilingual alt text (ES / EN)");
    const src = tag.match(/src="(\/img\/guia\/[^"]+)"/)?.[1];
    assert.ok(src, "img has a guia src");
    assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), `${src} exists on disk`);
    const width = Number(tag.match(/width=\{(\d+)\}/)?.[1]);
    const height = Number(tag.match(/height=\{(\d+)\}/)?.[1]);
    const actual = webpSize(new URL(`../public${src}`, import.meta.url));
    assert.equal(width, actual.width, `${src} width attr matches the file`);
    assert.equal(height, actual.height, `${src} height attr matches the file`);
    assert.ok(actual.width <= 1200, `${src} ~1200px wide or narrower`);
  }
});

test("one toggle site-wide, owned by the layout-level provider; <html lang> contract intact", () => {
  const language = read("../app/site-language.js");
  const layout = read("../app/layout.js");
  const header = read("../app/site-header.js");
  const map = read("../app/highway-map.js");

  // Single source: the toggle markup string appears exactly once in app source.
  for (const source of [page, header, map, layout]) {
    assert.doesNotMatch(source, /className="language-toggle"/, "no toggle markup outside site-language.js");
  }
  assert.equal((language.match(/className="language-toggle"/g) ?? []).length, 1, "exactly one toggle component");

  // Provider lifts state to the layout level and publishes on <html lang>.
  assert.match(layout, /<SiteLanguageProvider>/, "layout wraps the site in the provider");
  assert.match(language, /export function SiteLanguageProvider\(\{ children \}\)/);
  assert.match(language, /document\.documentElement\.lang = language;/, "<html lang> stays the publication channel");
  assert.match(language, /export function useSiteLanguage\(\)/, "the follower hook survives untouched");

  // The map follows the provider (no local state, no own toggle) and still
  // mirrors the language for its imperative Leaflet code.
  assert.match(map, /const \{ language \} = useSiteLanguageState\(\)/, "map consumes the shared state");
  assert.match(map, /selectedLanguage\.current = language;/, "imperative mirror kept in sync");
});
