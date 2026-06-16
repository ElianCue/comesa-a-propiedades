import { prisma } from "../prisma";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export class LookupService {
  async getCities() {
    return prisma.city.findMany({
      select: { id: true, nombre: true, slug: true },
      orderBy: { nombre: "asc" },
    });
  }

  async getCityById(id: string) {
    return prisma.city.findUnique({
      where: { id },
      include: { barrios: { orderBy: { nombre: "asc" } } },
    });
  }

  async createCity(data: { nombre: string }) {
    const slug = slugify(data.nombre);
    return prisma.city.create({ data: { nombre: data.nombre, slug } });
  }

  async updateCity(id: string, data: { nombre: string }) {
    const slug = slugify(data.nombre);
    return prisma.city.update({ where: { id }, data: { nombre: data.nombre, slug } });
  }

  async deleteCity(id: string) {
    const propertyCount = await prisma.property.count({ where: { city_id: id } });
    if (propertyCount > 0) {
      throw new Error(`No se puede eliminar la ciudad porque tiene ${propertyCount} propiedad(es) asociada(s).`);
    }
    await prisma.barrio.deleteMany({ where: { city_id: id } });
    return prisma.city.delete({ where: { id } });
  }

  async getBarrios(cityId?: string) {
    const where = cityId ? { city_id: cityId } : {};
    return prisma.barrio.findMany({
      where,
      select: { id: true, nombre: true, city_id: true },
      orderBy: { nombre: "asc" },
    });
  }

  async createBarrio(data: { nombre: string; city_id: string }) {
    return prisma.barrio.create({ data });
  }

  async updateBarrio(id: string, data: { nombre: string }) {
    return prisma.barrio.update({ where: { id }, data });
  }

  async deleteBarrio(id: string) {
    const propertyCount = await prisma.property.count({ where: { barrio_id: id } });
    if (propertyCount > 0) {
      throw new Error(`No se puede eliminar el barrio porque tiene ${propertyCount} propiedad(es) asociada(s).`);
    }
    return prisma.barrio.delete({ where: { id } });
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
