import HighwayMap from "./highway-map";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "TouristInformationCenter",
  name: "Directorio de Servicios de Felipe Carrillo Puerto",
  url: "https://fcpqroo.mx",
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Felipe Carrillo Puerto, Quintana Roo",
  },
  inLanguage: "es-MX",
};

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HighwayMap />
    </main>
  );
}
