// Catalog logic that works on lightweight index entries alone (id, category, coordinates,
// status, locationAccuracy, name). It carries no place records, so the client bundle can
// filter, search and draw markers before any per-place detail JSON is fetched.
// app/attractions.mjs re-exports these helpers for the committed source records.

export const CATEGORIES = [
  { id: "all", label: { es: "Todos", en: "All" } },
  { id: "nature", label: { es: "Naturaleza", en: "Nature" } },
  { id: "culture", label: { es: "Cultura", en: "Culture" } },
  { id: "food", label: { es: "Comida", en: "Food" } },
  { id: "lodging", label: { es: "Hospedaje", en: "Lodging" } },
  { id: "tours", label: { es: "Tours", en: "Tours" } },
];

// Case-insensitive match on the Spanish/English name and category label; blank queries match everything.
export function matchesSearch(place, query) {
  const normalized = typeof query === "string" ? query.trim().toLocaleLowerCase() : "";
  if (!normalized) return true;

  const category = CATEGORIES.find(({ id }) => id === place.category);
  const values = [place.name?.es, place.name?.en, category?.label?.es, category?.label?.en];

  return values.some((value) => typeof value === "string" && value.toLocaleLowerCase().includes(normalized));
}

export function filterPlaces(places, category, query = "") {
  return places.filter(
    (place) => (category === "all" || place.category === category) && matchesSearch(place, query),
  );
}

export function isVerified(place) {
  return place.status === "verified" && place.locationAccuracy === "exact";
}

// Directions are only offered for verified destinations with an https link.
export function directionsUrlFor(place) {
  const url = place.directionsUrl;
  return isVerified(place) && typeof url === "string" && url.startsWith("https://") ? url : null;
}
