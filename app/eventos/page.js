"use client";

import { useEffect, useState } from "react";
import GrecaBand from "../greca";
import events from "../events.mjs";
import FeaturedPartners from "../featured-partners";

// /eventos — FeaturedPartners (attract band + max-3 sponsor cards) on top,
// then a chronological list of everything else. Dates sort on the CLIENT so
// the page self-cleans past events even between weekly deploys.

const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function fmtRange(ev) {
  const s = new Date(ev.dateStart + "T00:00:00");
  const e = new Date(ev.dateEnd + "T00:00:00");
  const f = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return s.getTime() === e.getTime() ? f(s) : `${f(s)} – ${f(e)}`;
}

const card = {
  background: "var(--cream)",
  border: "1px solid var(--sand-line)",
  borderRadius: "10px",
  padding: "0.9rem 1rem",
};

export default function Eventos() {
  const [now, setNow] = useState(null);
  useEffect(() => setNow(new Date()), []);

  const upcoming = events.filter((ev) => !now || new Date(ev.dateEnd + "T23:59:59") >= now);
  const organic = upcoming
    .filter((ev) => !ev.promoted)
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart));

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
        {organic.length === 0 ? (
          <p style={{ ...card, color: "var(--charcoal-soft)" }}>
            Próximamente / Coming soon —{" "}
            <a href="mailto:eventos@fcpqroo.mx">¿tienes un evento? / submit an event</a>
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.6rem" }}>
            {organic.map((ev) => (
              <li key={ev.id} style={card}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", flexWrap: "wrap" }}>
                  <time style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--terracotta)", whiteSpace: "nowrap" }}>
                    {now ? fmtRange(ev) : ev.dateStart}
                  </time>
                  <strong style={{ fontFamily: "var(--font-heading)" }}>{ev.title.es}</strong>
                </div>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.88rem", color: "var(--charcoal-soft)" }}>
                  {ev.locationText.es} · {ev.cost.es} ·{" "}
                  <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer">
                    fuente / source ↗
                  </a>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
