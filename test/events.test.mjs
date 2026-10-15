import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import test from "node:test";
import events from "../app/events.mjs";
import { UI_TEXT } from "../app/i18n.mjs";
import {
  entryKind,
  eventChipDate,
  eventJsonLd,
  eventMarkerPosition,
  eventStartMs,
  eventVenueView,
  formatEventRange,
  isUpcomingEvent,
  parseCancunDateTime,
  premiumPromotions,
  promotedEvents,
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

    assert.ok(
      ["event", "offer"].includes(event.kind ?? "event"),
      `${event.id}: kind must be "event" or "offer" (absent kind validates as "event")`,
    );

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

test("kind separates events from offers; missing kind validates as event", () => {
  assert.equal(entryKind({ id: "x" }), "event", "absent kind defaults to event");
  assert.equal(entryKind({ id: "x", kind: "offer" }), "offer");
  assert.equal(entryKind({ id: "x", kind: "event" }), "event");

  const byId = new Map(events.map((event) => [event.id, event]));
  for (const id of ["promo-balam-nah", "test-partner-uno", "test-partner-dos"]) {
    assert.equal(byId.get(id).kind, "offer", `${id} is an offer, not an event`);
  }
  assert.equal(byId.get("test-2").promoted, undefined, "test-2 is un-promoted: a normal upcoming event");
  assert.equal(entryKind(byId.get("test-2")), "event", "test-2 stays a plain EVENT (default kind)");
});

test("committed EVENTS are all still upcoming (offers have campaign windows and are exempt)", () => {
  const eventRecords = events.filter((event) => entryKind(event) === "event");
  assert.ok(
    upcomingEvents(eventRecords, Date.now()).length === eventRecords.length,
    "an event in app/events.mjs has already ended; remove or extend it",
  );
  // Offers only need a parseable startAt (their campaign window start);
  // their window may already have ended without tripping the event hygiene.
  for (const offer of events.filter((event) => entryKind(event) === "offer")) {
    assert.ok(eventStartMs(offer) !== null, `${offer.id}: offers still need startAt to parse`);
  }
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
  // JSON-LD is emitted for kind === "event" only — fixture must be an event.
  const linked = events.find(
    (event) => event.venue?.placeId && entryKind(event) === "event",
  );
  assert.ok(linked, "fixture: expected a linked-venue EVENT");
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

test("/eventos filters at runtime, includes PROMOTED events and never offers, with JSON-LD for events only", () => {
  const page = read("../app/eventos/page.js");
  assert.match(page, /useEffect\(\(\) => setNow\(new Date\(\)\), \[\]\)/);
  assert.match(page, /upcomingEvents\(events, now\.getTime\(\)\)/, "runtime filtering, not build time");
  assert.match(page, /!now \? \(/, "nothing renders until the browser clock is known");
  assert.match(page, /entryKind\(ev\) === "event"/, "listing is events only — offers never appear");
  assert.doesNotMatch(page, /!ev\.promoted/, "promoted EVENTS belong in the listing");
  assert.match(page, /<details>/, "expandable entries");
  assert.match(page, /application\/ld\+json/);
  assert.match(page, /eventJsonLd\(event, placesById\)/, "JSON-LD rides on the event-filtered entry");
  assert.match(page, /Próximamente \/ Coming soon/, "bilingual empty state");
  assert.match(page, /Cargando eventos… \/ Loading events…/);
  assert.ok(!page.includes("contactNote"), "internal note must never render");
});

test("the map events layer reuses the layer-group pattern without touching the scroll-trap markup", () => {
  const map = read("../app/highway-map.js");
  assert.match(map, /const eventLayer = useRef\(null\);/);
  assert.match(map, /upcomingEvents\(events, Date\.now\(\)\)/, "markers are filtered at runtime");
  assert.match(map, /entryKind\(event\) === "event"/, "offers never get an event marker");
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
  for (const key of [
    "eventsLayer",
    "eventPopupWhen",
    "eventPopupVenue",
    "eventPopupPlace",
    "promotedBadge",
    "promoPrevious",
    "promoNext",
    "promoSlide",
    "upcomingHeading",
    "upcomingAllEvents",
    "upcomingPrevious",
    "upcomingNext",
  ]) {
    assert.ok(typeof UI_TEXT.es[key] === "string" && UI_TEXT.es[key].length > 0, `es.${key}`);
    assert.ok(typeof UI_TEXT.en[key] === "string" && UI_TEXT.en[key].length > 0, `en.${key}`);
  }
  // The strip heading is one inline-bilingual string in both languages
  // (es primary, en secondary) — it promises no specific day.
  assert.equal(UI_TEXT.es.upcomingHeading, "Eventos / Events");
  assert.equal(UI_TEXT.en.upcomingHeading, "Eventos / Events");
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

test("promotion tiers: MAX_PROMOTED caps every promoted record; the banner rotates exactly those three premium promos", () => {
  const promoted = promotedEvents(events);
  const premium = premiumPromotions(events);

  assert.deepEqual(
    promoted.map((event) => event.id).sort(),
    ["promo-balam-nah", "test-partner-dos", "test-partner-uno"],
    "promoted tier: every promoted record, capped by MAX_PROMOTED",
  );
  assert.equal(promoted.length, 3, "exactly MAX_PROMOTED records are promoted");
  assert.deepEqual(
    premium.map((event) => event.id).sort(),
    ["promo-balam-nah", "test-partner-dos", "test-partner-uno"],
    "banner rotation covers all three premium promotions",
  );
  assert.ok(
    premium.length === promoted.length,
    "the promoted tier is entirely premium — the old base tier no longer exists",
  );

  const byId = new Map(events.map((event) => [event.id, event]));
  assert.ok(!byId.get("test-2").promoted, "test-2 reverted to a normal upcoming event");
  for (const event of premium) {
    assert.equal(event.promoted, true);
    assert.equal(event.promotion?.mediaType, "image");
    assert.ok(typeof event.promotion.mediaUrl === "string", "the banner slices need a media image");
  }
});

test("the FeaturedPartners banner renders only premium entries", () => {
  const source = read("../app/featured-partners.js");
  assert.match(source, /premiumPromotions\(events\)/, "banner filters to the premium tier");
  assert.doesNotMatch(source, /events\.filter\(\(e\) => e\.promoted\)/, "only the premium filter may feed the banner");
});

test("the partners-row card grid below the banner is gone; zero premium promotions render nothing", () => {
  const source = read("../app/featured-partners.js");
  assert.doesNotMatch(source, /partners-row/, "no card grid markup");
  assert.doesNotMatch(source, /partner-card/, "no card grid markup");
  assert.match(
    source,
    /if \(partners\.length === 0\) return null;/,
    "an empty promoted tier renders nothing — no empty grid",
  );
  const css = read("../app/featured-partners.css");
  assert.doesNotMatch(css, /partners-row|partner-card/, "card grid styles removed");
});

test("the premium banner is a rotating ad space: N promos cycle, one renders static, reduced-motion disables auto-rotation only", () => {
  const source = read("../app/featured-partners.js");
  assert.match(source, /HOLD_MS = 6000/, "auto-advance about every 6 seconds");
  assert.match(source, /setInterval/);
  assert.match(source, /partners\.length >= 2/, "one promo → static frame, no rotation UI");
  assert.match(source, /rotating && \(/, "controls only when rotation exists");
  assert.match(source, /onMouseEnter=\{\(\) => setPaused\(true\)\}/, "pause on hover");
  assert.match(source, /onFocus=\{\(\) => setPaused\(true\)\}/, "pause on focus");
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /reduceMotion\.current\)/, "auto-rotation disabled under reduced motion; manual controls stay");
  assert.match(source, /onKeyDown=/, "keyboard accessible");
  assert.match(source, /ArrowLeft/);
  assert.match(source, /ArrowRight/);
  assert.match(source, /aria-label=\{text\.promoPrevious\}/);
  assert.match(source, /aria-label=\{text\.promoNext\}/);
  assert.match(source, /aria-label=\{`\$\{text\.promoSlide\} \$\{i \+ 1\}`\}/);
  assert.match(source, /aria-current=/, "dots expose the active promotion");
  const css = read("../app/featured-partners.css");
  assert.match(css, /\.attract__controls/);
  assert.match(css, /\.attract__dot/);
  assert.match(css, /prefers-reduced-motion/, "slice transition falls back to an instant swap");
});

test("/promo/<id> landings stay kind-agnostic: every promoted record gets one, offers included", () => {
  const source = read("../app/promo/[id]/page.js");
  assert.match(
    source,
    /promotedEvents\(events\)\.map\(\(e\) => \(\{ id: e\.id \}\)\)/,
    "generateStaticParams covers promoted offers and promoted events alike",
  );
});

test("the card-based promoted strip is fully gone from the homepage", () => {
  assert.ok(!existsSync(new URL("../app/promoted-events.js", import.meta.url)), "component deleted");
  const page = read("../app/page.js");
  assert.doesNotMatch(page, /PromotedEvents/, "no import, no mount");
  const css = read("../app/style.css");
  assert.doesNotMatch(css, /promoted-strip|promoted-card/, "strip styles removed");
});

test("useSiteLanguage lives in one shared module and both the banner and the community strip follow <html lang>", () => {
  const hook = read("../app/site-language.js");
  assert.match(hook, /export function useSiteLanguage\(\)/);
  assert.match(hook, /MutationObserver/, "follows the <html lang> attribute the map hero publishes");

  const banner = read("../app/featured-partners.js");
  assert.match(banner, /import \{ useSiteLanguage \} from "\.\/site-language";/);
  assert.doesNotMatch(banner, /function useSiteLanguage/, "no second copy of the hook");

  const upcoming = read("../app/upcoming-events.js");
  assert.match(upcoming, /import \{ useSiteLanguage \} from "\.\/site-language";/);
});

test("the community strip lists ALL upcoming EVENTS at runtime as date-first rows linking uniformly to /eventos#<id>", () => {
  const source = read("../app/upcoming-events.js");
  assert.match(
    source,
    /const upcoming = now\s*\?\s*upcomingEvents\(events, now\.getTime\(\)\)\.filter\(\(event\) => entryKind\(event\) === "event"\)\s*: \[\]/,
    "runtime filtering in Cancun time, events only — promotion status and kind both orthogonal",
  );
  assert.match(source, /if \(upcoming\.length === 0\) return null;/, "no empty section");
  // Date-first agenda rows: chip + full title — still no venues or costs.
  assert.doesNotMatch(source, /event\.venue/, "no venues");
  assert.doesNotMatch(source, /event\.cost/, "no costs");
  // Uniform /eventos#<id> hrefs — the tiered promoted → /promo/<id> logic is gone.
  assert.match(source, /href=\{`\/eventos#\$\{event\.id\}`\}/, "every row jumps to its /eventos entry");
  assert.doesNotMatch(source, /\/promo\/\$\{event\.id\}/, "promoted events use the same /eventos anchor");
  // Category color now paints the DATE CHIP (it absorbed the old 4px bar).
  assert.match(source, /import \{ categoryColor \} from "\.\/category-colors\.mjs";/);
  assert.match(source, /className="upcoming-row__date"/, "date chip renders on the row");
  assert.match(source, /className="upcoming-row__day"/, "day number renders");
  assert.match(source, /className="upcoming-row__month"/, "month renders");
  assert.match(source, /eventChipDate\(event, language\)/, "chip date comes from the shared Cancun-time formatter");
  assert.match(source, /style=\{\{ background: categoryColor\(event\.category\) \}\}/, "chip background is the category color");
  assert.doesNotMatch(source, /upcoming-row__bar/, "the 4px bar is gone — the chip absorbed it");
  assert.match(source, /className="upcoming-row__title"/, "row title still renders");
  // Promoted entries keep the (minimal) sponsored marker.
  assert.match(source, /text\.promotedBadge/, "paid entries stay labeled");
  const css = read("../app/style.css");
  assert.match(css, /\.upcoming-row/, "compact row styles exist");
  // Row height sits inside the 48–56px date-first band. An exact border-box
  // height (never min-height) so content can't inflate the row.
  const rowRule = css.match(/\.upcoming-row\s*\{([^}]*)\}/s)?.[1];
  assert.ok(rowRule, "row rule exists");
  const rowHeight = Number(rowRule.match(/height:\s*(\d+(?:\.\d+)?)px/)?.[1]);
  assert.ok(rowHeight >= 48 && rowHeight <= 56, `row height ${rowHeight}px inside the 48–56px band`);
  assert.match(rowRule, /box-sizing:\s*border-box;/, "height includes the 1px border");
  assert.doesNotMatch(rowRule, /min-height/, "exact height, not min-height");
  // Titles wrap to two lines max and are NEVER ellipsized: -webkit-line-clamp
  // is banned here — Chromium appends an ellipsis on its own — so the clamp
  // is a plain max-height of two line-heights.
  const titleRule = css.match(/\.upcoming-row__title\s*\{([^}]*)\}/s)?.[1];
  assert.ok(titleRule, "title rule exists");
  assert.doesNotMatch(titleRule, /text-overflow:\s*ellipsis/, "no ellipsis on titles");
  assert.doesNotMatch(titleRule, /white-space:\s*nowrap/, "titles wrap");
  assert.doesNotMatch(titleRule, /\bline-clamp\s*:/, "no line-clamp declaration — Chromium would render its own ellipsis");
  const titleLineHeight = Number(titleRule.match(/line-height:\s*([\d.]+)/)?.[1]);
  const titleMaxHeight = Number(titleRule.match(/max-height:\s*([\d.]+)em/)?.[1]);
  assert.ok(
    Math.abs(titleMaxHeight - 2 * titleLineHeight) < 0.01,
    "max-height clamps the title to exactly two lines",
  );
  // The chip stacks day over month on the category color.
  const chipRule = css.match(/\.upcoming-row__date\s*\{([^}]*)\}/s)?.[1];
  assert.match(chipRule, /flex-direction:\s*column/, "chip is a day-over-month column");
  assert.match(chipRule, /color:\s*#fff/, "chip text is white on the category color");
  const dayRule = css.match(/\.upcoming-row__day\s*\{([^}]*)\}/s)?.[1];
  const monthRule = css.match(/\.upcoming-row__month\s*\{([^}]*)\}/s)?.[1];
  assert.ok(
    Number(dayRule.match(/font-size:\s*([\d.]+)rem/)?.[1]) > Number(monthRule.match(/font-size:\s*([\d.]+)rem/)?.[1]),
    "day is prominent, month is small",
  );
  assert.match(css, /\.upcoming-row:hover\s*\{[^}]*border-color/s, "hover border stays");
  // Mobile-first: rows keep a readable card width at 360px.
  assert.match(css, /\.upcoming-strip__scroller > li\s*\{[^}]*flex:\s*0 0 clamp\([^)]*\)/s, "fixed-flex cards");
  // Slim single-line header: the scroll hint is gone entirely, and heading +
  // "all events" link share one row barely taller than the text.
  assert.doesNotMatch(source, /upcoming-strip__hint|upcomingScrollHint/, "hint span removed");
  assert.doesNotMatch(source, /upcoming-strip__header-actions/, "no actions wrapper — link sits in the header row");
  assert.match(
    source,
    /<h2 id="upcoming-strip-heading">\{text\.upcomingHeading\}<\/h2>\s*<a className="upcoming-strip__all"/,
    "heading and /eventos link are siblings on one line",
  );
  assert.doesNotMatch(css, /upcoming-strip__hint|upcoming-strip__header-actions/, "hint styles removed");
  assert.match(
    css,
    /\.upcoming-strip__header\s*\{[^}]*justify-content:\s*space-between/s,
    "one flex row: heading left, link right",
  );
  assert.match(css, /\.upcoming-strip__all\s*\{[^}]*padding:\s*0\.25rem 0/s, "link padded to the touch minimum");
});

test("eventChipDate: day + month in Cancun wall time, bilingual, year omitted, null on garbage", () => {
  // Fixed instant: 2026-11-02T12:00 in Cancun.
  const stamped = { startAt: "2026-11-02T12:00:00-05:00" };
  assert.deepEqual(eventChipDate(stamped, "es"), { day: "2", month: "nov" });
  assert.deepEqual(eventChipDate(stamped, "en"), { day: "2", month: "Nov" });
  // Offset-less datetime = Cancun wall time, even where UTC already flipped
  // the calendar day (23:30 Cancun = 04:30 UTC the NEXT day).
  assert.deepEqual(eventChipDate({ startAt: "2026-11-02T23:30:00" }, "es"), { day: "2", month: "nov" });
  // Whole-day legacy start date.
  assert.deepEqual(eventChipDate({ startAt: "2026-12-18" }, "es"), { day: "18", month: "dic" });
  assert.deepEqual(eventChipDate({ startAt: "2026-12-18" }, "en"), { day: "18", month: "Dec" });
  // No parseable start → null (the chip renders its neutral placeholder).
  assert.equal(eventChipDate({ startAt: "próximamente" }, "es"), null);
  assert.equal(eventChipDate({}, "en"), null);
});

test("the community strip gives mouse users a first-class input: wheel translation without scroll-trap, plus edge chevrons", () => {
  const source = read("../app/upcoming-events.js");

  // The wheel is translated by hand: React's synthetic onWheel attaches a
  // passive listener, so preventDefault() inside it is ignored.
  assert.match(source, /addEventListener\("wheel", onWheel, \{ passive: false \}\)/, "non-passive wheel listener via ref");
  assert.match(source, /return \(\) => scroller\.removeEventListener\("wheel", onWheel\)/, "listener cleaned up on unmount");
  assert.doesNotMatch(source, /onWheel=/, "no React synthetic wheel handler anywhere");

  // No scroll-trap: the handler returns BEFORE preventDefault when the strip
  // can't move further in the wheel's direction — at either end (or with no
  // overflow at all) the page scrolls normally.
  assert.match(
    source,
    /if \(goingForward \? max - scroller\.scrollLeft <= 1 : scroller\.scrollLeft <= 1\) return;[\s\S]*?event\.preventDefault\(\)/,
    "pass-through is decided before any preventDefault",
  );

  // Touch keeps the native pan — no touch handlers on the strip.
  assert.doesNotMatch(source, /onTouch|touchstart|touchmove/, "touch behavior untouched");

  // Edge chevrons: desktop only, one ~80% page per click, hidden at the ends,
  // bilingual aria-labels through the shared uiText pattern.
  assert.match(source, /window\.matchMedia\("\(min-width: 48rem\)"\)/, "desktop = the 48rem breakpoint used by the styles");
  assert.match(source, /\{desktop && \(/, "chevrons render on desktop only");
  assert.match(source, /scrollBy\(\{ left: direction \* scroller\.clientWidth \* 0\.8, behavior: "smooth" \}\)/, "one ~80% page per click");
  assert.match(source, /aria-label=\{text\.upcomingPrevious\}/);
  assert.match(source, /aria-label=\{text\.upcomingNext\}/);
  assert.match(source, /hidden=\{atStart\}/, "previous chevron hides at the start");
  assert.match(source, /hidden=\{atEnd\}/, "next chevron hides at the end");

  // The chevron chrome lives in the desktop query that already styles the
  // ribbon scroller, and the hidden attribute must beat the button's display
  // rule at both ends.
  const css = read("../app/style.css");
  const ribbonBlock = [...css.matchAll(/@media\s*\(min-width:\s*48rem\)\s*\{([\s\S]*?)\n\}/g)]
    .map((match) => match[1])
    .find((body) => body.includes(".upcoming-strip__scroller"));
  assert.ok(ribbonBlock, "the ribbon desktop rules live in a 48rem query");
  assert.match(ribbonBlock, /\.upcoming-strip__ribbon\s*\{[^}]*position:\s*relative/s, "the ribbon anchors the nav overlay");
  assert.match(ribbonBlock, /\.upcoming-strip__nav\s*\{[^}]*position:\s*absolute/s, "chevrons sit at the ribbon's right edge");
  assert.match(ribbonBlock, /\.upcoming-strip__nav-btn\[hidden\]\s*\{\s*display:\s*none/s, "hidden wins over the button display");
});

test("/eventos entries carry anchor ids that the homepage strip targets", () => {
  const page = read("../app/eventos/page.js");
  assert.match(page, /<li style=\{card\} id=\{event\.id\}>/, "every upcoming entry is a jump target");
  const upcoming = read("../app/upcoming-events.js");
  assert.match(upcoming, /`\/eventos#\$\{event\.id\}`/);
});

test("the homepage mounts the sections in order: banner, community strip, then map", () => {
  const page = read("../app/page.js");
  assert.doesNotMatch(page, /PromotedEvents/, "promoted card strip is gone");
  assert.ok(
    page.indexOf("<FeaturedPartners />") < page.indexOf("<UpcomingEvents />"),
    "rotating banner before the community strip",
  );
  assert.ok(
    page.indexOf("<UpcomingEvents />") < page.indexOf("<HighwayMap"),
    "community strip before the map",
  );
});
