"use client";

import { useEffect } from "react";

export const metadata = {
  title: "Noj Kaaj — Ruta de la Resistencia",
  description: "This page has moved to /tours/tulum-noj-kaaj.",
  alternates: { canonical: "https://fcpqroo.mx/tours/tulum-noj-kaaj" },
  robots: { index: false },
};

// The tour page moved (transportation-free revision, owner-approved framing).
// Instant client redirect for the static export, with a manual fallback link.
export default function NojKaajMoved() {
  useEffect(() => {
    window.location.replace("/tours/tulum-noj-kaaj");
  }, []);
  return (
    <main style={{ maxWidth: "34rem", margin: "4rem auto", padding: "0 1rem", lineHeight: 1.65 }}>
      <p>
        <span className="l10n-es">La página del tour se movió.</span>{" "}
        <span className="l10n-en">The tour page has moved.</span>
      </p>
      <p>
        <a href="/tours/tulum-noj-kaaj">Noj Kaaj — Ruta de la Resistencia →</a>
      </p>
    </main>
  );
}
