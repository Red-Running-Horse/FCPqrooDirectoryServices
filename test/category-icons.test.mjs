import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORIES } from "../app/attractions.mjs";
import { categoryIconSvg } from "../app/category-icons.mjs";

test("every category has a distinct, non-empty inline SVG icon", () => {
  const icons = CATEGORIES.map(({ id }) => categoryIconSvg(id));
  for (const [index, icon] of icons.entries()) {
    const { id } = CATEGORIES[index];
    assert.ok(icon.startsWith("<svg"), id);
    assert.ok(icon.endsWith("</svg>"), id);
    assert.match(icon, /viewBox="0 0 24 24"/, id);
    assert.match(icon, /<(path|circle)\b/, id);
  }
  assert.equal(new Set(icons).size, CATEGORIES.length);
});

test("icons are decorative, keyboard-inert and consistently stroked", () => {
  for (const { id } of CATEGORIES) {
    const icon = categoryIconSvg(id);
    assert.match(icon, /aria-hidden="true"/, id);
    assert.match(icon, /focusable="false"/, id);
    assert.match(icon, /fill="none"/, id);
    assert.match(icon, /stroke="currentColor"/, id);
    assert.match(icon, /stroke-linecap="round"/, id);
    assert.match(icon, /stroke-linejoin="round"/, id);
  }
});

test("unknown categories fall back to the all icon", () => {
  const fallback = categoryIconSvg("all");
  assert.equal(categoryIconSvg("does-not-exist"), fallback);
  assert.equal(categoryIconSvg(undefined), fallback);
  assert.equal(categoryIconSvg(null), fallback);
  assert.equal(categoryIconSvg(""), fallback);
});

test("size and class options are applied and kept markup-safe", () => {
  const icon = categoryIconSvg("food", { size: 28, className: "marker-icon" });
  assert.match(icon, /class="marker-icon"/);
  assert.match(icon, /width="28" height="28"/);

  const unsafe = categoryIconSvg("food", { size: '"><script>', className: '"><script>' });
  assert.ok(!unsafe.includes("<script"));
  assert.match(unsafe, /width="20" height="20"/);
});
