"use client";

import { useEffect, useRef, useState } from "react";
import events from "./events.mjs";

// FeaturedPartners — the paid tier, max 3 (enforced at build in events.mjs).
//   ATTRACT BAND: one composed image splits into vertical slices that cascade
//   out, and the next partner's image reassembles slice-by-slice. Pure CSS
//   transform transitions on <img>-lightweight JPGs (no GIFs). Pauses on
//   hover/focus; respects prefers-reduced-motion (static first frame).
//   CARDS ROW: all three partners always visible below the band — rotation
//   never hides a paying client.
const SLICES = 5;
const SLICE_MS = 70; // stagger between slices
const HOLD_MS = 5200; // time each partner holds the frame

function AttractBand({ partners }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  useEffect(() => {
    if (paused || reduceMotion.current) return;
    timer.current = setInterval(
      () => setActive((a) => (a + 1) % partners.length),
      HOLD_MS
    );
    return () => clearInterval(timer.current);
  }, [paused, partners.length]);

  const current = partners[active];
  const imagePartners = partners.filter((p) => p.promotion?.mediaType === "image");
  const shown = imagePartners.length >= 2 ? imagePartners : partners;

  return (
    <div
      className="attract"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {shown.map((p, sceneIndex) => (
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
        className="attract__link"
        href={current.promotion?.siteUrl || current.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${current.title.es} (sitio del patrocinador / sponsor site)`}
      >
        <span className="attract__badge">Promocionado / Sponsored</span>
        <span className="attract__name">{current.title.es}</span>
      </a>
    </div>
  );
}

export default function FeaturedPartners() {
  const partners = events.filter((e) => e.promoted);
  if (partners.length === 0) return null;

  return (
    <section aria-label="Patrocinadores / Featured partners">
      {partners.length >= 2 && <AttractBand partners={partners} />}
      <div className="partners-row">
        {partners.map((p) => (
          <a
            key={p.id}
            className="partner-card"
            href={p.promotion?.siteUrl || p.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
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
