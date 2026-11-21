import assert from "node:assert/strict";
import test from "node:test";

import { SPREAD_ANCHOR_ZOOM, spreadOffsets } from "../app/marker-spread.mjs";

test("coincident markers spread apart at low zoom and converge to zero at the anchor zoom", () => {
  const items = [
    { id: "a", position: [19.5, -88.0] },
    { id: "b", position: [19.5, -88.0] },
    { id: "c", position: [19.5, -88.0] },
    { id: "solo", position: [19.6, -88.1] },
  ];
  const low = spreadOffsets(items, 12);

  assert.deepEqual(low.get("solo"), [0, 0], "singletons are untouched");
  const stack = ["a", "b", "c"].map((id) => low.get(id));
  assert.ok(stack.every(([x, y]) => Math.hypot(x, y) > 0), "every stack member moves");
  assert.equal(new Set(stack.map(String)).size, 3, "all offsets are distinct");

  assert.deepEqual(spreadOffsets(items, 12), low, "deterministic across calls");
  const shuffled = spreadOffsets([items[2], items[0], items[3], items[1]], 12);
  assert.deepEqual(shuffled.get("b"), low.get("b"), "id-based: input order does not matter");

  const high = spreadOffsets(items, SPREAD_ANCHOR_ZOOM);
  assert.deepEqual(high.get("a"), [0, 0], "converges to the true point at the anchor zoom");
  assert.deepEqual(high.get("c"), [0, 0]);
  const past = spreadOffsets(items, SPREAD_ANCHOR_ZOOM + 2);
  assert.deepEqual(past.get("b"), [0, 0], "stays zero beyond the anchor zoom");
});

test("only EXACT coincidences spread; near-neighbours keep their true position", () => {
  const items = [
    { id: "plaza", position: [19.578135173994557, -88.0460485056746] },
    { id: "nojkaaj", position: [19.57814, -88.04605] }, // ~0.6 m away — NOT exact
    { id: "plaza-clone", position: [19.578135173994557, -88.0460485056746] },
  ];
  const at12 = spreadOffsets(items, 12);
  assert.deepEqual(at12.get("nojkaaj"), [0, 0], "near-duplicates keep their true coordinates");
  assert.notDeepEqual(at12.get("plaza"), [0, 0], "exact duplicates spread");
  assert.notDeepEqual(at12.get("plaza-clone"), [0, 0]);
});

test("the radius grows as you zoom out and the layout matches real-world meters", () => {
  const pair = [
    { id: "x", position: [19.58, -88.04] },
    { id: "y", position: [19.58, -88.04] },
  ];
  const meters = (offset, lat) =>
    Math.hypot(offset[0] * 111320, offset[1] * 111320 * Math.cos((lat * Math.PI) / 180));
  const near = meters(spreadOffsets(pair, 15).get("x"), 19.58);
  const far = meters(spreadOffsets(pair, 12).get("x"), 19.58);
  assert.ok(near > 0 && far > near * 3, "spread roughly doubles per zoom level out");
});
