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
//     startAt,             ISO-ish string (JSON-LD) or "YYYY-MM-DD" (card
//                          fallback), or null when the source has no
//                          parseable date — the human checklist verifies it
//     endAt,               or null
//     venue: { name: { es, en } } | null,
//     sourceUrl,           the event's own URL when the markup has one,
//                          otherwise the page URL
//     description: string,  trimmed; "" when absent
//     categoryGuess,       keyword pre-fill, validated against the directory
//   }
//
// Extraction order per page: schema.org/Event JSON-LD first (a page emitting
// it is machine-readable on purpose). When — and only when — a page has no
// JSON-LD events, the HTML-card fallback parses listing cards into the same
// candidate shape. JSON-LD wins when both are present.
//
// Card fallback (built from https://siturq.gob.mx/eventos, 2026-10): cards
// are <div class="card" data-municipality="…"> blocks with an
// <h3 class="card-title">, a <p class="card-text"> description, a
// <span class="date"> ("30 octubre 2026" — Spanish month, no comma) and a
// "Ver más" <a class="card-link"> to the event's detail page. Cards whose
// municipality (data-municipality) is outside the service region are dropped
// with a count — most SITUR listings are Cancún/Cozumel/Bacalar, not the
// Zona Maya. Cards without a date or description follow their detail link
// ONCE (one level deep), capped by MAX_DETAIL_FETCHES per run so the daily
// cron stays polite: one listing fetch per source plus a handful of details.
// ============================================================================

import { CATEGORIES } from "../../app/place-index.mjs";
import { CATEGORY_KEYWORDS } from "./sources.mjs";

const CATEGORY_IDS = new Set(CATEGORIES.map(({ id }) => id));
const DEFAULT_CATEGORY = "culture";
const JSON_LD_BLOCK = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

// Detail fetches per run, across all sources: the cron does one listing
// fetch per enabled source; six more fetches is a polite ceiling for cards
// missing a date or description.
export const MAX_DETAIL_FETCHES = 6;

// Card candidates carry the listing's own municipality classification;
// anything outside the Zona Maya is dropped (counted) before reporting.
// Municipality names are matched accent- and case-insensitively. Cards
// WITHOUT a municipality are kept — unknown is not out-of-region, and
// silence beats guesses.
export const ZONA_MAYA_MUNICIPALITIES = ["felipe carrillo puerto", "jose maria morelos"];

const MONTHS_ES = {
  enero: "01",
  febrero: "02",
  marzo: "03",
  abril: "04",
  mayo: "05",
  junio: "06",
  julio: "07",
  agosto: "08",
  septiembre: "09",
  setiembre: "09",
  octubre: "10",
  noviembre: "11",
  diciembre: "12",
};

export function guessCategory(text) {
  const haystack = (text ?? "").toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (!CATEGORY_IDS.has(category) || category === "all") continue;
    if (keywords.some((keyword) => haystack.includes(keyword))) return category;
  }
  return DEFAULT_CATEGORY;
}

// "30 octubre 2026" → "2026-10-30" (the one format SITUR's listing uses,
// zero-padded or not, optional "de"). Anything else → null: the candidate
// is still reported dateless for the human checklist.
export function parseCardDate(text) {
  const match = /^\s*(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)\s+(?:de\s+)?(\d{4})\s*$/i.exec(text ?? "");
  if (!match) return null;
  const month = MONTHS_ES[match[2].toLowerCase()];
  if (!month) return null;
  return `${match[3]}-${month}-${String(Number(match[1])).padStart(2, "0")}`;
}

function normalizeRegion(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isInServiceRegion(municipality) {
  if (!municipality) return true;
  return ZONA_MAYA_MUNICIPALITIES.includes(normalizeRegion(municipality));
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

function extractJsonLdEvents(html, source) {
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

// ---------------------------------------------------------------- card fallback

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function textOf(htmlFragment) {
  if (!htmlFragment) return "";
  return decodeEntities(htmlFragment.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return base;
  }
}

// One listing card → one raw card. Cards without a title are skipped (noise,
// not signal); a missing date/description is fine — the candidate is still
// reported and MAY follow its detail link (see collectCandidates).
function parseCardBlock(block) {
  const title = textOf(/<h3[^>]*class="[^"]*card-title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i.exec(block)?.[1]);
  if (!title) return null;
  const description = textOf(/<p[^>]*class="[^"]*card-text[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(block)?.[1]).slice(0, 300);
  const dateText = textOf(/<span[^>]*class="[^"]*\bdate\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(block)?.[1]);
  const rawLink =
    /<a[^>]*href="([^"]+)"[^>]*class="[^"]*card-link/i.exec(block)?.[1] ??
    /<a[^>]*class="[^"]*card-link[^"]*"[^>]*href="([^"]+)"/i.exec(block)?.[1] ??
    /<a[^>]*href="([^"]+)"[^>]*>\s*<h3/i.exec(block)?.[1];
  // "#" hrefs are placeholders, not detail pages.
  const link = rawLink && !rawLink.startsWith("#") ? rawLink : null;
  const municipality = /data-municipality="([^"]*)"/i.exec(block)?.[1]?.trim() || null;
  return { title, description, startAt: parseCardDate(dateText), link, municipality };
}

// Cards are sibling <div class="card" …> blocks inside the listing
// container. Cut from each card opener to the next (or EOF) so per-card
// regexes never cross cards. String.split can't do this: a zero-width
// lookahead at index 0 is ignored by split, which would drop the first card.
function cardBlocks(html) {
  const starts = [...html.matchAll(/<div[^>]*?class="card(?:\s|")[^>]*>/gi)].map((match) => match.index);
  return starts.map((start, i) => html.slice(start, starts[i + 1] ?? html.length));
}

function extractCards(html, source) {
  return cardBlocks(html)
    .map(parseCardBlock)
    .filter(Boolean)
    .map((card) => {
      const sourceUrl = card.link ? absoluteUrl(card.link, source.url) : source.url;
      const needsDetail = card.startAt === null || card.description === "";
      return {
        sourceId: source.id,
        title: { es: card.title, en: card.title },
        startAt: card.startAt,
        endAt: null,
        venue: card.municipality ? { name: { es: card.municipality, en: card.municipality } } : null,
        sourceUrl,
        description: card.description,
        categoryGuess: guessCategory(`${card.title} ${card.description}`),
        // Internal-only bookkeeping for collectCandidates, deleted before
        // candidates leave this module.
        ...(needsDetail && card.link ? { __detailUrl: sourceUrl } : {}),
        ...(card.municipality ? { __municipality: card.municipality } : {}),
      };
    });
}

export function extractEventsFromHtml(html, source) {
  const jsonLd = extractJsonLdEvents(html, source);
  if (jsonLd.length > 0) return jsonLd; // JSON-LD wins when both are present
  return extractCards(html, source);
}

// Fill the fields the listing card lacked from its detail page — JSON-LD
// first, then the same card structure. Only missing fields are filled: the
// listing is what we actually saw.
function enrichFromDetail(candidate, detailHtml) {
  const donor = extractEventsFromHtml(detailHtml, {
    id: candidate.sourceId,
    url: candidate.sourceUrl,
  })[0];
  if (!donor) return candidate;
  if (candidate.startAt === null && donor.startAt) candidate.startAt = donor.startAt;
  if (!candidate.description && donor.description) candidate.description = donor.description;
  return candidate;
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
//
// Alongside the candidates, the run reports `regionDropped` (card candidates
// outside the Zona Maya — SITUR lists the whole state) and `detailFetches`
// (detail pages actually followed; hard-capped at maxDetailFetches per run).
export async function collectCandidates(sources, fetchImpl, { maxDetailFetches = MAX_DETAIL_FETCHES } = {}) {
  const candidates = [];
  const failures = [];
  let regionDropped = 0;
  let detailFetches = 0;
  for (const source of sources) {
    try {
      const html = await fetchHtml(source.url, fetchImpl);
      for (const candidate of extractEventsFromHtml(html, source)) {
        if (!isInServiceRegion(candidate.__municipality)) {
          regionDropped += 1;
          continue;
        }
        if (candidate.__detailUrl && detailFetches < maxDetailFetches) {
          try {
            const detailHtml = await fetchHtml(candidate.__detailUrl, fetchImpl);
            enrichFromDetail(candidate, detailHtml);
            detailFetches += 1;
          } catch {
            // Detail page down or redesigned — the listing-level candidate
            // still counts; the checklist verifies dates anyway.
          }
        }
        delete candidate.__detailUrl;
        delete candidate.__municipality;
        candidates.push(candidate);
      }
    } catch (error) {
      failures.push({ source, message: error.message });
    }
  }
  return { candidates, failures, regionDropped, detailFetches };
}
