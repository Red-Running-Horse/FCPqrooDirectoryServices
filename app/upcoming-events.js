"use client";

import { useEffect, useRef, useState } from "react";
import events from "./events.mjs";
import { localize, uiText } from "./i18n.mjs";
import { entryKind, eventChipDate, upcomingEvents } from "./event-utils.mjs";
import { categoryColor } from "./category-colors.mjs";
import { useSiteLanguage } from "./site-language";

// UpcomingEvents — the community strip: EVERY upcoming EVENT, promoted or
// not, as compact date-first rows between the premium banner and the map.
// The strip is the site's agenda, not an index: each row leads with a date
// chip (day prominent, month small, chip background in the event's CATEGORY
// color — it absorbs the old 4px bar), then the FULL title wrapping to two
// lines max, never ellipsized. Venues and costs still live on /eventos.
// Every row links uniformly to /eventos#<id>: /eventos lists promoted events
// too, so the tiered /promo/<id> shortcut is gone. Promoted events keep a
// minimal sponsored marker — paid placement is always labeled.
//
// Upcoming/past is decided at RUNTIME in the browser on America/Cancun time,
// so expired events vanish without a rebuild. Until "now" is known nothing
// renders: a past event must never appear, not even in the prerendered HTML.
//
// Desktop input (≥48rem): Chromium's Fluent overlay scrollbars can't be
// styled, so the wheel is translated into horizontal scrolling — but ONLY
// while the strip can still move that way; at either end the page keeps
// scrolling normally (no scroll-trap). Touch keeps the native pan: no touch
// handlers here. Two chevron buttons page through the ribbon (~80% of its
// width per click) and hide at the ends.

export default function UpcomingEvents() {
  const language = useSiteLanguage();
  const text = uiText(language);
  const [now, setNow] = useState(null);
  useEffect(() => setNow(new Date()), []);

  const scrollerRef = useRef(null);
  // Ribbon edge state: drives the wheel pass-through and the chevrons.
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [desktop, setDesktop] = useState(false);

  const upcoming = now
    ? upcomingEvents(events, now.getTime()).filter((event) => entryKind(event) === "event")
    : [];

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 48rem)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // The strip renders (and re-renders with new content) only after the
  // browser clock is known, so [upcoming.length] covers mount and reflows.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const sync = () => {
      setAtStart(scroller.scrollLeft <= 1);
      setAtEnd(scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft <= 1);
    };
    sync();
    scroller.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      scroller.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [upcoming.length]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // React's synthetic onWheel attaches a PASSIVE listener, so
    // preventDefault() inside it is ignored — the wheel must be registered
    // by hand to translate vertical deltas into horizontal ones.
    const onWheel = (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = scroller.scrollWidth - scroller.clientWidth;
      const goingForward = event.deltaY > 0;
      // Pass through at either end (or with no overflow at all): translating
      // here would trap the wheel over the strip.
      if (goingForward ? max - scroller.scrollLeft <= 1 : scroller.scrollLeft <= 1) return;
      event.preventDefault();
      const step = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      scroller.scrollLeft = goingForward
        ? Math.min(scroller.scrollLeft + step, max)
        : Math.max(scroller.scrollLeft + step, 0);
    };
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [upcoming.length]);

  const scrollPage = (direction) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: "smooth" });
  };

  if (upcoming.length === 0) return null;

  return (
    <section className="upcoming-strip" aria-labelledby="upcoming-strip-heading">
      <div className="upcoming-strip__header">
        <h2 id="upcoming-strip-heading">{text.upcomingHeading}</h2>
        <a className="upcoming-strip__all" href="/eventos">
          {text.upcomingAllEvents} →
        </a>
      </div>
      <div className="upcoming-strip__ribbon">
        <ul className="upcoming-strip__scroller" ref={scrollerRef}>
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
        {desktop && (
          <div className="upcoming-strip__nav">
            <button
              type="button"
              className="upcoming-strip__nav-btn"
              aria-label={text.upcomingPrevious}
              hidden={atStart}
              onClick={() => scrollPage(-1)}
            >
              ←
            </button>
            <button
              type="button"
              className="upcoming-strip__nav-btn"
              aria-label={text.upcomingNext}
              hidden={atEnd}
              onClick={() => scrollPage(1)}
            >
              →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
