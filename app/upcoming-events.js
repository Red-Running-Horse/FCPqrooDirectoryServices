"use client";

import { useEffect, useState } from "react";
import events from "./events.mjs";
import { localize, uiText } from "./i18n.mjs";
import { entryKind, upcomingEvents } from "./event-utils.mjs";
import { categoryColor } from "./category-colors.mjs";
import { useSiteLanguage } from "./site-language";

// UpcomingEvents — the community strip: EVERY upcoming EVENT, promoted or
// not, as compact single-line rows between the premium banner and the map.
// Title only — dates, venues and costs live on /eventos. Each row carries a
// small bar in the event's category color (app/category-colors.mjs palette).
// Every row links uniformly to /eventos#<id>: /eventos lists promoted events
// too, so the tiered /promo/<id> shortcut is gone. Promoted events keep a
// minimal sponsored marker — paid placement is always labeled.
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
        <a className="upcoming-strip__all" href="/eventos">
          {text.upcomingAllEvents} →
        </a>
      </div>
      <ul className="upcoming-strip__scroller">
        {upcoming.map((event) => (
          <li key={event.id}>
            <a className="upcoming-row" href={`/eventos#${event.id}`}>
              <span
                className="upcoming-row__bar"
                style={{ background: categoryColor(event.category) }}
                aria-hidden="true"
              />
              <span className="upcoming-row__title">{localize(event.title, language)}</span>
              {event.promoted && (
                <span className="upcoming-row__sponsored">{text.promotedBadge}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
