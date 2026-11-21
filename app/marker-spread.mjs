// Pure marker spreading for coincident map pins (user directive).
//
// Why: an event at its venue, double screenings at one theater, and genuinely
// close neighbors (Noj Kaaj's meeting point IS the plaza) share one point —
// and on the map one marker renders on top of the other, so the underneath
// one reads as "missing". The data is correct; the rendering is not.
//
// What: markers grouped by EXACT coordinate fan out deterministically around
// their true point. The spread radius shrinks with zoom and reaches zero at
// SPREAD_ANCHOR_ZOOM, so at street level every pin sits exactly on its true
// coordinates (honest), while at city zoom stacked pins separate (readable).
// Angles are derived from a stable hash of each marker's id, so the layout is
// identical on every render — no flicker, independent of input order.
//
// Deliberately NOT changed: coordinates in the data. This module only affects
// where markers are drawn; the underlying records stay exact.

export const SPREAD_ANCHOR_ZOOM = 16;
export const SPREAD_BASE_METERS = 6;
const COORD_PRECISION = 7;
const METERS_PER_DEGREE_LAT = 111320;

// FNV-1a 32-bit — stable across runs and platforms.
function hashId(id) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 0xffffffff;
}

// items: [{ id, position: [lat, lon] }] — zoom: current map zoom (fractional ok).
// Returns a Map of id → [dLat, dLon] offsets (all zero for singletons and at
// zoom >= SPREAD_ANCHOR_ZOOM).
export function spreadOffsets(items, zoom) {
  const groups = new Map();
  for (const { id, position } of items) {
    const key = `${position[0].toFixed(COORD_PRECISION)},${position[1].toFixed(COORD_PRECISION)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id, position });
  }

  const offsets = new Map();
  // Zero at (and beyond) the anchor zoom: street level shows true coordinates;
  // each zoom level out doubles the radius.
  const radiusMeters =
    zoom >= SPREAD_ANCHOR_ZOOM ? 0 : SPREAD_BASE_METERS * 2 ** (SPREAD_ANCHOR_ZOOM - zoom);

  for (const group of groups.values()) {
    if (group.length === 1) {
      offsets.set(group[0].id, [0, 0]);
      continue;
    }
    // Sort by id so each member's slot — and therefore its angle — depends
    // only on who else is in the stack, never on input order.
    group.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const n = group.length;
    group.forEach(({ id, position }, i) => {
      // Evenly spaced around the circle, with a stable per-id jitter inside
      // each slot so the same id lands in the same place on every render.
      const angle = (2 * Math.PI * (i + 0.5 * hashId(id))) / n;
      const dLat = (radiusMeters * Math.sin(angle)) / METERS_PER_DEGREE_LAT;
      const dLon =
        (radiusMeters * Math.cos(angle)) /
        (METERS_PER_DEGREE_LAT * Math.cos((position[0] * Math.PI) / 180));
      // Normalise -0 to 0 so offsets compare cleanly (strict deep-equality).
      offsets.set(id, [Object.is(dLat, -0) ? 0 : dLat, Object.is(dLon, -0) ? 0 : dLon]);
    });
  }
  return offsets;
}
