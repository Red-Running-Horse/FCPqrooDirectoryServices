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

  return {
    selected: true,
    heading: ui.portalHeading,
    id: attraction.id,
    name,
    otherName: otherName && otherName !== name ? otherName : null,
    otherLanguage,
    categoryLabel: ui.labelCategory,
    category: categorySummary(attraction, language),
    status,
    statusLabel: statusLabels[status],
    description: text(attraction.description, language),
    details,
    verificationLabel: ui.labelVerification,
    verificationNote: text(attraction.verificationNote, language),
    lastUpdatedLabel: ui.labelLastUpdated,
    lastUpdated: text(attraction.lastUpdated, language),
    actions,
    directionsNote: directions ? null : ui.directionsUnavailable,
    clearLabel: ui.clearSelection,
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
