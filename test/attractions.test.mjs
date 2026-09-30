import assert from "node:assert/strict";
import test from "node:test";
import {
  attractions,
  CATEGORIES,
  directionsUrlFor,
  filterAttractions,
  isVerified,
} from "../app/attractions.mjs";
import { FCP_MAX_BOUNDS, FCP_VIEW_BOUNDS } from "../app/map-view.mjs";
import { placePortal } from "../app/place-portal.mjs";

function inside(bounds, { latitude, longitude }) {
  return (
    latitude >= bounds[0][0] &&
    latitude <= bounds[1][0] &&
    longitude >= bounds[0][1] &&
    longitude <= bounds[1][1]
  );
}

const market = attractions.find(({ id }) => id === "mercado-felipe-carrillo-puerto");
const sanctuary = attractions.find(({ id }) => id === "santuario-de-la-cruz-parlante-fcp");

test("attractions have complete, distinct, bilingual, in-bounds data", () => {
  assert.ok(attractions.length >= 1);
  assert.equal(new Set(attractions.map(({ id }) => id)).size, attractions.length);
  const categories = new Set(CATEGORIES.map(({ id }) => id));
  for (const attraction of attractions) {
    assert.ok(attraction.id);
    for (const language of ["es", "en"]) {
      assert.ok(attraction.name[language] && attraction.description[language], `${attraction.id} ${language}`);
    }
    assert.ok(categories.has(attraction.category) && attraction.category !== "all");
    assert.ok(["verified", "unverified", "unavailable"].includes(attraction.status));
    assert.ok(["exact", "approximate"].includes(attraction.locationAccuracy));
    assert.ok(inside(FCP_MAX_BOUNDS, attraction), `${attraction.id} dentro del límite regional`);
    assert.ok(attraction.directionsUrl === null || attraction.directionsUrl.startsWith("https://"));
  }
});

test("no demo placeholder points remain", () => {
  for (const attraction of attractions) {
    assert.doesNotMatch(attraction.id, /demo/i);
    assert.doesNotMatch(attraction.name.es, /demo/i);
    assert.doesNotMatch(attraction.name.en, /demo/i);
  }
});

test("the physically confirmed market is exact, verified and in the town view", () => {
  assert.ok(market);
  assert.equal(market.category, "food");
  assert.equal(market.status, "verified");
  assert.equal(market.locationAccuracy, "exact");
  assert.equal(isVerified(market), true);
  assert.equal(market.latitude, 19.580894458770345);
  assert.equal(market.longitude, -88.04402730793707);
  assert.equal(directionsUrlFor(market), "https://maps.app.goo.gl/zJbo8V1rE4ZmYT537");
  assert.ok(inside(FCP_VIEW_BOUNDS, market));
});

test("the Talking Cross sanctuary retains its unverified bilingual source data", () => {
  assert.ok(sanctuary);
  assert.equal(sanctuary.category, "culture");
  assert.equal(sanctuary.nameEs, "Santuario de la Cruz Parlante");
  assert.equal(sanctuary.nameEn, "Sanctuary of the Talking Cross");
  assert.equal(sanctuary.name.es, sanctuary.nameEs);
  assert.equal(sanctuary.name.en, sanctuary.nameEn);
  assert.equal(sanctuary.description.es, sanctuary.shortDescriptionEs);
  assert.equal(sanctuary.description.en, sanctuary.shortDescriptionEn);
  assert.match(sanctuary.fullDescriptionEs, /Cruzo'ob/);
  assert.match(sanctuary.fullDescriptionEn, /Caste War/);
  assert.equal(sanctuary.latitude, 19.580901);
  assert.equal(sanctuary.longitude, -88.049242);
  assert.ok(inside(FCP_VIEW_BOUNDS, sanctuary));
  assert.equal(sanctuary.addressEs.includes("Calle 60 \nCopied\n#788\n"), true);
  assert.equal(sanctuary.addressEn.includes("60 Street \nCopied\n#788\n"), true);
  assert.equal(sanctuary.address.es, sanctuary.addressEs);
  assert.equal(sanctuary.address.en, sanctuary.addressEn);
  assert.deepEqual(sanctuary.hours.map(({ day }) => day), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  assert.ok(sanctuary.hours.every(({ open, close }) => open === "07:00" && close === "18:00"));
  assert.equal(sanctuary.verified, false);
  assert.equal(sanctuary.status, "unverified");
  assert.equal(isVerified(sanctuary), false);
  assert.equal(directionsUrlFor(sanctuary), null);
  assert.equal(sanctuary.verificationSourceUrls.length, 5);
  assert.equal(sanctuary.verificationSourceUrls.at(-1), sanctuary.directionsUrl);
  assert.match(sanctuary.verificationNotes, /Calle 60 \nCopied\n#788\n/);
  assert.equal(sanctuary.verificationNote, sanctuary.verificationNotes);
  assert.equal(sanctuary.lastUpdated, "2026-09-30");

  for (const language of ["es", "en"]) {
    const portal = placePortal(sanctuary, language);
    assert.equal(portal.name, sanctuary.name[language]);
    assert.equal(portal.status, "approximate");
    assert.equal(portal.details.find(({ id }) => id === "address").value, sanctuary.address[language].trim());
    assert.match(portal.details.find(({ id }) => id === "hours").value, /07:00 - 18:00/);
    assert.equal(portal.verificationNote, sanctuary.verificationNotes);
    assert.equal(portal.actions.some(({ id }) => id === "directions"), false);
  }
});

test("directions are only offered for verified destinations", () => {
  for (const attraction of attractions) {
    if (!isVerified(attraction)) assert.equal(directionsUrlFor(attraction), null);
  }

  const url = "https://www.openstreetmap.org/?mlat=19.58&mlon=-88.04";
  const base = { directionsUrl: url, locationAccuracy: "exact" };
  assert.equal(directionsUrlFor({ ...base, status: "verified" }), url);
  assert.equal(directionsUrlFor({ ...base, status: "unverified" }), null);
  assert.equal(directionsUrlFor({ ...base, status: "verified", locationAccuracy: "approximate" }), null);
  assert.equal(directionsUrlFor({ ...base, status: "verified", directionsUrl: "http://example.com" }), null);
  assert.equal(directionsUrlFor({ ...base, status: "verified", directionsUrl: null }), null);
});

test("categories filter locally (empty categories allowed) and All restores every attraction", () => {
  assert.deepEqual(CATEGORIES.map(({ id }) => id), ["all", "nature", "culture", "food", "lodging", "tours"]);
  for (const { id, label } of CATEGORIES) {
    assert.ok(label.es && label.en, `${id} bilingüe`);
    const filtered = filterAttractions(id);
    assert.ok(filtered.every(({ category }) => id === "all" || category === id));
  }
  assert.deepEqual(filterAttractions("all"), attractions);
  assert.ok(filterAttractions("food").includes(market));
});
