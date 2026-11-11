// Shared Organization JSON-LD node (schema.org). Rendered by the homepage
// (inside its @graph) and by /contacto (machine-readable ContactPoint).
// Spanish-primary per the standing contract. sameAs lists only verified
// profile URLs — add the GBP listing / Instagram here once their URLs are
// confirmed.

const organization = {
  "@type": "Organization",
  "@id": "https://fcpqroo.mx/#organization",
  name: "Directorio de Servicios de Felipe Carrillo Puerto",
  url: "https://fcpqroo.mx",
  logo: "https://fcpqroo.mx/img/fcp-letters.webp",
  email: "eventos@fcpqroo.mx",
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: "+529841841313",
      url: "https://wa.me/529841841313",
      email: "eventos@fcpqroo.mx",
      availableLanguage: ["es", "en"],
      areaServed: "Felipe Carrillo Puerto, Quintana Roo, MX",
    },
  ],
  sameAs: ["https://www.facebook.com/fcpqroo.mx"],
};

export default organization;
