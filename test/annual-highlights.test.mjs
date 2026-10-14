import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import test from "node:test";
import annualHighlights from "../app/annual-highlights.mjs";
import { UI_TEXT } from "../app/i18n.mjs";
import { CATEGORIES } from "../app/place-index.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const readApp = (root, relative) => readFileSync(join(root, relative), "utf8");

function collectSources(dir, root, acc = []) {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const relative = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      collectSources(relative, root, acc);
    } else if (/\.(js|mjs)$/.test(entry.name)) {
      acc.push(relative);
    }
  }
  return acc;
}

test("annual highlights data validates: bilingual fields, slug ids, valid categories", () => {
  const categoryIds = new Set(CATEGORIES.map(({ id }) => id));
  const seen = new Set();
  const allowedKeys = new Set(["id", "title", "window", "description", "category", "sourceUrl"]);
  assert.equal(annualHighlights.length, 3, "v1 seeds exactly the three documented recurrences");

  for (const item of annualHighlights) {
    assert.match(item.id, /^[a-z0-9][a-z0-9-]*$/, `${item.id}: id must be a safe slug`);
    assert.ok(!seen.has(item.id), `${item.id}: duplicate id`);
    seen.add(item.id);

    // v2 pipeline discipline: records are plain data in exactly this shape.
    for (const key of Object.keys(item)) {
      assert.ok(allowedKeys.has(key), `${item.id}: unexpected key "${key}" — extend the schema deliberately`);
    }

    for (const field of ["title", "window", "description"]) {
      for (const language of ["es", "en"]) {
        assert.ok(
          typeof item[field]?.[language] === "string" && item[field][language].trim() !== "",
          `${item.id}: ${field}.${language} required`,
        );
      }
    }

    assert.ok(categoryIds.has(item.category) && item.category !== "all", `${item.id}: category must be a directory category`);
    if (item.sourceUrl !== undefined) {
      assert.match(item.sourceUrl, /^https:\/\//, `${item.id}: sourceUrl must be https`);
    }
  }
});

test("annual highlights carry NO parseable dates — no startAt/endAt anywhere", () => {
  const source = read("../app/annual-highlights.mjs");
  assert.doesNotMatch(source, /\bstartAt\b|\bendAt\b|\bdateStart\b|\bdateEnd\b/, "no event date keys");
  assert.doesNotMatch(source, /\d{4}-\d{2}-\d{2}/, "no ISO calendar dates");
  assert.doesNotMatch(source, /T\d{2}:\d{2}/, "no ISO datetimes");
  for (const item of annualHighlights) {
    for (const field of ["title", "window", "description"]) {
      for (const language of ["es", "en"]) {
        assert.doesNotMatch(
          item[field][language],
          /\d{4}-\d{2}-\d{2}|T\d{2}:\d{2}/,
          `${item.id}: ${field}.${language} must contain no ISO date`,
        );
      }
    }
  }
});

test("the three seeded recurrences are present with the documented sources", () => {
  assert.deepEqual(
    annualHighlights.map((item) => item.id).sort(),
    ["carnaval-fcp", "dia-de-muertos", "festival-xtaabay"],
  );
  const carnaval = annualHighlights.find((item) => item.id === "carnaval-fcp");
  assert.equal(carnaval.sourceUrl, "https://siturq.gob.mx/eventos");
});

test("/eventos renders the annual highlights section after the upcoming list", () => {
  const page = read("../app/eventos/page.js");

  assert.match(page, /import annualHighlights from "\.\.\/annual-highlights\.mjs";/, "dataset imported");
  assert.match(page, /aria-label=\{UI_TEXT\.es\.annualHighlightsHeading\}/, "section labelled by the heading key");
  assert.match(page, /\{UI_TEXT\.es\.annualHighlightsHeading\}\s*<\/h2>/, "heading renders from the i18n key");
  assert.match(page, /\{annualHighlights\.map\(\(item\) => \(/, "one card per entry");
  assert.match(
    page,
    /fontSize: "0\.85rem", fontWeight: 700, color: "var\(--terracotta\)"/,
    "window matches the upcoming list's terracotta <time> styling",
  );

  // Section placement: after the upcoming-events section, before </main>.
  const upcomingSection = page.indexOf('aria-label="Próximos eventos / Upcoming events"');
  const highlights = page.indexOf("aria-label={UI_TEXT.es.annualHighlightsHeading}");
  assert.ok(upcomingSection > -1 && upcomingSection < highlights, "after the upcoming-events list");
  assert.ok(page.indexOf("</main>") > highlights, "inside the page main");

  // Static rendering choice: the section sits outside the runtime "now" gate
  // (it has no dates to filter and can never be past).
  const sectionBody = page.slice(highlights);
  assert.doesNotMatch(sectionBody, /\bnow\b/, "highlights never consult the runtime clock");
  assert.doesNotMatch(sectionBody, /application\/ld\+json/, "no JSON-LD on undated recurrences");
  assert.doesNotMatch(sectionBody, /formatEventRange|upcomingEvents/, "no dated-event plumbing");
});

test("the heading exists in both languages with the exact inline-bilingual text", () => {
  assert.equal(UI_TEXT.es.annualHighlightsHeading, "Eventos que vuelven cada año / Annual highlights");
  assert.equal(UI_TEXT.en.annualHighlightsHeading, "Eventos que vuelven cada año / Annual highlights");
});

test("annual highlights never reach the strip, the map, JSON-LD, or events.mjs", () => {
  const root = new URL("../app/", import.meta.url).pathname;
  const allowed = new Set(["annual-highlights.mjs", join("eventos", "page.js")]);
  for (const relative of collectSources(".", root)) {
    if (allowed.has(relative)) continue;
    assert.ok(
      !readApp(root, relative).includes("annual-highlights"),
      `${relative} must not touch the annual highlights dataset`,
    );
  }
  // events.mjs stays separate — pin it explicitly by name too.
  assert.doesNotMatch(read("../app/events.mjs"), /annual/, "events.mjs never imports the highlights file");
});
