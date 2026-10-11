"use client";

import { useEffect, useState } from "react";
import events from "./events.mjs";
import { localize, uiText } from "./i18n.mjs";
import { entryKind, formatEventRange, upcomingEvents } from "./event-utils.mjs";
import { useSiteLanguage } from "./site-language";

// UpcomingEvents — the community strip: EVERY upcoming EVENT, promoted or
// not, as a horizontally scrollable strip of cards between the premium
// banner and the map. kind: "offer" records (a B&B rental, placeholder
// partners) never appear here — they are not events. Organic events link
// straight to their entry on /eventos (#<id> anchor); promoted events link
// to their /promo/<id> landing (the convention every other surface follows)
// and keep the sponsored badge + terracotta accent — paid placement is
// always labeled.
//
// Placement: immediately after the FeaturedPartners banner and before the
// map, so the page opens with the promotional surface, teases what's on,
// then lands on the interactive hero.
//
// Upcoming/past is decided at RUNTIME in the browser on America/Cancun time,
// so expired events vanish without a rebuild. Until "now" is known nothing
// renders: a past event must never appear, not even in the prerendered HTML.

export default function UpcomingEvents() {
  const language = useSiteLanguage();
  const text = uiText(language);
  const [now, setNow] = useState(null);
  useEffect(() => setNow(new Date()), []);

  const upcoming = now
    ? upcomingEvents(events, now.getTime()).filter((event) => entryKind(event) === "event")
    : [];
  if (upcoming.length === 0) return null;

  return (
    <section className="upcoming-strip" aria-labelledby="upcoming-strip-heading">
      <div className="upcoming-strip__header">
        <h2 id="upcoming-strip-heading">{text.upcomingHeading}</h2>
        <div className="upcoming-strip__header-actions">
          <span className="upcoming-strip__hint" aria-hidden="true">
            {text.upcomingScrollHint}
          </span>
          <a className="upcoming-strip__all" href="/eventos">
            {text.upcomingAllEvents} →
          </a>
        </div>
      </div>
      <ul className="upcoming-strip__scroller">
        {upcoming.map((event) => {
          const titleEn = event.title?.en;
          const venue = localize(event.venue?.name, language);
          return (
            <li key={event.id}>
              <article
                className={
                  event.promoted ? "upcoming-card upcoming-card--promoted" : "upcoming-card"
                }
              >
                {event.promoted && <span className="upcoming-card__badge">{text.promotedBadge}</span>}
                <h3 className="upcoming-card__title">
                  {event.title.es}
                  {titleEn && titleEn !== event.title.es && (
                    <span className="upcoming-card__title-alt"> / {titleEn}</span>
                  )}
                </h3>
                <p className="upcoming-card__meta">{formatEventRange(event, language)}</p>
                {venue && <p className="upcoming-card__meta">{venue}</p>}
                <a
                  className="upcoming-card__cta"
                  href={event.promoted ? `/promo/${event.id}` : `/eventos#${event.id}`}
                >
                  {text.upcomingView} →
                </a>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
