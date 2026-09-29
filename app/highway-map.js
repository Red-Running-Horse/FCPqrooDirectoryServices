"use client";

import { useEffect, useRef, useState } from "react";
import { roadLabel } from "./road-label.mjs";
import {
  FCP_MAX_BOUNDS,
  FCP_VIEW_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  TOURIST_MAP_STYLE,
  shouldShowLabels,
} from "./map-view.mjs";

export default function HighwayMap() {
  const container = useRef(null);
  const [error, setError] = useState("");

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
        button.textContent = "Volver a Felipe Carrillo Puerto";
        L.DomEvent.disableClickPropagation(wrapper);
        L.DomEvent.on(button, "click", () => map.fitBounds(FCP_VIEW_BOUNDS));
        return wrapper;
      };
      reset.addTo(map);

      const response = await fetch("/regional-highways.geojson", {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("No se pudo cargar el archivo de carreteras.");

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
        setError("No se pudo cargar el mapa de carreteras.");
      }
    });

    return () => {
      disposed = true;
      controller.abort();
      map?.remove();
    };
  }, []);

  return (
    <>
      {error && <p role="alert">{error}</p>}
      <div ref={container} className="map" aria-label="Mapa turístico de Felipe Carrillo Puerto" />
    </>
  );
}
