import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_LANGUAGE, LANGUAGES, localize, UI_TEXT, uiText } from "../app/i18n.mjs";

test("Spanish is the default and English is available", () => {
  assert.equal(DEFAULT_LANGUAGE, "es");
  assert.deepEqual(LANGUAGES.map(({ id }) => id), ["es", "en"]);
  assert.equal(uiText("en").resetView, "Back to Felipe Carrillo Puerto");
  assert.equal(uiText("fr"), UI_TEXT.es);
});

test("hero copy is translated in Spanish and English", () => {
  assert.equal(UI_TEXT.es.heroEyebrow, "Guía local de Maya Ka’an");
  assert.equal(
    UI_TEXT.es.heroSubheading,
    "Naturaleza, cultura, comida y experiencias locales en un solo mapa.",
  );
  assert.equal(UI_TEXT.en.heroEyebrow, "Maya Ka’an local guide");
  assert.equal(
    UI_TEXT.en.heroSubheading,
    "Nature, culture, food, and local experiences in one map.",
  );
});

test("every UI string is translated in both languages", () => {
  const keys = Object.keys(UI_TEXT.es).sort();
  assert.deepEqual(Object.keys(UI_TEXT.en).sort(), keys);
  for (const key of keys) {
    assert.ok(UI_TEXT.es[key].trim() && UI_TEXT.en[key].trim(), key);
  }
  for (const key of ["heading", "instructions", "filtersLabel", "statusUnverified", "directionsUnavailable", "resetView"]) {
    assert.notEqual(UI_TEXT.es[key], UI_TEXT.en[key], key);
  }
});

test("localize picks the requested language and falls back to Spanish", () => {
  const value = { es: "Hola", en: "Hello" };
  assert.equal(localize(value, "en"), "Hello");
  assert.equal(localize(value, "es"), "Hola");
  assert.equal(localize(value, "fr"), "Hola");
});
