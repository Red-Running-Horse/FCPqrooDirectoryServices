// Mirrors the selected place onto the Leaflet markers: highlight, aria-pressed and quick popup.
export function syncMarkerSelection(markers, selectedId) {
  for (const [id, marker] of markers) {
    const selected = id === selectedId;
    const element = marker.getElement();
    element?.classList.toggle("attraction-marker--selected", selected);
    element?.setAttribute("aria-pressed", String(selected));
    if (selected && !marker.isPopupOpen()) marker.openPopup();
    if (!selected && marker.isPopupOpen()) marker.closePopup();
  }
}
