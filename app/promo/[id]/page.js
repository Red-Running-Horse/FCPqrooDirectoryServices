import { notFound } from "next/navigation";
import events from "../../events.mjs";
import GrecaBand from "../../greca";
import placesIndex from "../../../public/data/places-index.json";
import { eventVenueView, formatEventRange, promotedEvents } from "../../event-utils.mjs";
import L10n from "../../l10n.js";

const placesById = new Map(placesIndex.map((place) => [place.id, place]));

// /promo/<id> — promotional landing pages for featured partners. Statically
// generated from the promoted entries in app/events.mjs; links from the
// attract band, partner cards and map portal land here. The partner's own
// subdomain site is linked inside, not instead of this page.
//
// Next 16: params is a Promise — must be awaited in both the page and
// generateMetadata.

export function generateStaticParams() {
  return promotedEvents(events).map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const ev = events.find((e) => e.id === id);
  return {
    title: ev ? `${ev.title.es} — Promoción` : "Promoción",
    description: ev?.description?.es,
  };
}

const h1 = { fontFamily: "var(--font-heading)", fontSize: "1.7rem", margin: "1rem 0 0.25rem" };
const badge = {
  display: "inline-block",
  fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
  background: "var(--marigold)", color: "var(--obsidian)",
  borderRadius: "4px", padding: "0.15rem 0.5rem", marginTop: "0.75rem",
};
const infoBox = {
  background: "var(--cream)", border: "1px solid var(--sand-line)",
  borderRadius: "10px", padding: "0.9rem 1rem", margin: "0.8rem 0",
};
const btnPrimary = {
  display: "inline-block", background: "var(--jungle)", color: "#fff",
  fontWeight: 600, textDecoration: "none", padding: "0.65rem 1.3rem",
  borderRadius: "8px", marginRight: "0.6rem",
};
const btnGhost = {
  display: "inline-block", background: "transparent", color: "var(--turquoise)",
  border: "2px solid var(--turquoise)", fontWeight: 600, textDecoration: "none",
  padding: "0.6rem 1.2rem", borderRadius: "8px",
};

export default async function PromoLanding({ params }) {
  const { id } = await params;
  const ev = events.find((e) => e.id === id && e.promoted);
  if (!ev) notFound();
  const L = ev.landing ?? {};
  const highlights = L.highlights ?? [];
  const venueEs = eventVenueView(ev, "es", placesById);
  const venueEn = eventVenueView(ev, "en", placesById);
  const venueNameDiffers = venueEn.name && venueEn.name !== venueEs.name;

  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "0 1rem 4rem", lineHeight: 1.65 }}>
      <GrecaBand />
      <span style={badge}>
        <span className="l10n-es">Promocionado</span>
        <span className="l10n-en">Sponsored</span>
      </span>
      <h1 style={h1}>
        <L10n pair={ev.title} />
      </h1>
      {ev.promotion?.tagline && (
        <p style={{ fontSize: "1.05rem", color: "var(--terracotta)", fontWeight: 600, margin: "0.2rem 0 0.8rem" }}>
          <L10n pair={ev.promotion.tagline} />
        </p>
      )}

      {ev.promotion?.mediaType === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ev.promotion.mediaUrl}
          alt={ev.title.es}
          style={{ width: "100%", borderRadius: "12px", border: "2px solid var(--marigold)", display: "block" }}
        />
      )}

      <p style={{ marginTop: "1rem" }}>
        <L10n pair={ev.description} />
      </p>
      {L.details && (
        <p>
          <L10n pair={L.details} />
        </p>
      )}

      {highlights.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.1rem", marginTop: "1.6rem" }}>
            <span className="l10n-es">Incluye</span>
            <span className="l10n-en">Includes</span>
          </h2>
          <ul style={{ paddingLeft: "1.2rem" }}>
            {highlights.map((h) => (
              <li key={h.es} style={{ marginBottom: "0.3rem" }}>
                <L10n pair={h} />
              </li>
            ))}
          </ul>
        </>
      )}

      <div style={infoBox}>
        <p style={{ margin: "0.2rem 0" }}>
          <strong>📅</strong>{" "}
          <span className="l10n-es">{formatEventRange(ev, "es")}</span>
          <span className="l10n-en">{formatEventRange(ev, "en")}</span>
        </p>
        <p style={{ margin: "0.2rem 0" }}>
          <strong>📍</strong>{" "}
          {venueEs.name ? (
            venueNameDiffers ? (
              <>
                <span className="l10n-es">{venueEs.name}</span>
                <span className="l10n-en">{venueEn.name}</span>
              </>
            ) : (
              venueEs.name
            )
          ) : (
            <>
              <span className="l10n-es">Por confirmar</span>
              <span className="l10n-en">To be confirmed</span>
            </>
          )}
        </p>
        {ev.cost && (
          <p style={{ margin: "0.2rem 0" }}>
            <strong>💲</strong> <L10n pair={ev.cost} />
          </p>
        )}
        {venueEs.href && (
          <p style={{ margin: "0.6rem 0 0" }}>
            <a href={venueEs.href} style={btnGhost}>
              <span className="l10n-es">Ver en el mapa</span>
              <span className="l10n-en">View on map</span>
            </a>
          </p>
        )}
      </div>

      <div style={{ marginTop: "1.4rem" }}>
        {(ev.promotion?.siteUrl || ev.sourceUrl) && (
          <a href={ev.promotion?.siteUrl || ev.sourceUrl} target="_blank" rel="noopener noreferrer" style={btnPrimary}>
            <span className="l10n-es">Visitar sitio oficial ↗</span>
            <span className="l10n-en">Visit official site ↗</span>
          </a>
        )}
        <a href="/eventos" style={btnGhost}>
          <span className="l10n-es">← Todos los eventos</span>
          <span className="l10n-en">← All events</span>
        </a>
      </div>

      {ev.sourceUrl && (
        <p style={{ marginTop: "2.5rem", fontSize: "0.85rem", color: "var(--charcoal-soft)" }}>
          <span className="l10n-es">Promoción pagada verificada contra su fuente:</span>{" "}
          <span className="l10n-en">Paid promotion verified against its source:</span>{" "}
          <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer">
            <span className="l10n-es">fuente ↗</span>
            <span className="l10n-en">source ↗</span>
          </a>
        </p>
      )}
    </main>
  );
}