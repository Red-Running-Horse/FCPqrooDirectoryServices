import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { GUIDE_DATA } from "../app/guide-data.mjs";
import {
  getGuideMetadata,
  getGuideSections,
  getPdfAsset,
  guideOfflineResources,
  localizeGuide,
} from "../app/tourist-guide.mjs";
import sitemap from "../app/sitemap.js";

test("guide data exports required metadata, disclaimer, and attribution", () => {
  const meta = getGuideMetadata(GUIDE_DATA);

  assert.ok(meta, "guide must have metadata");
  assert.equal(typeof meta.sourceTitle, "string");
  assert.equal(typeof meta.sourceAuthor, "string");
  assert.equal(typeof meta.lastReviewed, "string");
  assert.match(meta.lastReviewed, /^\d{4}-\d{2}/, "lastReviewed should have YYYY-MM format");

  assert.ok(meta.sourceMetadataNote.es && meta.sourceMetadataNote.en);
  assert.match(meta.sourceMetadataNote.en, /Tzolkin Homes/i);

  assert.ok(meta.officialDisclaimer.es && meta.officialDisclaimer.en);
  assert.match(meta.officialDisclaimer.en, /not constitute legal/i);

  assert.equal(
    meta.sourceUrl,
    "https://tzolkin-homes1.notion.site/Mexico-Practical-Relocation-Preparation-Guide-For-Entry-Rivera-Maya-5bd4e3a7710c408b90cc5c2651fcbbd7?source=copy_link",
  );
  assert.equal(meta.pdfAsset, null, "pdfAsset defaults to null until user provides asset");
});

test("guide sections have complete, bilingual, well-formed entries", () => {
  const sections = getGuideSections(GUIDE_DATA);
  assert.ok(Array.isArray(sections));
  assert.ok(sections.length >= 6, "guide should cover entry, documents, transport, money, connectivity, health/safety, etiquette");

  const sectionIds = new Set();

  for (const section of sections) {
    assert.ok(section.id, "section must have an id");
    assert.ok(!sectionIds.has(section.id), `section id "${section.id}" must be unique`);
    sectionIds.add(section.id);

    assert.ok(section.title.es && section.title.en, `section ${section.id} must have bilingual title`);
    assert.ok(section.summary.es && section.summary.en, `section ${section.id} must have bilingual summary`);
    assert.ok(Array.isArray(section.items) && section.items.length > 0, `section ${section.id} must have items`);

    for (const item of section.items) {
      assert.ok(item.title.es && item.title.en, `item must have bilingual title`);
      assert.ok(item.body.es && item.body.en, `item must have bilingual body`);

      if (item.officialLink) {
        assert.match(item.officialLink.url, /^https:\/\//, `official source must be https`);
        assert.ok(item.officialLink.label.es && item.officialLink.label.en);
      }
    }
  }
});

test("localizeGuide handles requested languages and falls back gracefully", () => {
  const localizedEs = localizeGuide(GUIDE_DATA, "es");
  const localizedEn = localizeGuide(GUIDE_DATA, "en");
  const fallback = localizeGuide(GUIDE_DATA, "de");

  assert.equal(localizedEs.metadata.sourceTitle, GUIDE_DATA.metadata.sourceTitle);
  assert.equal(localizedEn.metadata.sourceTitle, GUIDE_DATA.metadata.sourceTitle);
  assert.equal(fallback.metadata.sourceMetadataNote, GUIDE_DATA.metadata.sourceMetadataNote.es, "unsupported language falls back to Spanish");

  // Fallback when an English string is missing
  const partialGuide = {
    metadata: {
      sourceTitle: "Título",
      sourceMetadataNote: { es: "Nota de fuente" },
      officialDisclaimer: { es: "Aviso legal", en: "Disclaimer" },
      lastReviewed: "2026-10",
      sourceUrl: "https://notion.so/test",
      pdfAsset: null,
    },
    sections: [
      {
        id: "test-sec",
        title: { es: "Sección" },
        summary: { es: "Resumen" },
        items: [
          {
            title: { es: "Elemento" },
            body: { es: "Contenido" },
          },
        ],
      },
    ],
  };

  const localizedPartial = localizeGuide(partialGuide, "en");
  assert.equal(localizedPartial.metadata.sourceMetadataNote, "Nota de fuente", "missing en note falls back to es");
  assert.equal(localizedPartial.sections[0].title, "Sección", "missing en section title falls back to es");
  assert.equal(localizedPartial.sections[0].items[0].title, "Elemento", "missing en item title falls back to es");
});

test("PDF asset resolver detects null, local, and external assets safely", () => {
  assert.equal(getPdfAsset(GUIDE_DATA), null);
  assert.equal(getPdfAsset({ metadata: { pdfAsset: null } }), null);
  assert.equal(getPdfAsset({ metadata: { pdfAsset: "" } }), null);
  assert.equal(getPdfAsset({ metadata: { pdfAsset: "   " } }), null);
  assert.equal(getPdfAsset({ metadata: { pdfAsset: "javascript:alert(1)" } }), null);
  assert.equal(getPdfAsset({ metadata: { pdfAsset: "/downloads/mexico-guide.pdf" } }), "/downloads/mexico-guide.pdf");
  assert.equal(getPdfAsset({ metadata: { pdfAsset: "https://example.com/guide.pdf" } }), "https://example.com/guide.pdf");
});

test("offline manifest includes local guide data and excludes external URLs", () => {
  const offlineResources = guideOfflineResources(GUIDE_DATA);

  assert.deepEqual(offlineResources, ["/data/tourist-guide.json"]);
  assert.ok(!offlineResources.some((url) => url.includes("notion.site")), "must not cache external Notion URLs");
  assert.ok(!offlineResources.some((url) => url.startsWith("http:") || url.startsWith("https:")), "offline manifest must contain only local paths");

  // With a local PDF configured
  const guideWithLocalPdf = {
    ...GUIDE_DATA,
    metadata: {
      ...GUIDE_DATA.metadata,
      pdfAsset: "/downloads/mexico-guide.pdf",
    },
  };
  assert.deepEqual(guideOfflineResources(guideWithLocalPdf), [
    "/data/tourist-guide.json",
    "/downloads/mexico-guide.pdf",
  ]);

  // With an external PDF configured
  const guideWithExternalPdf = {
    ...GUIDE_DATA,
    metadata: {
      ...GUIDE_DATA.metadata,
      pdfAsset: "https://external.com/guide.pdf",
    },
  };
  assert.deepEqual(guideOfflineResources(guideWithExternalPdf), ["/data/tourist-guide.json"]);
});

test("committed static public/data/tourist-guide.json matches GUIDE_DATA", () => {
  const staticPath = new URL("../public/data/tourist-guide.json", import.meta.url);
  assert.ok(existsSync(staticPath), "public/data/tourist-guide.json must exist");

  const raw = readFileSync(staticPath, "utf8");
  const parsed = JSON.parse(raw);
  assert.deepEqual(parsed, GUIDE_DATA);
});

test("sitemap includes /guide route while keeping homepage first", () => {
  const entries = sitemap();
  const [homepage, guideEntry] = entries;

  assert.equal(homepage.url, "https://fcpqroo.mx");
  assert.equal(homepage.priority, 1);

  assert.ok(guideEntry, "sitemap should contain guide entry");
  assert.equal(guideEntry.url, "https://fcpqroo.mx/guide");
  assert.equal(guideEntry.changeFrequency, "weekly");
  assert.equal(guideEntry.priority, 0.8);
});
