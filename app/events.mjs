// ============================================================================
// app/events.mjs — curated events for the Zona Maya. Same honesty rules as
// app/attractions.mjs: every event keeps a sourceUrl (usually the Facebook
// post) and a status. Payment buys placement, never verification.
//
// PROMOTED TIER: at most 3 events may be promoted at any time (banner in the
// attract band + card, linking to the client's subdomain microsite). The build
// FAILS if a fourth is promoted — that guard is intentional.
// ============================================================================

export const MAX_PROMOTED = 3;

const events = [
  {
    id: "promo-balam-nah",
    promoted: true,
    promotion: {
      mediaType: "image",
      mediaUrl: "/promo/balamnah_1680_480.webp",
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
    dateStart: "2026-10-06",
    dateEnd: "2026-12-31",
    placeId: "balam-nah-felipe-carrillo-puerto",
    locationText: { es: "Felipe Carrillo Puerto", en: "Felipe Carrillo Puerto" },
    cost: { es: "Consultar", en: "See site" },
    sourceUrl: "https://balamnah.fcpqroo.mx",
    status: "unverified",
    lastUpdated: "2026-10-06",
  },
];

// ---- Build-time guard: never more than MAX_PROMOTED sponsored events ----
const promotedCount = events.filter((e) => e.promoted).length;
if (promotedCount > MAX_PROMOTED) {
  throw new Error(
    `[events] ${promotedCount} events are promoted but MAX_ PROMOTED is ${MAX_PROMOTED}. ` +
      `Demote one before building — the sponsored slots are capped at 3 by design.`
  );
}

export default events;
