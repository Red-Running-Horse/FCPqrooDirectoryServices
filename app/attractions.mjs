export const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "nature", label: "Naturaleza" },
  { id: "culture", label: "Cultura" },
  { id: "food", label: "Comida" },
  { id: "lodging", label: "Hospedaje" },
  { id: "tours", label: "Tours" },
];

// Demo pins only: these coordinates do not identify verified businesses or attractions.
export const attractions = [
  {
    id: "nature-demo-1",
    name: "Punto de naturaleza (demo)",
    category: "nature",
    description: "Ejemplo de un sitio natural; ubicación y detalles pendientes de verificar.",
    latitude: 19.59,
    longitude: -88.055,
    directionsUrl: null,
    status: "placeholder",
  },
  {
    id: "nature-demo-2",
    name: "Segundo punto de naturaleza (demo)",
    category: "nature",
    description: "Ejemplo adicional; no representa una atracción confirmada.",
    latitude: 19.555,
    longitude: -88.065,
    directionsUrl: null,
    status: "placeholder",
  },
  {
    id: "culture-demo",
    name: "Punto cultural (demo)",
    category: "culture",
    description: "Ejemplo de espacio cultural; ubicación pendiente de verificar.",
    latitude: 19.585,
    longitude: -88.03,
    directionsUrl: null,
    status: "placeholder",
  },
  {
    id: "food-demo",
    name: "Punto de comida (demo)",
    category: "food",
    description: "Ejemplo de comida local; no representa un negocio confirmado.",
    latitude: 19.575,
    longitude: -88.07,
    directionsUrl: null,
    status: "placeholder",
  },
  {
    id: "lodging-demo",
    name: "Punto de hospedaje (demo)",
    category: "lodging",
    description: "Ejemplo de alojamiento; no representa un negocio confirmado.",
    latitude: 19.57,
    longitude: -88.025,
    directionsUrl: null,
    status: "placeholder",
  },
  {
    id: "tours-demo",
    name: "Punto de tours (demo)",
    category: "tours",
    description: "Ejemplo de recorrido; operador y ubicación pendientes de verificar.",
    latitude: 19.6,
    longitude: -88.04,
    directionsUrl: null,
    status: "placeholder",
  },
];

export function filterAttractions(category) {
  return attractions.filter((attraction) => category === "all" || attraction.category === category);
}
