import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import events, { MAX_PROMOTED } from "../app/events.mjs";
import { entryKind, premiumPromotions, promotedEvents } from "../app/event-utils.mjs";

// /promociones — the offer surface. ACTIVE PROMOS are data-driven from
// app/events.mjs (promoted + kind "offer"; the axes never mix with events).
// Every paid placement carries the «Advertising» label. Tiers are the
// approved deck copy, bilingual via the l10n gate. The scarcity line is
// computed (MAX_PROMOTED − live premium promos), never hardcoded.
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../app/promociones/page.js");

const liveOffers = promotedEvents(events).filter((event) => entryKind(event) === "offer");

test("active promos are data-driven: count, fields and links all come from events.mjs", () => {
  // Ground truth from the data module.
  assert.equal(liveOffers.length, 2, "two promoted offers live (balam-nah, selva-morena)");
  for (const offer of liveOffers) {
    assert.equal(entryKind(offer), "offer", `${offer.id}: offers only, never events`);
    assert.ok(offer.title?.es && offer.title?.en, `${offer.id}: bilingual title`);
    assert.ok(offer.promotion?.tagline?.es, `${offer.id}: tagline present`);
    assert.ok(offer.cost?.es, `${offer.id}: cost present`);
    assert.ok(offer.promotion?.siteUrl?.startsWith("https://"), `${offer.id}: siteUrl present`);
  }

  // The page reads the records — nothing is hardcoded.
  assert.match(page, /import events, \{ MAX_PROMOTED \} from "\.\.\/events\.mjs";/);
  assert.match(page, /promotedEvents\(events\)\.filter\(\(event\) => entryKind\(event\) === "offer"\)/, "offers filter is data-driven");
  for (const offer of liveOffers) {
    assert.ok(!page.includes(`"${offer.title.es}"`) && !page.includes(`"${offer.id}"`), `${offer.title.es} must not appear as a literal`);
  }
  // One card per live offer, rendered through the gated bilingual renderer.
  assert.match(page, /offers\.map\(\(offer\) => \(/, "one card per live offer");
  assert.match(page, /<L10n pair=\{offer\.title\} \/>/, "card name gated");
  assert.match(page, /<L10n pair=\{offer\.promotion\.tagline\} \/>/, "card tagline gated");
  assert.match(page, /<L10n pair=\{offer\.cost\} \/>/, "card cost gated");
  // Links: the /promo/<id> landing (data-driven id) + the external siteUrl.
  assert.match(page, /href=\{`\/promo\/\$\{offer\.id\}`\}/, "landing link builds from the record id");
  assert.match(page, /href=\{offer\.promotion\.siteUrl\} target="_blank" rel="noopener noreferrer"/, "site link sanitized");
  // Fields render only when present — no empty rows.
  assert.match(page, /\{offer\.promotion\?\.tagline && \(/, "tagline conditional");
  assert.match(page, /\{offer\.cost && \(/, "cost conditional");
  assert.match(page, /\{offer\.promotion\?\.siteUrl && \(/, "site link conditional");
});

test("every paid placement carries the «Advertising» label", () => {
  // One badge inside each offer card, bilingual via the gate.
  assert.match(page, /<span className="promo-offer__ad">/, "badge class exists");
  assert.match(page, /<span className="l10n-es">Publicidad<\/span>/, "ES disclosure");
  assert.match(page, /<span className="l10n-en">Advertising<\/span>/, "EN disclosure");
  const articles = (page.match(/<article className="promo-offer"/g) ?? []).length;
  const badges = (page.match(/promo-offer__ad"/g) ?? []).length;
  assert.equal(articles, 1, "a single card template (mapped over the live offers)");
  assert.ok(badges >= 1, "badge rides on the card template");
});

test("membership tiers render the approved deck copy, bilingual", () => {
  assert.match(page, /const TIERS = \[/, "tiers are structured data");
  const tiers = [
    [/Incluido — gratis para siempre/, /Included — free forever/],
    [/Nivel 1/, /Level 1/],
    [/Nivel 2/, /Level 2/],
    [/Nivel 3 — Fundador/, /Level 3 — Founder/],
  ];
  for (const [es, en] of tiers) {
    assert.match(page, new RegExp(`name: \\{ es: "${es.source}", en: "${en.source}" \\}`), `${es.source}: bilingual tier name`);
  }
  // Approved feature copy, both languages (spot checks across the tiers).
  for (const s of [
    "Listado en el mapa", "Map listing",
    "Botones de llamada y WhatsApp", "Call and WhatsApp buttons",
    "Sub-página propia", "Your own sub-page",
    "Banner rotativo (máx. 3)", "Rotating banner (max 3)",
    "Opciones de privacidad", "Privacy options",
    "Todo lo anterior", "Everything above",
    "Reuniones semanales y coaching", "Weekly meetings and coaching",
    "Concierge compartido", "Shared concierge",
    "Prioridad en pilotos Fedimint y red comunitaria", "Priority in Fedimint pilots and the community network",
    "Consorcio de biodiversidad", "Biodiversity consortium",
  ]) {
    assert.ok(page.includes(`"${s}"`), `tier copy: ${s}`);
  }
  // The Founder tier is the featured card.
  assert.match(page, /promo-tier--featured/, "featured tier styling hook");
  assert.match(page, /featured: true,\s*\n\s*features: \[\s*\n\s*\{ es: "Todo lo anterior"/s, "Founder tier carries 'everything above'");
  // Tiers render through the gated renderer.
  assert.match(page, /<L10n pair=\{tier\.name\} \/>/, "tier name gated");
  assert.match(page, /<L10n pair=\{feature\} \/>/, "tier features gated");
});

test("CTA: WhatsApp link reuses the existing pattern; scarcity is computed and truthful", () => {
  assert.match(page, /className="business-cta__whatsapp"/, "reuses the homepage CTA pattern");
  assert.match(page, /href="https:\/\/wa\.me\/529841841313"/, "the WhatsApp number");
  assert.match(page, /target="_blank"[\s\S]*?rel="noopener noreferrer"/, "external link sanitized");

  // Scarcity: computed from MAX_PROMOTED − live premium promos, rendered via
  // expressions — never a hardcoded "third slot" claim.
  assert.match(page, /const openBannerSlots = MAX_PROMOTED - premiumPromotions\(events\)\.length;/, "slots computed from the data");
  assert.match(page, /\{openBannerSlots\} de \{MAX_PROMOTED\} espacios/, "ES line uses the computed values");
  assert.match(page, /\{openBannerSlots\} of \{MAX_PROMOTED\} rotating-banner slots/, "EN line uses the computed values");
  assert.doesNotMatch(page, /tercer espacio|third (banner )?slot/i, "no hardcoded slot claims");
  assert.match(page, /\{openBannerSlots > 0 && \(/, "scarcity line hides when the banner is full");

  // Truth check against the live data right now.
  const open = MAX_PROMOTED - premiumPromotions(events).length;
  assert.equal(open, 1, "exactly one banner slot is open today (the third)");
  assert.equal(premiumPromotions(events).length, liveOffers.length, "both live offers hold banner media");
});

test("rules: one-language gating, no events, no new schema", () => {
  // Active-language only (l10n gate), as across the static pages.
  assert.ok((page.match(/className="l10n-/g) ?? []).length >= 10, "chrome strings gated");
  assert.doesNotMatch(page, /Próximos eventos|Upcoming events/, "no event language on the offers page");
  // No new schema.
  assert.doesNotMatch(page, /application\/ld\+json|schema\.org/, "no new schema");
  // i18n parity untouched: the page needs no UI_TEXT keys (inline gated copy).
  assert.doesNotMatch(page, /from "\.\.\/i18n\.mjs"/, "no i18n.mjs import — no new keys");
});
