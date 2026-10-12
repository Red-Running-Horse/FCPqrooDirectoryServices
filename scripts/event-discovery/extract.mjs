// ============================================================================
// scripts/event-discovery/extract.mjs — turn a fetched source page into
// event candidates. Pure logic + an injectable fetch: tests mock fetch and
// never touch the network.
//
// Candidate shape (fields mirror app/events.mjs so a reviewed candidate can
// be published without reshaping):
//   {
//     sourceId,            which registry source produced it
//     title: { es, en },   ES copy of the source string; EN is a placeholder
//                          flagged for translation in the issue checklist
//     startAt,             ISO-ish string straight from the source
//     endAt,               or null
//     venue: { name: { es, en } } | null,
//     sourceUrl,           the event's own URL when the markup has one,
//                          otherwise the page URL
//     description: string,  trimmed; "" when absent
//     categoryGuess,       keyword pre-fill, validated against the directory
//   }
// Blocks without a parseable startDate are skipped: an event candidate with
// no date is noise, not signal.
// ============================================================================

import { CATEGORIES } from "../../app/place-index.mjs";
import { CATEGORY_KEYWORDS } from "./sources.mjs";

const CATEGORY_IDS = new Set(CATEGORIES.map(({ id }) => id));
const DEFAULT_CATEGORY = "culture";
const JSON_LD_BLOCK = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

export function guessCategory(text) {
  const haystack = (text ?? "").toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (!CATEGORY_IDS.has(category) || category === "all") continue;
    if (keywords.some((keyword) => haystack.includes(keyword))) return category;
  }
  return DEFAULT_CATEGORY;
}

function eventNodes(node, acc = []) {
  if (Array.isArray(node)) {
    for (const item of node) eventNodes(item, acc);
    return acc;
  }
  if (node && typeof node === "object") {
    if (node["@graph"]) eventNodes(node["@graph"], acc);
    const type = node["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.some((t) => typeof t === "string" && t.split("/").pop() === "Event")) {
      acc.push(node);
    }
  }
  return acc;
}

function textOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function venueFrom(location) {
  if (!location) return null;
  if (typeof location === "string") {
    const name = location.trim();
    return name ? { name: { es: name, en: name } } : null;
  }
  const name =
    textOrEmpty(location.name) ||
    (location.address && typeof location.address === "object"
      ? textOrEmpty(location.address.addressLocality)
      : "") ||
    (typeof location.address === "string" ? location.address.trim() : "");
  return name ? { name: { es: name, en: name } } : null;
}

function eventUrl(node, pageUrl) {
  const url = textOrEmpty(node.url);
  return /^https?:\/\//.test(url) ? url : pageUrl;
}

export function extractEventsFromHtml(html, source) {
  const candidates = [];
  for (const match of html.matchAll(JSON_LD_BLOCK)) {
    let parsed;
    try {
      parsed = JSON.parse(match[1].trim());
    } catch {
      continue; // malformed block — the next block may still be readable
    }
    for (const node of eventNodes(parsed)) {
      const name = textOrEmpty(node.name);
      const startAt = textOrEmpty(node.startDate);
      if (!name || !startAt || Number.isNaN(Date.parse(startAt))) continue;
      const description = textOrEmpty(node.description).slice(0, 300);
      candidates.push({
        sourceId: source.id,
        title: { es: name, en: name },
        startAt,
        endAt: textOrEmpty(node.endDate) || null,
        venue: venueFrom(node.location),
        sourceUrl: eventUrl(node, source.url),
        description,
        categoryGuess: guessCategory(`${name} ${description}`),
      });
    }
  }
  return candidates;
}

export async function fetchHtml(url, fetchImpl, { timeoutMs = 15000 } = {}) {
  const response = await fetchImpl(url, {
    headers: { Accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`${url} respondió ${response.status}`);
  }
  return response.text();
}

// Fetch every source and extract candidates. A single source failing (DNS,
// timeout, redesign) is reported in `failures` instead of aborting the run —
// one down page must not hide candidates from the sources that still answer.
// Callers decide whether "every source failed" is a red run.
export async function collectCandidates(sources, fetchImpl) {
  const candidates = [];
  const failures = [];
  for (const source of sources) {
    try {
      const html = await fetchHtml(source.url, fetchImpl);
      candidates.push(...extractEventsFromHtml(html, source));
    } catch (error) {
      failures.push({ source, message: error.message });
    }
  }
  return { candidates, failures };
}
