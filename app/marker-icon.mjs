// View model for place map markers. A place carrying a markerLogo renders its
// own logo — rounded, cream-bordered, ~36px — ringed in the primary CATEGORY
// COLOR so the map's category language survives; every other place keeps the
// category glyph marker. Pure module: highway-map.js consumes this and
// node --test pins it, mirroring app/place-portal.mjs and app/sw-handler.mjs.

import { categoryColor } from "./category-colors.mjs";
import { categoryIconSvg } from "./category-icons.mjs";

export const LOGO_MARKER_SIZE = 36;
export const GLYPH_MARKER_SIZE = 32;

export function markerIconView(place) {
  const ringColor = categoryColor(place?.category);
  const logo =
    typeof place?.markerLogo === "string" && place.markerLogo.trim() !== "" ? place.markerLogo.trim() : null;
  if (logo) {
    return {
      kind: "logo",
      logo,
      ringColor,
      html: `<img class="attraction-marker__logo" src="${logo}" alt="" width="${LOGO_MARKER_SIZE}" height="${LOGO_MARKER_SIZE}">`,
      size: [LOGO_MARKER_SIZE, LOGO_MARKER_SIZE],
      anchor: [LOGO_MARKER_SIZE / 2, LOGO_MARKER_SIZE / 2],
      popupAnchor: [0, -LOGO_MARKER_SIZE / 2],
    };
  }
  return {
    kind: "glyph",
    logo: null,
    ringColor,
    html: categoryIconSvg(place?.category, { size: 18, className: "attraction-marker__icon" }),
    size: [GLYPH_MARKER_SIZE, GLYPH_MARKER_SIZE],
    anchor: [GLYPH_MARKER_SIZE / 2, GLYPH_MARKER_SIZE / 2],
    popupAnchor: [0, -GLYPH_MARKER_SIZE / 2],
  };
}
