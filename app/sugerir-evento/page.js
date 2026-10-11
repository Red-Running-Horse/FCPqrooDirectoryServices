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
        Sugerir un evento{" "}
        <span style={{ fontSize: "1rem", fontWeight: 400 }}>— send us your event / envía tu evento</span>
      </h1>
      <p style={{ color: "var(--charcoal-soft)" }}>
        Cuéntanos sobre tu evento en Felipe Carrillo Puerto o las comunidades de la Zona Maya. Cada
        propuesta se revisa antes de publicarse: los eventos aparecen solo después de la revisión. / Tell
        us about your event in Felipe Carrillo Puerto or the Zona Maya communities. Every suggestion is
        reviewed before publication: events appear only after review.
      </p>
      <SuggestEventForm places={placesIndex} />
    </main>
  );
}
