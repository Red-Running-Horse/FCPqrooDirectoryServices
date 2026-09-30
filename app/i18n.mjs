export const LANGUAGES = [
  { id: "es", label: "ES", name: "Español" },
  { id: "en", label: "EN", name: "English" },
];

export const DEFAULT_LANGUAGE = "es";

export const UI_TEXT = {
  es: {
    heading: "Explora Felipe Carrillo Puerto",
    instructions:
      "Mapa turístico de Felipe Carrillo Puerto, corazón de Maya Ka'an. Descubre naturaleza, cultura, comida y experiencias locales; toca un ícono para ver los detalles y acércate para leer los nombres de las calles.",
    legendRoad: "Carretera regional",
    legendCategories: "Categorías",
    languageLabel: "Idioma",
    filtersLabel: "Filtrar puntos del mapa",
    mapLabel: "Mapa turístico de Felipe Carrillo Puerto",
    resetView: "Volver a Felipe Carrillo Puerto",
    statusVerified: "Verificado",
    statusUnverified: "Demo: sin verificar, ubicación aproximada",
    directions: "Cómo llegar (abre otra pestaña)",
    directionsUnavailable: "Indicaciones no disponibles: la ubicación es aproximada y no está verificada.",
    loadError: "No se pudo cargar el mapa de carreteras.",
    portalHeading: "Lugar seleccionado",
    portalPrompt: "Selecciona un punto en el mapa para ver sus detalles aquí.",
    clearSelection: "Quitar selección",
    badgeVerified: "Verificado",
    badgeApproximate: "Ubicación aproximada",
    badgeUnavailable: "No disponible",
    labelCategory: "Categoría",
    labelAddress: "Dirección / comunidad",
    labelHours: "Horario",
    labelPhone: "Teléfono",
    labelWhatsapp: "WhatsApp",
    labelWebsite: "Sitio web",
    labelVerification: "Nota de verificación",
    labelLastUpdated: "Última actualización",
    actionCall: "Llamar",
    actionWhatsapp: "WhatsApp (abre otra pestaña)",
    actionWebsite: "Sitio web (abre otra pestaña)",
    popupHint: "Detalles completos debajo del mapa.",
    popupDetails: "Ver detalles",
  },
  en: {
    heading: "Explore Felipe Carrillo Puerto",
    instructions:
      "Tourist map of Felipe Carrillo Puerto, the heart of Maya Ka'an. Discover nature, culture, food and local experiences; tap an icon for details and zoom in to read the street names.",
    legendRoad: "Regional road",
    legendCategories: "Categories",
    languageLabel: "Language",
    filtersLabel: "Filter map points",
    mapLabel: "Tourist map of Felipe Carrillo Puerto",
    resetView: "Back to Felipe Carrillo Puerto",
    statusVerified: "Verified",
    statusUnverified: "Demo: unverified, approximate location",
    directions: "Directions (opens a new tab)",
    directionsUnavailable: "Directions unavailable: the location is approximate and not verified.",
    loadError: "The road map could not be loaded.",
    portalHeading: "Selected place",
    portalPrompt: "Select a point on the map to see its details here.",
    clearSelection: "Clear selection",
    badgeVerified: "Verified",
    badgeApproximate: "Approximate location",
    badgeUnavailable: "Unavailable",
    labelCategory: "Category",
    labelAddress: "Address / community",
    labelHours: "Hours",
    labelPhone: "Phone",
    labelWhatsapp: "WhatsApp",
    labelWebsite: "Website",
    labelVerification: "Verification note",
    labelLastUpdated: "Last updated",
    actionCall: "Call",
    actionWhatsapp: "WhatsApp (opens a new tab)",
    actionWebsite: "Website (opens a new tab)",
    popupHint: "Full details below the map.",
    popupDetails: "View details",
  },
};

export function uiText(language) {
  return UI_TEXT[language] ?? UI_TEXT[DEFAULT_LANGUAGE];
}

// Picks the requested language from a { es, en } value, falling back to Spanish.
export function localize(value, language) {
  return value?.[language] ?? value?.[DEFAULT_LANGUAGE];
}
