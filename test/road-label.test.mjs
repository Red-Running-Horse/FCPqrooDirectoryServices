import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { FCP_CENTER, labelTier } from "../app/map-view.mjs";
import {
  clipToViewport,
  labelsOverlap,
  mergeRoadSegments,
  placeRoadLabel,
  roadLabel,
  roadLabelPlacement,
} from "../app/road-label.mjs";

test("keeps named roads, including streets with numbers", () => {
  assert.equal(roadLabel("  Ramal a X - Yatil  "), "Ramal a X - Yatil");
  assert.equal(roadLabel("1 Oriente"), "1 Oriente");
});

test("omits missing, placeholder and numeric code-like names", () => {
  for (const name of [null, undefined, "", "   ", "N/D", " n/d ", "N/A", "63", "47 A", "QR-307", "307/2"]) {
    assert.equal(roadLabel(name), null, String(name));
  }
});

const viewport = { x: 200, y: 200 };
const project = ([x, y]) => ({ x, y });

test("anchors diagonal labels on the road midpoint and keeps text upright", () => {
  const up = roadLabelPlacement([[20, 20], [140, 140]], project, 70, viewport);
  assert.deepEqual(up?.point, { x: 80, y: 80 });
  assert.equal(up?.angle, 45);

  const reversed = roadLabelPlacement([[140, 140], [20, 20]], project, 70, viewport);
  assert.deepEqual(reversed?.point, up.point);
  assert.equal(reversed?.angle, 45);

  const down = roadLabelPlacement([[20, 140], [140, 20]], project, 70, viewport);
  assert.equal(down?.angle, -45);
});

test("centers a label on a gently curved road rather than off its centerline", () => {
  const road = [[20, 80], [60, 78], [100, 77], [140, 78], [180, 80]];
  const placement = roadLabelPlacement(road, project, 65, viewport);
  assert.deepEqual(placement?.point, { x: 100, y: 77 });
  assert.ok(Math.abs(placement.angle) < 20);
});

test("omits short, sharply bent, and viewport-clipped labels", () => {
  assert.equal(roadLabelPlacement([[20, 50], [50, 50]], project, 60, viewport), null);
  assert.equal(roadLabelPlacement([[60, 60], [85, 60], [85, 85]], project, 40, viewport), null);
  assert.equal(roadLabelPlacement([[-20, 50], [85, 50]], project, 70, viewport), null);
  assert.equal(roadLabelPlacement([[10, 10], [80, 80]], project, 70, { x: 75, y: 75 }), null);
});

test("joins same-name road pieces that share endpoints into one chain", () => {
  const chains = mergeRoadSegments([
    { name: "Benito Juárez", group: "street", coordinates: [[20, 0], [30, 0]] },
    { name: "Benito Juárez", group: "street", coordinates: [[0, 0], [10, 0]] },
    { name: "Benito Juárez", group: "street", coordinates: [[20, 0], [10, 0]] },
    { name: "Benito Juárez", group: "street", coordinates: [[50, 50], [60, 50]] },
    { name: "Constituyentes", group: "street", coordinates: [[30, 0], [40, 0]] },
    { name: "Benito Juárez", group: "highway", coordinates: [[30, 0], [40, 0]] },
  ]);

  assert.deepEqual(chains[0], {
    name: "Benito Juárez",
    group: "street",
    coordinates: [[0, 0], [10, 0], [20, 0], [30, 0]],
    length: 30,
  });
  assert.equal(chains.length, 4);
  assert.deepEqual(chains.map(({ length }) => length), [30, 10, 10, 10]);
});

test("detects overlapping labels so crowded names are suppressed", () => {
  const a = roadLabelPlacement([[20, 50], [180, 50]], project, 60, viewport);
  const near = roadLabelPlacement([[20, 55], [180, 55]], project, 60, viewport);
  const far = roadLabelPlacement([[20, 150], [180, 150]], project, 60, viewport);
  assert.equal(labelsOverlap(a, near), true);
  assert.equal(labelsOverlap(a, far), false);
});

// Web Mercator projection of [lng, lat] to screen pixels for a view centred on FCP.
function mercator(zoom, [centerLat, centerLng], size) {
  const scale = 256 * 2 ** zoom;
  const toWorld = ([lng, lat]) => {
    const sin = Math.sin((lat * Math.PI) / 180);
    return {
      x: ((lng + 180) / 360) * scale,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
    };
  };
  const center = toWorld([centerLng, centerLat]);
  return ([lng, lat]) => {
    const point = toWorld([lng, lat]);
    return { x: point.x - center.x + size.x / 2, y: point.y - center.y + size.y / 2 };
  };
}

function townStreetLabels(zoom, merge) {
  const data = JSON.parse(readFileSync(new URL("../public/regional-highways.geojson", import.meta.url)));
  const size = { x: 800, y: 600 };
  const project = mercator(zoom, FCP_CENTER, size);
  const segments = data.features
    .map(({ properties, geometry }) => ({
      name: roadLabel(properties.NOMBRE),
      group: labelTier(properties.TIPO_VIAL),
      coordinates: geometry.coordinates,
      length: 0,
    }))
    .filter(({ name, group }) => name && group === "street");
  const names = new Set();
  const placed = [];
  for (const { name, coordinates } of merge ? mergeRoadSegments(segments) : segments) {
    if (names.has(name)) continue;
    const placement = placeRoadLabel(coordinates, project, name.length * 7, size);
    if (!placement || placed.some((other) => labelsOverlap(placement, other))) continue;
    placed.push(placement);
    names.add(name);
  }
  return names;
}

test("town street names fit at city-level zoom 14 once pieces are joined", () => {
  assert.equal(townStreetLabels(14, false).size, 0, "block-long pieces alone are too short at zoom 14");
  const labels = townStreetLabels(14, true);
  assert.ok(labels.size >= 3, `street labels at zoom 14: ${[...labels].join(", ")}`);
});

test("joined streets keep their labels when zoomed in deeper than the street length", () => {
  for (const zoom of [15, 16, 17, 18]) {
    assert.ok(townStreetLabels(zoom, true).size >= townStreetLabels(zoom, false).size, `zoom ${zoom}`);
    assert.ok(townStreetLabels(zoom, true).size >= 1, `zoom ${zoom}`);
  }
});

test("clips long roads to the viewport and labels the visible stretch", () => {
  assert.deepEqual(clipToViewport([{ x: -100, y: 50 }, { x: 300, y: 50 }], viewport), [[{ x: 0, y: 50 }, { x: 200, y: 50 }]]);
  assert.deepEqual(clipToViewport([{ x: -10, y: -10 }, { x: -5, y: 250 }], viewport), []);
  assert.equal(clipToViewport([{ x: 10, y: 10 }, { x: 250, y: 10 }, { x: 250, y: 50 }, { x: 10, y: 50 }], viewport).length, 2);

  // A straight road far longer than the screen: its midpoint is off-screen, yet it is labelled on-screen.
  const long = [[-400, 100], [1000, 100]];
  assert.equal(roadLabelPlacement(long, project, 70, viewport), null);
  assert.deepEqual(placeRoadLabel(long, project, 70, viewport)?.point, { x: 100, y: 100 });
  // Short, bent and too-small viewports are still suppressed.
  assert.equal(placeRoadLabel([[20, 50], [50, 50]], project, 60, viewport), null);
  assert.equal(placeRoadLabel([[60, 60], [85, 60], [85, 85]], project, 40, viewport), null);
  assert.equal(placeRoadLabel([[10, 10], [80, 80]], project, 70, { x: 75, y: 75 }), null);
});
