import { seedProperties, SITE_URL } from "@/lib/properties";

export default async function sitemap() {
  const base = SITE_URL;

  const propertyUrls = seedProperties.map((p) => ({
    url: `${base}/propiedad/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${base}/mapa`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${base}/busqueda`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...propertyUrls,
  ];
}
