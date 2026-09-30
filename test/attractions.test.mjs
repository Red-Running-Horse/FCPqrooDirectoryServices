import assert from "node:assert/strict";
import test from "node:test";
import {
  attractions,
  CATEGORIES,
  directionsUrlFor,
  filterAttractions,
  isVerified,
  nonMappablePlaces,
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
const museum = attractions.find(({ id }) => id === "museo-de-la-ciudad-felipe-carrillo-puerto");
const casaDeLaCultura = attractions.find(
  ({ id }) => id === "casa-de-la-cultura-felipe-carrillo-puerto",
);
const plaza = attractions.find(
  ({ id }) => id === "plaza-civica-parque-de-las-palapas-monumento-felipe-carrillo-puerto",
);
const church = attractions.find(({ id }) => id === "iglesia-de-san-servacio-felipe-carrillo-puerto");
const balamNah = attractions.find(({ id }) => id === "balam-nah-felipe-carrillo-puerto");
const whippingFountain = attractions.find(
  ({ id }) => id === "pila-de-los-azotes-felipe-carrillo-puerto",
);
const pichTree = attractions.find(({ id }) => id === "arbol-del-pich-felipe-carrillo-puerto");

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

test("the City Museum retains its unverified bilingual source data", () => {
  assert.ok(museum);
  assert.equal(museum.category, "culture");
  assert.equal(museum.nameEs, "Museo de la Ciudad de Felipe Carrillo Puerto");
  assert.equal(museum.nameEn, "Felipe Carrillo Puerto City Museum");
  assert.equal(museum.name.es, museum.nameEs);
  assert.equal(museum.name.en, museum.nameEn);
  assert.equal(museum.description.es, museum.shortDescriptionEs);
  assert.equal(museum.description.en, museum.shortDescriptionEn);
  assert.match(museum.fullDescriptionEs, /Calle 67 \nCopied\n#768\n, Col. Centro/);
  assert.match(museum.fullDescriptionEn, /assassinated in 1924/);
  assert.equal(museum.latitude, 19.5795);
  assert.equal(museum.longitude, -88.0453);
  assert.ok(inside(FCP_VIEW_BOUNDS, museum));
  assert.match(museum.coordinateSource, /19°34'43"N 88°02'43"W/);
  assert.equal(museum.addressEs.includes("Calle 67 \nCopied\n#768\n"), true);
  assert.equal(museum.addressEn.includes("67 Street \nCopied\n#768\n"), true);
  assert.equal(museum.address.es, museum.addressEs);
  assert.equal(museum.address.en, museum.addressEn);
  assert.deepEqual(museum.hours.map(({ day }) => day), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  assert.ok(museum.hours.every(({ open, close }) => open === "09:00" && close === "18:00"));
  assert.equal(museum.verified, false);
  assert.equal(museum.status, "unverified");
  assert.equal(isVerified(museum), false);
  assert.equal(directionsUrlFor(museum), null);
  assert.equal(museum.verificationSourceUrls.length, 6);
  assert.equal(
    museum.verificationSourceUrls[1],
    "https://www.felipecarrillopuerto.gob.mx/carnaval?view=article&amp;id=4&amp;catid=9",
  );
  assert.match(museum.verificationNotes, /Calle 67 \nCopied\n#768\n/);
  assert.equal(museum.verificationNote, museum.verificationNotes);
  assert.equal(museum.lastUpdated, "2026-09-30");

  for (const language of ["es", "en"]) {
    const portal = placePortal(museum, language);
    assert.equal(portal.name, museum.name[language]);
    assert.equal(portal.status, "approximate");
    assert.match(portal.details.find(({ id }) => id === "hours").value, /09:00 - 18:00/);
    assert.equal(portal.actions.some(({ id }) => id === "directions"), false);
  }
});

test("the House of Culture retains its unverified approximate source data", () => {
  assert.ok(casaDeLaCultura);
  assert.equal(casaDeLaCultura.category, "culture");
  assert.equal(casaDeLaCultura.name.es, casaDeLaCultura.nameEs);
  assert.equal(casaDeLaCultura.name.en, casaDeLaCultura.nameEn);
  assert.equal(casaDeLaCultura.description.es, casaDeLaCultura.shortDescriptionEs);
  assert.equal(casaDeLaCultura.description.en, casaDeLaCultura.shortDescriptionEn);
  assert.match(casaDeLaCultura.fullDescriptionEs, /Calle 67 \nCopied\n#768\n, Col. Centro/);
  assert.match(casaDeLaCultura.fullDescriptionEn, /Calle 67 \nCopied\n#768\n, Col. Centro/);
  assert.equal(casaDeLaCultura.latitude, 19.5796);
  assert.equal(casaDeLaCultura.longitude, -88.0451);
  assert.ok(inside(FCP_VIEW_BOUNDS, casaDeLaCultura));
  assert.equal(casaDeLaCultura.addressEs.includes("Calle 67 \nCopied\n#768\n"), true);
  assert.equal(casaDeLaCultura.addressEn.includes("67 Street \nCopied\n#768\n"), true);
  assert.equal(casaDeLaCultura.address.es, casaDeLaCultura.addressEs);
  assert.equal(casaDeLaCultura.address.en, casaDeLaCultura.addressEn);
  assert.deepEqual(casaDeLaCultura.hours.map(({ day }) => day), [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ]);
  assert.ok(casaDeLaCultura.hours.every(({ open, close }) => open === "09:00" && close === "18:00"));
  assert.deepEqual(casaDeLaCultura.hoursDisplay, {
    es: "Lun - Dom: 09:00 - 18:00",
    en: "Mon - Sun: 09:00 - 18:00",
  });
  assert.equal(casaDeLaCultura.verified, false);
  assert.equal(casaDeLaCultura.status, "unverified");
  assert.equal(casaDeLaCultura.locationAccuracy, "approximate");
  assert.equal(isVerified(casaDeLaCultura), false);
  assert.equal(directionsUrlFor(casaDeLaCultura), null);
  assert.match(casaDeLaCultura.verificationNotes, /Calle 67 \nCopied\n#768\n/);
  assert.equal(casaDeLaCultura.verificationNote, casaDeLaCultura.verificationNotes);
  assert.equal(casaDeLaCultura.verificationSourceUrls.length, 4);
  assert.equal(casaDeLaCultura.lastUpdated, "2026-09-30");
});

test("the civic plaza / palapa park retains its unverified bilingual source data", () => {
  assert.ok(plaza);
  assert.equal(plaza.category, "culture");
  assert.equal(plaza.nameEs, "Plaza Cívica / Parque de las Palapas + Monumento a Felipe Carrillo Puerto");
  assert.equal(plaza.nameEn, "Civic Plaza / Palapa Park + Monument to Felipe Carrillo Puerto");
  assert.equal(plaza.name.es, plaza.nameEs);
  assert.equal(plaza.name.en, plaza.nameEn);
  assert.equal(plaza.description.es, plaza.shortDescriptionEs);
  assert.equal(plaza.description.en, plaza.shortDescriptionEn);
  assert.equal(plaza.latitude, 19.5792);
  assert.equal(plaza.longitude, -88.0448);
  assert.ok(inside(FCP_VIEW_BOUNDS, plaza));
  assert.equal(plaza.address.es, plaza.addressEs);
  assert.equal(plaza.address.en, plaza.addressEn);
  assert.deepEqual(plaza.hours.map(({ day }) => day), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  assert.ok(plaza.hours.every(({ open, close }) => open === "" && close === ""));
  assert.equal(plaza.verified, false);
  assert.equal(plaza.status, "unverified");
  assert.equal(plaza.locationAccuracy, "approximate");
  assert.equal(isVerified(plaza), false);
  assert.equal(directionsUrlFor(plaza), null);
  assert.match(plaza.verificationNotes, /Calle 67 \nCopied\n#768\n/);
  assert.equal(plaza.verificationNote, plaza.verificationNotes);
  assert.equal(plaza.lastUpdated, "2026-09-30");

  for (const language of ["es", "en"]) {
    const portal = placePortal(plaza, language);
    assert.equal(portal.name, plaza.name[language]);
    assert.equal(portal.status, "approximate");
    assert.equal(portal.actions.some(({ id }) => id === "directions"), false);
  }
});

test("the church of San Servacio preserves its source verified:true without upgrading location accuracy", () => {
  assert.ok(church);
  assert.equal(church.category, "culture");
  assert.equal(church.nameEs, "Iglesia de San Servacio");
  assert.equal(church.nameEn, "Church of Saint Servatius");
  assert.equal(church.name.es, church.nameEs);
  assert.equal(church.name.en, church.nameEn);
  assert.equal(church.description.es, church.shortDescriptionEs);
  assert.equal(church.description.en, church.shortDescriptionEn);
  assert.equal(church.latitude, 19.5798);
  assert.equal(church.longitude, -88.0455);
  assert.ok(inside(FCP_VIEW_BOUNDS, church));
  assert.equal(church.address.es, church.addressEs);
  assert.equal(church.address.en, church.addressEn);
  assert.deepEqual(church.hours.map(({ day }) => day), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

  // Source-level "verified" reflects a third-party mass directory's attribution, not a
  // physical/GPS verification of coordinates or naming — it must be preserved as-is.
  assert.equal(church.verified, true);
  assert.equal(church.verifiedBy, "horariodemisa.com.mx");
  // The exported attraction must not upgrade status/locationAccuracy on the strength of that
  // source field alone, so the UI never asserts exact/physical verification for this record.
  assert.equal(church.status, "unverified");
  assert.equal(church.locationAccuracy, "approximate");
  assert.equal(isVerified(church), false);
  assert.equal(directionsUrlFor(church), null);
  assert.match(church.verificationNotes, /not GPS-verified/);
  assert.equal(church.verificationNote, church.verificationNotes);
  assert.equal(church.lastUpdated, "2026-09-30");

  for (const language of ["es", "en"]) {
    const portal = placePortal(church, language);
    assert.equal(portal.name, church.name[language]);
    assert.equal(portal.status, "approximate");
    assert.equal(portal.actions.some(({ id }) => id === "directions"), false);
  }
});

test("Balam-Nah user-provided coordinates remain unverified and approximate", () => {
  assert.ok(balamNah);
  assert.equal(balamNah.category, "culture");
  assert.equal(balamNah.name.es, "Balam-Nah");
  assert.equal(balamNah.name.en, "Balam-Nah");
  assert.equal(balamNah.description.es, balamNah.shortDescriptionEs);
  assert.equal(balamNah.description.en, balamNah.shortDescriptionEn);
  assert.equal(balamNah.website, "https://balamnah.fcpqroo.mx/");
  assert.equal(balamNah.latitude, 19.476991842956);
  assert.equal(balamNah.longitude, -88.06736291757169);
  assert.ok(inside(FCP_MAX_BOUNDS, balamNah));
  assert.equal(balamNah.verified, false);
  assert.equal(balamNah.status, "unverified");
  assert.equal(balamNah.locationAccuracy, "approximate");
  assert.match(balamNah.coordinateSource, /User-provided.*not independently GPS-verified/);
  assert.match(balamNah.verificationNotes, /coordinates were provided by the user.*not been independently GPS-verified/);
  assert.equal(balamNah.directionsUrl, null);
  assert.equal(directionsUrlFor(balamNah), null);
  assert.equal(
    placePortal(balamNah, "en").actions.some(({ id }) => id === "directions"),
    false,
  );
});

test("the Pila de los Azotes is unverified with an approximate historic-centre point", () => {
  assert.ok(whippingFountain);
  assert.equal(whippingFountain.category, "culture");
  assert.equal(whippingFountain.nameEs, "Pila de los Azotes");
  assert.equal(whippingFountain.nameEn, "Whipping Fountain (Pila de los Azotes)");
  assert.equal(whippingFountain.name.es, whippingFountain.nameEs);
  assert.equal(whippingFountain.name.en, whippingFountain.nameEn);
  assert.equal(whippingFountain.description.es, whippingFountain.shortDescriptionEs);
  assert.equal(whippingFountain.description.en, whippingFountain.shortDescriptionEn);
  assert.equal(whippingFountain.address.es, whippingFountain.addressEs);
  assert.equal(whippingFountain.address.en, whippingFountain.addressEn);
  assert.equal(typeof whippingFountain.latitude, "number");
  assert.equal(typeof whippingFountain.longitude, "number");
  assert.ok(inside(FCP_VIEW_BOUNDS, whippingFountain));
  assert.match(whippingFountain.coordinateSource, /Approximate placeholder.*not GPS-verified/);
  assert.deepEqual(
    whippingFountain.hours.map(({ day }) => day),
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  );
  assert.equal(whippingFountain.verified, false);
  assert.equal(whippingFountain.status, "unverified");
  assert.equal(whippingFountain.locationAccuracy, "approximate");
  assert.equal(isVerified(whippingFountain), false);
  assert.equal(directionsUrlFor(whippingFountain), null);
  assert.equal(whippingFountain.verificationSourceUrls.length, 4);
  // The construction-date conflict must stay unresolved in the notes and out of the descriptions.
  assert.match(whippingFountain.verificationNotes, /MAJOR DATE CONFLICT/);
  assert.match(whippingFountain.verificationNotes, /Do not publish a construction date/);
  assert.equal(whippingFountain.verificationNote, whippingFountain.verificationNotes);
  assert.equal(whippingFountain.lastUpdated, "2026-09-30");

  for (const language of ["es", "en"]) {
    const portal = placePortal(whippingFountain, language);
    assert.equal(portal.name, whippingFountain.name[language]);
    assert.equal(portal.status, "approximate");
    assert.equal(portal.actions.some(({ id }) => id === "directions"), false);
  }
});

test("the historic Pich tree is mappable at the user coordinates but stays unverified", () => {
  assert.ok(pichTree);
  assert.equal(nonMappablePlaces.some(({ id }) => id === pichTree.id), false);
  assert.equal(pichTree.category, "nature");
  assert.equal(pichTree.name.es, "Árbol del Pich (histórico)");
  assert.equal(pichTree.name.en, "The Pich Tree (historic)");
  assert.equal(pichTree.description.es, pichTree.shortDescriptionEs);
  assert.equal(pichTree.description.en, pichTree.shortDescriptionEn);
  assert.equal(pichTree.latitude, 19.609933175898494);
  assert.equal(pichTree.longitude, -88.55789465767205);
  assert.match(pichTree.coordinateSource, /User-provided.*not independently GPS-verified/);
  assert.equal(pichTree.mappable, true);
  assert.equal(pichTree.verified, false);
  assert.equal(pichTree.status, "unverified");
  assert.equal(pichTree.locationAccuracy, "approximate");
  assert.equal(isVerified(pichTree), false);
  assert.equal(pichTree.directionsUrl, null);
  assert.equal(directionsUrlFor(pichTree), null);
  assert.match(pichTree.shortDescriptionEs, /23 de junio de 2017/);
  assert.match(pichTree.shortDescriptionEn, /June 23, 2017/);
  assert.match(pichTree.fullDescriptionEs, /ESTADO ACTUAL INCIERTO/);
  assert.match(pichTree.fullDescriptionEn, /CURRENT STATUS UNCERTAIN/);
  assert.match(pichTree.verificationNotes, /no confirmation of a replanted specimen/);
  assert.match(pichTree.verificationNotes, /monument at the original site/);
  assert.match(pichTree.verificationNotes, /exact location of the original tree/);
  assert.match(pichTree.verificationNotes, /provided by the user and have not been independently GPS-verified/);
  assert.match(pichTree.verificationNotes, /historical-memory point, not confirmation of a currently visitable attraction/);
  assert.equal(pichTree.verificationNote, pichTree.verificationNotes);
  assert.equal(pichTree.lastUpdated, "2026-09-30");
});

test("every mapped attraction has its own point so no marker hides another", () => {
  const points = attractions.map(({ latitude, longitude }) => `${latitude},${longitude}`);
  assert.equal(new Set(points).size, attractions.length);
});

test("Expomaya is not published", () => {
  for (const place of [...attractions, ...nonMappablePlaces]) {
    assert.doesNotMatch(place.id, /expomaya/i);
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
