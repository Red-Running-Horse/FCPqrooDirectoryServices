// Shared gated-bilingual renderer. Static-export pages can't know the
// visitor's language at prerender time, so a bilingual value ships as both
// variants and CSS (the .l10n-es / .l10n-en gate classes in style.css) shows
// only the active one, keyed on <html lang>. When both variants are
// identical (proper nouns, shared names) the value renders once, ungated.
// No hooks — safe in server and client components alike.

export default function L10n({ pair }) {
  const es = pair?.es;
  const en = pair?.en;
  if (en && en !== es) {
    return (
      <>
        <span className="l10n-es">{es}</span>
        <span className="l10n-en">{en}</span>
      </>
    );
  }
  return <>{es}</>;
}
