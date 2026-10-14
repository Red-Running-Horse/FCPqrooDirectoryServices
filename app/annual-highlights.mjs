// ============================================================================
// app/annual-highlights.mjs — ANNUAL HIGHLIGHTS: the directory's institutional
// memory. A curated, bilingual dataset of events that recur every year in
// Felipe Carrillo Puerto and the Zona Maya. Official local channels promote
// events post-facto; this dataset remembers what comes back every year.
//
// HARD BOUNDARIES — this dataset is SEPARATE from app/events.mjs on purpose:
//   * Records have NO fixed dates: `window` is free text with NO YEAR and
//     never an ISO date, so a highlight can never expire and can never reach
//     upcomingEvents(), the events tripwire test, the community strip, the
//     map events layer, or schema.org/Event JSON-LD.
//   * app/events.mjs must NEVER import this file. The only surface that
//     renders it is the "Annual highlights" section on /eventos.
//
// Schema (per record):
//   id          unique slug ("carnaval-fcp").
//   title       bilingual { es, en } — the event's name.
//   window      bilingual { es, en } — typical timing of the recurrence,
//               free text, NO YEAR: "Principios de marzo" / "Early March".
//               Never an event-date key or ISO value — a window must stay
//               unparseable as a date so the exclusions above hold by
//               construction.
//   description bilingual { es, en } — one factual line each. Editorial tone:
//               factual, no campaign copy, no hashtags.
//   category    a directory category slug (app/place-index.mjs, not "all").
//   sourceUrl   optional — where the recurrence is documented.
//
// CURATION + FUTURE AUTOMATION: additions are human-curated; v1 ships only
// the three documented recurrences below. A v2 automated pipeline may
// PROPOSE new records in exactly this shape — plain data, no functions
// beyond the export — and a human reviews and commits each proposal.
// ============================================================================

const annualHighlights = [
  {
    id: "carnaval-fcp",
    title: {
      es: "Carnaval Felipe Carrillo Puerto",
      en: "Felipe Carrillo Puerto Carnival",
    },
    window: {
      es: "Principios de marzo",
      en: "Early March",
    },
    description: {
      es: "Desfiles de comparsas y carros alegóricos por las calles del centro.",
      en: "Parades of comparsas and floats through the downtown streets.",
    },
    category: "culture",
    sourceUrl: "https://siturq.gob.mx/eventos",
  },
  {
    id: "festival-xtaabay",
    title: {
      es: "Festival de la Xtáabay",
      en: "Xtáabay Festival",
    },
    window: {
      es: "Mediados de octubre",
      en: "Mid-October",
    },
    description: {
      es: "Música, teatro y danza dedicados a la Xtáabay, figura de la tradición oral maya.",
      en: "Music, theater and dance dedicated to the Xtáabay, a figure of Maya oral tradition.",
    },
    category: "culture",
  },
  {
    id: "dia-de-muertos",
    title: {
      es: "Día de Muertos",
      en: "Day of the Dead",
    },
    window: {
      es: "Finales de octubre al 2 de noviembre",
      en: "Late October through November 2",
    },
    description: {
      es: "Velorios, altares domésticos y reuniones en los cementerios de las comunidades.",
      en: "Wakes, home altars and cemetery gatherings in the communities.",
    },
    category: "culture",
  },
];

export default annualHighlights;
