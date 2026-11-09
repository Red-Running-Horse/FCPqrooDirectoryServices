import events from "./events.mjs";

export const dynamic = "force-static";

export default function sitemap() {
  const base = "https://fcpqroo.mx";
  const now = new Date();
  const page = (path, priority) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  });
  const promotedLandings = events
    .filter((event) => event.promoted)
    .map((event) => page(`/promo/${event.id}`, 0.7));
  return [
    page("", 1),               // map
    page("/guia", 0.9),        // visitor guide
    page("/eventos", 0.9),     // events
    page("/tzolkin", 0.6),     // tzolkin
    page("/promociones", 0.6), // promociones
    page("/tours/noj-kaaj", 0.6), // Noj Kaaj tour
    ...promotedLandings,       // client landing pages (data-driven)
  ];
}
