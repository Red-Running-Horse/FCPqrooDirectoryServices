import GuideView from "./guide-view";

export const metadata = {
  title: "Guía Práctica para Visitantes",
  description:
    "Guía práctica y de preparación para viajeros a Felipe Carrillo Puerto y la Riviera Maya: llegada, transporte, moneda, conectividad y cultura maya.",
  alternates: {
    canonical: "/guide",
  },
  openGraph: {
    type: "article",
    locale: "es_MX",
    url: "https://fcpqroo.mx/guide",
    siteName: "Directorio de Servicios FCP",
    title: "Guía Práctica para Visitantes | Felipe Carrillo Puerto",
    description:
      "Guía práctica y de preparación para viajeros a Felipe Carrillo Puerto y la Riviera Maya: llegada, transporte, moneda, conectividad y cultura maya.",
  },
};

export default function GuidePage() {
  return (
    <main>
      <GuideView />
    </main>
  );
}
