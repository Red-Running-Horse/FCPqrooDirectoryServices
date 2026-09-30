import assert from "node:assert/strict";
import test from "node:test";
import { attractions } from "../app/attractions.mjs";
import { syncMarkerSelection } from "../app/marker-selection.mjs";
import { placePopup, placePortal } from "../app/place-portal.mjs";

function fakeMarker() {
  const classes = new Set();
  const attributes = {};
  const element = {
    classList: { toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)) },
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
  };
  const marker = {
    open: false,
    classes,
    attributes,
    getElement: () => element,
    isPopupOpen: () => marker.open,
    openPopup: () => {
      marker.open = true;
    },
    closePopup: () => {
      marker.open = false;
    },
  };
  return marker;
}

const market = attractions.find(({ id }) => id === "mercado-felipe-carrillo-puerto");

const approximatePlace = {
  id: "approximate-test",
  name: { es: "Sitio de prueba", en: "Test site" },
  category: "nature",
  description: { es: "Ubicación aproximada.", en: "Approximate location." },
  latitude: 19.58,
  longitude: -88.05,
  status: "unverified",
  locationAccuracy: "approximate",
  directionsUrl: null,
};

test("the marker popup is a short bilingual summary, not the full details", () => {
  const es = placePopup(market, "es");
  const en = placePopup(market, "en");

  assert.deepEqual(Object.keys(es).sort(), [
    "category",
    "detailsLabel",
    "hint",
    "id",
    "name",
    "status",
    "statusLabel",
  ]);
  assert.equal(es.name, market.name.es);
  assert.equal(en.name, market.name.en);
  assert.equal(es.category, "Comida");
  assert.equal(en.category, "Food");
  assert.equal(es.status, "verified");
  assert.equal(es.statusLabel, "Verificado");
  assert.equal(en.statusLabel, "Verified");
  assert.equal(es.detailsLabel, "Ver detalles");
  assert.equal(en.detailsLabel, "View details");
  assert.match(es.hint, /debajo del mapa/);
  assert.match(en.hint, /below the map/);
  assert.equal(placePopup(null, "es"), null);

  const approx = placePopup(approximatePlace, "en");
  assert.equal(approx.status, "approximate");
  assert.equal(approx.statusLabel, "Approximate location");
});

test("selecting a marker opens only its popup and marks it selected", () => {
  const ids = [market.id, approximatePlace.id];
  const markers = new Map(ids.map((id) => [id, fakeMarker()]));
  const [first, second] = ids;

  syncMarkerSelection(markers, first);
  for (const [id, marker] of markers) {
    assert.equal(marker.open, id === first, id);
    assert.equal(marker.attributes["aria-pressed"], String(id === first));
    assert.equal(marker.classes.has("attraction-marker--selected"), id === first);
  }

  syncMarkerSelection(markers, second);
  assert.equal(markers.get(first).open, false);
  assert.equal(markers.get(second).open, true);

  syncMarkerSelection(markers, null);
  assert.ok([...markers.values()].every((marker) => !marker.open && marker.attributes["aria-pressed"] === "false"));
});

test("marker selection still drives the below-map portal with matching content", () => {
  for (const place of [...attractions, approximatePlace]) {
    for (const language of ["es", "en"]) {
      const popup = placePopup(place, language);
      const portal = placePortal(place, language);
      assert.equal(portal.selected, true);
      assert.equal(portal.id, popup.id);
      assert.equal(portal.name, popup.name);
      assert.equal(portal.category, popup.category);
      assert.equal(portal.status, popup.status);
      assert.equal(portal.statusLabel, popup.statusLabel);
    }
  }
  assert.deepEqual(placePortal(approximatePlace, "es").actions, []);
  assert.deepEqual(placePortal(market, "es").actions.map(({ id }) => id), ["directions", "call"]);
});
