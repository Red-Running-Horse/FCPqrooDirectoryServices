export const TOURIST_MAP_STYLE = {
  background: "#f3eddf",
  highwayCasing: "#fff7e8",
  highway: "#c96f3b",
  label: "#3c3028",
};

// Town centre of Felipe Carrillo Puerto.
export const FCP_CENTER = [19.5797, -88.0453];

// Initial view: the town of Felipe Carrillo Puerto (roughly 5 km across), not the whole region.
export const FCP_VIEW_BOUNDS = [
  [19.555, -88.075],
  [19.605, -88.015],
];

// Panning limit: wider than the initial view so nearby coast, lagoons and
// neighbouring communities stay reachable without drifting across Mexico.
export const FCP_MAX_BOUNDS = [
  [18.8, -89.1],
  [20.4, -87.0],
];

export const MIN_ZOOM = 8;
export const MAX_ZOOM = 20;
// Regional roads are labelled from LABEL_MIN_ZOOM; local town streets from STREET_LABEL_MIN_ZOOM
// (city-level close zoom) so the town view is readable without clutter at regional zooms.
export const LABEL_MIN_ZOOM = 11;
export const STREET_LABEL_MIN_ZOOM = 14;

const HIGHWAY_TYPES = new Set(["Carretera", "Camino", "Enlace"]);

export function labelTier(roadType) {
  return HIGHWAY_TYPES.has(roadType) ? "highway" : "street";
}

export function shouldShowLabels(zoom, tier = "highway") {
  const minimum = tier === "street" ? STREET_LABEL_MIN_ZOOM : LABEL_MIN_ZOOM;
  return typeof zoom === "number" && zoom >= minimum;
}
