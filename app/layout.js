import "leaflet/dist/leaflet.css";
import "./style.css";
import "./maya-theme.css";
import "./featured-partners.css";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import SiteHeader from "./site-header";
import { SiteLanguageProvider } from "./site-language";

export const metadata = {
  metadataBase: new URL("https://fcpqroo.mx"),
  title: {
    default: "Directorio de Servicios | Felipe Carrillo Puerto",
    template: "%s | Directorio de Servicios FCP",
  },
  description:
    "Explora el mapa de Felipe Carrillo Puerto y comunidades de la región: naturaleza, cultura, comida y servicios locales.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://fcpqroo.mx/",
    siteName: "Directorio de Servicios FCP",
    title: "Directorio de Servicios | Felipe Carrillo Puerto",
    description:
      "Explora el mapa de Felipe Carrillo Puerto y comunidades de la región: naturaleza, cultura, comida y servicios locales.",
    images: [
      {
        url: "/og/cover.jpg",
        width: 1200,
        height: 630,
        alt: "Directorio de servicios de Felipe Carrillo Puerto, Quintana Roo, con imagen tropical y ruta local",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Directorio de Servicios | Felipe Carrillo Puerto",
    description:
      "Explora el mapa de Felipe Carrillo Puerto y comunidades de la región: naturaleza, cultura, comida y servicios locales.",
    images: ["/og/cover.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the inline script below restores the stored
    // language onto <html lang> before first paint, so the attribute can
    // differ from the prerendered "es-MX" (see preventing-flash-before-
    // hydration guide).
    <html lang="es-MX" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem("fcp:language");if(l==="en"||l==="es")document.documentElement.lang=l;}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <SiteLanguageProvider>
          <SiteHeader />
          {children}
        </SiteLanguageProvider>
      </body>
    </html>
  );
}
