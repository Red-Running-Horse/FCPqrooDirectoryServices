"use client";

import { useEffect, useState } from "react";
import GrecaBand from "../greca";
import events from "../events.mjs";
import annualHighlights from "../annual-highlights.mjs";
import FeaturedPartners from "../featured-partners";
import placesIndex from "../../public/data/places-index.json";
import {
  entryKind,
  eventJsonLd,
  eventVenueView,
  formatEventRange,
  upcomingEvents,
} from "../event-utils.mjs";
import { UI_TEXT } from "../i18n.mjs";
import L10n from "../l10n.js";

// /eventos — FeaturedPartners (attract band + max-3 sponsor cards) on top,
// then a chronological list of ALL upcoming EVENTS: promoted events (test-2)
// belong here too — a promoted event is still an event. kind: "offer" records
// (a B&B rental, placeholder partners) never appear here. Upcoming/past is
// decided at RUNTIME in the browser on America/Cancun time, so expired
// events vanish without a rebuild. Until "now" is known the listing renders
// a placeholder: a past event must never appear, not even in the prerendered
// HTML.

const placesById = new Map(placesIndex.map((place) => [place.id, place]));

const card = {
  background: "var(--cream)",
  border: "1px solid var(--sand-line)",
  borderRadius: "10px",
  padding: "0.9rem 1rem",
};

const meta = { margin: "0.3rem 0", fontSize: "0.88rem", color: "var(--charcoal-soft)" };

// A bilingual value renders through the shared gated renderer (see l10n.js):
// both variants ship in the HTML, CSS shows only the active language.
function EventEntry({ event }) {
  const venueEs = eventVenueView(event, "es", placesById);
  const venueEn = eventVenueView(event, "en", placesById);
  const venueNameDiffers = venueEn.name && venueEn.name !== venueEs.name;
  const jsonLd = JSON.stringify(eventJsonLd(event, placesById)).replace(/</g, "\\u003c");
  return (
    // id anchors the homepage upcoming-events strip links (/eventos#<id>).
    <li style={card} id={event.id}>
      <details>
        <summary style={{ cursor: "pointer" }}>
          <time style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--terracotta)", whiteSpace: "nowrap" }}>
            <span className="l10n-es">{formatEventRange(event, "es")}</span>
            <span className="l10n-en">{formatEventRange(event, "en")}</span>
          </time>{" "}
          <strong style={{ fontFamily: "var(--font-heading)" }}>
            <L10n pair={event.title} />
          </strong>
        </summary>
        <div style={{ marginTop: "0.6rem", fontSize: "0.92rem" }}>
          <p style={{ margin: "0.3rem 0" }}>
            <L10n pair={event.description} />
          </p>
          <p style={meta}>
            📅 <span className="l10n-es">{formatEventRange(event, "es")}</span>
            <span className="l10n-en">{formatEventRange(event, "en")}</span>
          </p>
          {venueEs.name && (
            <p style={meta}>
              📍{" "}
              {venueNameDiffers ? (
                <>
                  <span className="l10n-es">{venueEs.name}</span>
                  <span className="l10n-en">{venueEn.name}</span>
                </>
              ) : (
                venueEs.name
              )}
              {venueEs.href && (
                <>
                  {" — "}
                  <a href={venueEs.href}>
                    <span className="l10n-es">ver en el directorio</span>
                    <span className="l10n-en">view in directory</span>
                  </a>
                </>
              )}
            </p>
          )}
          {event.cost && (
            <p style={meta}>
              💲 <L10n pair={event.cost} />
            </p>
          )}
          {event.sourceUrl && (
            <p style={meta}>
              <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">
                <span className="l10n-es">fuente ↗</span>
                <span className="l10n-en">source ↗</span>
              </a>
            </p>
          )}
        </div>
      </details>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
    </li>
  );
}

export default function Eventos() {
  const [now, setNow] = useState(null);
  useEffect(() => setNow(new Date()), []);

  const upcoming = now ? upcomingEvents(events, now.getTime()) : [];
  const listed = upcoming.filter((ev) => entryKind(ev) === "event");

  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "0 1rem 4rem", lineHeight: 1.6 }}>
      <GrecaBand />
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.7rem", margin: "1rem 0 0.25rem" }}>
        Eventos{" "}
        <span style={{ fontSize: "1rem", fontWeight: 400 }}>
          <span className="l10n-es">— qué está pasando</span>
          <span className="l10n-en">— what&apos;s on</span>
        </span>
      </h1>
      <p style={{ color: "var(--charcoal-soft)" }}>
        <span className="l10n-es">
          Ferias, ceremonias, tours y música de la Zona Maya. Los eventos destacados son promoción
          pagada — siempre marcados.
        </span>{" "}
        <span className="l10n-en">
          Fairs, ceremonies, tours and music. Featured events are paid promotion — always labeled.
        </span>
      </p>

      <div style={{ margin: "1.2rem 0 1.6rem" }}>
        <FeaturedPartners />
      </div>

      <section aria-label="Próximos eventos / Upcoming events">
        <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.6rem" }}>
          <span className="l10n-es">Próximos eventos</span>
          <span className="l10n-en">Upcoming</span>
        </h2>
        {!now ? (
          <p style={{ ...card, color: "var(--charcoal-soft)" }}>
            <span className="l10n-es">Cargando eventos…</span>
            <span className="l10n-en">Loading events…</span>
          </p>
        ) : listed.length === 0 ? (
          <p style={{ ...card, color: "var(--charcoal-soft)" }}>
            <span className="l10n-es">
              Próximamente —{" "}
              <a href="mailto:eventos@fcpqroo.mx">¿tienes un evento?</a>
            </span>
            <span className="l10n-en">
              Coming soon — <a href="mailto:eventos@fcpqroo.mx">submit an event</a>
            </span>
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.6rem" }}>
            {listed.map((ev) => (
              <EventEntry key={ev.id} event={ev} />
            ))}
          </ul>
        )}
      </section>

      {/* Annual highlights: recurrences with no fixed dates, so they render
          statically — outside the runtime "now" gate above, which exists to
          keep PAST events out of the prerender. A highlight can never be
          past, and gating it would only flash a loading state and hide the
          section from the prerendered HTML. */}
      <section aria-label={UI_TEXT.es.annualHighlightsHeading} style={{ marginTop: "1.8rem" }}>
        <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.6rem" }}>
          <span className="l10n-es">Eventos que vuelven cada año</span>
          <span className="l10n-en">Annual highlights</span>
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.6rem" }}>
          {annualHighlights.map((item) => (
            <li key={item.id} style={card}>
              {/* Window styling mirrors the upcoming list's <time>: terracotta,
                  bold, 0.85rem. No whiteSpace:nowrap — windows are phrases that
                  must wrap at 360px. */}
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "var(--terracotta)" }}>
                <L10n pair={item.window} />
              </p>
              <p style={{ margin: "0.25rem 0 0" }}>
                <strong style={{ fontFamily: "var(--font-heading)" }}>
                  <L10n pair={item.title} />
                </strong>
              </p>
              <p style={{ ...meta, margin: "0.3rem 0 0" }}>
                <L10n pair={item.description} />
              </p>
              {item.sourceUrl && (
                <p style={meta}>
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <span className="l10n-es">fuente ↗</span>
                    <span className="l10n-en">source ↗</span>
                  </a>
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
