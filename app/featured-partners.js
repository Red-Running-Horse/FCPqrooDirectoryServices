"use client";

import { useEffect, useRef, useState } from "react";
import events from "./events.mjs";
import { uiText } from "./i18n.mjs";
import { premiumPromotions } from "./event-utils.mjs";
import { useSiteLanguage } from "./site-language";

// FeaturedPartners — the PREMIUM promotion surface (enforced in events.mjs:
// promoted plus a promotion media block, capped at MAX_PROMOTED total). It is
// the only paid surface: when zero premium promotions exist, nothing renders.
//   ROTATING AD SPACE: the band cycles every premium promotion with a
//   whole-scene crossfade: auto-advance every HOLD_MS, dot indicators and
//   prev/next arrows in the bar below the image, pause on hover/focus, ←/→
//   arrow keys while focus is inside the band. Auto-rotation is DISABLED under
//   prefers-reduced-motion — the arrows and dots still work (the crossfade
//   falls back to an instant swap via CSS). Exactly ONE premium promo renders
//   a static frame with no rotation UI.
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
          style={{
            // Per-breakpoint scene sources consumed by the CSS at each
            // breakpoint — swapping image files in public/promo/ (and these
            // two URLs) is all an asset refresh needs.
            ["--scene-desktop"]: `url(${p.promotion?.mediaUrl})`,
            ["--scene-mobile"]: `url(${p.promotion?.mobileMediaUrl ?? p.promotion?.mediaUrl})`,
          }}
        />
      ))}
      <a
        className="attract__image-link"
        href={`/promo/${current.id}`}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className="attract__bar">
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
    </section>
  );
}
