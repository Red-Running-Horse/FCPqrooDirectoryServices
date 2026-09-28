"use client";

import { useEffect, useRef, useState } from "react";
import { roadLabel } from "./road-label.mjs";

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

      map = L.map(container.current, { preferCanvas: true }).setView(
        [19.6, -88.05],
        10
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const response = await fetch("/regional-highways.geojson", {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("No se pudo cargar el archivo de carreteras.");

      const data = await response.json();
      if (disposed) return;

      const labels = [];
      const active = new Set();
      const roads = L.geoJSON(data, {
        style: { color: "#17649a", weight: 2.5, opacity: 0.8 },
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

      map.fitBounds(roads.getBounds(), { padding: [20, 20] });

      function updateLabels() {
        const visible = new Set();
        if (map.getZoom() >= 12) {
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
      <div ref={container} className="map" aria-label="Mapa de carreteras regionales" />
    </>
  );
}
