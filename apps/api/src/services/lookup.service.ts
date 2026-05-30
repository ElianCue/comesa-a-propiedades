import { prisma } from "../lib/prisma";

export class LookupService {
  async getCities() {
    return prisma.city.findMany({
      select: { id: true, nombre: true, slug: true },
      orderBy: { nombre: "asc" },
    });
  }

  async getBarrios(cityId?: string) {
    const where = cityId ? { city_id: cityId } : {};
    return prisma.barrio.findMany({
      where,
      select: { id: true, nombre: true, city_id: true },
      orderBy: { nombre: "asc" },
    });
  }

  async getAmenities() {
    return prisma.amenity.findMany({
      select: { id: true, nombre: true, slug: true, icono: true },
      orderBy: { nombre: "asc" },
    });
  }

  async getPropertyTypes() {
    return prisma.propertyType.findMany({
      select: { id: true, nombre: true, slug: true },
      orderBy: { nombre: "asc" },
    });
  }

  async getOperations() {
    return prisma.operation.findMany({
      select: { id: true, nombre: true, slug: true },
      orderBy: { nombre: "asc" },
    });
  }

  async getCurrencies() {
    return prisma.currency.findMany({
      select: { id: true, codigo: true, simbolo: true },
    });
  }
}

export const lookupService = new LookupService();
