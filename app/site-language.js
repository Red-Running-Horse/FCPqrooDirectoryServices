"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { DEFAULT_LANGUAGE, LANGUAGES, uiText } from "./i18n.mjs";

// Shared ES/EN state, lifted to the layout level. The provider owns the single
// language state and publishes it on <html lang>; any component that renders
// bilingual copy follows that attribute (via useSiteLanguage's MutationObserver)
// so the whole site switches together — same uiText pattern, one toggle in the
// site nav, no per-component state.
//
// Persistence (static export = hard navigation): the choice survives full
// page reloads via localStorage. The inline script in layout.js restores
// <html lang> from the same key BEFORE first paint (no flash of the wrong
// language); the provider adopts that stored value in a layout effect (pre-
// paint) so its state can never clobber the restored choice on hydration.
export const LANGUAGE_STORAGE_KEY = "fcp:language";

function readStoredLanguage() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

const SiteLanguageContext = createContext(null);

export function SiteLanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  useLayoutEffect(() => {
    const stored = readStoredLanguage();
    document.documentElement.lang = stored;
    if (stored !== language) setLanguageState(stored);
    // Mount only: adopt the persisted choice once. State changes flow
    // through setLanguage below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setLanguage = (id) => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, id);
    } catch {
      // storage unavailable (private mode, etc.) — the toggle still works for the session
    }
    setLanguageState(id);
  };
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return (
    <SiteLanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </SiteLanguageContext.Provider>
  );
}

export function useSiteLanguageState() {
  const context = useContext(SiteLanguageContext);
  if (!context) throw new Error("useSiteLanguageState outside SiteLanguageProvider");
  return context;
}

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

// The one ES/EN toggle, rendered in the site nav (every page, all form
// factors). Pressed state drives the provider; followers see the <html lang>
// attribute change.
export function LanguageToggle() {
  const { language, setLanguage } = useSiteLanguageState();
  const text = uiText(language);
  return (
    <div className="language-toggle" role="group" aria-label={`${text.languageLabel} / Language`}>
      {LANGUAGES.map(({ id, label, name }) => (
        <button
          key={id}
          type="button"
          lang={id}
          aria-label={name}
          aria-pressed={language === id}
          onClick={() => setLanguage(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
