import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { UI_TEXT } from "../app/i18n.mjs";

// Hero monument wordmark contract: the h1 splits text.heading at its first
// space — word 1 is a small charcoal kicker line in the editorial face, the
// remaining three words render as a centered per-letter wordmark (FELIPE /
// CARRILLO / PUERTO) in Titan One's heavy slot, over an asymmetric carved
// extrusion. FELIPE is solid terracotta, PUERTO solid turquoise, and
// CARRILLO's eight letters each carry a discrete paint from the adapted
// palette — no gradient, no inner pattern, flat fills only. The turquoise
// eyebrow kicker sits
// centered above the wordmark — clearing the corner toggle at narrow
// widths — and the caption is centered below. The wordmark carries no
// fret. The language toggle sits in the hero card's top-right corner.
// The palette is the monument's own, worn as brand imagery: the letter
// stack is aria-hidden and a visually-hidden span keeps the full
// sentence available to screen readers. There is no alternate theme.
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.(mjs|js|jsx)$/.test(entry.name)) yield path;
  }
}

test("heading shape: one verb + the invariant three-word name, in both languages", () => {
  const names = [];
  for (const lang of ["es", "en"]) {
    const words = UI_TEXT[lang].heading.split(" ");
    assert.equal(words.length, 4, `${lang}: heading must be one verb + a three-word name`);
    assert.ok(/^\p{L}+$/u.test(words[0]), `${lang}: leading word is a single verb`);
    assert.deepEqual(
      words.slice(1),
      ["Felipe", "Carrillo", "Puerto"],
      `${lang}: the proper name stays a three-word invariant`,
    );
    names.push(words.slice(1).join(" "));
  }
  assert.equal(names[0], names[1], "the proper name must not be translated");
});

test("one h1, a centered wordmark stack derived from the heading split", () => {
  const map = read("../app/highway-map.js");

  assert.equal((map.match(/<h1[\s>]/g) ?? []).length, 1, "exactly one h1");
  assert.match(
    map,
    /const \[headingLead, \.\.\.wordmarkWords\] = text\.heading\.split\(" "\)/,
    "wordmark derived from a split at the first space",
  );
  assert.match(map, /<section className="hero" aria-label=\{text\.heading\}>/, "hero keeps its labelled section");
  assert.match(map, /<h1 className="hero__wordmark">/, "h1 is the wordmark");
  assert.match(
    map,
    /<span className="hero__wordmark-lead">\{headingLead\}<\/span>\{" "\}/,
    "a real space separates the kicker from the name in the h1 text",
  );
  assert.match(map, /className="hero__wordmark-stack"/, "wordmark lines stack");
  assert.match(map, /className="hero__wordmark-line"/, "one line per name word");
  assert.match(map, /className="hero__letter"/, "one span per letter");
  assert.doesNotMatch(map, /"--t"/, "letters carry no inline sweep variable (the gradient is gone)");
  assert.doesNotMatch(map, /const sweep =/, "no sweep interpolation in the markup");

  // No fret under the wordmark: the hero markup renders no raw SVG
  // pattern markup (no inline <svg>/<defs>/<pattern> of any kind).
  const heroMarkup = map.slice(
    map.indexOf('<section className="hero"'),
    map.indexOf("</section>", map.indexOf('<section className="hero"')),
  );
  assert.doesNotMatch(heroMarkup, /<svg/, "no svg inlined in the hero markup");
  assert.doesNotMatch(heroMarkup, /<defs/, "no raw <defs> in the hero markup");
  assert.doesNotMatch(heroMarkup, /greca-pattern/, "no raw greca-pattern in the hero markup");

  // The three name lines stack base-to-top as one unit.
  const theme = read("../app/maya-theme.css");
  const stack = theme.match(/\.hero__wordmark-stack\s*\{([^}]*)\}/)?.[1];
  const gap = Number(stack.match(/gap:\s*([\d.]+)em/)?.[1]);
  assert.ok(gap >= 0.05 && gap <= 0.1, `name-line gap is ${gap}em — tight, within the 0.05–0.1em spec`);

  // Source order: kicker → wordmark → subheading → toggle.
  const eyebrow = map.indexOf('className="hero__eyebrow"');
  const h1 = map.indexOf('<h1 className="hero__wordmark">');
  const sub = map.indexOf('className="hero__subheading"');
  const toggle = map.indexOf('className="language-toggle"');
  assert.ok(
    eyebrow > -1 && eyebrow < h1 && h1 < sub && sub < toggle,
    "kicker, wordmark, subheading, toggle render in that order",
  );
});

test("hero stays text-forward: sign image gone, no hero__mark anywhere", () => {
  const map = read("../app/highway-map.js");
  const style = read("../app/style.css");
  const theme = read("../app/maya-theme.css");

  assert.doesNotMatch(map, /hero__mark/, "markup removed");
  assert.doesNotMatch(map, /<img/, "no image asset anywhere in the map/hero markup");
  assert.doesNotMatch(style, /hero__mark/, "no base rule");
  assert.doesNotMatch(theme, /hero__mark/, "no theme rule");
  assert.ok(
    !existsSync(new URL("../public/img/fcp_sign_1060_100.webp", import.meta.url)),
    "sign file removed from public/img",
  );
  assert.ok(
    !existsSync(new URL("../public/img/fcp-sign.webp", import.meta.url)),
    "legacy sign file removed from public/img",
  );
});

test("Titan One font loading: heavy slot, swap, latin + latin-ext, metric-matched fallback", () => {
  const theme = read("../app/maya-theme.css");
  const faces = [...theme.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);

  const titan = faces.filter((f) => /font-family:\s*"Titan One";/.test(f));
  assert.equal(titan.length, 2, "exactly the latin and latin-ext subsets");
  for (const face of titan) {
    assert.match(face, /font-style:\s*normal/, "upright face");
    assert.match(face, /font-weight:\s*800/, "serves the wordmark's heavy slot");
    assert.match(face, /font-display:\s*swap/, "swap display");
    assert.match(face, /src:\s*url\("?https:\/\/fonts\.gstatic\.com\/[^)"]+"?\)\s*format\("woff2"\)/, "woff2 source");
    assert.match(face, /unicode-range:\s*U\+[0-9A-F]+/, "subset range declared");
  }
  assert.ok(titan.some((f) => /U\+0000-00FF/.test(f)), "latin subset present");
  assert.ok(titan.some((f) => /U\+0100-/.test(f)), "latin-ext subset present");

  const fallback = faces.find((f) => /font-family:\s*"Titan One Fallback";/.test(f));
  assert.ok(fallback, "fallback face exists");
  assert.match(fallback, /src:\s*local\(/, "fallback is a local face");
  assert.match(fallback, /size-adjust:\s*[\d.]+%/, "size-adjust for zero-CLS swap");
  assert.match(fallback, /ascent-override:\s*[\d.]+%/);
  assert.match(fallback, /descent-override:\s*[\d.]+%/);
  assert.match(fallback, /line-gap-override:\s*[\d.]+%/);

  const wordmark = theme.match(/\.hero__wordmark\s*\{([^}]*)\}/)?.[1];
  assert.match(
    wordmark,
    /font-family:\s*"Titan One", "Titan One Fallback"/,
    "wordmark stacks the web face over the metric-matched fallback",
  );
  assert.match(wordmark, /font-size:\s*clamp\(/, "clamp sizing");
});

test("statue palette: the monument's literal colors are the default — no toggle, no adapted terracotta", () => {
  const theme = read("../app/maya-theme.css");
  const map = read("../app/highway-map.js");

  // The continuous sweep is gone and must not come back: no interpolated
  // variable in the markup, no color-mix gradient in the letter face.
  assert.doesNotMatch(map, /"--t"/, "letters carry no sweep variable");
  assert.doesNotMatch(map, /letterIndex \/ Math\.max/, "no per-letter interpolation");
  const letter = theme.match(/\.hero__letter\s*\{([^}]*)\}/)?.[1];
  assert.doesNotMatch(
    letter,
    /var\(--t[,)]|--c:\s*color-mix\(\s*in oklab,\s*var\(--turquoise\)/,
    "letter face holds no gradient",
  );
  assert.match(letter, /--c:\s*#0bd133/, "FELIPE is the statue's green, by exact value");
  assert.doesNotMatch(
    letter,
    /--c:\s*var\(--terracotta\)/,
    "the adapted-terracotta default is gone",
  );
  assert.match(
    letter,
    /--cd:\s*color-mix\(in oklab, var\(--c\) 75%, #[0-9a-f]+\)/,
    "extrusion shade derives from the letter's own color",
  );
  assert.match(letter, /color:\s*var\(--c\)/, "letters paint with their solid color");

  // CARRILLO: the monument's own sequence, one DISCRETE paint per letter
  // — red, pink, green, yellow, purple, red, orange, blue. Exact pins: a
  // gradient or the adapted journey cannot pass.
  const expected = [
    "#eb0507",
    "#fa084e",
    "#0cc737",
    "#fcba08",
    "#7b116d",
    "#d00b1c",
    "#ed9c13",
    "#05a3dd",
  ];
  const paints = [
    ...theme.matchAll(
      /^\.hero__wordmark-line:nth-child\(2\) \.hero__letter:nth-child\((\d)\) \{\s*--c:\s*([^;]+);/gm,
    ),
  ];
  assert.equal(paints.length, 8, "exactly one paint rule per CARRILLO letter");
  const distinct = new Set();
  for (const [, idx, color] of paints) {
    assert.equal(color.trim(), expected[Number(idx) - 1], `CARRILLO letter ${idx} paint`);
    distinct.add(color.trim());
  }
  assert.equal(distinct.size, 8, "all eight paints are distinct — discrete, like the monument");
  assert.doesNotMatch(
    theme,
    /#a36416|#947818|#7d8732|#5a9051|#2c926f|#008c88/,
    "the adapted-terracotta journey is gone",
  );

  assert.match(
    theme,
    /^\.hero__wordmark-line:nth-child\(3\) \.hero__letter\s*\{[^}]*--c:\s*#931410/m,
    "PUERTO is the base's dark red, by exact value",
  );

  // No toggle construct remains, in the stylesheet or anywhere in app JS.
  assert.doesNotMatch(theme, /data-theme/, "no theme gate in the stylesheet");
  assert.doesNotMatch(theme, /statue-faithful/, "the review-only theme name is gone");
  for (const file of walk(new URL("../app", import.meta.url).pathname)) {
    assert.doesNotMatch(
      readFileSync(file, "utf8"),
      /statue-faithful|data-theme/,
      `${file} must not reference a theme toggle`,
    );
  }
});

test("extrusion: asymmetric carved side-faces, vertical bias, strengthened ground shadow", () => {
  const theme = read("../app/maya-theme.css");
  const letter = theme.match(/\.hero__letter\s*\{([^}]*)\}/)?.[1];
  assert.match(
    letter,
    /--cds:\s*color-mix\(in oklab, var\(--c\) \d+%, #[0-9a-f]+\)/,
    "a darker side tone drives the left face",
  );
  const shadow = letter.match(/text-shadow:\s*([^;]+);/)?.[1];
  assert.ok(shadow, "letter carries a text-shadow stack");

  // One layer per line — commas inside rgba() must not split the stack.
  const layers = shadow.split(/,\s*\n\s*/).map((s) => s.trim());
  assert.equal(layers.length, 7, "3 down-left + 3 down-right steps + 1 ground shadow");

  const left = layers.filter((l) => l.startsWith("-"));
  const right = layers.filter((l) => /^0\./.test(l));
  assert.equal(left.length, 3, "three down-left stacked steps");
  assert.equal(right.length, 3, "three down-right stacked steps");
  for (const [i, layer] of left.entries()) {
    const m = layer.match(/^-([\d.]+)em\s+([\d.]+)em\s+0\s+var\(--cds\)$/);
    assert.ok(m, `left step ${i + 1} is an em-based --cds stack`);
    assert.ok(parseFloat(m[2]) > parseFloat(m[1]), `left step ${i + 1} keeps vertical bias`);
  }
  for (const [i, layer] of right.entries()) {
    const m = layer.match(/^([\d.]+)em\s+([\d.]+)em\s+0\s+var\(--cd\)$/);
    assert.ok(m, `right step ${i + 1} is an em-based --cd stack`);
    assert.ok(parseFloat(m[2]) > parseFloat(m[1]), `right step ${i + 1} keeps vertical bias`);
  }
  assert.match(
    layers[6],
    /^0\s+0\.\d+em\s+0\.\d+em\s+rgba\(\s*36,\s*28,\s*21,\s*0\.3\d\s*\)$/,
    "strengthened soft ground shadow rising straight down",
  );
});

test("letters are flat solid fills — no inner pattern, nothing softening the glyphs", () => {
  const theme = read("../app/maya-theme.css");
  const letter = theme.match(/\.hero__letter\s*\{([^}]*)\}/)?.[1];

  assert.doesNotMatch(letter, /background-image:/, "no inner pattern on the letters");
  assert.doesNotMatch(letter, /background-clip/, "nothing clipped inside the glyphs");
  assert.doesNotMatch(letter, /filter:|blur\(/, "no blur on the letter layer");
  assert.match(letter, /color:\s*var\(--c\)/, "letters paint as flat solid fills");
});

test("wordmark accessibility: brand imagery to the eye, the sentence to screen readers", () => {
  const map = read("../app/highway-map.js");

  // The per-letter stack is decorative — aria-hidden keeps screen readers
  // from spelling letter-by-letter...
  assert.match(
    map,
    /<span className="hero__wordmark-stack" aria-hidden="true">/,
    "the letter stack is hidden from assistive tech",
  );
  // ...and the full name ships in a visually-hidden span inside the h1.
  assert.match(
    map,
    /<span className="visually-hidden"> \{wordmarkWords\.join\(" "\)\}<\/span>/,
    "the sentence text stays available to screen readers",
  );
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

test("hero composition is fully centered — kicker above, caption below", () => {
  const theme = read("../app/maya-theme.css");
  const map = read("../app/highway-map.js");

  // The eyebrow opens the centered stack: its top margin clears the corner
  // toggle at narrow widths, where the centered kicker shares the top band.
  const eyebrow = theme.match(/\.hero__eyebrow\s*\{([^}]*)\}/)?.[1];
  assert.match(eyebrow, /text-align:\s*center/, "eyebrow centered");
  assert.match(eyebrow, /margin:\s*2\.7rem 0 0\.3rem/, "toggle clearance above, air below");

  // Source order inside the section: kicker, then the wordmark, then caption.
  const kicker = map.indexOf('className="hero__eyebrow"');
  const h1 = map.indexOf('<h1 className="hero__wordmark">');
  const caption = map.indexOf('className="hero__subheading"');
  assert.ok(
    kicker > -1 && kicker < h1 && h1 < caption,
    "kicker renders above the wordmark, caption below",
  );

  // No left-aligned remnants of the old title block.
  const sub = theme.match(/\.hero__subheading\s*\{([^}]*)\}/)?.[1];
  assert.match(sub, /text-align:\s*center/, "caption centered");
  assert.match(sub, /margin-inline:\s*auto/, "caption block centered on desktop");
});

test("monument scale: desktop clamp raises CARRILLO to ~70–80% of the hero width", () => {
  const theme = read("../app/maya-theme.css");
  const desktop = theme.match(/@media\s*\(min-width:\s*48rem\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(desktop, "desktop media query exists");

  const wordmark = desktop.match(/\.hero__wordmark\s*\{([^}]*)\}/)?.[1];
  assert.match(
    wordmark,
    /font-size:\s*clamp\(4\.5rem,\s*9\.4vw,\s*13rem\)/,
    "desktop wordmark clamp sized for the 500–540px hero-height target",
  );

  const lead = desktop.match(/\.hero__wordmark-lead\s*\{([^}]*)\}/)?.[1];
  assert.match(lead, /font-size:\s*clamp\(/, "lead keeps a smaller, consistent measure");

  // Above the breakpoint the centered kicker clears the toggle horizontally,
  // so it needs only a breath of air — not the narrow-width clearance.
  const eyebrow = desktop.match(/\.hero__eyebrow\s*\{([^}]*)\}/)?.[1];
  assert.match(eyebrow, /margin-top:\s*0\.4rem/, "desktop kicker sits near the card's top");
});

test("CARRILLO light-sweep garnish: slow pass, CARRILLO only, frozen under reduced motion", () => {
  const theme = read("../app/maya-theme.css");
  const map = read("../app/highway-map.js");

  // The overlay copy is fed from the same i18n-derived word.
  assert.match(
    map,
    /className="hero__wordmark-line" key=\{word\} data-word=\{word\}>/,
    "each line carries data-word for the sheen overlay",
  );

  // The sheen layer exists on the middle line only.
  const sheen = theme.match(/\.hero__wordmark-line:nth-child\(2\)::after\s*\{([^}]*)\}/)?.[1];
  assert.ok(sheen, "sheen overlay on CARRILLO (::after of line 2)");
  assert.match(sheen, /content:\s*attr\(data-word\)/, "overlay mirrors the wordmark text");
  assert.match(sheen, /background-clip:\s*text/, "sheen clipped to the letterforms");
  assert.match(sheen, /-webkit-background-clip:\s*text/, "webkit clip for the overlay");
  assert.match(
    sheen,
    /rgba\(255,\s*2\d\d,\s*1\d\d,\s*0\.55\)/,
    "translucent warm sheen",
  );
  assert.match(sheen, /animation:\s*hero-wordmark-sheen\s+25s\s+linear\s+infinite/, "~25s linear pass");
  assert.match(theme, /@keyframes\s+hero-wordmark-sheen/, "sheen keyframes exist");
  assert.doesNotMatch(
    theme,
    /\.hero__wordmark-line:nth-child\([13]\)::after/,
    "sweep never touches FELIPE or PUERTO",
  );

  // Reduced motion parks the sweep off-text as a static frame.
  const reduced = theme.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(reduced, "a reduced-motion query exists");
  assert.match(
    reduced,
    /\.hero__wordmark-line:nth-child\(2\)::after\s*\{\s*animation:\s*none/s,
    "sheen frozen under reduced motion",
  );
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
