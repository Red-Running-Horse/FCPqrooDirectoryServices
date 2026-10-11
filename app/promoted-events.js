"use client";

import { useEffect, useState } from "react";
import events from "./events.mjs";
import { DEFAULT_LANGUAGE, localize, uiText } from "./i18n.mjs";
import { formatEventRange, promotedEvents } from "./event-utils.mjs";

// PromotedEvents — the BASE promotion tier on the homepage: every promoted
// event (with or without the premium media block) as a horizontally
// scrollable strip of cards linking to its /promo/<id> landing. Native CSS
// scroll-snap; no carousel library. The section renders nothing when no
// event is promoted.
//
// Placement: below the map, so the interactive hero stays the first thing on
// the page and both promotional surfaces bracket the core product (premium
// banner on top, base strip at the bottom).
//
// Language: the map hero owns the ES/EN state and publishes it on
// <html lang>; this component follows that attribute so the whole page
// switches together (same uiText pattern, no second toggle).

function useSiteLanguage() {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  useEffect(() => {
    const read = () => setLanguage(document.documentElement.lang === "en" ? "en" : DEFAULT_LANGUAGE);
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);
  return language;
}

export default function PromotedEvents() {
  const language = useSiteLanguage();
  const text = uiText(language);
  const promoted = promotedEvents(events);
  if (promoted.length === 0) return null;

  return (
    <section className="promoted-strip" aria-labelledby="promoted-strip-heading">
      <div className="promoted-strip__header">
        <h2 id="promoted-strip-heading">{text.promotedHeading}</h2>
        <span className="promoted-strip__hint" aria-hidden="true">
          {text.promotedScrollHint}
        </span>
      </div>
      <ul className="promoted-strip__scroller">
        {promoted.map((event) => {
          const titleEn = event.title?.en;
          const venue = localize(event.venue?.name, language);
          return (
            <li key={event.id}>
              <article className="promoted-card">
                {event.promotion?.mediaType === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="promoted-card__media"
                    src={event.promotion.cardUrl || event.promotion.mediaUrl}
                    alt=""
                    loading="lazy"
                  />
                )}
                <span className="promoted-card__badge">{text.promotedBadge}</span>
                <h3 className="promoted-card__title">
                  {event.title.es}
                  {titleEn && titleEn !== event.title.es && (
                    <span className="promoted-card__title-alt"> / {titleEn}</span>
                  )}
                </h3>
                <p className="promoted-card__meta">{formatEventRange(event, language)}</p>
                {venue && <p className="promoted-card__meta">{venue}</p>}
                <a className="promoted-card__cta" href={`/promo/${event.id}`}>
                  {text.promotedView} →
                </a>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
