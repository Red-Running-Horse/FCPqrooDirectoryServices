import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { UI_TEXT } from "../app/i18n.mjs";

// Single-language pages + site-wide language persistence.
//
// Mechanism: the nav toggle publishes <html lang> (layout-level provider).
// Static-export pages can't know the visitor's language at prerender time,
// so bilingual copy ships in both variants and CSS shows only the active
// one (.l10n-es / .l10n-en gate classes keyed on html[lang]). The persisted
// choice is restored by an inline <head> script BEFORE first paint (no
// flash of the wrong language on hard navigation), and the prerendered
// HTML stays Spanish-primary.
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("STEP 0 — persistence: inline head script restores <html lang> before first paint; provider adopts and writes back", () => {
  const layout = read("../app/layout.js");
  const provider = read("../app/site-language.js");

  // The script sits in <head>, before <body>, reads the same storage key the
  // provider writes, and only accepts the two known language ids.
  const headAt = layout.indexOf("<head>");
  const scriptAt = layout.indexOf("localStorage.getItem(");
  const bodyAt = layout.indexOf("<body>");
  assert.ok(headAt > -1 && scriptAt > headAt && scriptAt < bodyAt, "inline script runs before the body parses");
  assert.match(layout, /document\.documentElement\.lang=l/, "restores <html lang>");
  assert.match(layout, /l==="en"\|\|l==="es"/, "only the two known ids are accepted");
  assert.match(layout, /<html lang="es-MX" suppressHydrationWarning>/, "the pre-paint attribute change is hydration-safe");

  // Provider: same key, persisted on change, adopted pre-paint so hydration
  // can never clobber the restored choice.
  const key = provider.match(/LANGUAGE_STORAGE_KEY = "([^"]+)"/)?.[1];
  assert.ok(key, "storage key is exported as a constant");
  assert.ok(layout.includes(key), "the inline script reads the SAME key");
  assert.match(provider, /localStorage\.setItem\(LANGUAGE_STORAGE_KEY, id\)/, "the toggle persists the choice");
  assert.match(provider, /useLayoutEffect\(\(\) => \{\s*const stored = readStoredLanguage\(\);/, "stored choice adopted before paint");
  assert.match(provider, /readStoredLanguage\(\)/, "adoption reads storage (not just the attribute)");
  assert.match(provider, /document\.documentElement\.lang = language;/, "<html lang> stays the publication channel");
});

test("gating CSS: only the active language renders, ES is the default", () => {
  const css = read("../app/style.css");
  assert.match(css, /\.l10n-en\s*\{\s*display:\s*none;\s*\}/, "EN hidden by default (ES-primary prerender)");
  assert.match(css, /html\[lang="en"\]\s+\.l10n-es\s*\{\s*display:\s*none;\s*\}/, "ES hidden when EN is active");
  assert.match(css, /html\[lang="en"\]\s+\.l10n-en\s*\{\s*display:\s*inline;\s*\}/, "EN shown when active");
  assert.match(css, /\.l10n-en\.l10n-block\s*\{\s*display:\s*none;\s*\}/, "block variant hidden by default");
  assert.match(css, /html\[lang="en"\]\s+\.l10n-en\.l10n-block\s*\{\s*display:\s*block;\s*\}/, "block variant shown when active");
});

test("shared L10n renderer: gated pair, or once when both languages are identical", () => {
  const l10n = read("../app/l10n.js");
  assert.match(l10n, /export default function L10n\(\{ pair \}\)/);
  assert.match(l10n, /<span className="l10n-es">\{es\}<\/span>/, "ES variant gated");
  assert.match(l10n, /<span className="l10n-en">\{en\}<\/span>/, "EN variant gated");
  assert.match(l10n, /if \(en && en !== es\)/, "identical values render once, ungated (proper nouns)");
});

test("/guia renders one language per toggle state via the existing Es/En spans", () => {
  const page = read("../app/guia/page.js");
  assert.match(page, /const Es = \(\{ children \}\) => <span className="guide-es l10n-es" lang="es">/, "Es span gated");
  assert.match(page, /const En = \(\{ children \}\) => <span className="guide-en l10n-en" lang="en">/, "En span gated");
  assert.match(page, /className="guide-en l10n-en" lang="en" style=\{\{ fontSize: "0\.62em"/, "h1 EN variant gated");
  assert.match(page, /<span className="l10n-es">← Volver al mapa<\/span>/, "back link gated");
  assert.match(page, /alt="[^"]* \/ [^"]*"/, "bilingual alt text keeps the ES / EN contract");
});

test("/eventos renders the active language only: entries, headings, empty states, annual highlights", () => {
  const page = read("../app/eventos/page.js");
  assert.match(page, /import L10n from "\.\.\/l10n\.js";/, "shared gated renderer");
  // Data fields go through L10n (titles, descriptions, costs, windows).
  assert.match(page, /<L10n pair=\{event\.title\} \/>/, "entry title gated");
  assert.match(page, /<L10n pair=\{event\.description\} \/>/, "entry description gated");
  assert.match(page, /<L10n pair=\{event\.cost\} \/>/, "entry cost gated");
  assert.match(page, /<L10n pair=\{item\.window\} \/>/, "highlight window gated");
  assert.match(page, /<L10n pair=\{item\.title\} \/>/, "highlight title gated");
  assert.match(page, /<L10n pair=\{item\.description\} \/>/, "highlight description gated");
  // The old slash-mash patterns are gone.
  assert.doesNotMatch(page, /\{event\.title\.es\}/, "no hardcoded es field left on entries");
  assert.doesNotMatch(page, /\{item\.window\.es\} \/ \{item\.window\.en\}/, "windows no longer mash both languages");
  assert.doesNotMatch(page, /Cargando eventos… \/ Loading events…/, "loading state renders one language");
  assert.match(page, /aria-label="Próximos eventos \/ Upcoming events"/, "accessible names may stay bilingual");
  // Date ranges and chrome strings are gated pairs.
  assert.ok((page.match(/className="l10n-es">\{formatEventRange\(event, "es"\)\}/g) ?? []).length >= 2, "entry dates gated");
  assert.match(page, /<span className="l10n-es">Eventos que vuelven cada año<\/span>/, "highlights heading gated");
  assert.match(page, /<span className="l10n-en">Annual highlights<\/span>/, "highlights heading EN variant");
});

test("/promo landings render the active language; metadata stays Spanish-primary", () => {
  const page = read("../app/promo/[id]/page.js");
  assert.match(page, /import L10n from "\.\.\/\.\.\/l10n\.js";/);
  assert.match(page, /<L10n pair=\{ev\.title\} \/>/, "title gated");
  assert.match(page, /<L10n pair=\{ev\.description\} \/>/, "description gated");
  assert.match(page, /<L10n pair=\{ev\.promotion\.tagline\} \/>/, "tagline gated");
  assert.match(page, /<L10n pair=\{h\} \/>/, "highlights gated");
  assert.match(page, /<L10n pair=\{ev\.cost\} \/>/, "cost gated");
  assert.match(page, /<span className="l10n-es">Promocionado<\/span>/, "badge gated");
  assert.match(page, /<span className="l10n-en">Includes<\/span>/, "section heading EN variant");
  assert.doesNotMatch(page, /Incluye \/ Includes/, "no slash-mashed heading");
  // SEO: metadata + image alt stay ES-primary.
  assert.match(page, /title: ev \? `\$\{ev\.title\.es\} — Promoción`/, "metadata stays Spanish-primary");
  assert.match(page, /alt=\{ev\.title\.es\}/, "alt stays Spanish-primary");
});

test("/sugerir-evento renders the active language; form values that must stay bilingual are pinned", () => {
  const page = read("../app/sugerir-evento/page.js");
  const form = read("../app/sugerir-evento/suggest-event-form.js");
  assert.match(page, /<span className="l10n-es">Sugerir un evento<\/span>/, "page h1 gated");
  assert.match(page, /<span className="l10n-en">Suggest an event<\/span>/, "page h1 EN variant");
  assert.doesNotMatch(page, /send us your event \/ envía tu evento/, "no slash-mashed subtitle");
  assert.match(form, /import \{ useSiteLanguage \} from "\.\.\/site-language";/, "form follows the site language");
  assert.match(form, /<span className="l10n-es">Nombre del evento \*<\/span>/, "field labels gated");
  assert.match(form, /<span className="l10n-en">Event name \*<\/span>/, "field label EN variant");
  assert.match(form, /\{categoryLabel\[language\] \?\? categoryLabel\.es\}/, "select options render the active language");
  assert.match(form, /<span className="l10n-es">Enviar propuesta<\/span>/, "submit button gated");
  // Functional values stay intentionally bilingual.
  assert.match(form, /Evento \/ Event: \$\{form\.name\}/, "mailto body stays bilingual (a form VALUE)");
  assert.match(form, /`\$\{es\} \/ \$\{en\}`/, "datalist venue values stay bilingual");
});

test("the other bilingual pages render the active language (promociones, tours, tzolkin)", () => {
  const promociones = read("../app/promociones/page.js");
  assert.match(promociones, /import L10n from "\.\.\/l10n\.js";/);
  assert.match(promociones, /<L10n pair=\{offer\.title\} \/>/, "offer names gated");
  assert.match(promociones, /<span className="l10n-es">Publicidad<\/span>/, "Advertising label gated");
  assert.match(promociones, /<L10n pair=\{tier\.name\} \/>/, "tier names gated");
  assert.match(promociones, /<span className="l10n-es">Ofertas activas<\/span>/, "section heading gated");

  const tour = read("../app/tours/noj-kaaj/page.js");
  assert.match(tour, /<strong className="l10n-es">\{item\.es\}<\/strong>/, "includes list gated");
  assert.match(tour, /<strong className="l10n-en">\{item\.en\}<\/strong>/, "includes EN variant");
  assert.match(tour, /<span className="l10n-es">Cómo llegar<\/span>/, "section heading gated");
  assert.doesNotMatch(tour, /La experiencia incluye \/ Your experience includes/, "no slash-mashed heading");

  const tzolkin = read("../app/tzolkin/page.js");
  assert.match(tzolkin, /<span className="l10n-es">Hoy<\/span>/, "today label gated");
  assert.match(tzolkin, /<span className="l10n-en">Today<\/span>/, "today label EN variant");
  assert.match(tzolkin, /<span className="l10n-es">Los 20 señales<\/span>/, "day-signs heading gated");
  assert.match(tzolkin, /<span className="l10n-es">— el calendario sagrado de 260 días<\/span>/, "h1 subtitle gated");
});

test("i18n key parity is untouched — no new UI_TEXT keys were needed for gating", () => {
  const esKeys = Object.keys(UI_TEXT.es).sort();
  const enKeys = Object.keys(UI_TEXT.en).sort();
  assert.deepEqual(enKeys, esKeys, "es/en key parity holds");
  for (const key of esKeys) {
    assert.ok(UI_TEXT.es[key].trim() && UI_TEXT.en[key].trim(), key);
  }
});
