import type { CsvMapping } from "../import-csv";

const mapping: CsvMapping = {
  columnas: {
    direccion: { campo: "direccion", required: true },
    precio: { campo: "precio", required: false, default: 0, transform: safeNumber },
    moneda: { campo: "moneda", default: "USD" },
    tipo: { campo: "tipo", required: true },
    operacion: { campo: "operacion", required: true },
    ciudad: { campo: "ciudad", default: "La Plata" },
    barrio: { campo: "barrio", required: true },
    m2_totales: { campo: "m2Totales", required: true, transform: Number },
    m2_cubiertos: { campo: "m2Cubiertos", required: true, transform: Number },
    m2_terreno: { campo: "m2Terreno", transform: Number },
    m2_descubierta: { campo: "m2Descubierta", transform: Number },
    ambientes: { campo: "ambientes", required: true, transform: Number },
    dormitorios: { campo: "dormitorios", required: true, transform: Number },
    banos: { campo: "banos", required: true, transform: Number },
    cant_plantas: { campo: "cantPlantas", transform: Number },
    descripcion: { campo: "descripcion", required: false, default: "" },
    lat: { campo: "lat", transform: Number },
    lng: { campo: "lng", transform: Number },
    antiguedad: { campo: "antiguedad" },
    piso: { campo: "piso" },
    cochera: { campo: "cochera", transform: siNoToBool },
    balcon: { campo: "balcon", transform: siNoToBool },
    jardin: { campo: "jardin", transform: siNoToBool },
    parrilla: { campo: "parrilla", transform: siNoToBool },
    pileta: { campo: "pileta", transform: siNoToBool },
    apto_banco: { campo: "aptoBanco", transform: siNoToBool },
    permuta: { campo: "permuta", transform: siNoToBool },
    fotos: { campo: "fotos", transform: parseUrls },
    expensas: { campo: "expensas" },
  },
  columnAliases: {
    "sup. total": "m2_totales",
    "superficie total": "m2_totales",
    "m² totales": "m2_totales",
    "sup. cubierta": "m2_cubiertos",
    "superficie cubierta": "m2_cubiertos",
    "m² cubiertos": "m2_cubiertos",
    dirección: "direccion",
    descripción: "descripcion",
    operación: "operacion",
    antigüedad: "antiguedad",
    "precio venta": "precio",
    "precio alquiler": "precio",
    "precio usd": "precio",
  },
  amenityFields: ["cochera", "balcon", "jardin", "parrilla", "pileta"],
  amenityMapping: {
    cochera: "Cochera",
    balcon: "Balcón",
    jardin: "Jardín",
    parrilla: "Parrilla",
    pileta: "Pileta",
  },
};

function safeNumber(v: string): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function siNoToBool(v: string): boolean {
  const s = String(v).trim().toLowerCase();
  return s === "si" || s === "sí" || s === "true" || s === "1";
}

function parseUrls(v: string): string[] {
  if (!v) return [];
  return String(v)
    .split(/[;,|]/)
    .map((u) => u.trim())
    .filter(Boolean);
}

export default mapping;
