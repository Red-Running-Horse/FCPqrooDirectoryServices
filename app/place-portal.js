import { placePortal } from "./place-portal.mjs";

export default function PlacePortal({ attraction, language, onClear }) {
  const view = placePortal(attraction, language);

  return (
    <section className="place-portal" aria-labelledby="place-portal-heading" aria-live="polite" lang={language}>
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
            </div>
            <button type="button" className="place-portal__clear" onClick={onClear}>
              {view.clearLabel}
            </button>
          </div>
          <p className="place-portal__meta">
            <span className="visually-hidden">{view.categoryLabel}: </span>
            {view.category}
            <span className={`status-badge status-badge--${view.status}`}>{view.statusLabel}</span>
          </p>
          {view.description && <p>{view.description}</p>}
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
          {view.actions.length > 0 && (
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
          )}
          {view.directionsNote && <p className="place-portal__note">{view.directionsNote}</p>}
          <p className="place-portal__verification">
            {view.verificationNote && (
              <>
                <strong>{view.verificationLabel}:</strong> {view.verificationNote}
                <br />
              </>
            )}
            {view.lastUpdated && (
              <>
                <strong>{view.lastUpdatedLabel}:</strong> <time dateTime={view.lastUpdated}>{view.lastUpdated}</time>
              </>
            )}
          </p>
        </article>
      )}
    </section>
  );
}
