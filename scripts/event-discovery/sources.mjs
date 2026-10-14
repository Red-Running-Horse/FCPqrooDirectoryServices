// ============================================================================
// scripts/event-discovery/sources.mjs — registry of the public pages the
// discovery pipeline scans for event candidates.
//
// A source is a plain HTML page expected to advertise events either as
// schema.org/Event JSON-LD (the same markup /eventos emits for its own
// entries) or as listing cards in the SITUR shape extract.mjs documents.
// extract.mjs tries JSON-LD first, then the card markup; cards outside the
// Zona Maya service region are dropped with a count. Pages with neither
// simply yield no candidates — silence beats guesses, because every
// candidate becomes editor work downstream.
//
// Keep URLs official and anonymously fetchable: Facebook and other
// login-walled pages are listed with `enabled: false` so the pipeline never
// mistakes a login wall for "no events". Those are checked manually following
// EVENT_CHECKLIST.md.
// ============================================================================

export const SOURCES = [
  {
    id: "siturq-eventos",
    name: "SITUR-Q — Eventos",
    url: "https://siturq.gob.mx/eventos",
    enabled: true,
  },
  {
    id: "balam-nah",
    name: "Balam-Nah (centro cultural)",
    url: "https://balamnah.fcpqroo.mx",
    enabled: true,
  },
  {
    id: "ayuntamiento-fcp",
    name: "Ayuntamiento de Felipe Carrillo Puerto (Facebook)",
    url: "https://www.facebook.com/AyuntamientoFCP",
    // Facebook serves an anonymous fetch a login wall, not event markup.
    enabled: false,
    note: "Revisar a mano siguiendo EVENT_CHECKLIST.md hasta tener un espejo público.",
  },
];

export function enabledSources(sources = SOURCES) {
  return sources.filter((source) => source.enabled);
}

// Keyword → directory category (ids from app/place-index.mjs) used to
// pre-fill a candidate's "categoría sugerida". First match wins; anything
// unmatched defaults to "culture", which is where FCP events concentrate.
// The guess is only a starting point — the editor confirms the category
// before publishing.
export const CATEGORY_KEYWORDS = [
  ["food", ["comida", "gastronom", "cocina", "degustación", "antojito"]],
  ["tours", ["tour", "recorrido", "expedición", "ruta"]],
  ["nature", ["naturaleza", "cenote", "senderismo", "avistamiento", "reforestación"]],
  ["lodging", ["hospedaje"]],
  ["culture", ["música", "concierto", "taller", "exposición", "danza", "teatro", "feria", "festival", "cultura", "arte", "cine", "libro", "tradición"]],
];
