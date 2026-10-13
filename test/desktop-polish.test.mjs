import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Desktop polish pass (1366-1600px): the banner rotates and is compact, the
// striped hero bar is gone, the city sign is capped, the offline panel is a
// collapsed disclosure, and the radio section left no orphans. Mobile rules
// must stay untouched — every pin here lives in a min-width media query or
// asserts an absence.
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("banner auto-rotation stays live in the desktop styles", () => {
  const css = read("../app/featured-partners.css");
  const js = read("../app/featured-partners.js");

  // The slice cascade consumes the per-scene exit direction (alternating
  // split/reform) — the mechanism the rotation animates.
  assert.match(css, /\.attract__slice\s*\{[^}]*translateY\(var\(--exit-y/s, "exit direction consumed");

  // Desktop media query shortens the band ~45% and never kills the motion.
  const desktop = css.match(/@media\s*\(min-width:\s*48rem\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(desktop, "a desktop media query exists for the band");
  assert.match(desktop, /aspect-ratio:\s*69\s*\/\s*11/, "desktop band image area ~45% shorter");
  assert.doesNotMatch(desktop, /transition:\s*none|animation:\s*none/, "rotation animation stays live on desktop");

  // Mobile band ratio untouched, reduced-motion still the only kill switch.
  const mobile = css.match(/@media\s*\(max-width:\s*47\.99rem\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.match(mobile, /aspect-ratio:\s*69\s*\/\s*20/, "mobile band keeps its ratio");
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.attract__slice\s*\{\s*transition:\s*none/s);

  // Auto-advance still interval-driven and reduced-motion gated in JS, and
  // slices cover-crop (never stretch) on the shorter desktop band.
  assert.match(js, /setInterval/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /reduceMotion\.current\)/);
  assert.match(js, /backgroundSize:\s*`\$\{SLICES \* 100\}% auto`/, "cover-crop, no vertical stretch");
});

test("div.hero_bar is fully gone — markup and both CSS layers", () => {
  const map = read("../app/highway-map.js");
  const style = read("../app/style.css");
  const theme = read("../app/maya-theme.css");
  assert.doesNotMatch(map, /hero__bar/, "no markup");
  assert.doesNotMatch(style, /hero__bar/, "no base rule");
  assert.doesNotMatch(theme, /hero__bar/, "no theme override");
});

test("hero mark is capped on desktop and stays proportional on mobile", () => {
  const theme = read("../app/maya-theme.css");
  assert.match(
    theme,
    /\.hero__mark\s*\{[^}]*aspect-ratio:\s*1200\s*\/\s*345/s,
    "exact source ratio preserved — no distortion at any width",
  );
  const mq = theme.match(/@media\s*\(min-width:\s*48rem\)\s*\{\s*\.hero__mark\s*\{([^}]*)\}/)?.[1];
  assert.ok(mq, "desktop cap exists");
  assert.match(mq, /max-width:\s*34rem/, "~544px wide → ~156px tall at the 1200:345 ratio");
});

test("offline panel is a keyboard-accessible disclosure, collapsed by default", () => {
  const map = read("../app/highway-map.js");
  const tag = map.match(/<details[^>]*className="offline-management"[^>]*>/s)?.[0];
  assert.ok(tag, "the panel is a details element");
  assert.doesNotMatch(tag, /\bopen\b/, "collapsed by default — no open attribute");
  assert.match(tag, /ref=\{offlineDetailsRef\}/, "wired so the quickbar link can open it");
  assert.match(map, /<summary className="offline-management__summary">[\s\S]*?offline-management__summary-label[\s\S]*?<\/summary>/, "summary trigger with dot + short label");
  assert.match(map, /offlineDetailsRef\.current\.open = true/, "quickbar link expands the panel after the jump");
  assert.match(map, /id="offline-management-heading" className="visually-hidden"/, "heading kept for assistive tech");

  const style = read("../app/style.css");
  assert.match(style, /\.offline-management__summary\s*\{[^}]*cursor:\s*pointer/s, "summary styled as the trigger");
  assert.match(style, /\.offline-management__summary::-webkit-details-marker/s, "native marker suppressed");
});

test("radio section is gone with no orphaned markup, strings, or styles", () => {
  const map = read("../app/highway-map.js");
  const i18n = read("../app/i18n.mjs");
  assert.doesNotMatch(map, /radio-heading/, "section markup removed");
  assert.doesNotMatch(map, /radios\.inpi\.gob\.mx/, "stream link removed from the homepage");
  assert.doesNotMatch(i18n, /radioHeading|radioDescription|radioListen|radioUnavailable/, "no orphaned UI strings");
  // The shared business-cta styles must survive for the remaining CTA card.
  assert.match(read("../app/style.css"), /\.business-cta\s*\{/);
  assert.match(map, /<section className="business-cta" aria-labelledby="business-cta-heading">/);
});
