import assert from "node:assert/strict";
import test from "node:test";
import { attractions } from "../app/attractions.mjs";
import { UI_TEXT } from "../app/i18n.mjs";
import { emailUrl, phoneUrl, placePortal, placeStatus, websiteUrl, whatsappUrl } from "../app/place-portal.mjs";

const verifiedPlace = {
  id: "verified-test",
  name: { es: "Museo de prueba", en: "Test museum" },
  category: "culture",
  description: { es: "Descripción corta.", en: "Short description." },
  latitude: 19.58,
  longitude: -88.045,
  status: "verified",
  locationAccuracy: "exact",
  directionsUrl: "https://www.openstreetmap.org/?mlat=19.58&mlon=-88.045",
  address: { es: "Centro, Felipe Carrillo Puerto", en: "Downtown, Felipe Carrillo Puerto" },
  hours: { es: "Lun–Vie 9:00–17:00", en: "Mon–Fri 9:00–17:00" },
  phone: "+52 983 000 0000",
  whatsapp: "+52 983 000 0001",
  website: "https://example.com",
  verificationNote: { es: "Verificado en sitio.", en: "Verified on site." },
  lastUpdated: "2026-09-01",
};

const approximatePlace = {
  ...verifiedPlace,
  id: "approximate-test",
  status: "unverified",
  locationAccuracy: "approximate",
  directionsUrl: null,
  hours: null,
  phone: null,
  whatsapp: null,
  website: null,
  verificationNote: { es: "Sin verificar.", en: "Not verified." },
};

const market = attractions.find(({ id }) => id === "mercado-felipe-carrillo-puerto");
const actionIds = (view) => view.actions.map(({ id }) => id);

const batchAPlace = {
  id: "batch-a-test",
  name: { es: "Museo de prueba", en: "Test museum" },
  category: "culture",
  description: { es: "Descripción corta.", en: "Short description." },
  latitude: 19.58,
  longitude: -88.045,
  status: "verified",
  locationAccuracy: "exact",
  directionsUrl: "https://www.openstreetmap.org/?mlat=19.58&mlon=-88.045",
  address: { es: "Centro, Felipe Carrillo Puerto", en: "Downtown, Felipe Carrillo Puerto" },
  phone: "+52 983 000 0000",
  email: "info@example.com",
  website: "https://example.com",
  socialLinks: { facebook: "https://www.facebook.com/museo", instagram: "", tiktok: null },
  verificationSourceUrls: [
    "https://lugares.inah.gob.mx/en/node/4844",
    "https://sic.cultura.gob.mx/ficha.php?table=museo&table_id=311",
    "http://example.com/insecure",
    "javascript:alert(1)",
  ],
  accessibility: {
    wheelchairAccess: true,
    parking: true,
    notesEs: "Sanitarios disponibles.",
    notesEn: "Toilets available.",
  },
  lastUpdated: "2026-10-13",
};

test("default portal state prompts the user to select a place in ES and EN", () => {
  const es = placePortal(null, "es");
  const en = placePortal(undefined, "en");
  assert.deepEqual(es, { selected: false, heading: UI_TEXT.es.portalHeading, prompt: UI_TEXT.es.portalPrompt });
  assert.deepEqual(en, { selected: false, heading: UI_TEXT.en.portalHeading, prompt: UI_TEXT.en.portalPrompt });
  assert.match(es.prompt, /Selecciona/);
  assert.match(en.prompt, /Select/);
  assert.equal(placePortal(null, "fr").prompt, UI_TEXT.es.portalPrompt);
});

test("a selected verified place renders every available field and action", () => {
  const view = placePortal(verifiedPlace, "es");
  assert.equal(view.selected, true);
  assert.equal(view.name, "Museo de prueba");
  assert.equal(view.otherName, "Test museum");
  assert.equal(view.otherLanguage, "en");
  assert.equal(view.category, "Cultura");
  assert.equal(view.status, "verified");
  assert.equal(view.statusLabel, "Verificado");
  assert.equal(view.description, "Descripción corta.");
  assert.deepEqual(
    view.details.map(({ id, label, value }) => [id, label, value]),
    [
      ["address", "Dirección / comunidad", "Centro, Felipe Carrillo Puerto"],
      ["hours", "Horario", "Lun–Vie 9:00–17:00"],
      ["phone", "Teléfono", "+52 983 000 0000"],
      ["whatsapp", "WhatsApp", "+52 983 000 0001"],
      ["website", "Sitio web", "https://example.com"],
    ],
  );
  assert.equal(view.verificationNote, "Verificado en sitio.");
  assert.equal(view.lastUpdated, "2026-09-01");
  assert.deepEqual(view.actions, [
    { id: "directions", label: UI_TEXT.es.directions, href: verifiedPlace.directionsUrl, external: true },
    { id: "call", label: "Llamar", href: "tel:+529830000000", external: false },
    { id: "whatsapp", label: UI_TEXT.es.actionWhatsapp, href: "https://wa.me/529830000001", external: true },
    { id: "website", label: UI_TEXT.es.actionWebsite, href: "https://example.com", external: true },
  ]);
  assert.equal(view.directionsNote, null);
});

test("portal text follows the ES/EN toggle", () => {
  const es = placePortal(verifiedPlace, "es");
  const en = placePortal(verifiedPlace, "en");
  assert.equal(en.name, "Test museum");
  assert.equal(en.otherName, "Museo de prueba");
  assert.equal(en.category, "Culture");
  assert.equal(en.statusLabel, "Verified");
  assert.equal(en.description, "Short description.");
  assert.equal(en.verificationNote, "Verified on site.");
  assert.equal(en.lastUpdatedLabel, "Last updated");
  assert.equal(es.lastUpdatedLabel, "Última actualización");
  assert.deepEqual(en.details.map(({ label }) => label), ["Address / community", "Hours", "Phone", "WhatsApp", "Website"]);
  assert.deepEqual(en.actions.map(({ label }) => label), [
    UI_TEXT.en.directions,
    "Call",
    UI_TEXT.en.actionWhatsapp,
    UI_TEXT.en.actionWebsite,
  ]);
  for (const key of ["portalHeading", "portalPrompt", "badgeApproximate", "badgeUnavailable", "labelHours"]) {
    assert.notEqual(UI_TEXT.es[key], UI_TEXT.en[key], key);
  }
});

test("approximate places show the approximate badge, notes and no action buttons", () => {
  for (const language of ["es", "en"]) {
    const view = placePortal(approximatePlace, language);
    assert.equal(view.status, "approximate");
    assert.equal(view.statusLabel, UI_TEXT[language].badgeApproximate);
    assert.deepEqual(view.actions, []);
    assert.equal(view.directionsNote, UI_TEXT[language].directionsUnavailable);
    assert.ok(view.verificationNote && view.lastUpdated);
    assert.deepEqual(view.details.map(({ id }) => id), ["address"]);
  }
});

test("the verified market exposes only its available details and actions", () => {
  for (const language of ["es", "en"]) {
    const view = placePortal(market, language);
    assert.equal(view.status, "verified");
    assert.equal(view.statusLabel, UI_TEXT[language].badgeVerified);
    assert.deepEqual(actionIds(view), ["directions", "call"]);
    assert.equal(view.directionsNote, null);
    assert.deepEqual(view.details.map(({ id }) => id), ["address", "hours", "phone", "website"]);
    assert.equal(view.details.find(({ id }) => id === "website").value, "Under Construction");
    assert.ok(!JSON.stringify(view).includes("https://www.felipecarrillopuerto.gob.mx/component/tags/tag/mercado"));
  }
});

test("action buttons are hidden when data is missing, invalid or unverified", () => {
  assert.deepEqual(actionIds(placePortal({ ...verifiedPlace, status: "unverified" }, "es")), ["call", "whatsapp", "website"]);
  assert.deepEqual(actionIds(placePortal({ ...verifiedPlace, locationAccuracy: "approximate" }, "es")), [
    "call",
    "whatsapp",
    "website",
  ]);
  assert.deepEqual(actionIds(placePortal({ ...verifiedPlace, directionsUrl: null }, "es")), ["call", "whatsapp", "website"]);
  assert.deepEqual(actionIds(placePortal({ ...verifiedPlace, phone: null }, "es")), ["directions", "whatsapp", "website"]);
  assert.deepEqual(actionIds(placePortal({ ...verifiedPlace, whatsapp: "" }, "es")), ["directions", "call", "website"]);
  assert.deepEqual(actionIds(placePortal({ ...verifiedPlace, website: "http://example.com" }, "es")), [
    "directions",
    "call",
    "whatsapp",
  ]);
  const unavailable = placePortal({ ...verifiedPlace, status: "unavailable" }, "en");
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.statusLabel, "Unavailable");
  assert.ok(!actionIds(unavailable).includes("directions"));
  const bare = placePortal({ ...verifiedPlace, phone: null, whatsapp: null, website: null, hours: null, address: null }, "es");
  assert.deepEqual(actionIds(bare), ["directions"]);
  assert.deepEqual(bare.details, []);
});

test("contact links are sanitized", () => {
  assert.equal(placeStatus(verifiedPlace), "verified");
  assert.equal(phoneUrl("983 123 4567"), "tel:9831234567");
  assert.equal(phoneUrl("12"), null);
  assert.equal(phoneUrl(null), null);
  assert.equal(whatsappUrl("+52 (983) 123-4567"), "https://wa.me/529831234567");
  assert.equal(whatsappUrl("abc"), null);
  assert.equal(websiteUrl("javascript:alert(1)"), null);
  assert.equal(websiteUrl("https://example.com/a b"), null);
  assert.equal(websiteUrl(" https://example.com "), "https://example.com");
});

test("email renders as a mailto action only when present and valid", () => {
  assert.deepEqual(placePortal(batchAPlace, "es").emailAction, {
    id: "email",
    label: "Correo",
    href: "mailto:info@example.com",
    external: false,
  });
  assert.equal(placePortal(batchAPlace, "en").emailAction.label, "Email");
  for (const email of [null, "", "not-an-email", "a@b", "two words@example.com"]) {
    assert.equal(placePortal({ ...batchAPlace, email }, "es").emailAction, null, String(email));
  }
  assert.equal(
    placePortal({ ...batchAPlace, email: "  info@example.com  " }, "es").emailAction.href,
    "mailto:info@example.com",
  );
  assert.equal(placePortal(verifiedPlace, "es").emailAction, null, "no email action without data");
  assert.equal(placePortal(market, "en").emailAction, null, "no email action without data");
  assert.equal(emailUrl("MUSEO@EXAMPLE.COM"), "mailto:MUSEO@EXAMPLE.COM");
  assert.equal(emailUrl("info@example.com; DROP TABLE places"), null);
});

test("social links render only https links, with bilingual labels", () => {
  const es = placePortal(batchAPlace, "es");
  assert.deepEqual(es.socialLinks, [
    { id: "facebook", label: "Facebook", href: "https://www.facebook.com/museo", external: true },
  ]);
  const extra = placePortal(
    {
      ...batchAPlace,
      socialLinks: {
        tiktok: "https://www.tiktok.com/@museo",
        instagram: "http://instagram.com/museo",
        facebook: "javascript:alert(1)",
        pinterest: "https://www.pinterest.com/museo",
      },
    },
    "en",
  );
  assert.deepEqual(
    extra.socialLinks.map(({ id, label, href, external }) => [id, label, href, external]),
    [
      ["tiktok", "TikTok", "https://www.tiktok.com/@museo", true],
      ["pinterest", "Pinterest", "https://www.pinterest.com/museo", true],
    ],
    "known keys keep their order, unknown keys render capitalized, http and javascript links are dropped",
  );
  assert.ok(
    JSON.stringify(es.socialLinks).indexOf("http://") === -1,
    "no insecure link ever reaches the social list",
  );
  assert.deepEqual(placePortal(verifiedPlace, "es").socialLinks, []);
  assert.deepEqual(placePortal(market, "en").socialLinks, []);
});

test("official sources render as a compact link list only when present", () => {
  assert.deepEqual(placePortal(batchAPlace, "es").officialSources, {
    label: "Fuentes oficiales",
    links: [
      { href: "https://lugares.inah.gob.mx/en/node/4844", text: "lugares.inah.gob.mx" },
      { href: "https://sic.cultura.gob.mx/ficha.php?table=museo&table_id=311", text: "sic.cultura.gob.mx" },
    ],
  });
  assert.equal(placePortal(batchAPlace, "en").officialSources.label, "Official sources");
  const escaped = placePortal(
    {
      ...batchAPlace,
      verificationSourceUrls: [
        "https://example.com/ficha?table=museo&table_id=311&amp;view=1",
        "https://example.com/ficha?table=museo&table_id=311&amp;view=1",
      ],
    },
    "es",
  );
  assert.deepEqual(escaped.officialSources.links, [
    { href: "https://example.com/ficha?table=museo&table_id=311&view=1", text: "example.com" },
  ], "&amp; is unescaped for the href and duplicate sources collapse");
  assert.equal(placePortal(verifiedPlace, "es").officialSources, null, "no sources block without data");
  assert.equal(placePortal(market, "en").officialSources, null, "no sources block without data");
});

test("accessibility lines render only when present, with localized notes", () => {
  assert.deepEqual(placePortal(batchAPlace, "es").accessibility, {
    label: "Accesibilidad",
    lines: ["Entrada accesible para sillas de ruedas", "Estacionamiento accesible", "Sanitarios disponibles."],
  });
  assert.deepEqual(placePortal(batchAPlace, "en").accessibility, {
    label: "Accessibility",
    lines: ["Wheelchair-accessible entrance", "Accessible parking", "Toilets available."],
  });
  const notesOnly = placePortal(
    { ...batchAPlace, accessibility: { wheelchairAccess: null, parking: null, notesEs: "Solo español." } },
    "en",
  );
  assert.deepEqual(notesOnly.accessibility.lines, ["Solo español."], "a missing English note falls back to Spanish");
  const emptyTranslatedNote = placePortal(
    { ...batchAPlace, accessibility: { wheelchairAccess: null, parking: null, notesEs: "Solo español.", notesEn: "" } },
    "en",
  );
  assert.equal(
    emptyTranslatedNote.accessibility,
    null,
    "an empty translated note does not fall back, matching every other localized field",
  );
  for (const accessibility of [
    { wheelchairAccess: false, parking: false, notesEs: " ", notesEn: "" },
    { wheelchairAccess: null, parking: null, notesEs: "", notesEn: "" },
    null,
    undefined,
  ]) {
    assert.equal(placePortal({ ...batchAPlace, accessibility }, "es").accessibility, null);
  }
  assert.equal(placePortal(verifiedPlace, "es").accessibility, null, "no accessibility block without data");
  assert.equal(placePortal(market, "en").accessibility, null, "no accessibility block without data");
});

test("the committed museum record renders email, official sources and accessibility", () => {
  const museum = attractions.find(({ id }) => id === "museo-de-la-guerra-de-castas-tihosuco");
  const es = placePortal(museum, "es");
  assert.deepEqual(es.emailAction, {
    id: "email",
    label: "Correo",
    href: "mailto:museogcastas@hotmail.com",
    external: false,
  });
  assert.deepEqual(es.socialLinks, [], "the museum's social keys are all null");
  assert.equal(es.officialSources.label, "Fuentes oficiales");
  assert.deepEqual(es.officialSources.links, [
    { href: "https://lugares.inah.gob.mx/en/node/4844", text: "lugares.inah.gob.mx" },
    { href: "https://sic.cultura.gob.mx/ficha.php?table=museo&table_id=311", text: "sic.cultura.gob.mx" },
  ]);
  assert.deepEqual(es.accessibility, {
    label: "Accesibilidad",
    lines: [
      "Entrada accesible para sillas de ruedas",
      "Estacionamiento accesible",
      "Ficha oficial: estacionamiento y entrada accesibles para sillas de ruedas; sanitarios disponibles; sin restaurante. Pendiente de confirmación en campo.",
    ],
  });
  const en = placePortal(museum, "en");
  assert.equal(en.emailAction.label, "Email");
  assert.equal(en.officialSources.label, "Official sources");
  assert.equal(en.accessibility.label, "Accessibility");
  assert.match(en.accessibility.lines[2], /Official listing/);
});

test("the committed Kantemo record renders its facebook link and nothing else new", () => {
  const kantemo = attractions.find(({ id }) => id === "kantemo-cueva-de-las-serpientes-colgantes");
  for (const language of ["es", "en"]) {
    const view = placePortal(kantemo, language);
    assert.deepEqual(view.socialLinks, [
      { id: "facebook", label: "Facebook", href: "https://www.facebook.com/KantemoPrincipal", external: true },
    ]);
    assert.equal(view.emailAction, null);
    assert.equal(view.officialSources, null);
    assert.equal(view.accessibility, null);
  }
});

test("the market renders phone-only contact with no empty Batch A rows", () => {
  for (const language of ["es", "en"]) {
    const view = placePortal(market, language);
    assert.deepEqual(actionIds(view), ["directions", "call"]);
    assert.equal(view.emailAction, null);
    assert.deepEqual(view.socialLinks, []);
    assert.equal(view.officialSources, null);
    assert.equal(view.accessibility, null);
  }
});
