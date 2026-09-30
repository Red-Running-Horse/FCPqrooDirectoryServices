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
  assert.match(page, /"@type": "TouristInformationCenter"/);
  assert.match(page, /areaServed:/);
  assert.match(page, /inLanguage: "es-MX"/);
});
