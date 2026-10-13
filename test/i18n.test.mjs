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

test("search and business CTA copy is translated in Spanish and English", () => {
  assert.equal(UI_TEXT.es.ctaHeading, "¿Tienes un negocio local?");
  assert.equal(
    UI_TEXT.es.ctaDescription,
    "Ayuda a los visitantes a descubrir tu negocio en Felipe Carrillo Puerto. Podemos ayudarte con tu ficha, sitio web y presencia en redes sociales.",
  );
  assert.equal(UI_TEXT.es.ctaLearn, "Conoce el proyecto");
  assert.equal(UI_TEXT.es.ctaRequest, "Solicita información");
  assert.equal(UI_TEXT.es.businessCtaUnderConstruction, "Esta sección está en construcción.");
  assert.equal(UI_TEXT.en.ctaHeading, "Do you run a local business?");
  assert.equal(
    UI_TEXT.en.ctaDescription,
    "Help visitors discover your business in Felipe Carrillo Puerto. We can help with your listing, website, and social media presence.",
  );
  assert.equal(UI_TEXT.en.ctaLearn, "Learn about the project");
  assert.equal(UI_TEXT.en.ctaRequest, "Request information");
  assert.equal(UI_TEXT.en.businessCtaUnderConstruction, "This section is under construction.");
  assert.equal(UI_TEXT.es.labelLastUpdated, "Última actualización");
  assert.equal(UI_TEXT.es.labelVerification, "Nota de verificación");
  assert.equal(UI_TEXT.en.labelLastUpdated, "Last updated");
  assert.equal(UI_TEXT.en.labelVerification, "Verification note");
  for (const language of ["es", "en"]) {
    const cta = Object.entries(UI_TEXT[language]).filter(([key]) => key.startsWith("cta"));
    for (const [key, value] of cta) {
      assert.doesNotMatch(value, /@|https?:|\+?\d[\d\s-]{6,}/, `${language}.${key} sin contacto inventado`);
    }
  }
});

test("every UI string is translated in both languages", () => {
  const keys = Object.keys(UI_TEXT.es).sort();
  assert.deepEqual(Object.keys(UI_TEXT.en).sort(), keys);
  for (const key of keys) {
    assert.ok(UI_TEXT.es[key].trim() && UI_TEXT.en[key].trim(), key);
  }
  for (const key of ["heading", "instructions", "filtersLabel", "statusUnverified", "directionsUnavailable", "resetView", "searchLabel", "searchPlaceholder", "searchEmpty", "ctaHeading", "ctaDescription", "ctaLearn", "ctaRequest"]) {
    assert.notEqual(UI_TEXT.es[key], UI_TEXT.en[key], key);
  }
});

test("localize picks the requested language and falls back to Spanish", () => {
  const value = { es: "Hola", en: "Hello" };
  assert.equal(localize(value, "en"), "Hello");
  assert.equal(localize(value, "es"), "Hola");
  assert.equal(localize(value, "fr"), "Hola");
});
