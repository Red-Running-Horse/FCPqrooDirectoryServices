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
export const LABEL_MIN_ZOOM = 11;

export function shouldShowLabels(zoom) {
  return typeof zoom === "number" && zoom >= LABEL_MIN_ZOOM;
}
