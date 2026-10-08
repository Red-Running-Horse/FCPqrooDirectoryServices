import GrecaBand from "../../greca";

export const metadata = {
  title: "Noj Kaaj — Ruta de la Resistencia",
  description:
    "Caminata histórica de 5 estaciones por Felipe Carrillo Puerto: comida tradicional maya, arte, música y testimonios. $3,500 MXN por 2 personas. / Five-station historical walking tour in Felipe Carrillo Puerto.",
};

const h1 = { fontFamily: "var(--font-heading)", fontSize: "1.7rem", margin: "1rem 0 0.25rem" };
const eyebrow = {
  fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
  color: "var(--turquoise)", margin: "0.75rem 0 0",
};
const tagline = { fontSize: "1.05rem", fontWeight: 600, color: "var(--terracotta)", margin: "0.2rem 0 0.8rem" };
const infoBox = {
  background: "var(--cream)", border: "1px solid var(--sand-line)",
  borderRadius: "10px", padding: "0.9rem 1rem", margin: "1rem 0",
};
const h2 = { fontSize: "1.1rem", marginTop: "1.8rem" };
const btnPrimary = {
  display: "inline-block", background: "var(--jungle)", color: "#fff", fontWeight: 600,
  textDecoration: "none", padding: "0.7rem 1.4rem", borderRadius: "8px",
};
const btnGhost = {
  display: "inline-block", background: "transparent", color: "var(--turquoise)",
  border: "2px solid var(--turquoise)", fontWeight: 600, textDecoration: "none",
  padding: "0.6rem 1.2rem", borderRadius: "8px",
};

const INCLUDES = [
  { icon: "🚶", es: "Recorrido a pie de cinco estaciones por el centro histórico — el corazón espiritual y político de la Guerra Social Maya", en: "Five-station walking route through the historic town — the spiritual and political heart of the Maya Social War" },
  { icon: "🥘", es: "Preparación de comida tradicional maya — observa y saborea platillos auténticos hechos por manos locales", en: "Traditional Maya food preparation — watch and taste authentic dishes made by local hands" },
  { icon: "🎨", es: "Recorrido de arte — murales y arte maya contemporáneo que continúan la historia", en: "Art tour — murals and contemporary Maya artwork carrying the story forward" },
  { icon: "🎵", es: "Historia musical — los sonidos de la resistencia, de los ritmos ancestrales a las voces mayas de hoy", en: "Music history — the sounds of resistance, from ancestral rhythms to today's Maya voices" },
  { icon: "🗣️", es: "Traductor de inglés incluido — no te pierdas ni una palabra de los testimonios", en: "English translator included — never miss a word of the testimonies" },
  { icon: "🍽️", es: "Botanas tradicionales incluidas", en: "Traditional appetizers included" },
  { icon: "🚕", es: "Recogida en la estación del Tren Maya — al llegar, nosotros nos encargamos de todo", en: "Pickup from the Felipe Carrillo Puerto Tren Maya station — once you arrive, we take care of everything" },
];

export default function NojKaajTour() {
  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "0 1rem 4rem", lineHeight: 1.65 }}>
      <GrecaBand />
      <p style={eyebrow}>Tour · Zona Maya</p>
      <h1 style={h1}>Noj Kaaj — Ruta de la Resistencia</h1>
      <p style={tagline}>Camina la historia. Escucha la tierra. / Walk history. Listen to the land.</p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/nojkaaj_resistance_tour_1280_720.webp"
        alt="Noj Kaaj — Ruta de la Resistencia"
        style={{ width: "100%", borderRadius: "12px", display: "block", border: "1px solid var(--sand-line)" }}
      />

      <p style={{ marginTop: "1rem" }}>
        En el corazón de la Zona Maya de Quintana Roo se encuentra <strong>Noj Kaaj</strong> — «la
        Gran Ciudad», hoy Felipe Carrillo Puerto — la memoria viva de la resistencia maya. Aquí la
        historia no se cuenta: <strong>se camina, se saborea, se escucha y se vive</strong> junto a
        la comunidad que la mantiene viva. / In the heart of Quintana Roo&apos;s Zona Maya lies Noj
        Kaaj — &ldquo;the Great Town,&rdquo; today Felipe Carrillo Puerto — the living memory of the
        Maya resistance. History here isn&apos;t told; it&apos;s walked, tasted, heard, and lived
        alongside the community that keeps it alive.
      </p>

      <h2 style={h2}>La experiencia incluye / Your experience includes</h2>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.55rem" }}>
        {INCLUDES.map((item) => (
          <li
            key={item.es}
            style={{
              background: "var(--cream)", border: "1px solid var(--sand-line)",
              borderLeft: "4px solid var(--turquoise)", borderRadius: "8px", padding: "0.6rem 0.9rem",
            }}
          >
            {item.icon} <strong>{item.es}</strong>
            <div style={{ fontSize: "0.85rem", color: "var(--charcoal-soft)" }}>{item.en}</div>
          </li>
        ))}
      </ul>

      <div style={infoBox}>
        <p style={{ margin: "0.2rem 0", fontSize: "1.05rem" }}>
          💲 <strong>$3,500 MXN — paquete para 2 personas / package for 2 people</strong>
        </p>
        <p style={{ margin: "0.2rem 0" }}>⏱️ ~3–4 horas / hours</p>
        <p style={{ margin: "0.2rem 0" }}>📍 Felipe Carrillo Puerto, Quintana Roo — Zona Maya</p>
        <p style={{ margin: "0.2rem 0" }}>📅 Reservación mínima 3 días antes / Book at least 3 days in advance</p>
        <p style={{ margin: "0.2rem 0", fontSize: "0.9rem", color: "var(--charcoal-soft)" }}>
          💛 Cada peso apoya directamente a familias locales y la preservación cultural. /
          Every peso directly supports local families and cultural preservation.
        </p>
      </div>

      <h2 style={h2}>Cómo llegar / Getting here</h2>
      <p>
        Felipe Carrillo Puerto es atendido por el <strong>Tren Maya</strong>. Según el horario
        actual: salida de Tulum 10:45 (llegada 12:07) y regreso desde FCP 18:40 (llegada a Tulum
        20:02). Los boletos los compras directamente en{" "}
        <a href="https://reservas.ventaboletostrenmaya.com.mx" target="_blank" rel="noopener noreferrer">
          reservas.ventaboletostrenmaya.com.mx
        </a>{" "}
        — ~24–102.50 MXN por persona por trayecto (≈200–400 MXN ida y vuelta para dos, según clase).
        <strong> Verifica los horarios en el portal oficial antes de tu viaje</strong> — pueden
        cambiar. Te enviamos nuestros horarios recomendados, el punto de encuentro del taxi y todos
        los detalles después de reservar. / Fares typically run 24–102.50 MXN per person each way;
        please verify train times on the official portal before your trip — schedules can change.
      </p>
      <p style={{ color: "var(--charcoal-soft)" }}>
        💰 Costo total estimado para dos: ~$3,700–3,900 MXN (paquete + boletos de tren). /
        Estimated total for two: ~$3,700–3,900 MXN (package + train tickets).
      </p>

      <h2 style={h2}>Bueno saber / Good to know</h2>
      <p>
        👟 Calzado cómodo y protección solar recomendados · Recorrido a pie / Comfortable walking
        shoes and sun protection recommended · Walking route
      </p>

      <div style={{ marginTop: "1.6rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        {/* TODO: replace with the real booking link (WhatsApp or Facebook) */}
        <a href="https://www.instagram.com/nojkaajrutadelaresistencia" target="_blank" rel="noopener noreferrer" style={btnPrimary}>
          📩 Reserva tu fecha / Message us to reserve
        </a>
        <a href="/?lugar=noj-kaaj-ruta-de-la-resistencia" style={btnGhost}>Ver en el mapa / View on map</a>
      </div>
    </main>
  );
}