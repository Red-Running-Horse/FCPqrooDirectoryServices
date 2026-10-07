import { categoryIconSvg } from "./category-icons.mjs";
import { placeCategoryStyle } from "./category-colors.mjs";
import { placePortal } from "./place-portal.mjs";

export default function PlacePortal({
  attraction,
  language,
  onClear,
  isSaved = false,
  onToggleSave = null,
  detailUnavailable = false,
}) {
  const view = placePortal(attraction, language);

  return (
    <section
      id="place-portal"
      className="place-portal"
      tabIndex={-1}
      aria-labelledby="place-portal-heading"
      aria-live="polite"
      lang={language}
    >
      <h2 id="place-portal-heading" className="place-portal__heading">
        {view.heading}
      </h2>
      {!view.selected ? (
        <p className="place-portal__prompt">{view.prompt}</p>
      ) : (
        <article className="place-portal__place">
          <div className="place-portal__title">
            <div>
              <h3>{view.name}</h3>
              {view.otherName && (
                <p className="place-portal__alt-name" lang={view.otherLanguage}>
                  {view.otherName}
                </p>
              )}
              {attraction.promotion?.cardUrl && (
                <a className="place-portal__promo" href={`/promo/${attraction.promotion.eventId}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attraction.promotion.cardUrl} alt="" loading="lazy" />
                  <span>Promoción / Promotion ↗</span>
                </a>
              )}
            </div>
            <button type="button" className="place-portal__clear" onClick={onClear}>
              {view.clearLabel}
            </button>
          </div>
          <p className="place-portal__meta">
            <span className="visually-hidden">{view.categoryLabel}: </span>
            {view.category && (
              <span className="category-chip" style={placeCategoryStyle(attraction)}>
                <span
                  className="category-chip__icon"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{
                    __html: categoryIconSvg(attraction?.category, { size: 14 }),
                  }}
                />
                <span className="category-chip__label">{view.category}</span>
              </span>
            )}
            <span className={`status-badge status-badge--${view.status}`}>{view.statusLabel}</span>
          </p>
          {onToggleSave && (
            <div className="place-portal__offline-bar">
              {isSaved ? (
                <div className="place-portal__offline-saved">
                  <span className="place-portal__offline-badge" role="status">
                    ✓ {view.savedOfflineBadge}
                  </span>
                  <button
                    type="button"
                    className="place-portal__offline-btn place-portal__offline-btn--remove"
                    onClick={() => onToggleSave(attraction.id)}
                    aria-label={`${view.removeOfflineLabel}: ${view.name}`}
                  >
                    {view.removeOfflineLabel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="place-portal__offline-btn"
                  onClick={() => onToggleSave(attraction.id)}
                  aria-label={`${view.saveOfflineLabel}: ${view.name}`}
                >
                  {view.saveOfflineLabel}
                </button>
              )}
            </div>
          )}
          {detailUnavailable && (
            <p className="place-portal__note place-portal__note--offline" role="alert">
              {view.offlineDetailUnavailable}
            </p>
          )}
          {view.description && <p>{view.description}</p>}
          {view.actions.length > 0 && (
            <>
              <div className="place-portal__actions">
                {view.actions.map(({ id, label, href, external }) => (
                  <a
                    key={id}
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {label}
                  </a>
                ))}
              </div>
              <p className="place-portal__network-note">{view.networkRequiredNote}</p>
            </>
          )}
          {view.directionsNote && <p className="place-portal__note">{view.directionsNote}</p>}
          {view.details.length > 0 && (
            <dl className="place-portal__details">
              {view.details.map(({ id, label, value }) => (
                <div key={id}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {view.verificationNote && (
            <p className="place-portal__verification">
              <strong>{view.verificationLabel}:</strong> {view.verificationNote}
            </p>
          )}
          {view.lastUpdated && (
            <p className="place-portal__updated">
              <strong>{view.lastUpdatedLabel}:</strong> <time dateTime={view.lastUpdated}>{view.lastUpdated}</time>
            </p>
          )}
        </article>
      )}
    </section>
  );
}
