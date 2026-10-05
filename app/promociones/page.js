import GrecaBand from "../greca";

export const metadata = {
  title: "Promociones — Felipe Carrillo Puerto",
  description:
    "Ofertas y promociones de turismo comunitario en la Zona Maya. Community tourism offers in the Zona Maya.",
};

// Placeholder for the promotions board. Local businesses and community
// operators get listed here as their offers are verified — same honesty
// rules as the map (unverified vs. verified).
const COMING_SOON = [
  { es: "Tours comunitarios Maya Ka'an", en: "Maya Ka'an community tours" },
  { es: "Hospedaje en ecocabañas", en: "Ecolodge cabins" },
  { es: "Comida tradicional yucateca", en: "Traditional Yucatecan food" },
];

export default function Promociones() {
  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "0 1rem 4rem", lineHeight: 1.65 }}>
      <GrecaBand />
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.7rem", margin: "1rem 0 0.25rem" }}>
        Promociones <span style={{ fontSize: "1rem", fontWeight: 400 }}>— ofertas locales</span>
      </h1>
      <p style={{ color: "var(--charcoal-soft)" }}>
        Un tablón de ofertas de negocios y operadores comunitarios verificados, igual que el
        mapa: sin verificación, no se publica. / A board of offers from verified local
        businesses and community operators — same honesty rules as the map.
      </p>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem", marginTop: "1.5rem" }}>
        {COMING_SOON.map(({ es, en }) => (
          <li
            key={es}
            style={{
              background: "var(--cream)",
              border: "1px solid var(--sand-line)",
              borderLeft: "4px solid var(--marigold)",
              borderRadius: "8px",
              padding: "0.8rem 1rem",
            }}
          >
            <strong>{es}</strong>
            <div style={{ fontSize: "0.85rem", color: "var(--charcoal-soft)" }}>{en} — próximamente / coming soon</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
