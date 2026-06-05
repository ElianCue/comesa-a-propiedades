import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SITE_URL, WHATSAPP } from "@/lib/properties";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const title = "Comesaña Propiedades | Casas y Departamentos en La Plata y Mar del Plata";
const description =
  "Encontrá tu hogar en La Plata y Mar del Plata. Casas, departamentos, PH y más. Asesoramiento profesional personalizado — venta y alquiler.";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title,
    description,
    type: "website",
    locale: "es_AR",
    siteName: "Comesaña Propiedades",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Comesaña Propiedades",
    description:
      "Inmobiliaria con cobertura en La Plata y Mar del Plata. Venta y alquiler de casas, departamentos, PH y más.",
    url: SITE_URL,
    telephone: `+${WHATSAPP}`,
    priceRange: "$$",
    areaServed: [
      { "@type": "City", name: "La Plata", sameAs: "https://es.wikipedia.org/wiki/La_Plata" },
      { "@type": "City", name: "Mar del Plata", sameAs: "https://es.wikipedia.org/wiki/Mar_del_Plata" },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "La Plata",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </head>
      <body className={`${display.variable} ${sans.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
