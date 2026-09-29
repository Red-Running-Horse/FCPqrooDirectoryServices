import assert from "node:assert/strict";
import test from "node:test";
import {
  FCP_CENTER,
  FCP_MAX_BOUNDS,
  FCP_VIEW_BOUNDS,
  LABEL_MIN_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  shouldShowLabels,
} from "../app/map-view.mjs";

function contains(outer, inner) {
  return (
    outer[0][0] <= inner[0][0] &&
    outer[0][1] <= inner[0][1] &&
    outer[1][0] >= inner[1][0] &&
    outer[1][1] >= inner[1][1]
  );
}

test("the initial view covers Felipe Carrillo Puerto and stays inside the pan limit", () => {
  const [south, west] = FCP_VIEW_BOUNDS[0];
  const [north, east] = FCP_VIEW_BOUNDS[1];

  assert.ok(south < 19.578 && north > 19.578, "latitud de Felipe Carrillo Puerto");
  assert.ok(west < -88.045 && east > -88.045, "longitud de Felipe Carrillo Puerto");
  assert.ok(contains(FCP_MAX_BOUNDS, FCP_VIEW_BOUNDS));
});

test("the initial view is city-level, centred on Felipe Carrillo Puerto, with regional panning", () => {
  const [[south, west], [north, east]] = FCP_VIEW_BOUNDS;
  const [lat, lng] = FCP_CENTER;

  // City-level: under ~0.1° (about 10 km) across, not the whole state or region.
  assert.ok(north - south <= 0.1 && east - west <= 0.1, "vista a nivel ciudad");
  assert.ok(Math.abs((south + north) / 2 - lat) < 0.01, "centrada en latitud de FCP");
  assert.ok(Math.abs((west + east) / 2 - lng) < 0.01, "centrada en longitud de FCP");
  assert.ok(south < lat && lat < north && west < lng && lng < east);

  // The pan limit stays regional so nearby communities remain reachable.
  const [[maxSouth, maxWest], [maxNorth, maxEast]] = FCP_MAX_BOUNDS;
  assert.ok(maxNorth - maxSouth >= 1 && maxEast - maxWest >= 1, "límite regional de desplazamiento");
  assert.ok(contains(FCP_MAX_BOUNDS, FCP_VIEW_BOUNDS));
});

test("labels only appear once the visitor zooms in, within the allowed zoom range", () => {
  assert.equal(MAX_ZOOM, 20);
  assert.ok(MIN_ZOOM < LABEL_MIN_ZOOM && LABEL_MIN_ZOOM <= MAX_ZOOM);
  assert.equal(shouldShowLabels(LABEL_MIN_ZOOM - 1), false);
  assert.equal(shouldShowLabels(LABEL_MIN_ZOOM), true);
  assert.equal(shouldShowLabels(undefined), false);
});
