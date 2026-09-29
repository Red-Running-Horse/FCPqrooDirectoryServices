export const TOURIST_MAP_STYLE = {
  background: "#f3eddf",
  highwayCasing: "#fff7e8",
  highway: "#c96f3b",
  label: "#3c3028",
};

// Felipe Carrillo Puerto and the nearby attractions worth reaching by road.
export const FCP_VIEW_BOUNDS = [
  [19.2, -88.5],
  [19.95, -87.4],
];

// Panning limit: wider than the initial view so nearby coast, lagoons and
// neighbouring communities stay reachable without drifting across Mexico.
export const FCP_MAX_BOUNDS = [
  [18.8, -89.1],
  [20.4, -87.0],
];

export const MIN_ZOOM = 8;
export const MAX_ZOOM = 14;
export const LABEL_MIN_ZOOM = 11;

export function shouldShowLabels(zoom) {
  return typeof zoom === "number" && zoom >= LABEL_MIN_ZOOM;
}
