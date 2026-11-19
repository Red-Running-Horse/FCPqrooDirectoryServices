"use client";

import { useEffect, useState } from "react";
import events from "./events.mjs";
import { localize, uiText } from "./i18n.mjs";
import { entryKind, eventChipDate, upcomingEvents } from "./event-utils.mjs";
import { categoryColor } from "./category-colors.mjs";
import { useSiteLanguage } from "./site-language";

// UpcomingEvents — the community agenda: EVERY upcoming EVENT, promoted or
// not, as compact date-first rows. The strip is the site's agenda, not an
// index: each row leads with a date chip (day prominent, month small, chip
// background in the event's CATEGORY color), then the FULL title wrapping to
// three lines max, clipped only after the third line, never ellipsized
// before it. Venues and costs still live on /eventos. Every row links
// uniformly to /eventos#<id>. Promoted events keep a minimal sponsored
// marker — paid placement is always labeled.
//
// Upcoming/past is decided at RUNTIME in the browser on America/Cancun time,
// so expired events vanish without a rebuild. Until "now" is known nothing
// renders: a past event must never appear, not even in the prerendered HTML.
//
// Layout is a VERTICAL fading list (user directive): no horizontal scroll,
// no wheel translation, no snap, no chevrons. The container caps at ~5
// visible rows and a CSS mask fades the tail — that fade is the "more below"
// affordance that replaces the undiscoverable swipe gesture. The slim
// header's /eventos link is the full agenda. (Was: a horizontal snap
// carousel with mouse-wheel translation and paging chevrons.)

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
    <section className="upcoming-strip" id="upcoming-events" aria-labelledby="upcoming-strip-heading">
      <div className="upcoming-strip__header">
        <h2 id="upcoming-strip-heading">{text.upcomingHeading}</h2>
        <a className="upcoming-strip__all" href="/eventos">
          {text.upcomingAllEvents} →
        </a>
      </div>
      <ul className="upcoming-strip__scroller">
        {upcoming.map((event) => {
          const chip = eventChipDate(event, language);
          return (
            <li key={event.id}>
              <a className="upcoming-row" href={`/eventos#${event.id}`}>
                <span
                  className="upcoming-row__date"
                  style={{ background: categoryColor(event.category) }}
                >
                  <span className="upcoming-row__day">{chip?.day ?? "•"}</span>
                  <span className="upcoming-row__month">{chip?.month ?? ""}</span>
                </span>
                <span className="upcoming-row__body">
                  <span className="upcoming-row__title">{localize(event.title, language)}</span>
                  {event.promoted && (
                    <span className="upcoming-row__sponsored">{text.promotedBadge}</span>
                  )}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
