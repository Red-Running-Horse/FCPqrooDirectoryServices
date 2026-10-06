import HighwayMap from "./highway-map";
import FeaturedPartners from "./featured-partners";
import placesIndex from "../public/data/places-index.json";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Directorio de Servicios de Felipe Carrillo Puerto",
  url: "https://fcpqroo.mx",
  about: {
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
      <div style={{ maxWidth: "60rem", margin: "0 auto", padding: "0 1rem" }}>
        <FeaturedPartners />
      </div>
      <HighwayMap placesIndex={placesIndex} />
    </main>
  );
}