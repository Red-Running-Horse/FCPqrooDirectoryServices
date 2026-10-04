"use client";

import { GUIDE_DATA } from "./guide-data.mjs";
import { uiText } from "./i18n.mjs";
import {
  getGuideMetadata,
  getGuideSections,
  guidePdfUrl,
  hasPdfAsset,
  localizeGuide,
} from "./tourist-guide.mjs";

export default function TouristGuide({ language = "es", embedded = false }) {
  const text = uiText(language);
  const metadata = getGuideMetadata(GUIDE_DATA);
  const sections = getGuideSections(GUIDE_DATA);
  const pdfAvailable = hasPdfAsset(metadata);
  const pdfUrl = guidePdfUrl(metadata);

  return (
    <section
      id="tourist-guide"
      className="tourist-guide"
      aria-labelledby="tourist-guide-heading"
      lang={language}
    >
      <div className="tourist-guide__header">
        <p className="tourist-guide__eyebrow">{text.guideEyebrow}</p>
        <h2 id="tourist-guide-heading">{text.guideHeading}</h2>
        <p className="tourist-guide__intro">{text.guideIntro}</p>
      </div>

      <div className="tourist-guide__meta" aria-label="Metadata de la guía">
        <div className="tourist-guide__meta-item">
          <span className="tourist-guide__meta-label">{text.guideSourceAttribution}</span>{" "}
          <span className="tourist-guide__meta-value">
            {metadata.sourceAuthor} — <em>{metadata.sourceTitle}</em>
          </span>
        </div>
        <div className="tourist-guide__meta-item">
          <span className="tourist-guide__meta-label">{text.guideLastReviewed}</span>{" "}
          <time className="tourist-guide__meta-value" dateTime={metadata.lastReviewed}>
            {localizeGuide(metadata.lastReviewedDisplay, language)}
          </time>
        </div>
      </div>

      <div
        className="tourist-guide__disclaimer"
        role="note"
        aria-labelledby="tourist-guide-disclaimer-title"
      >
        <h3 id="tourist-guide-disclaimer-title" className="tourist-guide__disclaimer-title">
          {text.guideDisclaimerHeading}
        </h3>
        <p className="tourist-guide__disclaimer-text">
          {localizeGuide(metadata.officialDisclaimer, language)}
        </p>
      </div>

      <div className="tourist-guide__actions" role="region" aria-label="Recursos de la guía">
        <a
          href={metadata.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tourist-guide__action-btn tourist-guide__action-btn--notion"
        >
          <span className="tourist-guide__btn-icon" aria-hidden="true">↗</span>
          <span>{text.guideNotionAction}</span>
        </a>

        {pdfAvailable ? (
          <a
            href={pdfUrl}
            download
            className="tourist-guide__action-btn tourist-guide__action-btn--pdf"
          >
            <span className="tourist-guide__btn-icon" aria-hidden="true">↓</span>
            <span>{text.guidePdfDownload}</span>
          </a>
        ) : (
          <div
            className="tourist-guide__pdf-pending"
            role="status"
            aria-label={text.guidePdfDownload}
          >
            <span className="tourist-guide__btn-icon" aria-hidden="true">ℹ</span>
            <div className="tourist-guide__pdf-pending-content">
              <span className="tourist-guide__pdf-pending-title">{text.guidePdfDownload}</span>
              <p className="tourist-guide__pdf-pending-note">{text.guidePdfPlaceholder}</p>
            </div>
          </div>
        )}
      </div>

      <nav className="tourist-guide__nav" aria-label={text.guideSectionJump}>
        <p className="tourist-guide__nav-label">{text.guideSectionJump}:</p>
        <ul className="tourist-guide__nav-chips">
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#guide-section-${section.id}`} className="tourist-guide__nav-chip">
                {localizeGuide(section.title, language)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="tourist-guide__sections">
        {sections.map((section) => {
          const sectionTitle = localizeGuide(section.title, language);
          const sectionSummary = localizeGuide(section.summary, language);

          return (
            <article
              key={section.id}
              id={`guide-section-${section.id}`}
              className="tourist-guide__section-card"
              aria-labelledby={`heading-section-${section.id}`}
            >
              <div className="tourist-guide__section-header">
                <h3 id={`heading-section-${section.id}`} className="tourist-guide__section-title">
                  {sectionTitle}
                </h3>
                <p className="tourist-guide__section-summary">{sectionSummary}</p>
              </div>

              <div className="tourist-guide__items-grid">
                {section.items.map((item, index) => {
                  const itemTitle = localizeGuide(item.title, language);
                  const itemBody = localizeGuide(item.body, language);

                  return (
                    <div key={index} className="tourist-guide__item">
                      <h4 className="tourist-guide__item-title">{itemTitle}</h4>
                      <p className="tourist-guide__item-body">{itemBody}</p>
                      {item.officialLink && (
                        <p className="tourist-guide__item-link-wrap">
                          <span className="tourist-guide__official-label">
                            {text.guideOfficialSourceLabel}:
                          </span>{" "}
                          <a
                            href={item.officialLink.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tourist-guide__external-link"
                          >
                            <span>{localizeGuide(item.officialLink.label, language)}</span>
                            <span className="tourist-guide__external-badge" aria-hidden="true">
                              {" "}↗
                            </span>
                            <span className="visually-hidden"> ({text.guideExternalNotice})</span>
                          </a>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <div className="tourist-guide__footer">
        <a href={embedded ? "#map-top" : "/#map-top"} className="tourist-guide__back-button">
          ↑ {text.guideBackToMap}
        </a>
      </div>
    </section>
  );
}
