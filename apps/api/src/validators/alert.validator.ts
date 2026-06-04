import { z } from "zod";

export const createAlertSchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().optional(),
  ciudad: z.string().optional(),
  operacion: z.string().optional(),
  tipo: z.string().optional(),
  barrio: z.string().optional(),
  precio_min: z.coerce.number().optional(),
  precio_max: z.coerce.number().optional(),
  ambientes: z.coerce.number().optional(),
  moneda: z.string().optional(),
  dormitorios: z.coerce.number().optional(),
});
