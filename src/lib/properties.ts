export type Operacion = "Venta" | "Alquiler";
export type Tipo = "Casa" | "Depto" | "PH" | "Local" | "Terreno";
export type Moneda = "USD" | "ARS";
export type Ciudad = "La Plata" | "Mar del Plata";

export interface Property {
  id: string;
  ciudad: Ciudad;
  operacion: Operacion;
  tipo: Tipo;
  direccion: string;
  barrio: string;
  precio: number;
  moneda: Moneda;
  m2Totales: number;
  m2Cubiertos: number;
  ambientes: number;
  dormitorios: number;
  banos: number;
  cochera: boolean;
  balcon: boolean;
  jardin: boolean;
  parrilla: boolean;
  pileta: boolean;
  piso?: string;
  antiguedad?: string;
  descripcion: string;
  lat: number;
  lng: number;
  fotos: string[];
  activo: boolean;
}

export const CIUDADES: Ciudad[] = ["La Plata", "Mar del Plata"];

export const BARRIOS: Record<Ciudad, string[]> = {
"La Plata": [
    "Centro",
    "Tolosa",
    "Gonnet",
    "City Bell",
    "Villa Elisa",
    "Altos de San Lorenzo",
    "Los Hornos",
    "San Carlos",
    "Ringuelet"
  ],
"Mar del Plata": [
    "Centro", "La Perla", "Playa Grande"
  ],
};

export function getBarrios(ciudad?: Ciudad | ""): string[] {
  if (!ciudad || !(ciudad in BARRIOS)) return [];
  return BARRIOS[ciudad];
}

const PHOTOS = [
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80",
];

export const seedProperties: Property[] = [
  // ── La Plata ──
  { id: "1", ciudad: "La Plata", operacion: "Venta", tipo: "Casa", direccion: "Calle 47 entre 12 y 13", barrio: "Centro", precio: 185000, moneda: "USD", m2Totales: 280, m2Cubiertos: 220, ambientes: 5, dormitorios: 3, banos: 2, cochera: true, balcon: false, jardin: true, parrilla: true, pileta: false, antiguedad: "15 años", descripcion: "Hermosa casa familiar en pleno centro de La Plata, con jardín amplio y quincho con parrilla. Pisos de madera, cocina renovada, excelente luminosidad.", lat: -34.9214, lng: -57.9544, fotos: [PHOTOS[0], PHOTOS[4], PHOTOS[6]], activo: true },
  { id: "3", ciudad: "La Plata", operacion: "Alquiler", tipo: "Depto", direccion: "Calle 7 N° 1234, Piso 5", barrio: "Centro", precio: 420000, moneda: "ARS", m2Totales: 65, m2Cubiertos: 60, ambientes: 2, dormitorios: 1, banos: 1, cochera: false, balcon: true, jardin: false, parrilla: false, pileta: false, piso: "5° A", antiguedad: "10 años", descripcion: "Departamento luminoso de 2 ambientes a metros de la Plaza San Martín. Balcón con vista despejada, edificio con encargado.", lat: -34.9216, lng: -57.9540, fotos: [PHOTOS[2], PHOTOS[8]], activo: true },

  // ── Mar del Plata ──
  { id: "11", ciudad: "Mar del Plata", operacion: "Venta", tipo: "Casa", direccion: "Av. Colón 3245", barrio: "Playa Grande", precio: 320000, moneda: "USD", m2Totales: 350, m2Cubiertos: 250, ambientes: 6, dormitorios: 4, banos: 3, cochera: true, balcon: false, jardin: true, parrilla: true, pileta: true, antiguedad: "5 años", descripcion: "Impecable casa en Playa Grande a dos cuadras del mar. Amplios espacios con diseño moderno, pileta y parrilla. La mejor zona de Mar del Plata.", lat: -38.0055, lng: -57.5426, fotos: [PHOTOS[2], PHOTOS[6], PHOTOS[0]], activo: true },
  { id: "12", ciudad: "Mar del Plata", operacion: "Venta", tipo: "Depto", direccion: "San Martín 2850, Piso 12", barrio: "Centro", precio: 145000, moneda: "USD", m2Totales: 80, m2Cubiertos: 70, ambientes: 3, dormitorios: 2, banos: 2, cochera: true, balcon: true, jardin: false, parrilla: false, pileta: false, piso: "12° A", antiguedad: "10 años", descripcion: "Departamento con vista al mar en pleno centro de Mardel. Cochera cubierta incluida. Excelente inversión.", lat: -38.0020, lng: -57.5570, fotos: [PHOTOS[5], PHOTOS[7], PHOTOS[9]], activo: true },
  { id: "14", ciudad: "Mar del Plata", operacion: "Alquiler", tipo: "PH", direccion: "Bolívar 1850", barrio: "La Perla", precio: 280000, moneda: "ARS", m2Totales: 90, m2Cubiertos: 70, ambientes: 3, dormitorios: 2, banos: 1, cochera: false, balcon: false, jardin: true, parrilla: true, pileta: false, antiguedad: "20 años", descripcion: "PH con patio en La Perla, a metros de la playa. Ideal para disfrutar el verano o como vivienda permanente.", lat: -38.0120, lng: -57.5380, fotos: [PHOTOS[1], PHOTOS[3], PHOTOS[8]], activo: true },
];

export function formatPrice(p: Property): string {
  const n = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(p.precio);
  return p.moneda === "USD" ? `USD ${n}` : `$${n}/mes`;
}

export function propertyTitle(p: Property): string {
  const op = p.operacion === "Venta" ? "en Venta" : "en Alquiler";
  return `${p.tipo} ${op} en ${p.barrio}, ${p.ciudad} — Comensaña Propiedades`;
}

export function propertyDescription(p: Property): string {
  return `${p.descripcion.substring(0, 120)} — ${p.ambientes} ambientes, ${p.dormitorios} dorm., ${p.m2Totales} m². ${p.operacion === "Venta" ? formatPrice(p) : formatPrice(p)}.`;
}

export const WHATSAPP = "5492215551234";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://comesana-propiedades.vercel.app";
