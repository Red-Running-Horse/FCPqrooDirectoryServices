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
  // ---- SAMPLE promoted partner (replace with a real paid client) ----
  {
    id: "example-promoted-circuito-ximbal",
    promoted: true,
    promotion: {
      mediaType: "image",              // "image" only in the band (video/youtube -> card only)
      mediaUrl: "/promo/ximbal.jpg",   // put the file in /public/promo/
      siteUrl: "https://ximbal.fcpqroo.mx",   // the client's microsite
      tagline: {
        es: "Circuito comunitario de 2 días por Muyil, FCP y Tihosuco",
        en: "2-day community circuit through Muyil, FCP and Tihosuco",
      },
    },
    title: {
      es: "Circuito Maya Ximbal",
      en: "Maya Ximbal Circuit",
    },
    description: {
      es: "EXAMPLE — reemplazar con cliente real. Circuito comunitario con noche en la selva.",
      en: "EXAMPLE — replace with a real client. Community circuit with a night in the jungle.",
    },
    dateStart: "2026-11-14",
    dateEnd: "2026-11-15",
    placeId: "reserva-much-kanan-kaax-siijil-noh-ha",
    locationText: { es: "Salida: Tren Maya FCP", en: "Departure: Tren Maya FCP" },
    cost: { es: "Consultar", en: "To be announced" },
    sourceUrl: "https://example.org/replace-me",
    status: "unverified",
    lastUpdated: "2026-10-05",
  },

  // ---- SAMPLE organic entry (chronological list) ----
  {
    id: "example-feria-santa-cruz",
    promoted: false,
    title: {
      es: "Feria de la Santa Cruz",
      en: "Holy Cross Fair",
    },
    description: {
      es: "EXAMPLE — reemplazar con evento real. Peregrinación y feria anual en el Santuario (3 de mayo).",
      en: "EXAMPLE — replace with a real event. Annual pilgrimage and fair at the Sanctuary (May 3).",
    },
    dateStart: "2027-05-03",
    dateEnd: "2027-05-03",
    placeId: "santuario-de-la-cruz-parlante-fcp",
    locationText: { es: "Santuario de la Cruz Parlante", en: "Talking Cross Sanctuary" },
    cost: { es: "Entrada libre", en: "Free entry" },
    sourceUrl: "https://example.org/replace-me",
    status: "unverified",
    lastUpdated: "2026-10-05",
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
