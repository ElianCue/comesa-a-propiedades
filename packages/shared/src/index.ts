export type Operacion = "Venta" | "Alquiler";
export type Tipo = "Casa" | "Depto" | "PH" | "Local" | "Terreno" | "Campo" | "Oficina" | "Hotel" | "Negocio Especial" | "Quinta" | "Fondo Comercio" | "Galpon" | "Cochera";
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
  m2Terreno?: number;
  m2Descubierta?: number;
  ambientes: number;
  dormitorios: number;
  banos: number;
  cantPlantas?: number;
  cochera: boolean;
  balcon: boolean;
  jardin: boolean;
  parrilla: boolean;
  pileta: boolean;
  piso?: string;
  antiguedad?: string;
  expensas?: string;
  descripcion: string;
  lat: number;
  lng: number;
  fotos: string[];
  activo: boolean;
  aptoBanco: boolean;
  permuta: boolean;
  amenities?: string[];
  detalles?: Record<string, Array<{ clave: string; valor: string }>>;
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
    "Ringuelet",
  ],
  "Mar del Plata": ["Centro", "La Perla", "Playa Grande"],
};

export function getBarrios(ciudad?: Ciudad | ""): string[] {
  if (!ciudad || !(ciudad in BARRIOS)) return [];
  return BARRIOS[ciudad];
}

export function formatPrice(precio: number, moneda: Moneda): string {
  const n = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
  return moneda === "USD" ? `USD ${n}` : `$${n}/mes`;
}

export function formatPriceFromProperty(p: Property): string {
  return formatPrice(p.precio, p.moneda);
}

export function propertyTitle(p: Property): string {
  const op = p.operacion === "Venta" ? "en Venta" : "en Alquiler";
  return `${p.tipo} ${op} en ${p.barrio}, ${p.ciudad} — Comensaña Propiedades`;
}

export function propertyDescription(p: Property): string {
  return `${p.descripcion.substring(0, 120)} — ${p.ambientes} ambientes, ${p.dormitorios} dorm., ${p.m2Totales} m². ${formatPriceFromProperty(p)}.`;
}

export const WHATSAPP = "5492215551234";
