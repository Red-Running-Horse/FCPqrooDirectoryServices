import "leaflet/dist/leaflet.css";
import "./style.css";

export const metadata = {
  title: "Carreteras de Felipe Carrillo Puerto",
  description: "Mapa de carreteras regionales de Felipe Carrillo Puerto, Quintana Roo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
