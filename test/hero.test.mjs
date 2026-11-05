import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { UI_TEXT } from "../app/i18n.mjs";

// Hero contract — monument letters edition: the hero renders the Blender
// letter render (public/img/fcp-letters.webp, backdrop baked to the card
// cream #fff7e8) as one aria-hidden image inside the h1; the h1 keeps the
// full localized sentence for screen readers in a visually-hidden span.
// No letter-span machinery survives — no per-letter spans, no paint or
// extrusion custom properties, no wordmark webfont, no sheen. The eyebrow,
// caption and corner language toggle are unchanged.
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("hero renders the monument letters image inside one accessible h1", () => {
  const map = read("../app/highway-map.js");

  assert.equal((map.match(/<h1[\s>]/g) ?? []).length, 1, "exactly one h1");
  assert.match(map, /<section className="hero" aria-label=\{text\.heading\}>/, "hero keeps its labelled section");
  assert.match(
    map,
    /<span className="hero__wordmark-visual" aria-hidden="true">/,
    "the visual layer is aria-hidden brand imagery",
  );
  assert.match(
    map,
    /<img\s+className="hero__letters"\s+src="\/img\/fcp-letters\.webp"\s+alt=""\s+width=\{1920\}\s+height=\{852\}/,
    "the letters image ships with intrinsic dimensions for zero CLS",
  );
  assert.match(
    map,
    /<span className="visually-hidden">\{text\.heading\}<\/span>/,
    "the h1 carries the full localized sentence for screen readers",
  );
  for (const lang of ["es", "en"]) {
    assert.ok(UI_TEXT[lang].heading.length > 0, `${lang}: heading string feeds the sr-only sentence`);
  }

  // Source order: eyebrow → wordmark → caption → toggle.
  const eyebrow = map.indexOf('className="hero__eyebrow"');
  const h1 = map.indexOf('<h1 className="hero__wordmark">');
  const sub = map.indexOf('className="hero__subheading"');
  const toggle = map.indexOf('className="language-toggle"');
  assert.ok(
    eyebrow > -1 && eyebrow < h1 && h1 < sub && sub < toggle,
    "eyebrow, wordmark, caption, toggle render in that order",
  );

  // No inline SVG of any kind in the hero markup.
  const heroMarkup = map.slice(
    map.indexOf('<section className="hero"'),
    map.indexOf("</section>", map.indexOf('<section className="hero"')),
  );
  assert.doesNotMatch(heroMarkup, /<svg/, "no svg inlined in the hero markup");
});

test("the letters asset exists on disk at public/img/fcp-letters.webp", () => {
  assert.ok(
    existsSync(new URL("../public/img/fcp-letters.webp", import.meta.url)),
    "the Blender render ships with the repo",
  );
});

test("letter-span machinery is fully gone from markup and both CSS layers", () => {
  const map = read("../app/highway-map.js");
  const style = read("../app/style.css");
  const theme = read("../app/maya-theme.css");

  for (const [name, source] of [["markup", map], ["style.css", style], ["maya-theme.css", theme]]) {
    assert.doesNotMatch(source, /hero__letter\b/, `${name}: no per-letter spans`);
    assert.doesNotMatch(source, /hero__wordmark-(line|stack|lead)\b/, `${name}: no wordmark lines/stack/lead`);
    assert.doesNotMatch(source, /--cd\b|--cds\b|--c:\s*#0bd133/, `${name}: no paint/extrusion properties`);
    assert.doesNotMatch(source, /hero-wordmark-sheen|hero__wordmark-line::after/, `${name}: no sheen layer`);
    assert.doesNotMatch(source, /Titan One/, `${name}: no wordmark webfont`);
  }
  assert.doesNotMatch(map, /hero__mark/, "old sign markup stays gone");
  assert.ok(
    !existsSync(new URL("../public/img/fcp_sign_1060_100.webp", import.meta.url)),
    "sign file removed from public/img",
  );
});

test("letters sizing: fluid width on mobile, ~54% at desktop, height auto", () => {
  const theme = read("../app/maya-theme.css");

  const base = theme.match(/\.hero__letters\s*\{([^}]*)\}/)?.[1];
  assert.match(base, /width:\s*88%/, "fluid width on narrow screens");
  assert.match(base, /height:\s*auto/, "height follows the baked aspect");
  assert.doesNotMatch(base, /height:\s*\d+(\.\d+)?px/, "no fixed pixel height");

  const desktop = theme.match(/@media\s*\(min-width:\s*48rem\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.match(desktop, /\.hero__letters\s*\{[^}]*width:\s*56%/, "desktop pins ~56% of the hero card");
});

test("language toggle parks in the hero card's top-right corner, padding-aware", () => {
  const theme = read("../app/maya-theme.css");
  const map = read("../app/highway-map.js");

  const hero = theme.match(/\.hero\s*\{([^}]*)\}/)?.[1];
  assert.match(hero, /position:\s*relative/, "hero card anchors the corner toggle");
  const toggle = theme.match(/\.language-toggle\s*\{([^}]*)\}/)?.[1];
  assert.match(toggle, /position:\s*absolute/, "toggle is positioned, not in flow");
  assert.match(toggle, /top:\s*0\.7rem/, "toggle inset matches the hero card padding");
  assert.match(toggle, /inset-inline-end:\s*0\.8rem/, "toggle flush to the card's right padding");

  const desktop = theme.match(/@media\s*\(min-width:\s*48rem\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(desktop, "desktop media query exists");
  assert.match(desktop, /\.language-toggle\s*\{[^}]*top:\s*0\.9rem/s, "toggle follows the desktop padding");
  assert.match(desktop, /inset-inline-end:\s*1rem/, "toggle follows the desktop side padding");

  // Behavior and accessibility are unchanged: same group, same buttons.
  assert.match(map, /className="language-toggle" role="group" aria-label=\{`\$\{text\.languageLabel\} \/ Language`\}/);
  assert.match(map, /aria-pressed=\{language === id\}/, "pressed state still drives the active language");
});

test("hero composition is fully centered — eyebrow above, caption below", () => {
  const theme = read("../app/maya-theme.css");
  const map = read("../app/highway-map.js");

  const eyebrow = theme.match(/\.hero__eyebrow\s*\{([^}]*)\}/)?.[1];
  assert.match(eyebrow, /text-align:\s*center/, "eyebrow centered");
  assert.match(eyebrow, /margin:\s*2\.7rem 0 0\.3rem/, "toggle clearance above, air below");
  const kicker = map.indexOf('className="hero__eyebrow"');
  const h1 = map.indexOf('<h1 className="hero__wordmark">');
  const caption = map.indexOf('className="hero__subheading"');
  assert.ok(kicker > -1 && kicker < h1 && h1 < caption, "eyebrow above the letters, caption below");

  const sub = theme.match(/\.hero__subheading\s*\{([^}]*)\}/)?.[1];
  assert.match(sub, /text-align:\s*center/, "caption centered");
  assert.match(sub, /margin-inline:\s*auto/, "caption block centered on desktop");
});

test("hero never fixes a pixel height", () => {
  for (const path of ["../app/style.css", "../app/maya-theme.css"]) {
    const css = read(path);
    const heroRules = css.match(/\.hero[^{]*\{[^}]*\}/g) ?? [];
    assert.ok(heroRules.length > 0, `${path} has hero-scoped rules`);
    for (const rule of heroRules) {
      assert.doesNotMatch(
        rule,
        /(min-|max-)?height:\s*\d+(\.\d+)?px/,
        `no fixed pixel height in ${rule.split("{")[0].trim()}`,
      );
    }
  }
});
