import { z } from "zod";

export const propertyQuerySchema = z.object({
  ciudad: z.string().optional(),
  operacion: z.string().optional(),
  tipo: z.string().optional(),
  barrio: z.string().optional(),
  precioMax: z.coerce.number().optional(),
  activo: z.coerce.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().default(20),
});

export const createPropertySchema = z.object({
  ciudad: z.string().min(1),
  barrio: z.string().optional(),
  tipo: z.string().min(1),
  operacion: z.string().min(1),
  moneda: z.enum(["USD", "ARS"]),
  direccion: z.string().min(1),
  precio: z.number().int().positive(),
  m2_totales: z.number().positive(),
  m2_cubiertos: z.number().positive(),
  ambientes: z.number().int().positive(),
  dormitorios: z.number().int().positive(),
  banos: z.number().int().positive(),
  piso: z.string().optional(),
  antiguedad: z.string().optional(),
  descripcion: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  activo: z.boolean().default(true),
  apto_banco: z.boolean().default(false),
  permuta: z.boolean().default(false),
  amenities: z.array(z.string()).default([]),
  fotos: z.array(z.string().url("URL de foto inválida")).default([]),
  detalles: z.record(z.string()).default({}),
  m2_terreno: z.number().positive().optional(),
  m2_descubierta: z.number().positive().optional(),
  cant_plantas: z.number().int().positive().optional(),
  expensas: z.string().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
