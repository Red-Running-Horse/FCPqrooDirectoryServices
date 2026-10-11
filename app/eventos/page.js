"use client";

import { useEffect, useState } from "react";
import GrecaBand from "../greca";
import events from "../events.mjs";
import FeaturedPartners from "../featured-partners";
import placesIndex from "../../public/data/places-index.json";
import {
  eventJsonLd,
  eventVenueView,
  formatEventRange,
  upcomingEvents,
} from "../event-utils.mjs";

// /eventos — FeaturedPartners (attract band + max-3 sponsor cards) on top,
// then a chronological list of everything else. Upcoming/past is decided at
// RUNTIME in the browser on America/Cancun time, so expired events vanish
// without a rebuild. Until "now" is known the listing renders a placeholder:
// a past event must never appear, not even in the prerendered HTML.

const placesById = new Map(placesIndex.map((place) => [place.id, place]));

const card = {
  background: "var(--cream)",
  border: "1px solid var(--sand-line)",
  borderRadius: "10px",
  padding: "0.9rem 1rem",
};

const meta = { margin: "0.3rem 0", fontSize: "0.88rem", color: "var(--charcoal-soft)" };

function EventEntry({ event }) {
  const venue = eventVenueView(event, "es", placesById);
  const jsonLd = JSON.stringify(eventJsonLd(event, placesById)).replace(/</g, "\\u003c");
  return (
    <li style={card}>
      <details>
        <summary style={{ cursor: "pointer" }}>
          <time style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--terracotta)", whiteSpace: "nowrap" }}>
            {formatEventRange(event, "es")}
          </time>{" "}
          <strong style={{ fontFamily: "var(--font-heading)" }}>{event.title.es}</strong>
          {event.title.en && event.title.en !== event.title.es && (
            <span style={{ color: "var(--charcoal-soft)" }}> / {event.title.en}</span>
          )}
        </summary>
        <div style={{ marginTop: "0.6rem", fontSize: "0.92rem" }}>
          <p style={{ margin: "0.3rem 0" }}>{event.description.es}</p>
          {event.description.en && event.description.en !== event.description.es && (
            <p style={meta}>{event.description.en}</p>
          )}
          <p style={meta}>
            📅 {formatEventRange(event, "es")} / {formatEventRange(event, "en")}
          </p>
          {venue.name && (
            <p style={meta}>
              📍 {venue.name}
              {venue.href && (
                <>
                  {" — "}
                  <a href={venue.href}>ver en el directorio / view in directory</a>
                </>
              )}
            </p>
          )}
          {event.cost && (
            <p style={meta}>
              💲 {event.cost.es}
              {event.cost.en && event.cost.en !== event.cost.es && <> / {event.cost.en}</>}
            </p>
          )}
          {event.sourceUrl && (
            <p style={meta}>
              <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">
                fuente / source ↗
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
  const organic = upcoming.filter((ev) => !ev.promoted);

  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "0 1rem 4rem", lineHeight: 1.6 }}>
      <GrecaBand />
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.7rem", margin: "1rem 0 0.25rem" }}>
        Eventos <span style={{ fontSize: "1rem", fontWeight: 400 }}>— qué está pasando / what&apos;s on</span>
      </h1>
      <p style={{ color: "var(--charcoal-soft)" }}>
        Ferias, ceremonias, tours y música de la Zona Maya. Los eventos destacados son promoción
        pagada — siempre marcados. / Fairs, ceremonies, tours and music. Featured events are paid
        promotion — always labeled.
      </p>

      <div style={{ margin: "1.2rem 0 1.6rem" }}>
        <FeaturedPartners />
      </div>

      <section aria-label="Próximos eventos / Upcoming events">
        <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.6rem" }}>
          Próximos eventos / Upcoming
        </h2>
        {!now ? (
          <p style={{ ...card, color: "var(--charcoal-soft)" }}>
            Cargando eventos… / Loading events…
          </p>
        ) : organic.length === 0 ? (
          <p style={{ ...card, color: "var(--charcoal-soft)" }}>
            Próximamente / Coming soon —{" "}
            <a href="mailto:eventos@fcpqroo.mx">¿tienes un evento? / submit an event</a>
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.6rem" }}>
            {organic.map((ev) => (
              <EventEntry key={ev.id} event={ev} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
