import GrecaBand from "../greca";
import L10n from "../l10n.js";
import events, { MAX_PROMOTED } from "../events.mjs";
import { entryKind, premiumPromotions, promotedEvents } from "../event-utils.mjs";

export const metadata = {
  title: "Promociones — Felipe Carrillo Puerto",
  description:
    "Ofertas y promociones de turismo comunitario en la Zona Maya. Community tourism offers in the Zona Maya.",
};

// /promociones — the offer surface. ACTIVE PROMOS are data-driven from
// app/events.mjs (promoted: true, kind: "offer" — offers only, the axes
// never mix with events). Every paid placement carries the «Advertising»
// label (standing rule). Membership tiers are the approved deck copy.
// The banner-scarcity line is computed: MAX_PROMOTED minus the live
// premium promos, never hardcoded.

const offers = promotedEvents(events).filter((event) => entryKind(event) === "offer");
const openBannerSlots = MAX_PROMOTED - premiumPromotions(events).length;

const h2 = { fontSize: "1.15rem", margin: "1.8rem 0 0.6rem" };

const TIERS = [
  {
    name: { es: "Incluido — gratis para siempre", en: "Included — free forever" },
    features: [
      { es: "Listado en el mapa", en: "Map listing" },
      { es: "Página del lugar", en: "Place page" },
      { es: "Botones de llamada y WhatsApp", en: "Call and WhatsApp buttons" },
    ],
  },
  {
    name: { es: "Nivel 1", en: "Level 1" },
    features: [
      { es: "Sub-página propia", en: "Your own sub-page" },
      { es: "Logo", en: "Logo" },
      { es: "Datos y redes", en: "Details and socials" },
    ],
  },
  {
    name: { es: "Nivel 2", en: "Level 2" },
    features: [
      { es: "Banner rotativo (máx. 3)", en: "Rotating banner (max 3)" },
      { es: "Video", en: "Video" },
      { es: "Opciones de privacidad", en: "Privacy options" },
    ],
  },
  {
    name: { es: "Nivel 3 — Fundador", en: "Level 3 — Founder" },
    featured: true,
    features: [
      { es: "Todo lo anterior", en: "Everything above" },
      { es: "Reuniones semanales y coaching", en: "Weekly meetings and coaching" },
      { es: "Concierge compartido", en: "Shared concierge" },
      { es: "Prioridad en pilotos Fedimint y red comunitaria", en: "Priority in Fedimint pilots and the community network" },
      { es: "Consorcio de biodiversidad", en: "Biodiversity consortium" },
    ],
  },
];

export default function Promociones() {
  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "0 1rem 4rem", lineHeight: 1.65 }}>
      <GrecaBand />
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.7rem", margin: "1rem 0 0.25rem" }}>
        Promociones{" "}
        <span style={{ fontSize: "1rem", fontWeight: 400 }}>
          <span className="l10n-es">— ofertas locales</span>
          <span className="l10n-en">— local offers</span>
        </span>
      </h1>
      <p style={{ color: "var(--charcoal-soft)" }}>
        <span className="l10n-es">
          Un tablón de ofertas de negocios y operadores comunitarios verificados, igual que el
          mapa: sin verificación, no se publica.
        </span>{" "}
        <span className="l10n-en">
          A board of offers from verified local businesses and community operators — same honesty
          rules as the map.
        </span>
      </p>

      <section aria-label="Ofertas activas / Active offers">
        <h2 style={h2}>
          <span className="l10n-es">Ofertas activas</span>
          <span className="l10n-en">Active offers</span>
        </h2>
        <div className="promo-offers">
          {offers.map((offer) => (
            <article className="promo-offer" key={offer.id}>
              <span className="promo-offer__ad">
                <span className="l10n-es">Publicidad</span>
                <span className="l10n-en">Advertising</span>
              </span>
              <h3 className="promo-offer__name">
                <L10n pair={offer.title} />
              </h3>
              {offer.promotion?.tagline && (
                <p className="promo-offer__tagline">
                  <L10n pair={offer.promotion.tagline} />
                </p>
              )}
              {offer.cost && (
                <p className="promo-offer__cost">
                  <L10n pair={offer.cost} />
                </p>
              )}
              <div className="promo-offer__actions">
                <a href={`/promo/${offer.id}`}>
                  <span className="l10n-es">Ver detalles</span>
                  <span className="l10n-en">View details</span>
                </a>
                {offer.promotion?.siteUrl && (
                  <a href={offer.promotion.siteUrl} target="_blank" rel="noopener noreferrer">
                    <span className="l10n-es">Sitio oficial ↗</span>
                    <span className="l10n-en">Official site ↗</span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Niveles de membresía / Membership levels">
        <h2 style={h2}>
          <span className="l10n-es">Niveles de membresía</span>
          <span className="l10n-en">Membership levels</span>
        </h2>
        <div className="promo-tiers">
          {TIERS.map((tier) => (
            <article
              key={tier.name.es}
              className={tier.featured ? "promo-tier promo-tier--featured" : "promo-tier"}
            >
              <h3 className="promo-tier__name">
                <L10n pair={tier.name} />
              </h3>
              <ul className="promo-tier__features">
                {tier.features.map((feature) => (
                  <li key={feature.es}>
                    <L10n pair={feature} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="promo-join" aria-label="Publicita tu negocio / Advertise your business">
        <h2 style={h2}>
          <span className="l10n-es">Publicita tu negocio</span>
          <span className="l10n-en">Advertise your business</span>
        </h2>
        {openBannerSlots > 0 && (
          <p style={{ color: "var(--charcoal-soft)" }}>
            <span className="l10n-es">
              Quedan {openBannerSlots} de {MAX_PROMOTED} espacios en el banner rotativo.
            </span>{" "}
            <span className="l10n-en">
              {openBannerSlots} of {MAX_PROMOTED} rotating-banner slots are still open.
            </span>
          </p>
        )}
        <a
          className="business-cta__whatsapp"
          href="https://wa.me/529841841313"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="l10n-es">Escríbenos por WhatsApp</span>
          <span className="l10n-en">Message us on WhatsApp</span>
        </a>
      </section>
    </main>
  );
}
