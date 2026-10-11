"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LANGUAGE } from "./i18n.mjs";

// Shared ES/EN follower. The map hero owns the language state and publishes it
// on <html lang>; any component that renders bilingual copy follows that
// attribute (via MutationObserver) so the whole page switches together — same
// uiText pattern, no second toggle.

export function useSiteLanguage() {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  useEffect(() => {
    const read = () => setLanguage(document.documentElement.lang === "en" ? "en" : DEFAULT_LANGUAGE);
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);
  return language;
}
