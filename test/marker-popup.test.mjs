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

test("the marker popup is a short bilingual summary, not the full details", () => {
  const place = attractions[0];
  const es = placePopup(place, "es");
  const en = placePopup(place, "en");

  assert.deepEqual(Object.keys(es).sort(), [
    "category",
    "detailsLabel",
    "hint",
    "id",
    "name",
    "status",
    "statusLabel",
  ]);
  assert.equal(es.name, place.name.es);
  assert.equal(en.name, place.name.en);
  assert.equal(es.category, "Naturaleza");
  assert.equal(en.category, "Nature");
  assert.equal(es.status, "approximate");
  assert.equal(es.statusLabel, "Ubicación aproximada");
  assert.equal(en.statusLabel, "Approximate location");
  assert.equal(es.detailsLabel, "Ver detalles");
  assert.equal(en.detailsLabel, "View details");
  assert.match(es.hint, /debajo del mapa/);
  assert.match(en.hint, /below the map/);
  assert.equal(placePopup(null, "es"), null);
});

test("selecting a marker opens only its popup and marks it selected", () => {
  const markers = new Map(attractions.map(({ id }) => [id, fakeMarker()]));
  const [first, second] = attractions;

  syncMarkerSelection(markers, first.id);
  for (const [id, marker] of markers) {
    assert.equal(marker.open, id === first.id, id);
    assert.equal(marker.attributes["aria-pressed"], String(id === first.id));
    assert.equal(marker.classes.has("attraction-marker--selected"), id === first.id);
  }

  syncMarkerSelection(markers, second.id);
  assert.equal(markers.get(first.id).open, false);
  assert.equal(markers.get(second.id).open, true);

  syncMarkerSelection(markers, null);
  assert.ok([...markers.values()].every((marker) => !marker.open && marker.attributes["aria-pressed"] === "false"));
});

test("marker selection still drives the below-map portal with matching content", () => {
  for (const place of attractions) {
    for (const language of ["es", "en"]) {
      const popup = placePopup(place, language);
      const portal = placePortal(place, language);
      assert.equal(portal.selected, true);
      assert.equal(portal.id, popup.id);
      assert.equal(portal.name, popup.name);
      assert.equal(portal.category, popup.category);
      assert.equal(portal.status, popup.status);
      assert.equal(portal.statusLabel, popup.statusLabel);
      // Demo places stay unverified: no action buttons in the portal.
      assert.deepEqual(portal.actions, []);
    }
  }
});
