import "leaflet/dist/leaflet.css";
import "./style.css";

export const metadata = {
  metadataBase: new URL("https://fcpqroo.mx"),
  title: {
    default: "Directorio de Servicios | Felipe Carrillo Puerto",
    template: "%s | Directorio de Servicios FCP",
  },
  description:
    "Encuentra servicios locales, turismo y puntos de interés en Felipe Carrillo Puerto, Quintana Roo.",
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
      "Encuentra servicios locales, turismo y puntos de interés en Felipe Carrillo Puerto, Quintana Roo.",
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
