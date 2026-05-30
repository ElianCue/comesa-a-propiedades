import { z } from "zod";

export const createInquirySchema = z.object({
  property_id: z.string().min(1, "ID de propiedad requerido"),
  nombre: z.string().min(1, "Nombre requerido").max(200),
  email: z.string().email("Email inválido"),
  telefono: z.string().max(50).optional(),
  mensaje: z.string().max(2000).optional(),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
