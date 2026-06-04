import { SITE_URL } from "@/lib/properties";

export default async function sitemap() {
  const base = SITE_URL;

  let properties: any[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties?limit=100`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    properties = json?.data ?? [];
  } catch {
    // fallback: empty array so build doesn't fail
  }

  const propertyUrls = properties.map((p: any) => ({
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
