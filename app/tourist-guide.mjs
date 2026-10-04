// Pure helper functions for the bilingual tourist guide.
// Tested in Node.js without browser or React dependencies.

import { DEFAULT_LANGUAGE } from "./i18n.mjs";
import { GUIDE_DATA, GUIDE_METADATA, GUIDE_SECTIONS } from "./guide-data.mjs";

/**
 * Returns the guide metadata object.
 */
export function getGuideMetadata(data = GUIDE_DATA) {
  return data?.metadata ?? GUIDE_METADATA;
}

/**
 * Returns the array of guide sections.
 */
export function getGuideSections(data = GUIDE_DATA) {
  return data?.sections ?? GUIDE_SECTIONS;
}

/**
 * Resolves a bilingual { es, en } text field, falling back to Spanish (or first available string).
 */
export function localizeGuideField(field, language) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[language] ?? field[DEFAULT_LANGUAGE] ?? field.es ?? field.en ?? "";
}

/**
 * Resolves a bilingual guide object or field, falling back gracefully to Spanish.
 */
export function localizeGuide(guideOrField, language) {
  if (!guideOrField) return "";
  if (guideOrField.metadata && Array.isArray(guideOrField.sections)) {
    const meta = guideOrField.metadata;
    return {
      metadata: {
        sourceTitle: meta.sourceTitle ?? "",
        sourceAuthor: meta.sourceAuthor ?? "",
        sourceUrl: meta.sourceUrl ?? "",
        sourceMetadataNote: localizeGuideField(meta.sourceMetadataNote, language),
        officialDisclaimer: localizeGuideField(meta.officialDisclaimer, language),
        lastReviewed: meta.lastReviewed ?? "",
        lastReviewedDisplay: localizeGuideField(meta.lastReviewedDisplay, language),
        pdfAsset: getPdfAsset(meta),
      },
      sections: guideOrField.sections.map((section) => ({
        id: section.id,
        title: localizeGuideField(section.title, language),
        summary: localizeGuideField(section.summary, language),
        items: (section.items ?? []).map((item) => ({
          title: localizeGuideField(item.title, language),
          body: localizeGuideField(item.body, language),
          officialLink: item.officialLink
            ? {
                url: item.officialLink.url,
                label: localizeGuideField(item.officialLink.label, language),
              }
            : null,
        })),
      })),
    };
  }
  return localizeGuideField(guideOrField, language);
}

/**
 * Resolves the configured PDF asset URL or path, validating that it is a safe
 * root-relative path or https/http URL. Returns null if unconfigured or invalid.
 */
export function getPdfAsset(metadataOrData = GUIDE_METADATA) {
  const meta = metadataOrData?.metadata ?? metadataOrData;
  const asset = meta?.pdfAsset;
  if (typeof asset !== "string") return null;
  const trimmed = asset.trim();
  if (!trimmed) return null;
  const isLocal = trimmed.startsWith("/") && !trimmed.startsWith("//");
  const isHttpUrl = /^https?:\/\//i.test(trimmed);
  if (!isLocal && !isHttpUrl) return null;
  return trimmed;
}

/**
 * Checks whether a genuine PDF asset is configured.
 */
export function hasPdfAsset(metadataOrData = GUIDE_METADATA) {
  return getPdfAsset(metadataOrData) !== null;
}

/**
 * Returns the configured PDF URL or null.
 */
export function guidePdfUrl(metadataOrData = GUIDE_METADATA) {
  return getPdfAsset(metadataOrData);
}

/**
 * Determines whether a PDF asset path is a local static asset (safe for offline caching).
 * Rejects external URLs (http/https/protocol-relative) and non-root relative paths.
 */
export function isLocalPdf(metadataOrUrl) {
  const url = typeof metadataOrUrl === "string"
    ? metadataOrUrl
    : (metadataOrUrl?.metadata?.pdfAsset ?? metadataOrUrl?.pdfAsset);
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("/")) return false;
  if (trimmed.startsWith("//")) return false; // protocol-relative external
  return true;
}

/**
 * Returns an array of local paths that belong to the guide and should be cached
 * by an offline service worker. External URLs (Notion, Gob.mx, etc.) are strictly excluded.
 */
export function guideOfflineResources(data = GUIDE_DATA) {
  const resources = ["/data/tourist-guide.json"];
  const meta = getGuideMetadata(data);
  if (hasPdfAsset(meta) && isLocalPdf(meta.pdfAsset)) {
    resources.push(meta.pdfAsset.trim());
  }
  return resources;
}

/**
 * Validates the structure and essential fields of guide data.
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateGuideData(data = GUIDE_DATA) {
  const errors = [];
  const meta = data?.metadata;

  if (!meta) {
    errors.push("Missing guide metadata");
  } else {
    if (!meta.sourceTitle || typeof meta.sourceTitle !== "string") {
      errors.push("Metadata missing sourceTitle string");
    }
    if (!meta.sourceAuthor || typeof meta.sourceAuthor !== "string") {
      errors.push("Metadata missing sourceAuthor string");
    }
    if (!meta.sourceUrl || !meta.sourceUrl.startsWith("https://")) {
      errors.push("Metadata missing valid https sourceUrl");
    }
    if (!meta.officialDisclaimer || !meta.officialDisclaimer.es || !meta.officialDisclaimer.en) {
      errors.push("Metadata missing bilingual officialDisclaimer (es and en required)");
    }
    if (!meta.lastReviewed) {
      errors.push("Metadata missing lastReviewed date");
    }
  }

  const sections = data?.sections;
  if (!Array.isArray(sections) || sections.length === 0) {
    errors.push("Guide must contain at least one section");
  } else {
    sections.forEach((section, index) => {
      if (!section.id || typeof section.id !== "string") {
        errors.push(`Section at index ${index} missing id slug`);
      }
      if (!section.title?.es || !section.title?.en) {
        errors.push(`Section ${section.id || index} missing bilingual title`);
      }
      if (!section.summary?.es || !section.summary?.en) {
        errors.push(`Section ${section.id || index} missing bilingual summary`);
      }
      if (!Array.isArray(section.items) || section.items.length === 0) {
        errors.push(`Section ${section.id || index} has no items`);
      } else {
        section.items.forEach((item, itemIdx) => {
          if (!item.title?.es || !item.title?.en) {
            errors.push(`Section ${section.id} item ${itemIdx} missing bilingual title`);
          }
          if (!item.body?.es || !item.body?.en) {
            errors.push(`Section ${section.id} item ${itemIdx} missing bilingual body`);
          }
          if (item.officialLink) {
            if (!item.officialLink.url || !item.officialLink.url.startsWith("https://")) {
              errors.push(`Section ${section.id} item ${itemIdx} officialLink must use https`);
            }
            if (!item.officialLink.label?.es || !item.officialLink.label?.en) {
              errors.push(`Section ${section.id} item ${itemIdx} officialLink missing bilingual label`);
            }
          }
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
