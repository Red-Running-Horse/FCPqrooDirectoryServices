"use client";

import { useState } from "react";
import { CATEGORIES } from "../place-index.mjs";
import { useSiteLanguage } from "../site-language";

// Submission form for /sugerir-evento. POSTs to the relay configured via
// NEXT_PUBLIC_EVENT_FORM_ENDPOINT (inlined at build time). When the variable
// is unset the form never crashes: the submit button is replaced by a
// graceful mailto fallback.
//
// Labels and notices render the active language only: gated l10n-* spans
// (CSS keyed on <html lang>) everywhere except <option> text, which cannot
// contain spans — those follow useSiteLanguage like the homepage surfaces.
// The mailto body and datalist values stay intentionally bilingual (they are
// form VALUES, not display copy).

const FORM_ENDPOINT = process.env.NEXT_PUBLIC_EVENT_FORM_ENDPOINT;
const CONTACT_EMAIL = "eventos@fcpqroo.mx";

const field = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: "0.25rem",
  padding: "0.55rem 0.7rem",
  border: "1px solid var(--sand-line)",
  borderRadius: "8px",
  background: "#fff",
  color: "var(--obsidian)",
  font: "inherit",
};

const label = { display: "block", fontWeight: 600, fontSize: "0.92rem", marginTop: "0.9rem" };
const hint = { fontWeight: 400, fontSize: "0.82rem", color: "var(--charcoal-soft)" };

const notice = {
  background: "var(--cream)",
  border: "1px solid var(--sand-line)",
  borderRadius: "10px",
  padding: "0.9rem 1rem",
  marginTop: "1.2rem",
};

const submitButton = {
  marginTop: "1.2rem",
  padding: "0.65rem 1.3rem",
  border: "none",
  borderRadius: "8px",
  background: "var(--jungle)",
  color: "#fff",
  fontWeight: 600,
  font: "inherit",
  cursor: "pointer",
};

const initial = { name: "", start: "", end: "", venue: "", category: "", cost: "", description: "", contact: "" };

export default function SuggestEventForm({ places }) {
  const language = useSiteLanguage();
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failed, setFailed] = useState(false);

  const venueOptions = (places ?? [])
    .map((place) => {
      const es = place.name?.es ?? "";
      const en = place.name?.en;
      return en && en !== es ? `${es} / ${en}` : es;
    })
    .filter(Boolean);

  function update(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!FORM_ENDPOINT || submitting) return;
    setSubmitting(true);
    setFailed(false);
    try {
      const body = new URLSearchParams({
        "form-name": "event-suggestion",
        ...form,
      });
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
      });
      if (!response.ok) throw new Error(`Form relay responded ${response.status}`);
      setSubmitted(true);
    } catch (cause) {
      console.warn("Event suggestion failed:", cause);
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Sugerencia de evento / Event suggestion"
  )}&body=${encodeURIComponent(
    [
      `Evento / Event: ${form.name}`,
      `Inicio / Start: ${form.start}`,
      `Fin / End: ${form.end || "—"}`,
      `Lugar / Venue: ${form.venue}`,
      `Categoría / Category: ${form.category}`,
      `Costo / Cost: ${form.cost || "—"}`,
      "",
      form.description,
      "",
      `Contacto / Contact: ${form.contact}`,
    ].join("\n")
  )}`;

  if (submitted) {
    return (
      <div style={notice} role="status">
        <p style={{ margin: 0, fontWeight: 700 }}>
          <span className="l10n-es">¡Gracias!</span>
          <span className="l10n-en">Thank you!</span>
        </p>
        <p style={{ margin: "0.4rem 0 0" }}>
          <span className="l10n-es">
            Recibimos tu propuesta. Tu evento aparecerá en el directorio solo después de la revisión.
          </span>{" "}
          <span className="l10n-en">
            We received your suggestion. Your event will appear in the directory only after review.
          </span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "0.6rem" }}>
      <label style={label}>
        <span className="l10n-es">Nombre del evento *</span>
        <span className="l10n-en">Event name *</span>
        <input
          style={field}
          name="name"
          type="text"
          required
          autoComplete="off"
          value={form.name}
          onChange={update("name")}
        />
      </label>

      <label style={label}>
        <span className="l10n-es">Fecha y hora de inicio *</span>
        <span className="l10n-en">Start date and time *</span>
        <input
          style={field}
          name="start"
          type="datetime-local"
          required
          value={form.start}
          onChange={update("start")}
        />
      </label>

      <label style={label}>
        <span className="l10n-es">Fecha y hora de fin (opcional)</span>
        <span className="l10n-en">End date and time (optional)</span>
        <input
          style={field}
          name="end"
          type="datetime-local"
          value={form.end}
          onChange={update("end")}
        />
      </label>

      <label style={label}>
        <span className="l10n-es">Lugar *</span>
        <span className="l10n-en">Venue *</span>
        <span style={hint}>
          {" "}
          <span className="l10n-es">— ¿está en el directorio? Escríbelo y aparecerá en la lista.</span>
          <span className="l10n-en">— Is it in the directory? Start typing and it will show up in the list.</span>
        </span>
        <input
          style={field}
          name="venue"
          type="text"
          required
          list="directory-venues"
          autoComplete="off"
          value={form.venue}
          onChange={update("venue")}
        />
        <datalist id="directory-venues">
          {venueOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>

      <label style={label}>
        <span className="l10n-es">Categoría *</span>
        <span className="l10n-en">Category *</span>
        <select style={field} name="category" required value={form.category} onChange={update("category")}>
          <option value="" disabled>
            —
          </option>
          {CATEGORIES.filter(({ id }) => id !== "all").map(({ id, label: categoryLabel }) => (
            <option key={id} value={id}>
              {categoryLabel[language] ?? categoryLabel.es}
            </option>
          ))}
        </select>
      </label>

      <label style={label}>
        <span className="l10n-es">Costo (opcional)</span>
        <span className="l10n-en">Cost (optional)</span>
        <input
          style={field}
          name="cost"
          type="text"
          autoComplete="off"
          value={form.cost}
          onChange={update("cost")}
        />
      </label>

      <label style={label}>
        <span className="l10n-es">Descripción *</span>
        <span className="l10n-en">Description *</span>
        <textarea
          style={{ ...field, minHeight: "6rem", resize: "vertical" }}
          name="description"
          required
          value={form.description}
          onChange={update("description")}
        />
      </label>

      <label style={label}>
        <span className="l10n-es">Tu correo o teléfono *</span>
        <span className="l10n-en">Your email or phone *</span>
        <span style={hint}>
          {" "}
          <span className="l10n-es">Solo para dudas sobre tu propuesta.</span>
          <span className="l10n-en">Only for questions about your suggestion.</span>
        </span>
        <input
          style={field}
          name="contact"
          type="text"
          required
          autoComplete="off"
          value={form.contact}
          onChange={update("contact")}
        />
      </label>

      {FORM_ENDPOINT ? (
        <button type="submit" style={submitButton} disabled={submitting}>
          {submitting ? (
            <>
              <span className="l10n-es">Enviando…</span>
              <span className="l10n-en">Sending…</span>
            </>
          ) : (
            <>
              <span className="l10n-es">Enviar propuesta</span>
              <span className="l10n-en">Submit suggestion</span>
            </>
          )}
        </button>
      ) : (
        <div style={notice} role="status">
          <p style={{ margin: 0 }}>
            <span className="l10n-es">El formulario en línea no está configurado por el momento.</span>{" "}
            <span className="l10n-en">The online form is not set up at the moment.</span>
          </p>
          <p style={{ margin: "0.4rem 0 0" }}>
            <a href={mailto}>
              <span className="l10n-es">Envía tu evento por correo</span>
              <span className="l10n-en">Send your event by email</span>
            </a>
          </p>
        </div>
      )}

      {failed && (
        <p style={{ ...notice, borderColor: "var(--terracotta)" }} role="alert">
          <span className="l10n-es">
            No se pudo enviar la propuesta. Inténtalo de nuevo, o{" "}
            <a href={mailto}>envíala por correo</a>.
          </span>
          <span className="l10n-en">
            Couldn&apos;t send the suggestion. Try again, or{" "}
            <a href={mailto}>send it by email</a>.
          </span>
        </p>
      )}
    </form>
  );
}
