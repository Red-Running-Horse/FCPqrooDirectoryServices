// Offline-friendly inline SVG icons: no icon package, no CDN, no external assets.
// Every path below is an internal constant, never user or attraction data.
const ICON_PATHS = {
  // List/menu: the "all categories" fallback.
  all: '<path d="M8 7h11M8 12h11M8 17h11"/><circle cx="4.5" cy="7" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17" r="1"/>',
  // Leaf on a stem.
  nature:
    '<path d="M5 19c0-7 4-11 14-11 0 9-4 12-9 12-2.5 0-5-1.5-5-1z"/><path d="M4 20c3-4 6-6.5 10-8"/>',
  // Stepped structure with a civic doorway.
  culture:
    '<path d="M3 20h18"/><path d="M5 20v-4h14v4"/><path d="M8 16v-4h8v4"/><path d="M11 12V8h2v4"/><path d="M10.5 20v-3h3v3"/>',
  // Bowl with a spoon.
  food: '<path d="M4 11h14a7 7 0 0 1-7 7 7 7 0 0 1-7-7z"/><path d="M3 20h16"/><path d="M20 4v10"/><path d="M20 4c1.2 0 2 1 2 2.5S21.2 9 20 9"/>',
  // House with a bed inside.
  lodging:
    '<path d="M4 11 12 4l8 7"/><path d="M6 10.5V20h12v-9.5"/><path d="M9 17v-3h6v3"/><path d="M9 17h6"/>',
  // Compass rose with a route needle.
  tours: '<circle cx="12" cy="12" r="8.5"/><path d="M15 9l-2 5-5 2 2-5z"/>',
};

const FALLBACK_CATEGORY = "all";

// Returns a static inline SVG string for a category, falling back to the "all" icon.
export function categoryIconSvg(category, options = {}) {
  const { size = 20, className = "category-icon" } = options;
  const paths = ICON_PATHS[category] ?? ICON_PATHS[FALLBACK_CATEGORY];
  const safeSize = Number.isFinite(Number(size)) ? Number(size) : 20;
  const safeClass = String(className).replace(/[^\w -]/g, "");
  return (
    `<svg class="${safeClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ` +
    `width="${safeSize}" height="${safeSize}" fill="none" stroke="currentColor" stroke-width="1.8" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`
  );
}
