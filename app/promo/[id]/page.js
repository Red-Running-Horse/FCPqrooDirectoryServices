import { notFound } from "next/navigation";
import events from "../../events.mjs";
import GrecaBand from "../../greca";

// /promo/<id> — promotional landing pages for featured partners. Statically
// generated from the promoted entries in app/events.mjs; links from the
// attract band, partner cards and map portal land here. The partner's own
// subdomain site is linked inside, not instead of this page.
//
// Next 16: params is a Promise — must be awaited in both the page and
// generateMetadata.

export function generateStaticParams() {
  return events.filter((e) => e.promoted).map((e) => ({ id: e.id }));
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

  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "0 1rem 4rem", lineHeight: 1.65 }}>
      <GrecaBand />
      <span style={badge}>Promocionado / Sponsored</span>
      <h1 style={h1}>{ev.title.es}</h1>
      {ev.promotion?.tagline && (
        <p style={{ fontSize: "1.05rem", color: "var(--terracotta)", fontWeight: 600, margin: "0.2rem 0 0.8rem" }}>
          {ev.promotion.tagline.es}
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

      <p style={{ marginTop: "1rem" }}>{ev.description.es}</p>
      {L.details?.es && <p>{L.details.es}</p>}

      {highlights.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.1rem", marginTop: "1.6rem" }}>Incluye / Includes</h2>
          <ul style={{ paddingLeft: "1.2rem" }}>
            {highlights.map((h) => (
              <li key={h.es} style={{ marginBottom: "0.3rem" }}>{h.es}</li>
            ))}
          </ul>
        </>
      )}

      <div style={infoBox}>
        <p style={{ margin: "0.2rem 0" }}>
          <strong>📅</strong> {ev.dateStart === ev.dateEnd
            ? ev.dateStart
            : `${ev.dateStart} – ${ev.dateEnd}`}
        </p>
        <p style={{ margin: "0.2rem 0" }}><strong>📍</strong> {ev.locationText.es}</p>
        <p style={{ margin: "0.2rem 0" }}><strong>💲</strong> {ev.cost.es}</p>
        <p style={{ margin: "0.6rem 0 0" }}>
          <a href={`/?lugar=${ev.placeId}`} style={btnGhost}>Ver en el mapa / View on map</a>
        </p>
      </div>

      <div style={{ marginTop: "1.4rem" }}>
        <a href={ev.promotion?.siteUrl || ev.sourceUrl} target="_blank" rel="noopener noreferrer" style={btnPrimary}>
          Visitar sitio oficial / Visit official site ↗
        </a>
        <a href="/eventos" style={btnGhost}>← Todos los eventos / All events</a>
      </div>

      <p style={{ marginTop: "2.5rem", fontSize: "0.85rem", color: "var(--charcoal-soft)" }}>
        Promoción pagada verificada contra su fuente:{" "}
        <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer">fuente / source ↗</a>
      </p>
    </main>
  );
}