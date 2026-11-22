import { redirect } from "next/navigation";

export const metadata = {
  title: "Noj Kaaj — Ruta de la Resistencia",
  description: "Esta página se movió a /tours/tulum-noj-kaaj. / This page has moved to /tours/tulum-noj-kaaj.",
  alternates: { canonical: "https://fcpqroo.mx/tours/tulum-noj-kaaj" },
  robots: { index: false },
};

// The tour page moved to /tours/tulum-noj-kaaj — a transportation-free
// revision requested by the operator (community-first framing). The static
// export bakes this page into an instant meta-refresh redirect.
export default function NojKaajMoved() {
  redirect("/tours/tulum-noj-kaaj");
}
