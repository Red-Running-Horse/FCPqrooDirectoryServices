import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import test from "node:test";
import events from "../app/events.mjs";
import { UI_TEXT } from "../app/i18n.mjs";
import {
  eventJsonLd,
  eventMarkerPosition,
  eventStartMs,
  eventVenueView,
  formatEventRange,
  isUpcomingEvent,
  parseCancunDateTime,
  upcomingEvents,
} from "../app/event-utils.mjs";
import { CATEGORIES } from "../app/place-index.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const readApp = (root, relative) => readFileSync(join(root, relative), "utf8");
const places = JSON.parse(read("../public/data/places-index.json"));
const placesById = new Map(places.map((place) => [place.id, place]));

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

test("events data validates: required bilingual fields, venue references, categories", () => {
  const categoryIds = new Set(CATEGORIES.map(({ id }) => id));
  const seen = new Set();
  for (const event of events) {
    assert.match(event.id, /^[a-z0-9][a-z0-9-]*$/, `${event.id}: id must be a safe slug`);
    assert.ok(!seen.has(event.id), `${event.id}: duplicate id`);
    seen.add(event.id);

    for (const language of ["es", "en"]) {
      assert.ok(
        typeof event.title?.[language] === "string" && event.title[language].trim() !== "",
        `${event.id}: title.${language} required`,
      );
      assert.ok(
        typeof event.description?.[language] === "string" && event.description[language].trim() !== "",
        `${event.id}: description.${language} required`,
      );
    }

    assert.ok(eventStartMs(event) !== null, `${event.id}: startAt must parse`);
    if (event.endAt) {
      assert.ok(parseCancunDateTime(event.endAt) !== null, `${event.id}: endAt must parse`);
      assert.ok(parseCancunDateTime(event.endAt) >= eventStartMs(event), `${event.id}: endAt must not precede startAt`);
    }

    assert.ok(event.venue && typeof event.venue === "object", `${event.id}: venue required`);
    if (event.venue.placeId) {
      assert.ok(placesById.has(event.venue.placeId), `${event.id}: venue.placeId must exist in the directory`);
      assert.ok(event.venue.latitude === undefined, `${event.id}: coordinates belong on free-text venues`);
    } else {
      for (const language of ["es", "en"]) {
        assert.ok(
          typeof event.venue.name?.[language] === "string" && event.venue.name[language].trim() !== "",
          `${event.id}: free-text venue needs name.${language}`,
        );
      }
      if (event.venue.latitude !== undefined || event.venue.longitude !== undefined) {
        assert.ok(
          Number.isFinite(event.venue.latitude) && Number.isFinite(event.venue.longitude),
          `${event.id}: venue coordinates must be finite numbers`,
        );
      }
    }

    assert.ok(categoryIds.has(event.category) && event.category !== "all", `${event.id}: category must be a directory category`);
    if (event.cost) {
      assert.ok(typeof event.cost.es === "string" && event.cost.es.trim() !== "", `${event.id}: cost.es`);
    }
  }
});

test("committed events are all still upcoming (no stale records in the data)", () => {
  assert.ok(
    upcomingEvents(events, Date.now()).length === events.length,
    "an event in app/events.mjs has already ended; remove or extend it",
  );
});

test("upcoming/past is decided at runtime on America/Cancun time (UTC-5, no DST)", () => {
  // Offset-less endAt is read as Cancun wall time: 2026-10-11T23:59:59 in Cancun
  // equals 2026-10-12T04:59:59Z. If it were read as UTC it would end hours earlier.
  const event = { id: "x", startAt: "2026-10-10T20:00:00", endAt: "2026-10-11T23:59:59" };
  assert.ok(isUpcomingEvent(event, Date.parse("2026-10-12T04:59:58Z")), "still open a second before close");
  assert.ok(!isUpcomingEvent(event, Date.parse("2026-10-12T05:00:00Z")), "closed once Cancun passes midnight");

  // A legacy whole-day end date means the END of that day in Cancun.
  const legacy = { id: "y", startAt: "2026-10-01T00:00:00-05:00", dateEnd: "2026-10-11" };
  assert.ok(isUpcomingEvent(legacy, Date.parse("2026-10-12T04:59:59Z")));
  assert.ok(!isUpcomingEvent(legacy, Date.parse("2026-10-12T05:00:00Z")));

  // Past events never appear, and sorting follows startAt regardless of input order.
  const sorted = upcomingEvents(
    [
      { id: "later", startAt: "2026-11-01T10:00:00-05:00" },
      { id: "past", startAt: "2025-01-01T09:00:00-05:00", endAt: "2025-01-01T12:00:00-05:00" },
      { id: "sooner", startAt: "2026-10-20T10:00:00-05:00" },
    ],
    Date.parse("2026-10-11T12:00:00Z"),
  );
  assert.deepEqual(sorted.map((event) => event.id), ["sooner", "later"]);
});

test("venue resolution: linked places win; free-text venues only get markers with coordinates", () => {
  const linked = events.find((event) => event.venue?.placeId);
  assert.ok(linked, "fixture: expected a linked-venue event");
  const place = placesById.get(linked.venue.placeId);
  assert.deepEqual(eventMarkerPosition(linked, placesById), [place.latitude, place.longitude]);

  const view = eventVenueView(linked, "es", placesById);
  assert.equal(view.placeId, place.id);
  assert.equal(view.href, `/?lugar=${encodeURIComponent(place.id)}`);

  const freeText = { id: "z", venue: { name: { es: "Un parque", en: "A park" } } };
  assert.equal(eventMarkerPosition(freeText, placesById), null, "no coordinates → no marker");
  assert.equal(eventVenueView(freeText, "en", placesById).href, null);
  assert.equal(eventVenueView(freeText, "en", placesById).name, "A park");

  const withCoords = { id: "w", venue: { name: { es: "Un parque", en: "A park" }, latitude: 19.5, longitude: -88.05 } };
  assert.deepEqual(eventMarkerPosition(withCoords, placesById), [19.5, -88.05]);
});

test("schema.org/Event JSON-LD: name, startDate, endDate, location, description; internal notes never leak", () => {
  const linked = events.find((event) => event.venue?.placeId);
  const data = eventJsonLd(linked, placesById);
  assert.equal(data["@type"], "Event");
  assert.equal(data.name, linked.title.es);
  assert.equal(data.startDate, linked.startAt);
  assert.equal(data.endDate, linked.endAt);
  assert.equal(data.location["@type"], "Place");
  assert.equal(data.location.name, placesById.get(linked.venue.placeId).name.es);
  assert.ok(typeof data.description === "string" && data.description.length > 0);

  const serialized = JSON.stringify(data);
  assert.ok(!serialized.includes("contactNote"), "internal field must not reach JSON-LD");
  for (const event of events) {
    if (event.contactNote) {
      assert.ok(!serialized.includes(event.contactNote), "contactNote must never be rendered");
    }
  }

  const openEnded = eventJsonLd({ id: "open", title: { es: "X" }, startAt: "2026-11-01T10:00:00-05:00", venue: { name: { es: "Y", en: "Y" } } }, placesById);
  assert.ok(!("endDate" in openEnded), "endDate omitted when the event has no endAt");
});

test("event date ranges are formatted bilingually in Cancun wall time", () => {
  const sameDay = { id: "d", startAt: "2026-10-15T18:00:00-05:00", endAt: "2026-10-15T22:00:00-05:00" };
  const es = formatEventRange(sameDay, "es");
  const en = formatEventRange(sameDay, "en");
  assert.match(es, /oct/);
  assert.match(en, /Oct/);
  assert.ok(es.includes("–") && en.includes("–"), "same-day range shows a time span");

  const span = { id: "m", startAt: "2026-10-15T18:00:00-05:00", endAt: "2026-12-31T18:00:00-05:00" };
  assert.ok(formatEventRange(span, "es").includes("–"), "multi-day range shows both dates");

  const startOnly = { id: "s", startAt: "2026-10-15T18:00:00-05:00" };
  assert.ok(!formatEventRange(startOnly, "en").includes("–"), "no endAt → single date and time");
});

test("/eventos filters at runtime and renders expandable entries with JSON-LD", () => {
  const page = read("../app/eventos/page.js");
  assert.match(page, /useEffect\(\(\) => setNow\(new Date\(\)\), \[\]\)/);
  assert.match(page, /upcomingEvents\(events, now\.getTime\(\)\)/, "runtime filtering, not build time");
  assert.match(page, /!now \? \(/, "nothing renders until the browser clock is known");
  assert.match(page, /<details>/, "expandable entries");
  assert.match(page, /application\/ld\+json/);
  assert.match(page, /eventJsonLd\(event, placesById\)/);
  assert.match(page, /Próximamente \/ Coming soon/, "bilingual empty state");
  assert.match(page, /Cargando eventos… \/ Loading events…/);
  assert.ok(!page.includes("contactNote"), "internal note must never render");
});

test("the map events layer reuses the layer-group pattern without touching the scroll-trap markup", () => {
  const map = read("../app/highway-map.js");
  assert.match(map, /const eventLayer = useRef\(null\);/);
  assert.match(map, /upcomingEvents\(events, Date\.now\(\)\)/, "markers are filtered at runtime");
  assert.match(map, /eventMarkerPosition\(event, placesById\)/);
  assert.match(map, /aria-pressed=\{showEvents\}/);
  assert.match(map, /className="category-filters__events"/);

  // The category filter still owns its own group untouched…
  assert.match(map, /current\.group\.clearLayers\(\);/);
  // …and the mobile scroll-trap structure is byte-identical in shape.
  const initialMarkup = map.slice(map.indexOf('      <div className="map-container map-workspace">'));
  assert.match(initialMarkup, /<div className="map-workspace__map">\s*<div className="map-wrapper">\s*<div ref=\{container\} className="map"/);
  assert.match(initialMarkup, /map-mobile-overlay/);
});

test("events UI strings exist in both languages", () => {
  for (const key of ["eventsLayer", "eventPopupWhen", "eventPopupVenue", "eventPopupPlace"]) {
    assert.ok(typeof UI_TEXT.es[key] === "string" && UI_TEXT.es[key].length > 0, `es.${key}`);
    assert.ok(typeof UI_TEXT.en[key] === "string" && UI_TEXT.en[key].length > 0, `en.${key}`);
  }
});

test("/sugerir-evento is unlisted: noindex, no public links, no sitemap entry", () => {
  const page = read("../app/sugerir-evento/page.js");
  assert.match(page, /robots:\s*\{[^}]*index:\s*false[^}]*follow:\s*false/s, "robots metadata must noindex");

  const root = new URL("../app/", import.meta.url).pathname;
  for (const relative of collectSources(".", root)) {
    if (relative.startsWith(`sugerir-evento${sep}`)) continue;
    assert.ok(!readApp(root, relative).includes("/sugerir-evento"), `${relative} must not link /sugerir-evento`);
  }
  assert.ok(!read("../app/sitemap.js").includes("sugerir"), "sitemap must not list the page");
});

test("the submission form posts to the relay or falls back to mailto gracefully", () => {
  const form = read("../app/sugerir-evento/suggest-event-form.js");
  assert.match(form, /process\.env\.NEXT_PUBLIC_EVENT_FORM_ENDPOINT/);
  assert.match(form, /method:\s*"POST"/);
  assert.match(form, /mailto:/);
  assert.match(form, /no está configurado por el momento/, "graceful fallback when the endpoint is unset");
  assert.match(form, /solo después de la revis/i, "thank-you states the review gate");
  for (const name of ["name", "start", "venue", "category", "contact"]) {
    assert.ok(form.includes(`"${name}"`) || form.includes(`name="${name}"`), `form field ${name}`);
  }
});
