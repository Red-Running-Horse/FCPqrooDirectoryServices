export const dynamic = "force-static";

export default function sitemap() {
  return [
    {
      url: "https://fcpqroo.mx",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://fcpqroo.mx/guide",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
