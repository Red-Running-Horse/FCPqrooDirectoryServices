import assert from "node:assert/strict";
import test from "node:test";
import { roadLabel } from "../app/road-label.mjs";

test("keeps named roads, including streets with numbers", () => {
  assert.equal(roadLabel("  Ramal a X - Yatil  "), "Ramal a X - Yatil");
  assert.equal(roadLabel("1 Oriente"), "1 Oriente");
});

test("omits missing, placeholder and numeric code-like names", () => {
  for (const name of [null, undefined, "", "   ", "N/D", " n/d ", "N/A", "63", "47 A", "QR-307", "307/2"]) {
    assert.equal(roadLabel(name), null, String(name));
  }
});
