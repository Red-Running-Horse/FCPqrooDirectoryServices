"use client";

import { useState } from "react";
import { CATEGORIES } from "../place-index.mjs";

// Submission form for /sugerir-evento. POSTs to the relay configured via
// NEXT_PUBLIC_EVENT_FORM_ENDPOINT (inlined at build time). When the variable
// is unset the form never crashes: the submit button is replaced by a
// graceful mailto fallback.

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
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
          ¡Gracias! / Thank you!
        </p>
        <p style={{ margin: "0.4rem 0 0" }}>
          Recibimos tu propuesta. Tu evento aparecerá en el directorio solo después de la revisión. /
          We received your suggestion. Your event will appear in the directory only after review.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "0.6rem" }}>
      <label style={label}>
        Nombre del evento / Event name *
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
        Fecha y hora de inicio / Start date and time *
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
        Fecha y hora de fin (opcional) / End date and time (optional)
        <input
          style={field}
          name="end"
          type="datetime-local"
          value={form.end}
          onChange={update("end")}
        />
      </label>

      <label style={label}>
        Lugar / Venue *
        <span style={hint}>
          {" "}
          — ¿está en el directorio? Escríbelo y aparecerá en la lista. / Is it in the directory?
          Start typing and it will show up in the list.
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
        Categoría / Category *
        <select style={field} name="category" required value={form.category} onChange={update("category")}>
          <option value="" disabled>
            —
          </option>
          {CATEGORIES.filter(({ id }) => id !== "all").map(({ id, label: categoryLabel }) => (
            <option key={id} value={id}>
              {categoryLabel.es} / {categoryLabel.en}
            </option>
          ))}
        </select>
      </label>

      <label style={label}>
        Costo (opcional) / Cost (optional)
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
        Descripción / Description *
        <textarea
          style={{ ...field, minHeight: "6rem", resize: "vertical" }}
          name="description"
          required
          value={form.description}
          onChange={update("description")}
        />
      </label>

      <label style={label}>
        Tu correo o teléfono / Your email or phone *
        <span style={hint}> Solo para dudas sobre tu propuesta. / Only for questions about your suggestion.</span>
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
          {submitting ? "Enviando… / Sending…" : "Enviar propuesta / Submit suggestion"}
        </button>
      ) : (
        <div style={notice} role="status">
          <p style={{ margin: 0 }}>
            El formulario en línea no está configurado por el momento. / The online form is not set up
            at the moment.
          </p>
          <p style={{ margin: "0.4rem 0 0" }}>
            <a href={mailto}>Envía tu evento por correo / Send your event by email</a>
          </p>
        </div>
      )}

      {failed && (
        <p style={{ ...notice, borderColor: "var(--terracotta)" }} role="alert">
          No se pudo enviar la propuesta. Inténtalo de nuevo, o{" "}
          <a href={mailto}>envíala por correo / send it by email</a>.
        </p>
      )}
    </form>
  );
}
