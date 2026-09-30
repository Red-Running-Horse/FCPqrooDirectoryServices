import "leaflet/dist/leaflet.css";
import "./style.css";

export const metadata = {
  metadataBase: new URL("https://fcpqroo.mx"),
  title: {
    default: "Directorio de Servicios | Felipe Carrillo Puerto",
    template: "%s | Directorio de Servicios",
  },
  description:
    "Encuentra servicios locales, turismo y puntos de interés en Felipe Carrillo Puerto, Quintana Roo.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Directorio de Servicios",
    title: "Directorio de Servicios | Felipe Carrillo Puerto",
    description:
      "Encuentra servicios locales, turismo y puntos de interés en Felipe Carrillo Puerto, Quintana Roo.",
    url: "https://fcpqroo.mx",
    images: ["/og/cover.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Directorio de Servicios | Felipe Carrillo Puerto",
    description:
      "Encuentra servicios locales, turismo y puntos de interés en Felipe Carrillo Puerto, Quintana Roo.",
    images: ["/og/cover.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
