// app/greca.js — reusable stepped-fret (greca escalonada) band.
// Render <GrecaBand /> above any panel to give it the carved-stone edge.
export default function GrecaBand() {
  return (
    <svg
      className="greca"
      viewBox="0 0 600 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id="greca-pattern" width="48" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 12 V9 H6 V6 H12 V3 H18" fill="none" stroke="#9e3b25" strokeWidth="2.2" />
          <path d="M24 12 V9 H30 V6 H36 V3 H42" fill="none" stroke="#c08a2d" strokeWidth="2.2" />
        </pattern>
      </defs>
      <rect width="600" height="12" fill="url(#greca-pattern)" />
    </svg>
  );
}
