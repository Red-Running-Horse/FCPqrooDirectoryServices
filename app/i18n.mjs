export const LANGUAGES = [
  { id: "es", label: "ES", name: "Español" },
  { id: "en", label: "EN", name: "English" },
];

export const DEFAULT_LANGUAGE = "es";

export const UI_TEXT = {
  es: {
    heading: "Explora Felipe Carrillo Puerto",
    heroEyebrow: "Guía local de Maya Ka’an",
    heroSubheading: "Naturaleza, cultura, comida y experiencias locales en un solo mapa.",
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
    detailsError: "No se pudieron cargar los detalles de este lugar. Inténtalo de nuevo.",
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
    searchLabel: "Buscar lugares",
    searchPlaceholder: "Nombre o categoría (p. ej., mercado, comida)",
    searchEmpty: "No hay lugares que coincidan con tu búsqueda en esta categoría.",
    radioHeading: "XEPET — Radio Maya",
    radioDescription: "Escucha la transmisión de la radio maya del INPI.",
    radioListen: "Escuchar en vivo (abre otra pestaña)",
    radioUnavailable: "Si la transmisión no está disponible, inténtalo más tarde.",
    ctaHeading: "¿Tienes un negocio local?",
    ctaDescription:
      "Ayuda a los visitantes a descubrir tu negocio en Felipe Carrillo Puerto. Podemos ayudarte con tu ficha, sitio web y presencia en redes sociales.",
    ctaLearn: "Conoce el proyecto",
    ctaRequest: "Solicita información",
    businessCtaUnderConstruction: "Esta sección está en construcción.",
    ctaLearnMessage:
      "Este mapa es una guía local de Felipe Carrillo Puerto. Los lugares se incluyen según información verificada, no por pago.",
  },
  en: {
    heading: "Explore Felipe Carrillo Puerto",
    heroEyebrow: "Maya Ka’an local guide",
    heroSubheading: "Nature, culture, food, and local experiences in one map.",
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
    detailsError: "This place's details could not be loaded. Please try again.",
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
    searchLabel: "Search places",
    searchPlaceholder: "Name or category (e.g., market, food)",
    searchEmpty: "No places match your search in this category.",
    radioHeading: "XEPET — Maya Radio",
    radioDescription: "Listen to the INPI Maya radio stream.",
    radioListen: "Listen live (opens a new tab)",
    radioUnavailable: "If the stream is unavailable, please try again later.",
    ctaHeading: "Do you run a local business?",
    ctaDescription:
      "Help visitors discover your business in Felipe Carrillo Puerto. We can help with your listing, website, and social media presence.",
    ctaLearn: "Learn about the project",
    ctaRequest: "Request information",
    businessCtaUnderConstruction: "This section is under construction.",
    ctaLearnMessage:
      "This map is a local guide to Felipe Carrillo Puerto. Places are listed based on verified information, not payment.",
  },
};

export function uiText(language) {
  return UI_TEXT[language] ?? UI_TEXT[DEFAULT_LANGUAGE];
}

// Picks the requested language from a { es, en } value, falling back to Spanish.
export function localize(value, language) {
  return value?.[language] ?? value?.[DEFAULT_LANGUAGE];
}
