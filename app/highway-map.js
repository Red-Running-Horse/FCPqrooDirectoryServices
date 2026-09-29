"use client";

import { useEffect, useRef, useState } from "react";
import {
  attractions,
  CATEGORIES,
  directionsUrlFor,
  filterAttractions,
  isVerified,
} from "./attractions.mjs";
import { DEFAULT_LANGUAGE, LANGUAGES, localize, uiText } from "./i18n.mjs";
import { roadLabel } from "./road-label.mjs";
import {
  FCP_MAX_BOUNDS,
  FCP_VIEW_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  TOURIST_MAP_STYLE,
  shouldShowLabels,
} from "./map-view.mjs";

function categoryLabel(id, language) {
  return localize(CATEGORIES.find((category) => category.id === id).label, language);
}

function markerTitle(attraction, language) {
  return `${localize(attraction.name, language)} — ${categoryLabel(attraction.category, language)}`;
}

function attractionPopup(attraction, language) {
  const text = uiText(language);
  const popup = document.createElement("div");
  popup.className = "attraction-popup";
  popup.lang = language;
  const heading = document.createElement("strong");
  heading.textContent = localize(attraction.name, language);
  const details = document.createElement("p");
  details.textContent = `${categoryLabel(attraction.category, language)} · ${
    isVerified(attraction) ? text.statusVerified : text.statusUnverified
  }`;
  const description = document.createElement("p");
  description.textContent = localize(attraction.description, language);
  popup.append(heading, details, description);
  const url = directionsUrlFor(attraction);
  if (url) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = text.directions;
    popup.append(link);
  } else {
    const unavailable = document.createElement("p");
    unavailable.className = "attraction-popup__note";
    unavailable.textContent = text.directionsUnavailable;
    popup.append(unavailable);
  }
  return popup;
}

export default function HighwayMap() {
  const container = useRef(null);
  const attractionLayer = useRef(null);
  const resetButton = useRef(null);
  const selectedCategory = useRef("all");
  const selectedLanguage = useRef(DEFAULT_LANGUAGE);
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [error, setError] = useState(false);
  const text = uiText(language);

  useEffect(() => {
    document.documentElement.lang = language;
    if (resetButton.current) resetButton.current.textContent = uiText(language).resetView;
    const current = attractionLayer.current;
    if (!current) return;
    for (const attraction of attractions) {
      const marker = current.markers.get(attraction.id);
      const title = markerTitle(attraction, language);
      marker.options.title = title;
      marker.getElement()?.setAttribute("title", title);
      marker.getElement()?.setAttribute("aria-label", title);
      marker.setPopupContent(attractionPopup(attraction, language));
    }
  }, [language]);

  useEffect(() => {
    const current = attractionLayer.current;
    if (!current) return;
    current.group.clearLayers();
    for (const attraction of filterAttractions(category)) {
      current.group.addLayer(current.markers.get(attraction.id));
    }
  }, [category]);

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
      for (const attraction of attractions) {
        const approximate = isVerified(attraction) ? "" : " attraction-marker--approximate";
        const icon = L.divIcon({
          className: `attraction-marker attraction-marker--${attraction.category}${approximate}`,
          html: '<span aria-hidden="true"></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const title = markerTitle(attraction, selectedLanguage.current);
        const marker = L.marker([attraction.latitude, attraction.longitude], {
          icon,
          title,
          keyboard: true,
        });
        marker.on("add", () => marker.getElement()?.setAttribute("aria-label", marker.options.title));
        marker.bindPopup(attractionPopup(attraction, selectedLanguage.current));
        markers.set(attraction.id, marker);
      }
      attractionLayer.current = { group, markers };
      for (const attraction of filterAttractions(selectedCategory.current)) {
        group.addLayer(markers.get(attraction.id));
      }

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

      const labels = [];
      L.geoJSON(data, {
        style: {
          color: TOURIST_MAP_STYLE.highway,
          weight: 3,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        },
        onEachFeature(feature, layer) {
          const name = roadLabel(feature.properties?.NOMBRE);
          if (name) {
            const label = document.createElement("span");
            label.textContent = name;
            layer.bindTooltip(label, { direction: "center", className: "road-label" });
            labels.push({ name, layer });
          }
        },
      }).addTo(map);

      const active = new Set();

      function updateLabels() {
        const visible = new Set();
        if (shouldShowLabels(map.getZoom())) {
          const bounds = map.getBounds();
          const names = new Set();
          for (const { name, layer } of labels) {
            if (names.has(name) || !bounds.contains(layer.getCenter())) continue;
            names.add(name);
            visible.add(layer);
          }
        }

        for (const layer of active) {
          if (!visible.has(layer)) layer.closeTooltip();
        }
        for (const layer of visible) {
          if (!active.has(layer)) layer.openTooltip();
        }
        active.clear();
        for (const layer of visible) active.add(layer);
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
      <div className="map-header">
        <h1>{text.heading}</h1>
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
      <p>{text.instructions}</p>
      <ul className="legend">
        <li>
          <span className="swatch" aria-hidden="true" />
          {text.legendRoad}
        </li>
        <li>
          <span className="swatch swatch--approximate" aria-hidden="true" />
          {text.legendApproximate}
        </li>
      </ul>
      <nav className="category-filters" aria-label={text.filtersLabel}>
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={category === id}
            onClick={() => {
              selectedCategory.current = id;
              setCategory(id);
            }}
          >
            {localize(label, language)}
          </button>
        ))}
      </nav>
      {error && <p role="alert">{text.loadError}</p>}
      <div ref={container} className="map" aria-label={text.mapLabel} />
    </>
  );
}
