// Stable color tokens and horizontal split-color encoding for single- and multi-category places.
// Single-category places use a solid category color; multi-category places use horizontal
// division bands (2 categories = 2 bands, 3 categories = 3 bands, etc.) ordered deterministically
// according to the canonical category sequence in CATEGORIES.

import { CATEGORIES, placeCategories } from "./place-index.mjs";

// Canonical color token per place category, coherent with the Phase A palette:
// nature (jungle), culture (plum), food (terracotta), lodging (lagoon), tours (earth).
// "all" is a catalog filter, not a place category.
export const CATEGORY_COLORS = Object.freeze({
  nature: "#47775b",
  culture: "#914e70",
  food: "#a75030",
  lodging: "#536c98",
  tours: "#77663d",
});

export const FALLBACK_CATEGORY_COLOR = CATEGORY_COLORS.nature;

// Cap horizontal bands to maintain legibility and avoid overly thin stripes on compact markers.
export const MAX_SPLIT_BANDS = 4;

const CANONICAL_CATEGORY_ORDER = CATEGORIES.filter(({ id }) => id !== "all").map(({ id }) => id);

// Returns the stable color token for a category id, falling back to the default nature token.
export function categoryColor(categoryId) {
  return CATEGORY_COLORS[categoryId] ?? FALLBACK_CATEGORY_COLOR;
}

// Orders an array of category ids deterministically using the canonical order from CATEGORIES.
export function orderCategories(categories) {
  if (!Array.isArray(categories)) return [];
  const valid = categories.filter((id) => typeof id === "string" && id in CATEGORY_COLORS);
  const unique = [...new Set(valid)];
  return unique.sort((a, b) => {
    const ia = CANONICAL_CATEGORY_ORDER.indexOf(a);
    const ib = CANONICAL_CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

// Whether a place has more than one valid category.
export function isMultiCategory(place) {
  return placeCategories(place).length > 1;
}

// Generates a CSS background value for a given list of category ids:
// - 0 categories: fallback solid color
// - 1 category: solid category color
// - >=2 categories: horizontal linear gradient with proportional bands (capped at MAX_SPLIT_BANDS)
export function categoryBandBackground(categories) {
  const ordered = orderCategories(categories);
  if (ordered.length === 0) {
    return FALLBACK_CATEGORY_COLOR;
  }
  if (ordered.length === 1) {
    return categoryColor(ordered[0]);
  }

  const active = ordered.slice(0, MAX_SPLIT_BANDS);
  const count = active.length;
  const stops = [];

  for (let i = 0; i < count; i++) {
    const color = categoryColor(active[i]);
    const start = Number(((i / count) * 100).toFixed(3));
    const end = Number((((i + 1) / count) * 100).toFixed(3));
    stops.push(`${color} ${start}% ${end}%`);
  }

  return `linear-gradient(180deg, ${stops.join(", ")})`;
}

// Computes the background CSS value for a place object using its primary and secondary categories.
export function placeCategoryBackground(place) {
  if (!place) return FALLBACK_CATEGORY_COLOR;
  const categories = placeCategories(place);
  return categoryBandBackground(categories);
}

// Helper returning an inline style object suitable for React JSX style props.
export function placeCategoryStyle(place) {
  return { background: placeCategoryBackground(place) };
}
