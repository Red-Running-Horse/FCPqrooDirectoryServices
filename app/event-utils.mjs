// Pure helpers for the events feature: America/Cancun date math, upcoming/past
// filtering, venue resolution, bilingual formatting and schema.org/Event JSON-LD.
// This module is environment-agnostic (no DOM, no React) so node --test can
// exercise it directly, mirroring app/place-index.mjs and app/place-portal.mjs.
//
// Timezone model: America/Cancun is UTC-5 year-round (no DST since 2015). Event
// datetimes are stored as ISO 8601; an explicit offset is always honored, while
// an offset-less datetime is interpreted as Cancun wall time. Comparing instants
// is timezone-independent, so "now" is simply an absolute millisecond value.

import { localize } from "./i18n.mjs";

export const CANCUN_TIME_ZONE = "America/Cancun";
export const CANCUN_UTC_OFFSET = "-05:00";

const EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

// Parses an ISO date or datetime as an absolute instant. "2026-10-15" means the
// start of that day in Cancun; "2026-10-15T18:00" means 18:00 in Cancun.
export function parseCancunDateTime(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const text = value.trim();
  const stamped = EXPLICIT_ZONE.test(text)
    ? text
    : DATE_ONLY.test(text)
      ? `${text}T00:00:00${CANCUN_UTC_OFFSET}`
      : `${text}${CANCUN_UTC_OFFSET}`;
  const ms = Date.parse(stamped);
  return Number.isFinite(ms) ? ms : null;
}

export function eventStartMs(event) {
  return parseCancunDateTime(event?.startAt ?? event?.dateStart);
}

export function eventEndMs(event) {
  const explicit = parseCancunDateTime(event?.endAt);
  if (explicit !== null) return explicit;
  // Legacy whole-day end date: the last moment of that day in Cancun.
  const legacyDay = parseCancunDateTime(event?.dateEnd);
  if (legacyDay !== null) return legacyDay + DAY_MS - 1;
  const start = eventStartMs(event);
  return start === null ? null : start;
}

// An event stays listed until its end instant has passed in Cancun.
export function isUpcomingEvent(event, nowMs) {
  const end = eventEndMs(event);
  return end !== null && end >= nowMs;
}

// Events whose window has not closed, soonest first. Deliberately pure: callers
// pass Date.now() so listings self-clean at runtime without a rebuild.
export function upcomingEvents(events, nowMs) {
  return events
    .filter((event) => isUpcomingEvent(event, nowMs))
    .sort((a, b) => (eventStartMs(a) ?? 0) - (eventStartMs(b) ?? 0));
}

// ---- Venue -----------------------------------------------------------------
// A venue is either a linked directory place (venue.placeId) or a free-text
// venue name with optional coordinates for the map marker.

function placesLookup(placesOrMap) {
  return placesOrMap instanceof Map
    ? placesOrMap
    : new Map((placesOrMap ?? []).map((place) => [place.id, place]));
}

export function eventVenuePlace(event, places) {
  const placeId = event?.venue?.placeId ?? event?.placeId ?? null;
  if (!placeId) return null;
  return placesLookup(places).get(placeId) ?? null;
}

// Marker position: the linked place's coordinates win; a free-text venue only
// gets a marker when it carries its own coordinates; otherwise null.
export function eventMarkerPosition(event, places) {
  const place = eventVenuePlace(event, places);
  if (place && Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
    return [place.latitude, place.longitude];
  }
  const { latitude, longitude } = event?.venue ?? {};
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return [latitude, longitude];
  }
  return null;
}

// Display + link view. Matched places link back into the directory via the
// existing /?lugar=<id> deep link.
export function eventVenueView(event, language, places) {
  const place = eventVenuePlace(event, places);
  if (place) {
    const name = localize(place.name, language);
    return { name: name ?? null, placeId: place.id, href: `/?lugar=${encodeURIComponent(place.id)}` };
  }
  const name = localize(event?.venue?.name, language);
  return { name: name ?? null, placeId: null, href: null };
}

// ---- Bilingual formatting ---------------------------------------------------

const formatters = new Map();

function dateTimeFormatters(language) {
  const locale = language === "en" ? "en-US" : "es-MX";
  if (!formatters.has(locale)) {
    formatters.set(locale, {
      date: new Intl.DateTimeFormat(locale, {
        timeZone: CANCUN_TIME_ZONE,
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: new Intl.DateTimeFormat(locale, {
        timeZone: CANCUN_TIME_ZONE,
        hour: "numeric",
        minute: "2-digit",
      }),
    });
  }
  return formatters.get(locale);
}

// Human range in the requested language, always in Cancun wall time:
// "15 oct 2026, 18:00" (start only), "15 oct 2026, 18:00–22:00" (same day),
// "15 oct – 20 dic 2026" (spanning days). Falls back to the raw value when the
// event carries no parseable start.
export function formatEventRange(event, language) {
  const startMs = eventStartMs(event);
  if (startMs === null) return event?.startAt ?? "";
  const { date, time } = dateTimeFormatters(language);
  const endExplicit = parseCancunDateTime(event?.endAt);
  if (endExplicit === null) {
    return `${date.format(startMs)}, ${time.format(startMs)}`;
  }
  if (date.format(startMs) === date.format(endExplicit)) {
    return `${date.format(startMs)}, ${time.format(startMs)}–${time.format(endExplicit)}`;
  }
  return `${date.format(startMs)} – ${date.format(endExplicit)}`;
}

// ---- schema.org/Event JSON-LD ------------------------------------------------

export function eventJsonLd(event, places) {
  const venue = eventVenueView(event, "es", places);
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title?.es ?? event.title?.en ?? event.id,
    startDate: event.startAt,
    description: event.description?.es ?? event.description?.en ?? undefined,
    location: {
      "@type": "Place",
      name: venue.name ?? "Por confirmar / To be confirmed",
    },
  };
  const endMs = eventEndMs(event);
  if (event.endAt && endMs !== null) data.endDate = event.endAt;
  return data;
}

// Quick view for the in-map event popup; DOM assembly lives in highway-map.js.
export function eventPopupView(event, language, places) {
  return {
    id: event.id,
    name: localize(event.title, language),
    when: formatEventRange(event, language),
    venue: eventVenueView(event, language, places),
    cost: localize(event.cost, language) ?? null,
  };
}

// ---- Promotion tiers --------------------------------------------------------
// BASE: promoted: true — homepage strip + /promo/<id> landing.
// PREMIUM: additionally carries a promotion media block — FeaturedPartners
// banner + sponsor card. The banner is an upsell, never automatic.

export function promotedEvents(events) {
  return events.filter((event) => event.promoted === true);
}

export function premiumPromotions(events) {
  return promotedEvents(events).filter((event) => event.promotion?.mediaType === "image");
}

// ---- Kind: event vs offer ---------------------------------------------------
// Independent of the promotion tier: a promoted event is still an event
// (test-2), while an offer — a rental, a placeholder partner — may be
// promoted but never appears on event surfaces (/eventos, the map events
// layer, the community strip, schema.org/Event JSON-LD). Records written
// before kind existed default to "event".

export function entryKind(event) {
  return event?.kind === "offer" ? "offer" : "event";
}
