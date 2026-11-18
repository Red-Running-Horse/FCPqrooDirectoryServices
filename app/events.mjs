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
//               A date-only value ("2026-12-19") runs through that whole day:
//               the event ends at the last moment of the day in Cancun, so
//               day-long events stay listed until the day actually ends.
//   venue       { placeId? } links a directory place; otherwise a free-text
//               bilingual { name } with optional latitude/longitude for the
//               map marker (no coordinates → no marker).
//   category    one of the directory categories (app/place-index.mjs, not "all").
//   image       optional flyer for kind "event": { url, alt: { es, en } }.
//               Same-origin only, served from /img/eventos/<slug>.webp
//               (WebP, long edge <= 1600 px, <= 150 KB; guarded by
//               test/performance-guardrails.test.mjs). Rendered on /eventos
//               only — the community strip stays text-only, and offers ignore
//               the field (their surface is the promotion/landing media).
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
      // Band scenes, one file per breakpoint — swap files, not code. The wide
      // scene fits the desktop 69:11 crop; the 69:20 scene is native to the
      // mobile band (promotions without a mobile asset reuse mediaUrl).
      mediaUrl: "/promo/balamnah_1920_306.webp",        // desktop band scene (1911x300 ~6.37:1)
      mobileMediaUrl: "/promo/promotion0_1680_487.webp", // mobile band scene (1680x487 = 69:20)
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
    id: "congreso-avivamiento-llamas-de-fuego-2026",
    title: {
      es: "Congreso de Avivamiento 'Llamas de Fuego'",
      en: "'Flames of Fire' Revival Congress",
    },
    description: {
      es: "Congreso de avivamiento cristiano de dos días con el tema Llamas de Fuego. Evento público organizado por Congreso de Avivamiento en Felipe Carrillo Puerto; sede específica por confirmar.",
      en: "Two-day Christian revival congress themed 'Flames of Fire.' Public event organized by Congreso de Avivamiento in Felipe Carrillo Puerto; specific venue to be confirmed.",
    },
    startAt: "2026-12-18",
    endAt: "2026-12-19",
    venue: {
      name: {
        es: "Felipe Carrillo Puerto (sede por confirmar)",
        en: "Felipe Carrillo Puerto (venue to be confirmed)",
      },
    },
    category: "culture",
    image: {
      url: "/img/eventos/congreso-avivamiento-llamas-de-fuego-2026.webp",
      alt: { es: "Cartel del Congreso de Avivamiento Llamas de Fuego", en: "Poster for the 'Flames of Fire' Revival Congress" },
    },
    contactNote: "Verified from Facebook event listing, 2026-10-15. No venue, schedule, or contact published yet — update when announced.",
    sourceUrl: "https://www.facebook.com/events/930745553313771/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "selva-morena",
    promoted: true,
    kind: "offer",
    title: {
      es: "Selva Morena — Bienestar en la selva",
      en: "Selva Morena — Wellness in the Jungle",
    },
    description: {
      es: "Cabañas de estilo maya contemporáneo en la selva (Junior y Master con jacuzzi), restaurante orgánico y un centro de bienestar con temazcal, ceremonia de cacao, ritual de luna llena, yoga y terapias de sanación. Senderos, avistamiento de aves, jardín botánico y meliponario. Tours a sitios sagrados mayas, zonas arqueológicas, cenotes y lagunas. LGBTQ+ friendly.",
      en: "Contemporary Maya-style jungle cabins (Junior and Master with jacuzzi), an organic restaurant, and a wellness center offering temazcal, cacao ceremony, full-moon ritual, yoga and healing therapies. Trails, birdwatching, botanical garden and a native stingless-bee apiary (meliponario). Tours to sacred Maya sites, ruins, cenotes and lagoons. LGBTQ+ friendly.",
    },
    startAt: "2026-10-15",
    endAt: "2026-12-31",
    venue: { placeId: "selva-morena" },
    category: "lodging",
    cost: {
      es: "Experiencias de bienestar desde $500 MXN; cabañas desde $1,000 MXN",
      en: "Wellness experiences from MX$500; cabins from MX$1,000",
    },
    promotion: {
      mediaType: "image",
      mediaUrl: "/promo/selvamorena_1920_306.webp",
      mobileMediaUrl: "/promo/selvamorena_1680_487.webp",
      cardUrl: "/promo/selvamorena_1280_720.webp",
      siteUrl: "https://linktr.ee/selvamorena.oficial",
      tagline: {
        es: "Temazcal, cacao y cabañas en la selva — a 20 min del centro",
        en: "Temazcal, cacao and jungle cabins — 20 min from downtown",
      },
    },
    landing: {
      media: "/promo/selvamorena_1280_720.webp",
      highlights: [
        { es: "Temazcal, ceremonia de cacao y ritual de luna llena", en: "Temazcal, cacao ceremony and full-moon ritual" },
        { es: "Tours a sitios sagrados mayas, cenotes y lagunas (desde $800 MXN)", en: "Tours to sacred Maya sites, cenotes and lagoons (from MX$800)" },
        { es: "Cabañas Junior y Master con jacuzzi (desde $1,000 MXN)", en: "Junior and Master cabins with jacuzzi (from MX$1,000)" },
        { es: "Meliponario, jardín botánico y senderos con avistamiento de aves", en: "Meliponario, botanical garden and birdwatching trails" },
      ],
      links: [
        { label: "Booking.com", url: "https://www.booking.com/hotel/mx/selva-morena-felipe-carrillo-puerto.html" },
        { label: "Airbnb", url: "https://www.airbnb.mx/users/profile/1613248725142954351" },
        { label: "Linktree oficial", url: "https://linktr.ee/selvamorena.oficial" },
        { label: "Sitio web", url: "https://selvamorenareserva.wixsite.com/selva-morena" },
        { label: "YouTube", url: "https://www.youtube.com/@selva-morena" },
      ],
    },
    contactNote: "Verified with the operator, 2026-10-15. Prices indicative per their site (wellness $500, tours $800, cabins $1,000–1,200 MXN). Links: Linktree (official hub), Booking, Airbnb, Wix site, YouTube. Images provided by client.",
    sourceUrl: "https://selvamorenareserva.wixsite.com/selva-morena",
    status: "published",
    lastUpdated: "2026-10-15",
  },
  {
    id: "festival-cultura-del-caribe-2026",
    title: {
      es: "Festival de Cultura del Caribe 2026 — Belice país invitado",
      en: "Caribbean Culture Festival 2026 — Belize Guest Country",
    },
    description: {
      es: "Cuatro días de música, arte y tradiciones caribeñas que unen a los pueblos de la región, con Belice como país invitado. Programación de Felipe Carrillo Puerto por anunciarse.",
      en: "Four days of Caribbean music, art and traditions uniting the region's peoples, with Belize as guest country. FCP programming to be announced.",
    },
    startAt: "2026-11-19",
    endAt: "2026-11-22",
    venue: {
      name: { es: "Quintana Roo (sede FCP por anunciarse)", en: "Quintana Roo (FCP venue TBA)" },
    },
    category: "culture",
    contactNote: "Verified Oct 2026. Statewide festival; FCP-specific programming not yet published — update when announced.",
    sourceUrl: "https://www.facebook.com/share/p/1F7XkMNN4b/",
    status: "published",
    lastUpdated: "2026-10-21",
  },
  {
    id: "ciclos-2026-negra",
    title: { es: "Festival CICLOS 2026 — Negra", en: "Festival CICLOS 2026 — Negra" },
    description: {
      es: "Función de «Negra» en el Festival CICLOS 2026, el festival de cine de Árbol Rojo en Felipe Carrillo Puerto. Entrada gratuita.",
      en: "Screening of 'Negra' at Festival CICLOS 2026, Árbol Rojo's film festival in Felipe Carrillo Puerto. Free admission.",
    },
    startAt: "2026-11-23T18:00:00-05:00",
    venue: {
      name: { es: "Domo Infonavit, Felipe Carrillo Puerto", en: "Domo Infonavit, Felipe Carrillo Puerto" },
      latitude: 19.571900853488934,
      longitude: -88.04064636746081,
    },
    category: "culture",
    image: {
      url: "/img/eventos/ciclos-2026-a.webp",
      alt: { es: "Cartel del Festival CICLOS 2026 de Árbol Rojo", en: "Poster for Árbol Rojo's 2026 Festival CICLOS" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the CICLOS 2026 program sheet, 2026-11-18. Organizer: Árbol Rojo (arbolrojocine.com).",
    sourceUrl: "https://arbolrojocine.com/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "ciclos-2026-hilando-sones",
    title: { es: "Festival CICLOS 2026 — Hilando Sones", en: "Festival CICLOS 2026 — Hilando Sones" },
    description: {
      es: "Función de «Hilando Sones» en el Festival CICLOS 2026, el festival de cine de Árbol Rojo en Felipe Carrillo Puerto. Entrada gratuita.",
      en: "Screening of 'Hilando Sones' at Festival CICLOS 2026, Árbol Rojo's film festival in Felipe Carrillo Puerto. Free admission.",
    },
    startAt: "2026-11-23T20:00:00-05:00",
    venue: {
      name: { es: "Domo Infonavit, Felipe Carrillo Puerto", en: "Domo Infonavit, Felipe Carrillo Puerto" },
      latitude: 19.571900853488934,
      longitude: -88.04064636746081,
    },
    category: "culture",
    image: {
      url: "/img/eventos/ciclos-2026-a.webp",
      alt: { es: "Cartel del Festival CICLOS 2026 de Árbol Rojo", en: "Poster for Árbol Rojo's 2026 Festival CICLOS" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the CICLOS 2026 program sheet, 2026-11-18. Organizer: Árbol Rojo (arbolrojocine.com).",
    sourceUrl: "https://arbolrojocine.com/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "ciclos-2026-valentina-y-la-serenidad",
    title: { es: "Festival CICLOS 2026 — Valentina y la serenidad", en: "Festival CICLOS 2026 — Valentina y la serenidad" },
    description: {
      es: "Función de «Valentina y la serenidad» en el Festival CICLOS 2026, el festival de cine de Árbol Rojo en Felipe Carrillo Puerto. Entrada gratuita.",
      en: "Screening of 'Valentina y la serenidad' at Festival CICLOS 2026, Árbol Rojo's film festival in Felipe Carrillo Puerto. Free admission.",
    },
    startAt: "2026-11-24T18:00:00-05:00",
    venue: {
      name: { es: "Teatro de la Ciudad, Felipe Carrillo Puerto", en: "Teatro de la Ciudad, Felipe Carrillo Puerto" },
      latitude: 19.577983460373655,
      longitude: -88.04476419814225,
    },
    category: "culture",
    image: {
      url: "/img/eventos/ciclos-2026-b.webp",
      alt: { es: "Cartel del Festival CICLOS 2026 de Árbol Rojo", en: "Poster for Árbol Rojo's 2026 Festival CICLOS" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the CICLOS 2026 program sheet, 2026-11-18. Organizer: Árbol Rojo (arbolrojocine.com).",
    sourceUrl: "https://arbolrojocine.com/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "ciclos-2026-formas-de-atravesar-un-territorio",
    title: { es: "Festival CICLOS 2026 — Formas de atravesar un territorio", en: "Festival CICLOS 2026 — Formas de atravesar un territorio" },
    description: {
      es: "Función de «Formas de atravesar un territorio» en el Festival CICLOS 2026, el festival de cine de Árbol Rojo en Felipe Carrillo Puerto. Entrada gratuita.",
      en: "Screening of 'Formas de atravesar un territorio' at Festival CICLOS 2026, Árbol Rojo's film festival in Felipe Carrillo Puerto. Free admission.",
    },
    startAt: "2026-11-24T20:00:00-05:00",
    venue: {
      name: { es: "Teatro de la Ciudad, Felipe Carrillo Puerto", en: "Teatro de la Ciudad, Felipe Carrillo Puerto" },
      latitude: 19.577983460373655,
      longitude: -88.04476419814225,
    },
    category: "culture",
    image: {
      url: "/img/eventos/ciclos-2026-b.webp",
      alt: { es: "Cartel del Festival CICLOS 2026 de Árbol Rojo", en: "Poster for Árbol Rojo's 2026 Festival CICLOS" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the CICLOS 2026 program sheet, 2026-11-18. Organizer: Árbol Rojo (arbolrojocine.com).",
    sourceUrl: "https://arbolrojocine.com/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "ciclos-2026-vaychiletik",
    title: { es: "Festival CICLOS 2026 — Vaychiletik", en: "Festival CICLOS 2026 — Vaychiletik" },
    description: {
      es: "Función de «Vaychiletik» en el Festival CICLOS 2026, el festival de cine de Árbol Rojo en Felipe Carrillo Puerto. Entrada gratuita.",
      en: "Screening of 'Vaychiletik' at Festival CICLOS 2026, Árbol Rojo's film festival in Felipe Carrillo Puerto. Free admission.",
    },
    startAt: "2026-11-25T18:00:00-05:00",
    venue: {
      name: { es: "Teatro de la Ciudad, Felipe Carrillo Puerto", en: "Teatro de la Ciudad, Felipe Carrillo Puerto" },
      latitude: 19.577983460373655,
      longitude: -88.04476419814225,
    },
    category: "culture",
    image: {
      url: "/img/eventos/ciclos-2026-c.webp",
      alt: { es: "Cartel del Festival CICLOS 2026 de Árbol Rojo", en: "Poster for Árbol Rojo's 2026 Festival CICLOS" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the CICLOS 2026 program sheet, 2026-11-18. Organizer: Árbol Rojo (arbolrojocine.com).",
    sourceUrl: "https://arbolrojocine.com/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "ciclos-2026-mi-no-lugar",
    title: { es: "Festival CICLOS 2026 — Mi no lugar", en: "Festival CICLOS 2026 — Mi no lugar" },
    description: {
      es: "Función de «Mi no lugar» en el Festival CICLOS 2026, el festival de cine de Árbol Rojo en Felipe Carrillo Puerto. Entrada gratuita.",
      en: "Screening of 'Mi no lugar' at Festival CICLOS 2026, Árbol Rojo's film festival in Felipe Carrillo Puerto. Free admission.",
    },
    startAt: "2026-11-25T20:00:00-05:00",
    venue: {
      name: { es: "Teatro de la Ciudad, Felipe Carrillo Puerto", en: "Teatro de la Ciudad, Felipe Carrillo Puerto" },
      latitude: 19.577983460373655,
      longitude: -88.04476419814225,
    },
    category: "culture",
    image: {
      url: "/img/eventos/ciclos-2026-c.webp",
      alt: { es: "Cartel del Festival CICLOS 2026 de Árbol Rojo", en: "Poster for Árbol Rojo's 2026 Festival CICLOS" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the CICLOS 2026 program sheet, 2026-11-18. Organizer: Árbol Rojo (arbolrojocine.com).",
    sourceUrl: "https://arbolrojocine.com/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "ciclos-2026-tio-yim",
    title: { es: "Festival CICLOS 2026 — Tío Yim", en: "Festival CICLOS 2026 — Tío Yim" },
    description: {
      es: "Función de «Tío Yim» en el Festival CICLOS 2026, el festival de cine de Árbol Rojo en Felipe Carrillo Puerto. Entrada gratuita.",
      en: "Screening of 'Tío Yim' at Festival CICLOS 2026, Árbol Rojo's film festival in Felipe Carrillo Puerto. Free admission.",
    },
    startAt: "2026-11-26T18:00:00-05:00",
    venue: {
      name: { es: "Domo Infonavit, Felipe Carrillo Puerto", en: "Domo Infonavit, Felipe Carrillo Puerto" },
      latitude: 19.571900853488934,
      longitude: -88.04064636746081,
    },
    category: "culture",
    image: {
      url: "/img/eventos/ciclos-2026-a.webp",
      alt: { es: "Cartel del Festival CICLOS 2026 de Árbol Rojo", en: "Poster for Árbol Rojo's 2026 Festival CICLOS" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the CICLOS 2026 program sheet, 2026-11-18. Organizer: Árbol Rojo (arbolrojocine.com).",
    sourceUrl: "https://arbolrojocine.com/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "ciclos-2026-hijas-del-bosque",
    title: { es: "Festival CICLOS 2026 — Hijas del bosque", en: "Festival CICLOS 2026 — Hijas del bosque" },
    description: {
      es: "Función de «Hijas del bosque» en el Festival CICLOS 2026, el festival de cine de Árbol Rojo en Felipe Carrillo Puerto. Entrada gratuita.",
      en: "Screening of 'Hijas del bosque' at Festival CICLOS 2026, Árbol Rojo's film festival in Felipe Carrillo Puerto. Free admission.",
    },
    startAt: "2026-11-26T20:00:00-05:00",
    venue: {
      name: { es: "Domo Infonavit, Felipe Carrillo Puerto", en: "Domo Infonavit, Felipe Carrillo Puerto" },
      latitude: 19.571900853488934,
      longitude: -88.04064636746081,
    },
    category: "culture",
    image: {
      url: "/img/eventos/ciclos-2026-a.webp",
      alt: { es: "Cartel del Festival CICLOS 2026 de Árbol Rojo", en: "Poster for Árbol Rojo's 2026 Festival CICLOS" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the CICLOS 2026 program sheet, 2026-11-18. Organizer: Árbol Rojo (arbolrojocine.com).",
    sourceUrl: "https://arbolrojocine.com/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "ciclos-2026-foro-cineastas-pueblos-originarios",
    title: { es: "Festival CICLOS 2026 — Foro de Cineastas de Pueblos Originarios", en: "Festival CICLOS 2026 — Forum of Filmmakers from Indigenous Peoples" },
    description: {
      es: "Foro de Cineastas de Pueblos Originarios con invitados especiales, dentro del Festival CICLOS 2026 de Árbol Rojo en Felipe Carrillo Puerto. Entrada gratuita.",
      en: "Forum of filmmakers from indigenous peoples, with special guests, at Árbol Rojo's Festival CICLOS 2026 in Felipe Carrillo Puerto. Free admission.",
    },
    startAt: "2026-11-27T11:00:00-05:00",
    venue: {
      name: { es: "Auditorio del Instituto Tecnológico de Felipe Carrillo Puerto", en: "Auditorio del Instituto Tecnológico de Felipe Carrillo Puerto" },
      latitude: 19.5839823294831,
      longitude: -88.03015056745785,
    },
    category: "culture",
    image: {
      url: "/img/eventos/ciclos-2026-b.webp",
      alt: { es: "Cartel del Festival CICLOS 2026 de Árbol Rojo", en: "Poster for Árbol Rojo's 2026 Festival CICLOS" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the CICLOS 2026 program sheet, 2026-11-18. Organizer: Árbol Rojo (arbolrojocine.com).",
    sourceUrl: "https://arbolrojocine.com/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "ciclos-2026-li-cham-gala-fcp",
    title: { es: "Festival CICLOS 2026 — «Li Cham», gala Felipe Carrillo Puerto", en: "Festival CICLOS 2026 — 'Li Cham', FCP Gala" },
    description: {
      es: "Gala de «Li Cham» con la presencia de la directora Ana Ts'uyeb, en la Explanada del Parque Principal: cierre del Festival CICLOS 2026 de Árbol Rojo. Entrada gratuita.",
      en: "'Li Cham' gala screening with director Ana Ts'uyeb in attendance, at the Main Plaza — the closing of Árbol Rojo's Festival CICLOS 2026. Free admission.",
    },
    startAt: "2026-11-27T20:00:00-05:00",
    venue: {
      name: { es: "Explanada del Parque Principal, Felipe Carrillo Puerto", en: "Explanada del Parque Principal, Felipe Carrillo Puerto" },
      latitude: 19.582198310725833,
      longitude: -88.04538629099666,
    },
    category: "culture",
    image: {
      url: "/img/eventos/ciclos-2026-b.webp",
      alt: { es: "Cartel del Festival CICLOS 2026 de Árbol Rojo", en: "Poster for Árbol Rojo's 2026 Festival CICLOS" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the CICLOS 2026 program sheet, 2026-11-18. Organizer: Árbol Rojo (arbolrojocine.com).",
    sourceUrl: "https://arbolrojocine.com/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "festival-kooneex-kaay-sikil-2026",
    title: {
      es: "Festival Ko’one’ex K’aay + Festival Gastronómico SIKIL 2026",
      en: "Ko'one'ex K'aay Festival + SIKIL Gastronomic & Cultural Festival 2026",
    },
    description: {
      es: "Sexta edición del Festival Ko’one’ex K’aay junto al segundo Festival Gastronómico y Cultural SIKIL (Pepita): música que promueve las lenguas originarias con Carlos CHG, Sonido en Movimiento, Xéti NdáJnió Rap Mazateco, ADN Maya Colectivo, Cinturón de Orión Crotálico, Sayab K’aay Coro Infantil y Gigante Records, más exposición de platillos tradicionales a base de sikil (pepita de calabaza), productos artesanales y actividades de gastronomía ancestral. A partir de las 5:00 de la tarde. Expositores e inscripciones: 983 180 5680.",
      en: "Sixth edition of the Ko'one'ex K'aay Festival together with the 2nd SIKIL (Pepita) Gastronomic and Cultural Festival: music promoting indigenous languages with Carlos CHG, Sonido en Movimiento, Xéti NdáJnió Rap Mazateco, ADN Maya Colectivo, Cinturón de Orión Crotálico, Sayab K'aay Coro Infantil and Gigante Records, plus an exhibition of traditional dishes based on sikil (pumpkin seed), artisan products and ancestral gastronomy activities. From 5:00 PM. Exhibitors and registration: 983 180 5680.",
    },
    startAt: "2026-11-28T17:00:00-05:00",
    venue: {
      name: { es: "Concha Acústica “Alameda del Niño”, Felipe Carrillo Puerto", en: "Concha Acústica “Alameda del Niño”, Felipe Carrillo Puerto" },
      latitude: 19.576077358569158,
      longitude: -88.05435345779186,
    },
    category: "culture",
    image: {
      url: "/img/eventos/festival-kooneex-kaay-sikil-2026.webp",
      alt: { es: "Cartel del Festival Ko’one’ex K’aay y del Festival Gastronómico SIKIL 2026", en: "Poster for the Ko'one'ex K'aay Festival and the 2026 SIKIL Gastronomic Festival" },
    },
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from the Facebook share + press copy, 2026-11-18. Venue at Santiago Pacheco Cruz, Rafael E. Melgar (Google Maps pin on file). Exhibitor line: 983 180 5680.",
    sourceUrl: "https://www.facebook.com/share/1AANkeP82U/",
    status: "published",
    lastUpdated: "2026-11-18",
  },
  {
    id: "noche-nortena-epico-2026",
    title: {
      es: "La Noche se Pone Norteña en Épico — Banda 420",
      en: "A Northern Night at Épico — Banda 420",
    },
    description: {
      es: "Noche de música norteña en vivo con Banda 420: los mejores temas del regional mexicano para cantar y bailar. Cover de $100 MXN.",
      en: "A night of live norteña music with Banda 420: the best of regional Mexican music to sing and dance to. Cover: MX$100.",
    },
    startAt: "2026-11-21T22:00:00-05:00",
    venue: { placeId: "restaurante-epico" },
    category: "culture",
    image: {
      url: "/img/eventos/noche-nortena-epico-2026.webp",
      alt: { es: "Cartel de La Noche se Pone Norteña en Épico con Banda 420", en: "Poster for La Noche se Pone Norteña at Épico with Banda 420" },
    },
    cost: { es: "Cover $100 MXN", en: "Cover MX$100" },
    contactNote: "Verified from the Facebook event, Nov 2026.",
    sourceUrl: "https://www.facebook.com/events/1104811969005400/",
    status: "published",
    lastUpdated: "2026-11-18",
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