import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import type { CreateInquiryInput } from "../validators/inquiry.validator";

export class InquiryService {
  async create(input: CreateInquiryInput) {
    const property = await prisma.property.findUnique({ where: { id: input.property_id } });
    if (!property) throw new NotFoundError("Propiedad no encontrada");

    return prisma.inquiry.create({
      data: {
        property_id: input.property_id,
        nombre: input.nombre,
        email: input.email,
        telefono: input.telefono,
        mensaje: input.mensaje,
      },
      include: {
        property: {
          select: {
            direccion: true,
            city: { select: { nombre: true } },
            barrio: { select: { nombre: true } },
          },
        },
      },
    });
  }

  async list() {
    return prisma.inquiry.findMany({
      include: {
        property: {
          select: {
            direccion: true,
            city: { select: { nombre: true } },
            barrio: { select: { nombre: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  async getById(id: string) {
    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundError("Consulta no encontrada");
    return inquiry;
  }

  async markAsRead(id: string) {
    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundError("Consulta no encontrada");

    return prisma.inquiry.update({
      where: { id },
      data: { leido: !inquiry.leido },
    });
  }

  async delete(id: string) {
    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundError("Consulta no encontrada");

    await prisma.inquiry.delete({ where: { id } });
  }
}

export const inquiryService = new InquiryService();
