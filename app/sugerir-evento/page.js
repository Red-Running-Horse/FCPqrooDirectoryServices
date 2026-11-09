import GrecaBand from "../greca";
import placesIndex from "../../public/data/places-index.json";
import SuggestEventForm from "./suggest-event-form";

// /sugerir-evento — UNLISTED submission page. Linked from no public page,
// navigation or sitemap; excluded from indexing via robots metadata below.
// Share the URL directly (whatsapp, flyers, word of mouth).

export const metadata = {
  title: "Sugerir un evento / Suggest an event",
  description:
    "Envía un evento para el directorio de Felipe Carrillo Puerto. / Submit an event for the Felipe Carrillo Puerto directory.",
  robots: { index: false, follow: false },
};

export default function SugerirEvento() {
  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "0 1rem 4rem", lineHeight: 1.6 }}>
      <GrecaBand />
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.7rem", margin: "1rem 0 0.25rem" }}>
        <span className="l10n-es">Sugerir un evento</span>
        <span className="l10n-en">Suggest an event</span>{" "}
        <span style={{ fontSize: "1rem", fontWeight: 400 }}>
          <span className="l10n-es">— envía tu evento</span>
          <span className="l10n-en">— send us your event</span>
        </span>
      </h1>
      <p style={{ color: "var(--charcoal-soft)" }}>
        <span className="l10n-es">
          Cuéntanos sobre tu evento en Felipe Carrillo Puerto o las comunidades de la Zona Maya. Cada
          propuesta se revisa antes de publicarse: los eventos aparecen solo después de la revisión.
        </span>{" "}
        <span className="l10n-en">
          Tell us about your event in Felipe Carrillo Puerto or the Zona Maya communities. Every
          suggestion is reviewed before publication: events appear only after review.
        </span>
      </p>
      <SuggestEventForm places={placesIndex} />
    </main>
  );
}
