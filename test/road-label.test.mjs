import assert from "node:assert/strict";
import test from "node:test";
import { roadLabel, roadLabelPlacement } from "../app/road-label.mjs";

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
