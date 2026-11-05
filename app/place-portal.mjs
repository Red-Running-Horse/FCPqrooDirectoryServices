import { categorySummary, directionsUrlFor, isVerified } from "./place-index.mjs";
import { LANGUAGES, localize, uiText } from "./i18n.mjs";

// Badge shown in the portal: "unavailable" wins, then "verified" (exact + verified), else "approximate".
export function placeStatus(attraction) {
  if (attraction.status === "unavailable") return "unavailable";
  return isVerified(attraction) ? "verified" : "approximate";
}

function text(value, language) {
  const result = typeof value === "string" ? value : localize(value, language);
  return typeof result === "string" && result.trim() ? result.trim() : null;
}

function digits(value) {
  const result = typeof value === "string" ? value.replace(/\D/g, "") : "";
  return result.length >= 7 && result.length <= 15 ? result : null;
}

export function phoneUrl(phone) {
  const number = digits(phone);
  if (!number) return null;
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${number}`;
}

export function whatsappUrl(whatsapp) {
  const number = digits(whatsapp);
  return number ? `https://wa.me/${number}` : null;
}

export function websiteUrl(website) {
  return typeof website === "string" && /^https:\/\/[^\s]+$/.test(website.trim()) ? website.trim() : null;
}

export function emailUrl(email) {
  const value = typeof email === "string" ? email.trim() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : null;
}

// Social profiles and official sources link out under the same policy as the website:
// https only, no whitespace, so schemes like javascript: never reach the href.
export function externalUrl(url) {
  return typeof url === "string" && /^https:\/\/[^\s]+$/.test(url.trim()) ? url.trim() : null;
}

const SOCIAL_ORDER = ["facebook", "instagram", "tiktok"];

function socialLabel(ui, key) {
  const known = { facebook: ui.socialFacebook, instagram: ui.socialInstagram, tiktok: ui.socialTiktok };
  return known[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

// Some committed source listings escape "&" as "&amp;"; unescape it so the href works.
function officialSourceLink(url) {
  if (typeof url !== "string") return null;
  const href = externalUrl(url.replace(/&amp;/g, "&"));
  if (!href) return null;
  try {
    return { href, text: new URL(href).hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

function accessibilityLines(info, language, ui) {
  if (!info || typeof info !== "object") return [];
  const lines = [];
  if (info.wheelchairAccess === true) lines.push(ui.accessibilityWheelchair);
  if (info.parking === true) lines.push(ui.accessibilityParking);
  const note = text({ es: info.notesEs, en: info.notesEn }, language);
  if (note) lines.push(note);
  return lines;
}

// Builds the deterministic content of the below-map portal for the selected place (or null).
export function placePortal(attraction, language) {
  const ui = uiText(language);
  if (!attraction) {
    return { selected: false, heading: ui.portalHeading, prompt: ui.portalPrompt };
  }

  const status = placeStatus(attraction);
  const statusLabels = {
    verified: ui.badgeVerified,
    approximate: ui.badgeApproximate,
    unavailable: ui.badgeUnavailable,
  };
  const name = text(attraction.name, language);
  const otherLanguage = LANGUAGES.find(({ id }) => id !== language && attraction.name?.[id])?.id;
  const otherName = otherLanguage ? text(attraction.name, otherLanguage) : null;

  const call = phoneUrl(attraction.phone);
  const whatsapp = whatsappUrl(attraction.whatsapp);
  const website = websiteUrl(attraction.website);
  const directions = directionsUrlFor(attraction);

  const details = [
    { id: "address", label: ui.labelAddress, value: text(attraction.address, language) },
    { id: "hours", label: ui.labelHours, value: text(attraction.hoursDisplay ?? attraction.hours, language) },
    { id: "phone", label: ui.labelPhone, value: call ? attraction.phone.trim() : null },
    { id: "whatsapp", label: ui.labelWhatsapp, value: whatsapp ? attraction.whatsapp.trim() : null },
    { id: "website", label: ui.labelWebsite, value: website ?? text(attraction.websiteNote, language) },
  ].filter(({ value }) => value);

  const actions = [
    { id: "directions", label: ui.directions, href: directions, external: true },
    { id: "call", label: ui.actionCall, href: call, external: false },
    { id: "whatsapp", label: ui.actionWhatsapp, href: whatsapp, external: true },
    { id: "website", label: ui.actionWebsite, href: website, external: true },
  ].filter(({ href }) => href);

  const email = emailUrl(attraction.email);
  const socialLinks = Object.entries(attraction.socialLinks ?? {})
    .map(([key, url]) => ({ id: key, label: socialLabel(ui, key), href: externalUrl(url), external: true }))
    .filter(({ href }) => href)
    .sort(
      (a, b) =>
        (SOCIAL_ORDER.indexOf(a.id) === -1 ? SOCIAL_ORDER.length : SOCIAL_ORDER.indexOf(a.id)) -
          (SOCIAL_ORDER.indexOf(b.id) === -1 ? SOCIAL_ORDER.length : SOCIAL_ORDER.indexOf(b.id)) ||
        a.id.localeCompare(b.id),
    );
  const seenSources = new Set();
  const sourceLinks = [];
  for (const url of attraction.verificationSourceUrls ?? []) {
    const link = officialSourceLink(url);
    if (link && !seenSources.has(link.href)) {
      seenSources.add(link.href);
      sourceLinks.push(link);
    }
  }
  const accessLines = accessibilityLines(attraction.accessibility, language, ui);

  return {
    selected: true,
    heading: ui.portalHeading,
    id: attraction.id,
    name,
    otherName: otherName && otherName !== name ? otherName : null,
    otherLanguage,
    categoryLabel: ui.labelCategory,
    category: categorySummary(attraction, language) || null,
    status,
    statusLabel: statusLabels[status],
    description: text(attraction.description, language),
    details,
    emailAction: email ? { id: "email", label: ui.actionEmail, href: email, external: false } : null,
    socialLinks,
    officialSources: sourceLinks.length ? { label: ui.labelOfficialSources, links: sourceLinks } : null,
    accessibility: accessLines.length ? { label: ui.labelAccessibility, lines: accessLines } : null,
    verificationLabel: ui.labelVerification,
    verificationNote: text(attraction.verificationNote, language),
    lastUpdatedLabel: ui.labelLastUpdated,
    lastUpdated: text(attraction.lastUpdated, language),
    actions,
    directionsNote: directions ? null : ui.directionsUnavailable,
    clearLabel: ui.clearSelection,
    saveOfflineLabel: ui.savePlaceOffline,
    removeOfflineLabel: ui.removePlaceOffline,
    savedOfflineBadge: ui.placeSavedBadge,
    notSavedOfflineBadge: ui.placeUnsavedBadge,
    networkRequiredNote: ui.networkRequiredNote,
    offlineDetailUnavailable: ui.offlineDetailUnavailable,
  };
}

// Quick in-map popup summary for the selected marker; the portal stays the full details view.
export function placePopup(attraction, language) {
  if (!attraction) return null;
  const view = placePortal(attraction, language);
  const ui = uiText(language);
  return {
    id: view.id,
    name: view.name,
    category: view.category,
    status: view.status,
    statusLabel: view.statusLabel,
    hint: ui.popupHint,
    detailsLabel: ui.popupDetails,
  };
}
