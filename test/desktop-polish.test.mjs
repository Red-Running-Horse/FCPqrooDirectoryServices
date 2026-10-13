import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

// Desktop polish pass (1366-1600px): the banner rotates via a whole-scene
// crossfade with its chrome in one slim bar below the image, the striped hero
// bar is gone, the city sign is capped, the map is draggable on desktop, the
// offline panel is a collapsed disclosure, and the radio section left no
// orphans. Mobile keeps its band ratio on the reserver/scenes — the only
// mobile rule removed is the container's fixed aspect-ratio, which clipped
// the bar under overflow:hidden.
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("banner auto-rotation stays live in the desktop styles", () => {
  const css = read("../app/featured-partners.css");
  const js = read("../app/featured-partners.js");

  // The whole-scene crossfade consumes the active-scene flag — the mechanism
  // the rotation animates: state flips data-active, CSS fades opacity.
  assert.match(js, /data-active=\{sceneIndex === active\}/, "active scene flag wired to state");
  assert.match(css, /\.attract__scene\s*\{[^}]*opacity:\s*0/s, "scenes start transparent");
  assert.match(css, /\.attract__scene\s*\{[^}]*transition:\s*opacity/s, "crossfade transition on the scene");
  assert.match(css, /\.attract__scene\[data-active="true"\]\s*\{[^}]*opacity:\s*1/s, "active scene fades in");

  // Desktop media query shortens the band ~45% and never kills the motion.
  const desktop = css.match(/@media\s*\(min-width:\s*48rem\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(desktop, "a desktop media query exists for the band");
  assert.match(desktop, /aspect-ratio:\s*69\s*\/\s*11/, "desktop band image area ~45% shorter");
  assert.doesNotMatch(desktop, /transition:\s*none|animation:\s*none/, "rotation animation stays live on desktop");

  // Mobile band ratio untouched — it lives on the height reserver and the
  // scenes. The container itself must never carry a fixed ratio: a
  // fixed-ratio flex container under overflow:hidden clips the in-flow bar.
  const mobile = css.match(/@media\s*\(max-width:\s*47\.99rem\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(mobile, "a mobile media query exists for the band");
  assert.doesNotMatch(mobile, /aspect-ratio/, "mobile container grows with the bar");
  assert.match(css, /\.attract::before\s*\{[^}]*aspect-ratio:\s*69\s*\/\s*20/s, "mobile image area keeps its ratio");
  assert.match(mobile, /\.attract__badge\s*\{\s*display:\s*none/s, "badge yields to the partner name on narrow screens");
  assert.doesNotMatch(css, /\.attract\s*\{[^}]*aspect-ratio/s, "container never carries a fixed ratio");
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.attract__scene\s*\{\s*transition:\s*none/s);

  // Auto-advance still interval-driven and reduced-motion gated in JS, and
  // each scene carries both breakpoint sources as custom properties that the
  // CSS consumes per breakpoint (mobile falls back to the desktop file).
  assert.match(js, /setInterval/);
  assert.match(js, /HOLD_MS = 6000/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /reduceMotion\.current\)/);
  assert.match(js, /\["--scene-desktop"\]:\s*`url\(\$\{p\.promotion\?\.mediaUrl\}\)`/, "desktop scene source per promotion");
  assert.match(js, /\["--scene-mobile"\]:\s*`url\(\$\{p\.promotion\?\.mobileMediaUrl \?\? p\.promotion\?\.mediaUrl\}\)`/, "mobile scene source with desktop fallback");
  assert.match(css, /\.attract__scene\s*\{[^}]*background-image:\s*var\(--scene-mobile\)/s, "base styles consume the mobile scene source");
  assert.match(desktop, /background-image:\s*var\(--scene-desktop\)/, "desktop styles consume the desktop scene source");
  assert.doesNotMatch(js, /attract__slice|--exit-y|SLICES/, "slice cascade fully removed");
});

test("band controls and promo link live in one slim bar below the image — zero overlay", () => {
  const js = read("../app/featured-partners.js");
  const css = read("../app/featured-partners.css");

  // Markup order: scenes + invisible click surface first, then the bar that
  // holds the link and the controls — in flow after the reserved image area.
  const imageLink = js.indexOf('className="attract__image-link"');
  const bar = js.indexOf('className="attract__bar"');
  const link = js.indexOf('className="attract__link"');
  const controls = js.indexOf('className="attract__controls"');
  assert.ok(imageLink > -1 && imageLink < bar, "click surface stays on the image area");
  assert.ok(bar > -1 && link > bar && controls > bar, "link and controls render inside the bar, below the image");

  // The bar is a single in-flow row and the visible chrome is never
  // absolutely positioned, so it cannot cover a pixel of the promotion image.
  const barRule = css.match(/\.attract__bar\s*\{([^}]*)\}/)?.[1];
  assert.match(barRule, /display:\s*flex/, "one slim row");
  for (const cls of ["attract__link", "attract__controls"]) {
    const rule = css.match(new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`))?.[1];
    assert.ok(rule, `${cls} styled`);
    assert.doesNotMatch(rule, /position:\s*(absolute|fixed)/, `${cls} never overlays the image`);
  }
  const overlay = css.match(/\.attract__image-link\s*\{([^}]*)\}/)?.[1];
  assert.match(overlay, /position:\s*absolute/, "only the invisible click surface covers the image");
});

test("premium band scenes point at per-breakpoint assets in public/promo", () => {
  const events = read("../app/events.mjs");
  for (const [id, desktopFile, mobileFile] of [
    ["promo-balam-nah", "/promo/balamnah_1920_306.webp", "/promo/promotion0_1680_487.webp"],
    ["test-partner-uno", "/promo/promotion1_1920_306.webp", "/promo/promotion1_1680_487.webp"],
    ["test-partner-dos", "/promo/promotion2_1920_306.webp", "/promo/promotion2_1680_487.webp"],
  ]) {
    const afterId = new RegExp(`id: "${id}"[\\s\\S]*$`);
    const mediaUrl = events.match(afterId)?.[0].match(/mediaUrl: "([^"]+)"/)?.[1];
    const mobileMediaUrl = events.match(afterId)?.[0].match(/mobileMediaUrl: "([^"]+)"/)?.[1];
    assert.equal(mediaUrl, desktopFile, `${id} desktop scene`);
    assert.equal(mobileMediaUrl, mobileFile, `${id} mobile scene`);
    assert.ok(existsSync(new URL(`../public${desktopFile}`, import.meta.url)), `${desktopFile} exists on disk`);
    assert.ok(existsSync(new URL(`../public${mobileFile}`, import.meta.url)), `${mobileFile} exists on disk`);
  }
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
  const map = read("../app/highway-map.js");
  assert.match(map, /src="\/img\/fcp_sign_1060_100\.webp"/, "new wide sign image wired");
  assert.match(map, /width=\{1060\}[\s\S]*?height=\{100\}/, "intrinsic dimensions match the source");
  assert.match(
    theme,
    /\.hero__mark\s*\{[^}]*max-width:\s*1060px/s,
    "exact source ratio preserved — no distortion at any width",
  );
  const mq = theme.match(/@media\s*\(min-width:\s*48rem\)\s*\{\s*\.hero__mark\s*\{([^}]*)\}/)?.[1];
  assert.ok(mq, "desktop cap exists");
  assert.match(mq, /max-width:\s*34rem/, "~544px wide → ~85px tall at the 1911:300 ratio");
  assert.match(mq, /margin-inline:\s*auto/, "centered on desktop");
});

test("desktop map is draggable from the start — the tap-to-activate guard is mobile-only", () => {
  const map = read("../app/highway-map.js");
  const theme = read("../app/maya-theme.css");

  // The overlay that flips mapActive is display:none on desktop — the old gate
  // disabled dragging at init and nothing could ever re-enable it.
  assert.match(theme, /\.map-mobile-overlay\s*\{\s*display:\s*none/s, "overlay unreachable on desktop");

  // Dragging is now gated by the mobile guard only: desktop maps start
  // interactive and follow the breakpoint in both directions.
  assert.match(map, /mapActive \|\| desktopMap/, "dragging enabled when interactive or on desktop");
  assert.match(map, /window\.matchMedia\("\(min-width: 48rem\)"\)/, "desktop breakpoint detected");
  assert.match(
    map,
    /if \(!mapActiveRef\.current && !window\.matchMedia\("\(min-width: 48rem\)"\)\.matches\) \{\s*map\.dragging\.disable\(\);/,
    "init-time disable applies only under the mobile guard",
  );
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
