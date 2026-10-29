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
    id: "noche-biocultural-tsikbal-2026",
    title: {
      es: "Noche Biocultural de Sian Ka'an — Tsíikbal: voces, leyendas y memoria de nuestros pixanes",
      en: "Sian Ka'an Biocultural Night — Tsíikbal: voices, legends and memory of our pixanes",
    },
    description: {
      es: "Velada de diálogo y conversación (tsíikbal) dedicada a las leyendas mayas —la Xtabay, los aluxes, el Huay Chivo—, los relatos tradicionales y las costumbres de la época de los pixanes y las ánimas, con personas conocedoras de la memoria cultural del pueblo. Organiza el Consejo Juvenil de Sian Ka'an.",
      en: "An evening of dialogue (tsíikbal) dedicated to Maya legends — the Xtabay, the aluxes, the Huay Chivo — traditional tales and the customs of the season of the pixanes and ánimas, with keepers of the town's cultural memory. Organized by the Sian Ka'an Youth Council.",
    },
    startAt: "2026-10-30T19:00:00-05:00",
    endAt: "2026-10-30T21:00:00-05:00",
    venue: {
      name: {
        es: "Concha Acústica de Radio XHNKA",
        en: "Radio XHNKA Acoustic Shell",
      },
    },
    category: "culture",
    contactNote: "Verified from Consejo Juvenil de Sian Ka'an Facebook post, 2026-10-15. Inscriptions at Casa de la Crónica FCP; contact Tadeo Colli Estrella, 983 182 9942.",
    sourceUrl: "https://www.facebook.com/share/p/1EtcJ9Ch4h/",
    status: "published",
    lastUpdated: "2026-10-15",
  },
  {
    id: "noche-biocultural-concursos-2026",
    title: {
      es: "Noche Biocultural — Concurso de disfraces 'Entre mitos y leyendas' y calaveritas literarias",
      en: "Biocultural Night — 'Among Myths and Legends' costume contest and literary calaveritas",
    },
    description: {
      es: "Concurso de disfraces inspirados en las leyendas mayas (materiales reciclados bienvenidos) y concurso de calaveritas literarias sobre la gastronomía, fauna y fiestas del pueblo. Premios a los tres primeros lugares de cada concurso. Inscripciones en La Casa de la Crónica FCP.",
      en: "Costume contest inspired by Maya legends (recycled materials welcome) and a literary calaveritas contest about the town's food, fauna and festivities. Prizes for the top three of each. Registration at La Casa de la Crónica FCP.",
    },
    startAt: "2026-10-31T19:00:00-05:00",
    endAt: "2026-10-31T21:00:00-05:00",
    venue: {
      name: {
        es: "Concha Acústica de Radio XHNKA",
        en: "Radio XHNKA Acoustic Shell",
      },
    },
    category: "culture",
    contactNote: "Verified from Consejo Juvenil de Sian Ka'an Facebook post, 2026-10-15. Contact: Tadeo Colli Estrella, 983 182 9942. Prizes for 1st–3rd in each contest.",
    sourceUrl: "https://www.facebook.com/share/p/1EtcJ9Ch4h/",
    status: "published",
    lastUpdated: "2026-10-15",
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
    contactNote: "Verified from Facebook event listing, 2026-10-15. No venue, schedule, or contact published yet — update when announced.",
    sourceUrl: "https://www.facebook.com/events/930745553313771/",
    status: "published",
    lastUpdated: "2026-10-15",
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
    venue: {
      name: { es: "Selva Morena, Felipe Carrillo Puerto", en: "Selva Morena, Felipe Carrillo Puerto" },
      latitude: 19.62743084397342,
      longitude: -87.95014240683298,
    },
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
    id: "entre-animas-y-leyendas-2026",
    title: {
      es: "Entre Ánimas y Leyendas: Identidad e Historia de Nuestro Pueblo",
      en: "Among Souls and Legends: Identity and History of Our Town",
    },
    description: {
      es: "Tres veladas de Día de Muertos en los pasillos del Museo Histórico de FCP: exposición de altares y música prehispánica (27 oct), noche de mitos y leyendas junto a la fogata (28 oct), y arte, danza folklórica y conferencia (29 oct). Organiza el H. Ayuntamiento, Coordinación de Asuntos Indígenas. Entrada libre.",
      en: "Three Día de Muertos evenings in the halls of the FCP Historical Museum: altar exhibition and prehispanic music (Oct 27), a night of myths and legends by the bonfire (Oct 28), and art, folkloric dance and a keynote lecture (Oct 29). Organized by the Municipal Government's Indigenous Affairs Coordination. Free admission.",
    },
    startAt: "2026-10-27T18:00:00-05:00",
    endAt: "2026-10-29T20:00:00-05:00",
    venue: { placeId: "museo-de-la-ciudad-felipe-carrillo-puerto" },
    category: "culture",
    cost: { es: "Entrada libre", en: "Free admission" },
    contactNote: "Verified from Ayuntamiento FCP event posts, Oct 2026. Program: altars+prehispanic music Oct 27; legends bonfire Oct 28; art+ballet+lecture Oct 29, 6 PM daily.",
    sourceUrl: "https://www.facebook.com/share/p/19Sgjq5dJT/",
    status: "published",
    lastUpdated: "2026-10-21",
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
    id: "festival-animas-y-las-estrellas-2026",
    title: {
      es: "Festival de las Ánimas y las Estrellas — Hanal Pixán y astronomía maya",
      en: "Festival of Souls and Stars — Hanal Pixán and Maya Astronomy",
    },
    description: {
      es: "Una velada que une el Hanal Pixán —la comida de las ánimas— con la astronomía y cosmovisión maya: rituales, música en vivo y observación guiada del cielo nocturno. Horario y sede por anunciarse.",
      en: "An evening blending Hanal Pixán — the food of the souls — with Maya astronomy and cosmology: rituals, live music and guided stargazing. Time and venue to be announced.",
    },
    startAt: "2026-11-02",
    venue: {
      name: { es: "Felipe Carrillo Puerto (sede por anunciarse)", en: "Felipe Carrillo Puerto (venue TBA)" },
    },
    category: "culture",
    contactNote: "Verified Oct 2026. Evening event Nov 2; exact time/venue pending announcement.",
    sourceUrl: "https://www.facebook.com/share/p/19wm5vi8bw/",
    status: "published",
    lastUpdated: "2026-10-21",
  },
  {
    id: "desfile-de-animas-2026",
    title: {
      es: "Desfile de Ánimas — Janal Pixan",
      en: "Parade of Souls — Janal Pixan",
    },
    description: {
      es: "Las ánimas recorrerán las calles del centro en el Desfile de Ánimas, parte de las actividades del Janal Pixan que honran la memoria de quienes viven por siempre en nuestros corazones. Consulta la ruta oficial en la publicación del Ayuntamiento.",
      en: "The souls walk the downtown streets in the Parade of Souls, part of the Janal Pixan activities honoring those who live forever in our hearts. See the official route in the City Hall post.",
    },
    startAt: "2026-10-31",
    venue: {
      name: { es: "Calles del centro histórico, FCP", en: "Downtown streets, FCP" },
    },
    category: "culture",
    contactNote: "Verified Oct 2026. Route published by the Ayuntamiento — check the source post for the derrotero before attending.",
    sourceUrl: "https://www.facebook.com/share/p/1E25jnzfv9/",
    status: "published",
    lastUpdated: "2026-10-26",
  },
  {
    id: "janal-pixan-noche-musical-2026",
    title: {
      es: "Janal Pixan — Noche de música: Chan Santa Roots y Cheetos y su Grupo Tenaz",
      en: "Janal Pixan — Music night: Chan Santa Roots and Cheetos y su Grupo Tenaz",
    },
    description: {
      es: "El 1 de noviembre, noche de ritmo y ambiente con Chan Santa Roots y Cheetos y su Grupo Tenaz, dentro de la cartelera del Janal Pixan — entre aromas, colores y recuerdos. Consulta la cartelera completa en la publicación del Ayuntamiento.",
      en: "On November 1, a night of rhythm with Chan Santa Roots and Cheetos y su Grupo Tenaz, part of the Janal Pixan program — among aromas, colors and memories. See the full schedule in the City Hall post.",
    },
    startAt: "2026-11-01",
    venue: {
      name: { es: "Felipe Carrillo Puerto (sede por confirmar en cartelera)", en: "Felipe Carrillo Puerto (venue per official schedule)" },
    },
    category: "culture",
    contactNote: "Verified Oct 2026. Time and venue per the Ayuntamiento cartelera; two posts cover the same Nov 1 celebration.",
    sourceUrl: "https://www.facebook.com/share/p/1d3F4pECSA/",
    status: "published",
    lastUpdated: "2026-10-26",
  },
  {
    id: "uqroo-tsikbal-jaanal-pixan-2026",
    title: {
      es: "Tsikbal — Raíces que dialogan: cambios y continuidades del Jaanal Pixan (UQROO)",
      en: "Tsikbal — Roots in Dialogue: change and continuity in Jaanal Pixan (UQROO)",
    },
    description: {
      es: "Conversatorio entre personas mayas mayores portadoras de la tradición, académicos y jóvenes universitarios sobre cómo ha cambiado el Jaanal Pixan frente a la migración, la escolarización, la religión, el turismo y la vida urbana — con proyección de un video documental. Organizan la División de Ciencias Sociales y Humanidades y Fundación Mundo Sustentable.",
      en: "A dialogue between elder Maya tradition-bearers, academics and young university students on how Jaanal Pixan has changed with migration, schooling, religion, tourism and urban life — including a documentary screening. Organized by the Division of Social Sciences and Humanities and Fundación Mundo Sustentable.",
    },
    startAt: "2026-11-09T16:00:00-05:00",
    endAt: "2026-11-09T18:00:00-05:00",
    venue: {
      name: { es: "Aula Popol Naj 2, UQROO Campus FCP", en: "Popol Naj Hall 2, UQROO FCP Campus" },
    },
    category: "culture",
    contactNote: "Verified from UQROO Campus FCP post, Oct 2026. University-community event; open attendance presumed — confirm with the Division if promoting widely.",
    sourceUrl: "https://www.facebook.com/share/p/19ctTkP1jS/",
    status: "published",
    lastUpdated: "2026-10-29",
  },
  {
    id: "uqroo-memorial-universitario-2026",
    title: {
      es: "Memorial Universitario — Jaanal Pixan (UQROO)",
      en: "University Memorial — Jaanal Pixan (UQROO)",
    },
    description: {
      es: "Un espacio de escucha, reciprocidad y aprendizaje entre saber académico y saber comunitario: mesa de memoria colectiva, degustación de alimentos de la temporada, exposición de altares, muestra de calaveritas literarias y música maya pax y mesoamericana.",
      en: "A space of listening, reciprocity and learning between academic and community knowledge: a collective memory table, seasonal food tasting, altar exhibition, literary calaveritas showcase, and Maya pax and Mesoamerican music.",
    },
    startAt: "2026-11-10T18:00:00-05:00",
    endAt: "2026-11-10T20:00:00-05:00",
    venue: {
      name: { es: "Instalaciones de la UQROO, Campus FCP", en: "UQROO FCP Campus grounds" },
    },
    category: "culture",
    contactNote: "Verified from UQROO Campus FCP post, Oct 2026. Organized with Fundación Mundo Sustentable.",
    sourceUrl: "https://www.facebook.com/share/p/19ctTkP1jS/",
    status: "published",
    lastUpdated: "2026-10-29",
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
