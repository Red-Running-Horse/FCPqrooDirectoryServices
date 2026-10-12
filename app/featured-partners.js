"use client";

import { useEffect, useRef, useState } from "react";
import events from "./events.mjs";
import { uiText } from "./i18n.mjs";
import { premiumPromotions } from "./event-utils.mjs";
import { useSiteLanguage } from "./site-language";

// FeaturedPartners — the PREMIUM promotion surface (enforced in events.mjs:
// promoted plus a promotion media block, capped at MAX_PROMOTED total).
// BASE-tier promoted entries (no media block, e.g. test-2) never reach this
// component — they keep their /promo/<id> landing and, when kind: "event",
// their community-strip card.
//   ROTATING AD SPACE: the band cycles every premium promotion with the
//   slice-cascade transition: auto-advance every HOLD_MS, dot indicators and
//   prev/next arrows, pause on hover/focus, ←/→ arrow keys while focus is
//   inside the band. Auto-rotation is DISABLED under prefers-reduced-motion —
//   the arrows and dots still work (slice transition falls back to an
//   instant swap via CSS). Exactly ONE premium promo renders a static frame
//   with no rotation UI.
//   CARDS ROW: all premium partners always visible below the band — rotation
//   never hides a paying client.
const SLICES = 5;
const SLICE_MS = 70; // stagger between slices
const HOLD_MS = 6000; // time each promotion holds the frame

function RotatingBand({ partners, text }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  useEffect(() => {
    if (paused || partners.length < 2 || reduceMotion.current) return;
    const timer = setInterval(
      () => setActive((a) => (a + 1) % partners.length),
      HOLD_MS
    );
    return () => clearInterval(timer);
  }, [paused, partners.length]);

  const current = partners[active];
  const step = (delta) =>
    setActive((a) => (a + delta + partners.length) % partners.length);
  // One premium promo → static ad, no rotation UI.
  const rotating = partners.length >= 2;

  return (
    <div
      className="attract"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (!rotating) return;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          step(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          step(1);
        }
      }}
    >
      {partners.map((p, sceneIndex) => (
        <div
          key={p.id}
          className="attract__scene"
          data-active={sceneIndex === active}
          aria-hidden={sceneIndex !== active}
        >
          {Array.from({ length: SLICES }, (_, i) => (
            <div
              key={i}
              className="attract__slice"
              style={{
                backgroundImage: `url(${p.promotion?.mediaUrl})`,
                // each slice shows its vertical band of the shared image
                backgroundSize: `${SLICES * 100}% 100%`,
                backgroundPosition: `${(i / (SLICES - 1)) * 100}% 50%`,
                transitionDelay: `${i * SLICE_MS}ms`,
                // alternate exit direction by scene for the split/reform feel
                ["--exit-y"]:
                  sceneIndex % 2 === 0 ? "-102%" : "102%",
              }}
            />
          ))}
        </div>
      ))}
      <a
        className="attract__image-link"
        href={`/promo/${current.id}`}
        tabIndex={-1}
        aria-hidden="true"
      />
      <a
        className="attract__link"
        href={`/promo/${current.id}`}          // band — drop target="_blank" rel="noopener noreferrer"
        aria-label={`${current.title.es} (ver promoción / view promotion)`}
      >
        <span className="attract__badge">Promocionado / Sponsored</span>
        <span className="attract__name">{current.title.es}</span>
      </a>
      {rotating && (
        <div className="attract__controls">
          <button
            type="button"
            className="attract__arrow"
            onClick={() => step(-1)}
            aria-label={text.promoPrevious}
          >
            ←
          </button>
          <div className="attract__dots">
            {partners.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className="attract__dot"
                data-active={i === active}
                aria-current={i === active}
                aria-label={`${text.promoSlide} ${i + 1}`}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="attract__arrow"
            onClick={() => step(1)}
            aria-label={text.promoNext}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

export default function FeaturedPartners() {
  const language = useSiteLanguage();
  const text = uiText(language);
  const partners = premiumPromotions(events);
  if (partners.length === 0) return null;

  return (
    <section aria-label="Patrocinadores / Featured partners">
      <RotatingBand partners={partners} text={text} />
      <div className="partners-row">
        {partners.map((p) => (
            <a
            key={p.id}
            className="partner-card"
            href={`/promo/${p.id}`}               // card — drop target="_blank" rel="noopener noreferrer"
          >
            {p.promotion?.mediaType === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.promotion.cardUrl || p.promotion.mediaUrl} alt={p.title.es} loading="lazy" />
            )}
            <div className="partner-card__body">
              <span className="partner-card__badge">
                Promocionado / Sponsored
              </span>
              <h3>{p.title.es}</h3>
              {p.promotion?.tagline && <p>{p.promotion.tagline.es}</p>}
              <span className="partner-card__cta">
                Visitar sitio / Visit site ↗
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
