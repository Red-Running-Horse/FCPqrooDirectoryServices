"use client";

import { useEffect, useState } from "react";
import GrecaBand from "../greca";

// Tzolk'in — the 260-day Maya calendar. 13 numbers x 20 day signs.
// Correlation: 2012-12-21 (13.0.0.0.0) = 4 Ajaw. Computed client-side so the
// displayed day is always "today" for the visitor, not the last build date.
// NOTE: page title for /tzolkin is set via the layout title.template.
const DAY_NAMES = [
  "Imix", "Ik'", "Ak'bal", "K'an", "Chikchan", "Kimi", "Manik'", "Lamat", "Muluk", "Ok",
  "Chuwen", "Eb", "B'en", "Ix", "Men", "K'ib'", "Kab'an", "Etz'nab'", "Kawak", "Ajaw",
];
const EPOCH = Date.UTC(2012, 11, 21); // 4 Ajaw

function tzolkinFor(date) {
  const n = Math.floor((date.getTime() - EPOCH) / 86400000) % 260;
  const number = ((4 - 1 + n) % 13 + 13) % 13 + 1;
  const name = DAY_NAMES[(DAY_NAMES.indexOf("Ajaw") + n + 260 * 20) % 20];
  return { number, name };
}

export default function Tzolkin() {
  const [today, setToday] = useState(null);

  useEffect(() => {
    setToday(tzolkinFor(new Date()));
  }, []);

  return (
    <main style={{ maxWidth: "46rem", margin: "0 auto", padding: "0 1rem 4rem", lineHeight: 1.65 }}>
      <GrecaBand />
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.7rem", margin: "1rem 0 0.25rem" }}>
        Tzolk&rsquo;in <span style={{ fontSize: "1rem", fontWeight: 400 }}>— el calendario sagrado de 260 días</span>
      </h1>
      <p style={{ color: "var(--charcoal-soft)" }}>
        The 260-day sacred count: 13 numbers cycling through 20 day signs, used for
        ceremonies, naming, and divination since Classic times — still consulted by
        Maya daykeepers in the Zona Maya today.
      </p>

      <div
        role="status"
        style={{
          background: "var(--cream)",
          border: "1px solid var(--sand-line)",
          borderRadius: "12px",
          padding: "1.5rem 1rem",
          textAlign: "center",
          margin: "1.5rem 0",
        }}
      >
        {today ? (
          <>
            <div style={{ fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--terracotta)", fontWeight: 700 }}>
              Hoy / Today
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "2.6rem", fontWeight: 600, color: "var(--obsidian)" }}>
              {today.number} {today.name}
            </div>
          </>
        ) : (
          <div style={{ color: "var(--charcoal-soft)" }}>Calculando&hellip; / Calculating&hellip;</div>
        )}
      </div>

      <h2 style={{ fontSize: "1.1rem", marginTop: "2rem" }}>Los 20 señales / The 20 day signs</h2>
      <ol style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(9rem, 1fr))", gap: "0.4rem", paddingLeft: "1.2rem" }}>
        {DAY_NAMES.map((name, i) => (
          <li key={name} style={{ fontSize: "0.92rem" }}>
            <strong>{i + 1}.</strong> {name}
          </li>
        ))}
      </ol>
      <p style={{ marginTop: "2rem", fontSize: "0.85rem", color: "var(--charcoal-soft)" }}>
        Correlación: 21 dic 2012 (13.0.0.0.0) = 4 Ajaw. Correlation: Dec 21, 2012 = 4 Ajaw.
      </p>
    </main>
  );
}
