export const LANGUAGES = [
  { id: "es", label: "ES", name: "Español" },
  { id: "en", label: "EN", name: "English" },
];

export const DEFAULT_LANGUAGE = "es";

export const UI_TEXT = {
  es: {
    heading: "Explora Felipe Carrillo Puerto",
    instructions:
      "Mapa turístico de las carreteras regionales. Acércate para ver los nombres de las carreteras. Los puntos de interés son ejemplos con ubicación aproximada, no destinos confirmados.",
    legendRoad: "Carretera regional",
    legendApproximate: "Punto de ejemplo (ubicación aproximada)",
    languageLabel: "Idioma",
    filtersLabel: "Filtrar puntos del mapa",
    mapLabel: "Mapa turístico de Felipe Carrillo Puerto",
    resetView: "Volver a Felipe Carrillo Puerto",
    statusVerified: "Verificado",
    statusUnverified: "Demo: sin verificar, ubicación aproximada",
    directions: "Cómo llegar (abre otra pestaña)",
    directionsUnavailable: "Indicaciones no disponibles: la ubicación es aproximada y no está verificada.",
    loadError: "No se pudo cargar el mapa de carreteras.",
  },
  en: {
    heading: "Explore Felipe Carrillo Puerto",
    instructions:
      "Tourist map of the regional roads. Zoom in to see road names. Points of interest are examples with approximate locations, not confirmed destinations.",
    legendRoad: "Regional road",
    legendApproximate: "Example point (approximate location)",
    languageLabel: "Language",
    filtersLabel: "Filter map points",
    mapLabel: "Tourist map of Felipe Carrillo Puerto",
    resetView: "Back to Felipe Carrillo Puerto",
    statusVerified: "Verified",
    statusUnverified: "Demo: unverified, approximate location",
    directions: "Directions (opens a new tab)",
    directionsUnavailable: "Directions unavailable: the location is approximate and not verified.",
    loadError: "The road map could not be loaded.",
  },
};

export function uiText(language) {
  return UI_TEXT[language] ?? UI_TEXT[DEFAULT_LANGUAGE];
}

// Picks the requested language from a { es, en } value, falling back to Spanish.
export function localize(value, language) {
  return value?.[language] ?? value?.[DEFAULT_LANGUAGE];
}
