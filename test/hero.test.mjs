import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { UI_TEXT } from "../app/i18n.mjs";

// Hero monument wordmark contract: the h1 splits text.heading at its first
// space — word 1 is a small charcoal kicker line in the editorial face, the
// remaining three words render as a centered per-letter wordmark (FELIPE /
// CARRILLO / PUERTO) in Baloo 2 weight 800, with a terracotta→turquoise
// sweep and a 4-step em-based extrusion. The language toggle sits in the
// hero card's top-right corner. The statue's literal rainbow palette exists
// behind html[data-theme="statue-faithful"] for review comparison only; the
// adapted sweep is the default and no UI exposes the toggle.
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
  assert.match(map, /style=\{\{ "--t": `\$\{sweep\}%` \}\}/, "each letter carries the sweep position");

  // Source order: kicker eyebrow → wordmark → fret → subheading → toggle.
  const eyebrow = map.indexOf('className="hero__eyebrow"');
  const h1 = map.indexOf('<h1 className="hero__wordmark">');
  const fret = map.indexOf("<GrecaBand />");
  const sub = map.indexOf('className="hero__subheading"');
  const toggle = map.indexOf('className="language-toggle"');
  assert.ok(
    eyebrow > -1 && eyebrow < h1 && h1 < fret && fret < sub && sub < toggle,
    "eyebrow, wordmark, fret, subheading, toggle render in that order",
  );
  assert.match(map, /import GrecaBand from "\.\/greca";/, "fret motif component imported");
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

test("Baloo 2 800 font loading: swap, latin + latin-ext, metric-matched fallback", () => {
  const theme = read("../app/maya-theme.css");
  const faces = [...theme.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);

  const baloo = faces.filter((f) => /font-family:\s*"Baloo 2";/.test(f));
  assert.equal(baloo.length, 2, "exactly the latin and latin-ext subsets");
  for (const face of baloo) {
    assert.match(face, /font-style:\s*normal/, "upright face");
    assert.match(face, /font-weight:\s*800/, "weight 800 only");
    assert.match(face, /font-display:\s*swap/, "swap display");
    assert.match(face, /src:\s*url\("?https:\/\/fonts\.gstatic\.com\/[^)"]+"?\)\s*format\("woff2"\)/, "woff2 source");
    assert.match(face, /unicode-range:\s*U\+[0-9A-F]+/, "subset range declared");
  }
  assert.ok(baloo.some((f) => /U\+0000-00FF/.test(f)), "latin subset present");
  assert.ok(baloo.some((f) => /U\+0100-/.test(f)), "latin-ext subset present");

  const fallback = faces.find((f) => /font-family:\s*"Baloo 2 Fallback";/.test(f));
  assert.ok(fallback, "fallback face exists");
  assert.match(fallback, /src:\s*local\(/, "fallback is a local face");
  assert.match(fallback, /size-adjust:\s*[\d.]+%/, "size-adjust for zero-CLS swap");
  assert.match(fallback, /ascent-override:\s*[\d.]+%/);
  assert.match(fallback, /descent-override:\s*[\d.]+%/);
  assert.match(fallback, /line-gap-override:\s*[\d.]+%/);

  const wordmark = theme.match(/\.hero__wordmark\s*\{([^}]*)\}/)?.[1];
  assert.match(
    wordmark,
    /font-family:\s*"Baloo 2", "Baloo 2 Fallback"/,
    "wordmark stacks the web face over the metric-matched fallback",
  );
  assert.match(wordmark, /font-size:\s*clamp\(/, "clamp sizing");
});

test("adapted terracotta→turquoise sweep is the default; statue-faithful is gated and unexposed", () => {
  const theme = read("../app/maya-theme.css");

  const letter = theme.match(/\.hero__letter\s*\{([^}]*)\}/)?.[1];
  assert.match(
    letter,
    /--c:\s*color-mix\(in oklab, var\(--turquoise\) var\(--t, 0%\), var\(--terracotta\)\)/,
    "letter color sweeps terracotta→turquoise by --t",
  );
  assert.match(
    letter,
    /--cd:\s*color-mix\(in oklab, var\(--c\) 75%, #[0-9a-f]+\)/,
    "extrusion shade ~25% darker than the letter color",
  );
  assert.match(letter, /color:\s*var\(--c\)/, "letters paint with the sweep color");

  // The faithful palette is review-only: scoped to the data-theme selector
  // and applied per statue letter line (FELIPE / CARRILLO / PUERTO).
  assert.match(
    theme,
    /html\[data-theme="statue-faithful"\]\s+\.hero__wordmark-line:nth-child\(1\)\s+\.hero__letter/,
    "FELIPE green under the faithful theme",
  );
  for (let i = 1; i <= 8; i += 1) {
    assert.match(
      theme,
      new RegExp(
        `html\\[data-theme="statue-faithful"\\]\\s+\\.hero__wordmark-line:nth-child\\(2\\)\\s+\\.hero__letter:nth-child\\(${i}\\)`,
      ),
      `CARRILLO letter ${i} pinned under the faithful theme`,
    );
  }
  assert.match(
    theme,
    /html\[data-theme="statue-faithful"\]\s+\.hero__wordmark-line:nth-child\(3\)\s+\.hero__letter/,
    "PUERTO dark red under the faithful theme",
  );

  // Unexposed: nothing in the app JS can flip the theme.
  for (const file of walk(new URL("../app", import.meta.url).pathname)) {
    assert.doesNotMatch(
      readFileSync(file, "utf8"),
      /statue-faithful/,
      `${file} must not reference the review-only theme`,
    );
  }
});

test("extrusion: four em-based stacked shadows, vertical offsets only, plus one soft ground shadow", () => {
  const theme = read("../app/maya-theme.css");
  const letter = theme.match(/\.hero__letter\s*\{([^}]*)\}/)?.[1];
  const shadow = letter.match(/text-shadow:\s*([^;]+);/)?.[1];
  assert.ok(shadow, "letter carries a text-shadow stack");

  // One layer per line — commas inside rgba() must not split the stack.
  const layers = shadow.split(/,\s*\n\s*/).map((s) => s.trim());
  assert.equal(layers.length, 5, "4 stacked steps + 1 ground shadow");
  for (const [i, layer] of layers.entries()) {
    assert.match(layer, /^0\s/, `layer ${i + 1} keeps a zero horizontal offset (vertical only)`);
  }
  for (const step of layers.slice(0, 4)) {
    assert.match(step, /^0\s+0\.\d+em\s+0\s+var\(--cd\)$/, "em-based stacked step");
  }
  assert.match(
    layers[4],
    /^0\s+0\.\d+em\s+0\.\d+em\s+rgba\(/,
    "soft ground shadow rises straight down with a blur",
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
