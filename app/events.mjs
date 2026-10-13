// ============================================================================
// app/events.mjs — curated events AND promoted offers for the Zona Maya. Same
// honesty rules as app/attractions.mjs: every record keeps a sourceUrl
// (usually the Facebook post) and a status. Payment buys placement, never
// verification.
//
// Schema (per record):
//   id          unique slug.
//   kind        "event" | "offer" — what the record IS, independent of the
//               promotion tier. Events happen on a date and belong on event
//               surfaces (/eventos, the map events layer, the community
//               strip, schema.org/Event JSON-LD). Offers are paid placements
//               that are not events (a B&B rental, a placeholder partner):
//               they may still be promoted, but never appear on event
//               surfaces. Records without kind validate as "event".
//   title / description / cost   bilingual { es, en } objects (cost optional).
//   startAt     ISO 8601 datetime, required. For events: when it starts. For
//               offers: the campaign window start (same parsing rules).
//               Offset-less values read as America/Cancun wall time (UTC-5,
//               no DST).
//   endAt       ISO 8601 datetime, optional (defaults to the start instant).
//   venue       { placeId? } links a directory place; otherwise a free-text
//               bilingual { name } with optional latitude/longitude for the
//               map marker (no coordinates → no marker).
//   category    one of the directory categories (app/place-index.mjs, not "all").
//   contactNote INTERNAL ONLY — operational note for the editors; must never
//               be rendered anywhere user-facing.
//
// PROMOTED TIER (`promoted: true`) — orthogonal to kind; both events and
// offers can be promoted:
//   A promoted record carries a `promotion` media block (mediaUrl) and
//   rotates through the homepage banner ad space via FeaturedPartners, with
//   a landing page at /promo/<id>. The banner is the only paid surface and
//   an upsell, never automatic.
//   At most 3 records may be promoted at any time. The build FAILS if a
//   fourth is promoted — that guard is intentional.
// ============================================================================

export const MAX_PROMOTED = 3;

const events = [
  {
    id: "promo-balam-nah",
    kind: "offer",   // B&B rental offer, not an event — promoted placement only
    promoted: true,
    promotion: {
      mediaType: "image",
      mediaUrl: "/promo/promotion0_1680_487.webp",   // band (69:20 wide banner)
      cardUrl: "/promo/promotion0_1280_720.webp",
      siteUrl: "https://balamnah.fcpqroo.mx",
      tagline: {
        es: "Bed & Breakfast MXN850, a 10 minutos en la naturaleza.",
        en: "Bed & Breakfast MXN850, 10 min away in nature",
      },
    },
    title: { es: "Balam-Nah", en: "Balam-Nah" },
    description: {
      es: "Talleres, exposiciones y eventos culturales dedicados a la preservación de la cultura maya.",
      en: "Workshops, exhibitions and cultural events dedicated to preserving Maya culture.",
    },
    landing: {
      details: {
        es: "Balam-Nah («Casa del Jaguar») es un centro cultural y museo dedicado a preservar la lengua, el arte y las tradiciones del pueblo maya de la Zona Maya.",
        en: "Balam-Nah ('Jaguar House') is a cultural center and museum dedicated to preserving the language, art and traditions of the Zona Maya people.",
      },
      highlights: [
        { es: "Exposiciones de arte y cultura maya", en: "Maya art and culture exhibitions" },
        { es: "Talleres de lengua y tradiciones", en: "Language and tradition workshops" },
        { es: "Eventos y presentaciones culturales", en: "Cultural events and performances" },
      ],
    },
    startAt: "2026-10-06T09:00:00-05:00",
    endAt: "2026-12-31T18:00:00-05:00",
    venue: {
      placeId: "balam-nah-felipe-carrillo-puerto",
      name: { es: "Felipe Carrillo Puerto", en: "Felipe Carrillo Puerto" },
    },
    category: "culture",
    cost: { es: "Consultar", en: "See site" },
    contactNote: "Operado por el equipo de Balam-Nah; confirmar horarios de talleres por teléfono antes de publicar cambios.",
    sourceUrl: "https://balamnah.fcpqroo.mx",
    status: "unverified",
    lastUpdated: "2026-10-06",
  },
    {
    id: "test-partner-uno",
    kind: "offer",   // placeholder offer, not an event
    promoted: true,
    promotion: {
      mediaType: "image",
      mediaUrl: "/promo/promotion1_1680_487.webp",
      cardUrl: "/promo/promotion1_1280_720.webp",
      siteUrl: "https://example.com/1",
      tagline: { es: "Prueba uno / Test one", en: "Test one" },
    },
    title: { es: "Socio de Prueba Uno", en: "Test Partner One" },
    description: { es: "Entrada de prueba para ver el diseño.", en: "Test entry to preview the layout." },
    startAt: "2026-10-06T09:00:00-05:00",
    endAt: "2026-12-31T18:00:00-05:00",
    venue: {
      name: { es: "Felipe Carrillo Puerto", en: "Felipe Carrillo Puerto" },
    },
    category: "culture",
    cost: { es: "Consultar", en: "See site" },
    sourceUrl: "https://example.com/1",
    status: "unverified",
    lastUpdated: "2026-10-06",
  },
  {
    // Re-promoted on 2026-10-12 as the third banner slot: the MAX_PROMOTED=3
    // cap rotates three premium promotions again. test-2's BASE-tier demo was
    // un-promoted to make room — that tier no longer exists.
    id: "test-partner-dos",
    kind: "offer",   // placeholder offer, not an event
    promoted: true,
    promotion: {
      mediaType: "image",
      mediaUrl: "/promo/promotion2_1680_487.webp",
      siteUrl: "https://example.com/2",
      tagline: { es: "Prueba dos / Test two", en: "Test two" },
    },
    title: { es: "Socio de Prueba Dos", en: "Test Partner Two" },
    description: { es: "Entrada de prueba para ver el diseño.", en: "Test entry to preview the layout." },
    startAt: "2026-10-06T09:00:00-05:00",
    endAt: "2026-12-31T18:00:00-05:00",
    venue: {
      name: { es: "Felipe Carrillo Puerto", en: "Felipe Carrillo Puerto" },
    },
    category: "culture",
    cost: { es: "Consultar", en: "See site" },
    sourceUrl: "https://example.com/2",
    status: "unverified",
    lastUpdated: "2026-10-06",
  },
  {
    // Un-promoted on 2026-10-12: its promotion was a demo of the old BASE
    // tier (promoted without a media block), which no longer exists. It
    // stays a normal upcoming EVENT — community ribbon + /eventos; the
    // /promo/test-2 landing retired with the tier.
    // Submitted through the event suggestion form on 2026-10-11. Test data:
    // ES mirrors EN — real submissions need proper translation before publishing.
    // endAt extended from the submitted 11:25 to a week out so the demo
    // survives the data-hygiene test; the submitted window stays in contactNote.
    id: "test-2",
    title: { es: "Test 2", en: "Test 2" },
    description: { es: "Test test", en: "Test test" },
    landing: {
      details: {
        es: "Evento de prueba enviado a través del formulario de sugerencias.",
        en: "Test event submitted through the suggestion form.",
      },
    },
    startAt: "2026-10-11T10:25:00-05:00",
    endAt: "2026-10-18T11:25:00-05:00",
    venue: {
      placeId: "mercado-felipe-carrillo-puerto",
      name: {
        es: "Mercado Público Municipal de Felipe Carrillo Puerto",
        en: "Felipe Carrillo Puerto Municipal Public Market",
      },
    },
    category: "culture",
    contactNote: "Enviado por marcsir@tutanota.com el 2026-10-11 a las 15:26 (hora Cancún).",
    status: "unverified",
    lastUpdated: "2026-10-11",
  },
  {
  id: "cafeteando-xtaabay-2026-10-16",
  title: {
    es: "Cafeteando con la Xtáabay — 15° Festival de la Xtáabay",
    en: "Coffee with the Xtáabay — 15th Xtáabay Festival",
  },
  description: {
    es: "Disfruta un café orgánico y artesanal mientras te adentras en las historias y vivencias de encuentros cercanos con la Xtáabay, dentro del 15° Festival de la Xtáabay.",
    en: "Enjoy organic, artisanal coffee while you immerse yourself in stories and firsthand accounts of close encounters with the Xtáabay, within the 15th Xtáabay Festival.",
  },
  startAt: "2026-10-16T22:30:00-05:00",
  venue: {
    name: {
      es: "Callejón Cultural (Calle 44 entre 67 y 69, Col. Lázaro Cárdenas)",
      en: "Callejón Cultural (44th St. between 67 & 69, Lázaro Cárdenas)",
    },
  },
  category: "culture",
  cost: { es: "Participación libre y gratuita", en: "Free admission" },
  contactNote: "Verified from organizer's flyer, received 2026-10-12. Flyer credits: Festival de la Xtáabay, Kó'moal, Ts'uku'um, Noj Tunch, Cantera, Nahil Kanbal.",
  status: "published",
  lastUpdated: "2026-10-12",
},
];

// ---- Build-time guard: never more than MAX_PROMOTED sponsored events ----
const promotedCount = events.filter((e) => e.promoted).length;
if (promotedCount > MAX_PROMOTED) {
  throw new Error(
    `[events] ${promotedCount} events are promoted but MAX_PROMOTED is ${MAX_PROMOTED}. ` +
      `Demote one before building — the sponsored slots are capped at 3 by design.`
  );
}


export default events;
