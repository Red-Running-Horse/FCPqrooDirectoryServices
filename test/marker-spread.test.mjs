import assert from "node:assert/strict";
import test from "node:test";

import { SPREAD_ANCHOR_ZOOM, SPREAD_FLOOR_ZOOM, spreadOffsets } from "../app/marker-spread.mjs";

test("coincident markers spread only inside the zoom window, deterministically", () => {
  const items = [
    { id: "a", position: [19.5, -88.0] },
    { id: "b", position: [19.5, -88.0] },
    { id: "c", position: [19.5, -88.0] },
    { id: "solo", position: [19.6, -88.1] },
  ];
  const mid = spreadOffsets(items, 15);

  assert.deepEqual(mid.get("solo"), [0, 0], "singletons are untouched");
  const stack = ["a", "b", "c"].map((id) => mid.get(id));
  assert.ok(stack.every(([x, y]) => Math.hypot(x, y) > 0), "stack members spread in the window");
  assert.equal(new Set(stack.map(String)).size, 3, "all offsets distinct");

  assert.deepEqual(spreadOffsets(items, 15), mid, "deterministic across calls");
  const shuffled = spreadOffsets([items[2], items[0], items[3], items[1]], 15);
  assert.deepEqual(shuffled.get("b"), mid.get("b"), "id-based: input order does not matter");

  assert.deepEqual(spreadOffsets(items, SPREAD_FLOOR_ZOOM - 1).get("a"), [0, 0], "no spread below the floor zoom");
  assert.deepEqual(spreadOffsets(items, SPREAD_ANCHOR_ZOOM).get("a"), [0, 0], "converges at the anchor zoom");
  assert.deepEqual(spreadOffsets(items, SPREAD_ANCHOR_ZOOM + 2).get("b"), [0, 0]);
});

test("only EXACT coincidences spread; near-neighbours keep their true position", () => {
  const items = [
    { id: "plaza", position: [19.578135173994557, -88.0460485056746] },
    { id: "nojkaaj", position: [19.57814, -88.04605] },
    { id: "plaza-clone", position: [19.578135173994557, -88.0460485056746] },
  ];
  const mid = spreadOffsets(items, 15);
  assert.deepEqual(mid.get("nojkaaj"), [0, 0], "near-duplicates keep their true coordinates");
  assert.notDeepEqual(mid.get("plaza"), [0, 0]);
  assert.notDeepEqual(mid.get("plaza-clone"), [0, 0]);
  const low = spreadOffsets(items, SPREAD_FLOOR_ZOOM - 1);
  assert.deepEqual(low.get("plaza"), [0, 0], "below the floor even exact duplicates stay put");
});

test("the radius is a constant screen size inside the window", () => {
  const pair = [
    { id: "x", position: [19.58, -88.04] },
    { id: "y", position: [19.58, -88.04] },
  ];
  const meters = (offset, lat, zoom) => {
    const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
    return Math.hypot(offset[0] * 111320, offset[1] * 111320 * Math.cos((lat * Math.PI) / 180)) / mpp;
  };
  const px = (z) => meters(spreadOffsets(pair, z).get("x"), 19.58, z);
  assert.ok(Math.abs(px(15) - px(17)) < 1, "same pixel spread at any in-window zoom");
  assert.equal(px(SPREAD_FLOOR_ZOOM - 1), 0, "zero below the floor");
});
