import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import robots from "../app/robots.js";
import sitemap from "../app/sitemap.js";

test("robots route permits crawling and advertises the canonical host and sitemap", () => {
  assert.deepEqual(robots(), {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    host: "https://fcpqroo.mx",
    sitemap: "https://fcpqroo.mx/sitemap.xml",
  });
});

test("sitemap includes the homepage with useful indexing metadata", () => {
  const [homepage] = sitemap();

  assert.equal(homepage.url, "https://fcpqroo.mx");
  assert.ok(homepage.lastModified instanceof Date);
  assert.equal(homepage.changeFrequency, "weekly");
  assert.equal(homepage.priority, 1);
});

test("root metadata and homepage JSON-LD target Spanish-language SEO", () => {
  const layout = readFileSync(new URL("../app/layout.js", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");

  assert.match(layout, /^import "leaflet\/dist\/leaflet\.css";\nimport "\.\/style\.css";/);
  assert.match(layout, /metadataBase: new URL\("https:\/\/fcpqroo\.mx"\)/);
  assert.match(layout, /canonical: "\/"/);
  assert.match(layout, /locale: "es_MX"/);
  assert.match(layout, /lang="es-MX"/);
  assert.match(layout, /images: \["\/og\/cover\.jpg"\]/);
  assert.match(page, /type="application\/ld\+json"/);
  assert.match(page, /"@graph": \[website, organization\]/);
  assert.match(page, /"@type": "WebSite"/);
  assert.match(page, /about:/);
  assert.match(page, /inLanguage: "es-MX"/);
});

test("homepage JSON-LD carries the Organization node: identity, logo, contactPoint, sameAs", () => {
  const org = readFileSync(new URL("../app/organization.mjs", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");

  assert.match(org, /"@type": "Organization"/);
  assert.match(org, /name: "Directorio de Servicios de Felipe Carrillo Puerto"/);
  assert.match(org, /url: "https:\/\/fcpqroo\.mx"/);
  assert.match(org, /logo: "https:\/\/fcpqroo\.mx\/img\/fcp-letters\.webp"/);
  assert.match(org, /email: "eventos@fcpqroo\.mx"/);
  // contactPoint: WhatsApp number + event mailbox, both languages.
  assert.match(org, /"@type": "ContactPoint"/);
  assert.match(org, /telephone: "\+529841841313"/);
  assert.match(org, /url: "https:\/\/wa\.me\/529841841313"/);
  assert.match(org, /availableLanguage: \["es", "en"\]/);
  // sameAs links only verified official profiles.
  assert.match(org, /sameAs: \["https:\/\/www\.facebook\.com\/fcpqroo\.mx"\]/);
  // The homepage renders the shared node inside its @graph.
  assert.match(page, /import organization from "\.\/organization\.mjs"/);
  assert.match(page, /publisher: \{ "@id": "https:\/\/fcpqroo\.mx\/#organization" \}/);
});

test("/contacto renders bilingual actions, the privacy notice, and a machine-readable ContactPoint", () => {
  const page = readFileSync(new URL("../app/contacto/page.js", import.meta.url), "utf8");

  assert.match(page, /href="https:\/\/wa\.me\/529841841313"/);
  assert.match(page, /href="mailto:eventos@fcpqroo\.mx"/);
  assert.match(page, /target="_blank" rel="noopener noreferrer"/);
  // Bilingual gating on the visible copy (privacy notice included).
  assert.match(page, /className="l10n-es"/);
  assert.match(page, /className="l10n-en"/);
  assert.match(page, /Aviso de privacidad/);
  assert.match(page, /Privacy notice/);
  assert.match(page, /Nunca se publican ni se comparten con\s*terceros\./);
  assert.match(page, /never published or shared with third parties\./);
  // The page's JSON-LD reuses the shared Organization (ContactPoint node).
  assert.match(page, /import organization from "\.\.\/organization\.mjs"/);
  assert.match(page, /type="application\/ld\+json"/);
  assert.match(page, /\.\.\.organization/);
  // Listed: nav + sitemap. The unlisted submission page gets no link here.
  assert.equal(page.indexOf("/sugerir-evento"), -1, "no link to the unlisted form");
});

test("/contacto is linked from the site nav and the sitemap", () => {
  const header = readFileSync(new URL("../app/site-header.js", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../app/sitemap.js", import.meta.url), "utf8");

  assert.match(header, /\{ href: "\/contacto", label: "Contacto"/);
  assert.match(sitemap, /page\("\/contacto", 0\.5\)/);
});

test("llms.txt is a well-formed, concise agent table of contents", () => {
  const llms = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");

  assert.match(llms, /^# Directorio de Servicios de Felipe Carrillo Puerto\n/);
  assert.match(llms, /^> /m, "blockquote summary right under the H1 (llmstxt.org)");
  assert.match(llms, /^## Directorio$/m);
  assert.match(llms, /^## Eventos y calendario anual$/m);
  assert.match(llms, /^## Guía del visitante$/m);
  assert.match(llms, /^## Idioma \/ Language$/m);
  assert.match(llms, /\(https:\/\/fcpqroo\.mx\/eventos\)/, "points to /eventos");
  assert.match(llms, /\(https:\/\/fcpqroo\.mx\/guia\)/, "points to /guia");
  assert.match(llms, /#calendario-anual/, "annual-calendar anchor target exists");
  assert.match(llms, /español primero|Spanish-primary/i, "states the language policy");
  assert.ok(llms.split("\n").length <= 30, "concise — a table of contents, not a sitemap");
  assert.equal(llms.indexOf("sugerir-evento"), -1, "unlisted pages stay out of llms.txt");
});

test("sugerir-evento stays unlisted: no public link from nav, sitemap, or llms.txt", () => {
  const header = readFileSync(new URL("../app/site-header.js", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../app/sitemap.js", import.meta.url), "utf8");
  const llms = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");
  const contacto = readFileSync(new URL("../app/contacto/page.js", import.meta.url), "utf8");

  for (const [name, source] of [
    ["site-header", header],
    ["sitemap", sitemap],
    ["llms.txt", llms],
    ["contacto", contacto],
  ]) {
    assert.equal(source.indexOf("sugerir-evento"), -1, `no link to /sugerir-evento in ${name}`);
  }
});
