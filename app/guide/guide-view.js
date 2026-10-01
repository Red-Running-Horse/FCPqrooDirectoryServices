"use client";

import Link from "next/link";
import { useState } from "react";
import { DEFAULT_LANGUAGE, LANGUAGES, uiText } from "../i18n.mjs";
import TouristGuide from "../tourist-guide";

export default function GuideView() {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const text = uiText(language);

  return (
    <div className="guide-page-container">
      <header className="guide-page-header">
        <Link href="/" className="guide-page-header__back">
          ← {text.guideBackToMap}
        </Link>
        <div
          className="language-toggle"
          role="group"
          aria-label={`${text.languageLabel} / Language`}
        >
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
      </header>

      <TouristGuide language={language} />
    </div>
  );
}
