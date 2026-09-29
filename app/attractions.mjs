export const CATEGORIES = [
  { id: "all", label: { es: "Todos", en: "All" } },
  { id: "nature", label: { es: "Naturaleza", en: "Nature" } },
  { id: "culture", label: { es: "Cultura", en: "Culture" } },
  { id: "food", label: { es: "Comida", en: "Food" } },
  { id: "lodging", label: { es: "Hospedaje", en: "Lodging" } },
  { id: "tours", label: { es: "Tours", en: "Tours" } },
];

const DEMO_ADDRESS = {
  es: "Felipe Carrillo Puerto, Quintana Roo (zona aproximada)",
  en: "Felipe Carrillo Puerto, Quintana Roo (approximate area)",
};

const DEMO_VERIFICATION_NOTE = {
  es: "Punto de ejemplo: ubicación, horario y contacto aún no verificados.",
  en: "Example point: location, hours and contact not yet verified.",
};

const DEMO_LAST_UPDATED = "2026-09-29";

// Demo pins only: these coordinates are approximate points inside Felipe Carrillo Puerto and do
// not identify verified businesses or attractions. Set status to "verified" (and add a
// directionsUrl) only after confirming the real destination and its coordinates.
export const attractions = [
  {
    id: "nature-demo-1",
    name: { es: "Punto de naturaleza (demo)", en: "Nature spot (demo)" },
    category: "nature",
    description: {
      es: "Ejemplo de un sitio natural; ubicación aproximada y detalles pendientes de verificar.",
      en: "Example of a natural site; approximate location, details not yet verified.",
    },
    latitude: 19.59,
    longitude: -88.055,
    status: "unverified",
    locationAccuracy: "approximate",
    directionsUrl: null,
    address: DEMO_ADDRESS,
    hours: null,
    phone: null,
    whatsapp: null,
    website: null,
    verificationNote: DEMO_VERIFICATION_NOTE,
    lastUpdated: DEMO_LAST_UPDATED,
  },
  {
    id: "nature-demo-2",
    name: { es: "Segundo punto de naturaleza (demo)", en: "Second nature spot (demo)" },
    category: "nature",
    description: {
      es: "Ejemplo adicional con ubicación aproximada; no representa una atracción confirmada.",
      en: "Additional example with an approximate location; not a confirmed attraction.",
    },
    latitude: 19.563,
    longitude: -88.062,
    status: "unverified",
    locationAccuracy: "approximate",
    directionsUrl: null,
    address: DEMO_ADDRESS,
    hours: null,
    phone: null,
    whatsapp: null,
    website: null,
    verificationNote: DEMO_VERIFICATION_NOTE,
    lastUpdated: DEMO_LAST_UPDATED,
  },
  {
    id: "culture-demo",
    name: { es: "Punto cultural (demo)", en: "Culture spot (demo)" },
    category: "culture",
    description: {
      es: "Ejemplo de espacio cultural; ubicación aproximada pendiente de verificar.",
      en: "Example of a cultural venue; approximate location not yet verified.",
    },
    latitude: 19.585,
    longitude: -88.03,
    status: "unverified",
    locationAccuracy: "approximate",
    directionsUrl: null,
    address: DEMO_ADDRESS,
    hours: null,
    phone: null,
    whatsapp: null,
    website: null,
    verificationNote: DEMO_VERIFICATION_NOTE,
    lastUpdated: DEMO_LAST_UPDATED,
  },
  {
    id: "food-demo",
    name: { es: "Punto de comida (demo)", en: "Food spot (demo)" },
    category: "food",
    description: {
      es: "Ejemplo de comida local con ubicación aproximada; no representa un negocio confirmado.",
      en: "Example of local food with an approximate location; not a confirmed business.",
    },
    latitude: 19.575,
    longitude: -88.068,
    status: "unverified",
    locationAccuracy: "approximate",
    directionsUrl: null,
    address: DEMO_ADDRESS,
    hours: null,
    phone: null,
    whatsapp: null,
    website: null,
    verificationNote: DEMO_VERIFICATION_NOTE,
    lastUpdated: DEMO_LAST_UPDATED,
  },
  {
    id: "lodging-demo",
    name: { es: "Punto de hospedaje (demo)", en: "Lodging spot (demo)" },
    category: "lodging",
    description: {
      es: "Ejemplo de alojamiento con ubicación aproximada; no representa un negocio confirmado.",
      en: "Example of lodging with an approximate location; not a confirmed business.",
    },
    latitude: 19.57,
    longitude: -88.025,
    status: "unverified",
    locationAccuracy: "approximate",
    directionsUrl: null,
    address: DEMO_ADDRESS,
    hours: null,
    phone: null,
    whatsapp: null,
    website: null,
    verificationNote: DEMO_VERIFICATION_NOTE,
    lastUpdated: DEMO_LAST_UPDATED,
  },
  {
    id: "tours-demo",
    name: { es: "Punto de tours (demo)", en: "Tours spot (demo)" },
    category: "tours",
    description: {
      es: "Ejemplo de recorrido; operador y ubicación aproximada pendientes de verificar.",
      en: "Example of a tour; operator and approximate location not yet verified.",
    },
    latitude: 19.598,
    longitude: -88.04,
    status: "unverified",
    locationAccuracy: "approximate",
    directionsUrl: null,
    address: DEMO_ADDRESS,
    hours: null,
    phone: null,
    whatsapp: null,
    website: null,
    verificationNote: DEMO_VERIFICATION_NOTE,
    lastUpdated: DEMO_LAST_UPDATED,
  },
];

export function filterAttractions(category) {
  return attractions.filter((attraction) => category === "all" || attraction.category === category);
}

export function isVerified(attraction) {
  return attraction.status === "verified" && attraction.locationAccuracy === "exact";
}

// Directions are only offered for verified destinations with an https link.
export function directionsUrlFor(attraction) {
  const url = attraction.directionsUrl;
  return isVerified(attraction) && typeof url === "string" && url.startsWith("https://") ? url : null;
}
