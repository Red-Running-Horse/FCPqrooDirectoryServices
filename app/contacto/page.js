import GrecaBand from "../greca";
import organization from "../organization.mjs";

// /contacto — the public contact surface: WhatsApp + email actions, a plain-
// language privacy notice, and a machine-readable ContactPoint (the shared
// Organization node). Linked from the site nav and the sitemap. The unlisted
// submission page keeps its unlisted status: no link to it from here or any
// public surface.

export const metadata = {
  title: "Contacto — Felipe Carrillo Puerto",
  description:
    "Contacto del Directorio de Servicios de Felipe Carrillo Puerto: WhatsApp y correo. Contact the Felipe Carrillo Puerto services directory: WhatsApp and email.",
};

const btnPrimary = {
  display: "inline-block",
  background: "var(--jungle)",
  color: "#fff",
  fontWeight: 600,
  textDecoration: "none",
  padding: "0.7rem 1.4rem",
  borderRadius: "8px",
};

const btnGhost = {
  display: "inline-block",
  background: "transparent",
  color: "var(--turquoise)",
  border: "2px solid var(--turquoise)",
  fontWeight: 600,
  textDecoration: "none",
  padding: "0.6rem 1.2rem",
  borderRadius: "8px",
};

export default function Contacto() {
  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "0 1rem 4rem", lineHeight: 1.6 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ "@context": "https://schema.org", ...organization }).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />
      <GrecaBand />
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.7rem", margin: "1rem 0 0.25rem" }}>
        <span className="l10n-es">Contacto</span>
        <span className="l10n-en">Contact</span>
      </h1>
      <p style={{ color: "var(--charcoal-soft)" }}>
        <span className="l10n-es">
          ¿Organizas un evento, tienes un negocio o quieres corregir un dato del directorio?
          Escríbenos directamente.
        </span>{" "}
        <span className="l10n-en">
          Running an event, running a business, or correcting a directory listing? Reach us
          directly.
        </span>
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.7rem",
          alignItems: "center",
          margin: "1.2rem 0 2rem",
        }}
      >
        <a href="https://wa.me/529841841313" target="_blank" rel="noopener noreferrer" style={btnPrimary}>
          <span className="l10n-es">Escríbenos por WhatsApp</span>
          <span className="l10n-en">Message us on WhatsApp</span>
        </a>
        <a href="mailto:eventos@fcpqroo.mx" style={btnGhost}>
          eventos@fcpqroo.mx
        </a>
      </div>
      <h2 style={{ fontSize: "1.15rem", margin: "0 0 0.4rem", fontFamily: "var(--font-heading)" }}>
        <span className="l10n-es">Aviso de privacidad</span>
        <span className="l10n-en">Privacy notice</span>
      </h2>
      <p style={{ color: "var(--charcoal-soft)" }}>
        <span className="l10n-es">
          Los datos de contacto que compartas se usan únicamente para verificar y responder tus
          solicitudes: eventos, lugares y promociones. Nunca se publican ni se comparten con
          terceros.
        </span>{" "}
        <span className="l10n-en">
          The contact details you share are used only to verify and respond to your requests —
          events, places, and promotions. They are never published or shared with third parties.
        </span>
      </p>
    </main>
  );
}
