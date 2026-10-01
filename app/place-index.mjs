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

// A place has one primary `category` plus an optional `secondaryCategories` list (for example a
// nature spot where visitors can also sleep over). The primary category stays first and drives the
// marker icon and color; every category takes part in filtering and search, and a place is still
// listed only once per result set.
export function placeCategories(place) {
  const ids = [
    place?.category,
    ...(Array.isArray(place?.secondaryCategories) ? place.secondaryCategories : []),
  ];
  return ids.filter(
    (id, index) =>
      typeof id === "string" &&
      id !== "all" &&
      ids.indexOf(id) === index &&
      CATEGORIES.some((category) => category.id === id),
  );
}

// Bilingual labels of the primary and secondary categories, primary first.
export function categoryLabels(place, language) {
  return placeCategories(place).map((id) => {
    const { label } = CATEGORIES.find((category) => category.id === id);
    return label[language] ?? label.es;
  });
}

// Short display string for marker titles, popups, the portal and listing references.
export function categorySummary(place, language) {
  const labels = categoryLabels(place, language);
  return labels.length > 0 ? labels.join(" · ") : null;
}

// Case-insensitive match on the Spanish/English name and category labels; blank queries match everything.
export function matchesSearch(place, query) {
  const normalized = typeof query === "string" ? query.trim().toLocaleLowerCase() : "";
  if (!normalized) return true;

  const labels = placeCategories(place).flatMap((id) => {
    const { label } = CATEGORIES.find((category) => category.id === id);
    return [label.es, label.en];
  });
  const values = [place.name?.es, place.name?.en, ...labels];

  return values.some((value) => typeof value === "string" && value.toLocaleLowerCase().includes(normalized));
}

export function filterPlaces(places, category, query = "") {
  return places.filter(
    (place) =>
      (category === "all" || placeCategories(place).includes(category)) && matchesSearch(place, query),
  );
}

export function listingReferences(places) {
  return places.filter((place) =>
    place.status !== "unavailable" &&
    CATEGORIES.some(({ id }) => id !== "all" && id === place.category) &&
    typeof place.id === "string" &&
    typeof place.name?.es === "string" &&
    typeof place.latitude === "number" && Number.isFinite(place.latitude) &&
    typeof place.longitude === "number" && Number.isFinite(place.longitude),
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
