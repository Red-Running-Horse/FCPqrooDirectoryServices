"use client";

import { usePathname } from "next/navigation";
import GrecaBand from "./greca";
import { LanguageToggle } from "./site-language";

// Shared site header: greca band + obsidian bar with the section menu and the
// site-wide ES/EN toggle (the layout-level provider owns the language state).
const NAV_ITEMS = [
  { href: "/", label: "Mapa", match: (p) => p === "/" },
  { href: "/guia", label: "Guía", match: (p) => p.startsWith("/guia") },
  { href: "/eventos", label: "Eventos", match: (p) => p.startsWith("/eventos") },
  {
    href: "https://radios.inpi.gob.mx:8080/xepet",
    label: "Radio XEPET",
    external: true,
  },
  { href: "/tzolkin", label: "Tzolk'in", match: (p) => p.startsWith("/tzolkin") },
  { href: "/promociones", label: "Promociones", match: (p) => p.startsWith("/promociones") },
  { href: "/contacto", label: "Contacto", match: (p) => p.startsWith("/contacto") },
];

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <GrecaBand />
      <div className="site-header__inner">
        <nav aria-label="Secciones del sitio / Site sections">
          <ul className="site-nav">
            {NAV_ITEMS.map(({ href, label, external, match }) => (
              <li key={href}>
                <a
                  href={href}
                  aria-current={!external && match?.(pathname) ? "page" : undefined}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <LanguageToggle />
      </div>
    </header>
  );
}
