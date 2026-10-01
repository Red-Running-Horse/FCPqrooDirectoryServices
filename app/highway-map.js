"use client";

import { useEffect, useRef, useState } from "react";
import { categoryIconSvg } from "./category-icons.mjs";
import { DEFAULT_LANGUAGE, LANGUAGES, localize, uiText } from "./i18n.mjs";
import { syncMarkerSelection } from "./marker-selection.mjs";
import { loadPlaceDetail } from "./place-data.mjs";
import { CATEGORIES, filterPlaces, isVerified, listingReferences } from "./place-index.mjs";
import PlacePortal from "./place-portal";
import { placePopup } from "./place-portal.mjs";
import { labelsOverlap, mergeRoadSegments, placeRoadLabel, roadLabel } from "./road-label.mjs";
import {
  FCP_MAX_BOUNDS,
  FCP_VIEW_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  TOURIST_MAP_STYLE,
  labelTier,
  shouldShowLabels,
} from "./map-view.mjs";

function categoryLabel(id, language) {
  return localize(CATEGORIES.find((category) => category.id === id).label, language);
}

function markerTitle(attraction, language) {
  return `${localize(attraction.name, language)} — ${categoryLabel(attraction.category, language)}`;
}

function showPortal() {
  const portal = document.getElementById("place-portal");
  portal?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  portal?.focus({ preventScroll: true });
}

// Lightweight marker popup: name, category and status only; full details live in the portal.
function popupContent(attraction, language) {
  const view = placePopup(attraction, language);
  const root = document.createElement("div");
  root.className = "place-popup";
  root.lang = language;
  const name = document.createElement("p");
  name.className = "place-popup__name";
  name.textContent = view.name;
  const meta = document.createElement("p");
  meta.className = "place-popup__meta";
  meta.textContent = view.category ?? "";
  const badge = document.createElement("span");
  badge.className = `status-badge status-badge--${view.status}`;
  badge.textContent = view.statusLabel;
  meta.append(badge);
  const hint = document.createElement("p");
  hint.className = "place-popup__hint";
  hint.textContent = view.hint;
  const details = document.createElement("button");
  details.type = "button";
  details.className = "place-popup__details";
  details.textContent = view.detailsLabel;
  details.addEventListener("click", showPortal);
  root.append(name, meta, hint, details);
  return root;
}

export default function HighwayMap({ placesIndex }) {
  const container = useRef(null);
  const attractionLayer = useRef(null);
  const resetButton = useRef(null);
  const selectedCategory = useRef("all");
  const selectedSearch = useRef("");
  const selectedLanguage = useRef(DEFAULT_LANGUAGE);
  const selectedPlace = useRef(null);
  const pendingFocus = useRef(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [ctaMessage, setCtaMessage] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [error, setError] = useState(false);
  // places holds the lightweight index (marker fields only); detail holds the selected place
  // merged with its lazily fetched detail file.
  const places = placesIndex;
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(false);
  const text = uiText(language);
  const references = listingReferences(placesIndex);
  const noResults = search.trim() !== "" && filterPlaces(places, category, search).length === 0;
  const selectedPlaceView = detail ?? places.find(({ id }) => id === selectedId) ?? null;

  // Clears the selected place when it drops out of the active category + search results.
  function applyFilters(nextCategory, nextSearch) {
    selectedCategory.current = nextCategory;
    selectedSearch.current = nextSearch;
    setCategory(nextCategory);
    setSearch(nextSearch);
    if (!filterPlaces(places, nextCategory, nextSearch).some((place) => place.id === selectedPlace.current)) {
      setSelectedId(null);
    }
  }

  function focusMarker(current, id) {
    const marker = current.markers.get(id);
    if (!marker) return;
    current.group.addLayer(marker);
    current.map.setView(marker.getLatLng(), Math.max(current.map.getZoom(), 13));
    marker.openPopup();
    marker.getElement()?.focus({ preventScroll: true });
    container.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function focusListing(id) {
    if (!references.some((place) => place.id === id)) return;
    applyFilters("all", "");
    pendingFocus.current = id;
    setSelectedId(id);
    if (attractionLayer.current) {
      focusMarker(attractionLayer.current, id);
      pendingFocus.current = null;
    }
  }

  useEffect(() => {
    document.documentElement.lang = language;
    if (resetButton.current) resetButton.current.textContent = uiText(language).resetView;
    const current = attractionLayer.current;
    if (!current) return;
    for (const attraction of places) {
      const marker = current.markers.get(attraction.id);
      const title = markerTitle(attraction, language);
      marker.options.title = title;
      marker.getElement()?.setAttribute("title", title);
      marker.getElement()?.setAttribute("aria-label", title);
      if (marker.isPopupOpen()) marker.getPopup().update();
    }
  }, [language, places]);

  useEffect(() => {
    const current = attractionLayer.current;
    if (!current) return;
    current.group.clearLayers();
    for (const attraction of filterPlaces(places, category, search)) {
      current.group.addLayer(current.markers.get(attraction.id));
    }
  }, [category, search, places]);

  useEffect(() => {
    selectedPlace.current = selectedId;
    const current = attractionLayer.current;
    if (!current) return;
    syncMarkerSelection(current.markers, selectedId);
  }, [selectedId]);

  // Loads the selected place's detail file on demand. The portal shows the index summary while
  // the request is in flight; a stale or cleared selection aborts it and drops its response.
  useEffect(() => {
    setDetail(null);
    setDetailError(false);
    if (!selectedId) return;

    const entry = places.find(({ id }) => id === selectedId);
    if (!entry) return;

    let stale = false;
    const controller = new AbortController();
    loadPlaceDetail(selectedId, controller.signal)
      .then((loaded) => {
        if (!stale) setDetail({ ...entry, ...loaded });
      })
      .catch((cause) => {
        if (!stale && cause.name !== "AbortError") setDetailError(true);
      });

    return () => {
      stale = true;
      controller.abort();
    };
  }, [selectedId, places]);

  useEffect(() => {
    let map;
    let disposed = false;
    const controller = new AbortController();

    async function initialize() {
      const L = (await import("leaflet")).default;
      if (disposed) return;

      map = L.map(container.current, {
        preferCanvas: true,
        attributionControl: false,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        maxBounds: FCP_MAX_BOUNDS,
        maxBoundsViscosity: 0.8,
      });
      map.fitBounds(FCP_VIEW_BOUNDS);

      const reset = L.control({ position: "topleft" });
      reset.onAdd = () => {
        const wrapper = L.DomUtil.create("div", "leaflet-bar reset-view");
        const button = L.DomUtil.create("button", "", wrapper);
        button.type = "button";
        button.textContent = uiText(selectedLanguage.current).resetView;
        resetButton.current = button;
        L.DomEvent.disableClickPropagation(wrapper);
        L.DomEvent.on(button, "click", () => map.fitBounds(FCP_VIEW_BOUNDS));
        return wrapper;
      };
      reset.addTo(map);

      const group = L.layerGroup().addTo(map);
      const markers = new Map();
      for (const attraction of placesIndex) {
        const approximate = isVerified(attraction) ? "" : " attraction-marker--approximate";
        const icon = L.divIcon({
          className: `attraction-marker attraction-marker--${attraction.category}${approximate}`,
          html: categoryIconSvg(attraction.category, { size: 18, className: "attraction-marker__icon" }),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });
        const title = markerTitle(attraction, selectedLanguage.current);
        const marker = L.marker([attraction.latitude, attraction.longitude], {
          icon,
          title,
          keyboard: true,
        });
        marker.bindPopup(() => popupContent(attraction, selectedLanguage.current), {
          className: "place-popup-container",
          maxWidth: 240,
          autoPanPadding: [16, 16],
        });
        marker.on("add", () => {
          const element = marker.getElement();
          const selected = selectedPlace.current === attraction.id;
          element?.setAttribute("aria-label", marker.options.title);
          element?.setAttribute("aria-pressed", String(selected));
          element?.classList.toggle("attraction-marker--selected", selected);
        });
        // Leaflet toggles a bound popup on repeat clicks; selecting always shows the summary.
        const select = () => {
          setSelectedId(attraction.id);
          if (!marker.isPopupOpen()) marker.openPopup();
        };
        marker.on("click", select);
        marker.on("keypress", (event) => {
          if (event.originalEvent.key === "Enter") select();
        });
        markers.set(attraction.id, marker);
      }
      attractionLayer.current = { group, markers, map };
      for (const attraction of filterPlaces(placesIndex, selectedCategory.current, selectedSearch.current)) {
        group.addLayer(markers.get(attraction.id));
      }
      if (pendingFocus.current) {
        focusMarker(attractionLayer.current, pendingFocus.current);
        pendingFocus.current = null;
      }
      syncMarkerSelection(markers, selectedPlace.current);

      const response = await fetch("/regional-highways.geojson", {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Road data request failed: ${response.status}`);

      const data = await response.json();
      if (disposed) return;

      L.geoJSON(data, {
        style: {
          color: TOURIST_MAP_STYLE.highwayCasing,
          weight: 7,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        },
      }).addTo(map);

      const segments = [];
      L.geoJSON(data, {
        style: {
          color: TOURIST_MAP_STYLE.highway,
          weight: 3,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        },
        onEachFeature(feature) {
          const name = roadLabel(feature.properties?.NOMBRE);
          if (name && feature.geometry?.type === "LineString") {
            segments.push({
              name,
              group: labelTier(feature.properties?.TIPO_VIAL),
              coordinates: feature.geometry.coordinates,
            });
          }
        },
      }).addTo(map);

      const measure = document.createElement("canvas").getContext("2d");
      measure.font = "600 12px Arial";
      const labels = mergeRoadSegments(segments).map(({ name, group, coordinates }) => {
        const label = document.createElement("span");
        label.textContent = name;
        const tooltip = L.tooltip({
          direction: "center",
          className: "road-label",
          interactive: false,
          permanent: true,
        })
          .setContent(label);
        const bounds = L.latLngBounds(coordinates.map(([lng, lat]) => [lat, lng]));
        return { name, tier: group, coordinates, bounds, tooltip, label, width: measure.measureText(name).width };
      });

      const active = new Set();

      function updateLabels() {
        const visible = new Set();
        const zoom = map.getZoom();
        if (shouldShowLabels(zoom)) {
          const bounds = map.getBounds();
          const size = map.getSize();
          const names = new Set();
          const placed = [];
          for (const entry of labels) {
            const { name, tier, coordinates, label, tooltip, width } = entry;
            if (!shouldShowLabels(zoom, tier) || names.has(name) || !bounds.intersects(entry.bounds)) continue;
            const placement = placeRoadLabel(
              coordinates,
              ([lng, lat]) => map.latLngToContainerPoint([lat, lng]),
              width,
              size,
            );
            if (!placement || placed.some((other) => labelsOverlap(placement, other))) continue;
            placed.push(placement);
            names.add(name);
            label.style.transform = `rotate(${placement.angle}deg)`;
            tooltip.setLatLng(map.containerPointToLatLng(placement.point));
            visible.add(entry);
          }
        }

        for (const entry of active) {
          if (!visible.has(entry)) entry.tooltip.close();
        }
        for (const entry of visible) {
          if (!active.has(entry)) entry.tooltip.openOn(map);
        }
        active.clear();
        for (const entry of visible) active.add(entry);
      }

      map.on("moveend", updateLabels);
      updateLabels();
    }

    initialize().catch((cause) => {
      if (!disposed && cause.name !== "AbortError") {
        setError(true);
      }
    });

    return () => {
      disposed = true;
      controller.abort();
      attractionLayer.current = null;
      resetButton.current = null;
      map?.remove();
    };
  }, []);

  return (
    <>
      <section className="hero" aria-label={text.heading}>
        <div className="hero__bar" aria-hidden="true" />
        <div className="map-header">
          <div className="hero__title-block">
            <p className="hero__eyebrow">{text.heroEyebrow}</p>
            <h1>{text.heading}</h1>
            <p className="hero__subheading">{text.heroSubheading}</p>
          </div>
          <div className="language-toggle" role="group" aria-label={`${text.languageLabel} / Language`}>
            {LANGUAGES.map(({ id, label, name }) => (
              <button
                key={id}
                type="button"
                lang={id}
                aria-label={name}
                aria-pressed={language === id}
                onClick={() => {
                  selectedLanguage.current = id;
                  setLanguage(id);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="map-search" role="search">
        <label className="map-search__label" htmlFor="map-search-input">
          {text.searchLabel}
        </label>
        <input
          id="map-search-input"
          className="map-search__input"
          type="search"
          value={search}
          placeholder={text.searchPlaceholder}
          autoComplete="off"
          aria-describedby="map-search-empty"
          onChange={(event) => applyFilters(category, event.target.value)}
        />
        <p id="map-search-empty" className="map-search__empty" role="status">
          {noResults ? text.searchEmpty : ""}
        </p>
      </div>
      <nav className="category-filters" aria-label={text.filtersLabel}>
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={category === id}
            onClick={() => applyFilters(id, search)}
          >
            <span
              className="category-filters__icon"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: categoryIconSvg(id, { size: 16, className: "category-icon" }) }}
            />
            {localize(label, language)}
          </button>
        ))}
      </nav>
      <ul className="legend" aria-label={text.legendCategories}>
        <li>
          <span className="swatch" aria-hidden="true" />
          {text.legendRoad}
        </li>
        {CATEGORIES.filter(({ id }) => id !== "all").map(({ id, label }) => (
          <li key={id}>
            <span
              className={`legend__icon legend__icon--${id}`}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: categoryIconSvg(id, { size: 16, className: "category-icon" }) }}
            />
            {localize(label, language)}
          </li>
        ))}
      </ul>
      {error && <p role="alert">{text.loadError}</p>}
      <div className="map-container map-workspace">
        <div className="map-workspace__map">
          <div ref={container} className="map" aria-label={text.mapLabel} />
        </div>
        <section className="listing-references" aria-labelledby="listing-references-heading">
          <h2 id="listing-references-heading">{text.listingsHeading}</h2>
          <p>{text.listingsContext}</p>
          <ul>
            {references.map((place) => {
              const name = localize(place.name, language);
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    aria-label={`${text.listingsAction.replace("{name}", name)} — ${categoryLabel(place.category, language)}`}
                    onClick={() => focusListing(place.id)}
                  >
                    <span className="listing-references__name">{name}</span>
                    <span className="listing-references__category">{categoryLabel(place.category, language)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <div className="map-workspace__portal">
          <PlacePortal
            attraction={selectedPlaceView}
            language={language}
            onClear={() => setSelectedId(null)}
          />
          {detailError && (
            <p className="place-portal__note" role="alert">
              {text.detailsError}
            </p>
          )}
        </div>
      </div>
      <section className="business-cta" aria-labelledby="radio-heading">
        <h2 id="radio-heading">{text.radioHeading}</h2>
        <p>{text.radioDescription}</p>
        <div className="business-cta__actions">
          <a href="https://radios.inpi.gob.mx:8080/xepet" target="_blank" rel="noopener noreferrer">
            {text.radioListen}
          </a>
        </div>
        <p className="business-cta__helper">{text.radioUnavailable}</p>
      </section>
      <section className="business-cta" aria-labelledby="business-cta-heading">
        <h2 id="business-cta-heading">{text.ctaHeading}</h2>
        <p>{text.ctaDescription}</p>
        <div className="business-cta__actions">
          <button
            type="button"
            aria-expanded={ctaMessage === "learn"}
            aria-controls="business-cta-message"
            onClick={() => setCtaMessage(ctaMessage === "learn" ? null : "learn")}
          >
            {text.ctaLearn}
          </button>
          <button
            type="button"
            aria-disabled="true"
            aria-describedby="business-cta-under-construction"
          >
            {text.ctaRequest}
          </button>
        </div>
        <p id="business-cta-under-construction" className="business-cta__helper">
          {text.businessCtaUnderConstruction}
        </p>
        <p id="business-cta-message" className="business-cta__message" role="status">
          {ctaMessage === "learn" && text.ctaLearnMessage}
        </p>
      </section>
    </>
  );
}
