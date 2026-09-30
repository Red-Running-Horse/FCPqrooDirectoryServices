import "leaflet/dist/leaflet.css";
import "./style.css";

export const metadata = {
  metadataBase: new URL("https://fcpqroo.mx"),
  title: "Carreteras de Felipe Carrillo Puerto",
  description: "Mapa de carreteras regionales de Felipe Carrillo Puerto, Quintana Roo",
  openGraph: {
    images: [{ url: "/og/cover.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/cover.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
