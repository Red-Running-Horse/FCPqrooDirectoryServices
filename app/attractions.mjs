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

// Verified local places should carry exact coordinates and a working directionsUrl.
export const attractions = [
  {
    id: "mercado-felipe-carrillo-puerto",
    category: "food",
    name: {
      es: "Mercado Público Municipal de Felipe Carrillo Puerto",
      en: "Felipe Carrillo Puerto Municipal Public Market",
    },
    description: {
      es: "Mercado municipal con puestos de comida tradicional yucateca, productos locales y artesanías en el centro de la ciudad.",
      en: "Municipal market with traditional Yucatecan food stalls, local products and crafts in the city center.",
    },
    latitude: 19.580894458770345,
    longitude: -88.04402730793707,
    status: "verified",
    locationAccuracy: "exact",
    directionsUrl: "https://maps.app.goo.gl/zJbo8V1rE4ZmYT537",
    address: {
      es: "Calle 66 entre 65 y 67, Col. Centro, Felipe Carrillo Puerto, Quintana Roo",
      en: "66 Street between 65th and 67th, Col. Centro, Felipe Carrillo Puerto, Quintana Roo",
    },
    hours: {
      es: "Lun - Dom: 05:00 - 21:00",
      en: "Mon - Sun: 05:00 - 21:00",
    },
    phone: "800 911 6666",
    whatsapp: null,
    website: "https://www.felipecarrillopuerto.gob.mx/component/tags/tag/mercado",
    verificationNote: {
      es: "Ubicación verificada físicamente en sitio y confirmada por el equipo; coordenadas tomadas del punto directo en Google Maps.",
      en: "Location physically verified on site and confirmed by the team; coordinates taken from the direct Google Maps pin.",
    },
    lastUpdated: "2026-09-29",
  },
];

// Case-insensitive match on the Spanish/English name and category label; blank queries match everything.
export function matchesSearch(attraction, query) {
  const normalized = typeof query === "string" ? query.trim().toLocaleLowerCase() : "";
  if (!normalized) return true;

  const category = CATEGORIES.find(({ id }) => id === attraction.category);
  const values = [attraction.name?.es, attraction.name?.en, category?.label?.es, category?.label?.en];

  return values.some((value) => typeof value === "string" && value.toLocaleLowerCase().includes(normalized));
}

export function filterAttractions(category, query = "") {
  return attractions.filter(
    (attraction) => (category === "all" || attraction.category === category) && matchesSearch(attraction, query),
  );
}

export function isVerified(attraction) {
  return attraction.status === "verified" && attraction.locationAccuracy === "exact";
}

// Directions are only offered for verified destinations with an https link.
export function directionsUrlFor(attraction) {
  const url = attraction.directionsUrl;
  return isVerified(attraction) && typeof url === "string" && url.startsWith("https://") ? url : null;
}
