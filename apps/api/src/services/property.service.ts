import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import type { CreatePropertyInput, UpdatePropertyInput } from "../validators/property.validator";

const propertyInclude = {
  city: { select: { nombre: true, slug: true } },
  barrio: { select: { nombre: true } },
  property_type: { select: { nombre: true, slug: true } },
  operation: { select: { nombre: true, slug: true } },
  currency: { select: { codigo: true, simbolo: true } },
  photos: { select: { url: true, alt: true, orden: true }, orderBy: { orden: "asc" as const } },
  amenities: { select: { amenity: { select: { nombre: true, slug: true, icono: true } } } },
};

// Lightweight include used for listings: only bring the primary photo and basic lookups
const listingInclude = {
  city: { select: { nombre: true } },
  barrio: { select: { nombre: true } },
  operation: { select: { nombre: true } },
  currency: { select: { codigo: true } },
  photos: { select: { url: true, orden: true }, orderBy: { orden: "asc" as const }, take: 1 },
};

function serializeProperty(p: any) {
  return {
    id: p.id,
    ciudad: p.city.nombre,
    barrio: p.barrio.nombre,
    tipo: p.property_type.nombre,
    operacion: p.operation.nombre,
    moneda: p.currency.codigo,
    direccion: p.direccion,
    precio: p.precio,
    m2Totales: Number(p.m2_totales),
    m2Cubiertos: Number(p.m2_cubiertos),
    ambientes: p.ambientes,
    dormitorios: p.dormitorios,
    banos: p.banos,
    piso: p.piso,
    antiguedad: p.antiguedad,
    descripcion: p.descripcion,
    lat: p.lat,
    lng: p.lng,
    fotos: p.photos.map((ph: any) => ph.url).filter(Boolean),
    amenities: p.amenities.map((pa: any) => pa.amenity.nombre),
    activo: p.activo,
    aptoBanco: p.apto_banco,
    permuta: p.permuta,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

async function resolveLookups(input: {
  ciudad: string;
  barrio: string;
  tipo: string;
  operacion: string;
  moneda: string;
}) {
  const city = await prisma.city.findUniqueOrThrow({ where: { nombre: input.ciudad } });
  const barrio = await prisma.barrio.findFirstOrThrow({ where: { nombre: input.barrio, city_id: city.id } });
  const property_type = await prisma.propertyType.findUniqueOrThrow({ where: { nombre: input.tipo } });
  const operation = await prisma.operation.findUniqueOrThrow({ where: { nombre: input.operacion } });
  const currency = await prisma.currency.findUniqueOrThrow({ where: { codigo: input.moneda } });

  return {
    city_id: city.id,
    barrio_id: barrio.id,
    property_type_id: property_type.id,
    operation_id: operation.id,
    currency_id: currency.id,
  };
}

export class PropertyService {
  async list(filters: {
    ciudad?: string;
    operacion?: string;
    tipo?: string;
    barrio?: string;
    precioMax?: number;
    aptoBanco?: boolean;
    permuta?: boolean;
    cursor?: string;
    limit: number;
  }) {
    const where: any = { activo: true };

    if (filters.ciudad) {
      const city = await prisma.city.findUnique({ where: { nombre: filters.ciudad } });
      if (city) where.city_id = city.id;
    }
    if (filters.barrio) {
      const barrio = await prisma.barrio.findFirst({ where: { nombre: filters.barrio } });
      if (barrio) where.barrio_id = barrio.id;
    }
    if (filters.operacion) {
      const op = await prisma.operation.findUnique({ where: { nombre: filters.operacion } });
      if (op) where.operation_id = op.id;
    }
    if (filters.tipo) {
      const tipo = await prisma.propertyType.findUnique({ where: { nombre: filters.tipo } });
      if (tipo) where.property_type_id = tipo.id;
    }
    if (filters.precioMax) {
      where.currency_id = (await prisma.currency.findUnique({ where: { codigo: "USD" } }))!.id;
      where.precio = { lte: filters.precioMax };
    }
    if (filters.aptoBanco !== undefined) {
      where.apto_banco = filters.aptoBanco;
    }
    if (filters.permuta !== undefined) {
      where.permuta = filters.permuta;
    }

    const take = Math.min(filters.limit, 50);

    // Use a lightweight include for listing to reduce payload and DB work
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: listingInclude,
        orderBy: { created_at: "desc" },
        take: take + 1,
        ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      }),
      prisma.property.count({ where }),
    ]);

    const hasMore = properties.length > take;
    const items = hasMore ? properties.slice(0, take) : properties;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    // For listing we serialize a lightweight shape
    const serializeListing = (p: any) => ({
      id: p.id,
      ciudad: p.city?.nombre,
      barrio: p.barrio?.nombre,
      direccion: p.direccion,
      precio: p.precio,
      moneda: p.currency?.codigo,
      // Provide a 'fotos' array compatible with frontend expectations (first item only)
      fotos: ((p.photos || []).map((ph: any) => ph.url).filter(Boolean).slice(0, 1)) || [],
    });

    return {
      data: items.map(serializeListing),
      meta: { total, cursor: nextCursor },
    };
  }

  async getById(id: string) {
    const property = await prisma.property.findUnique({ where: { id }, include: propertyInclude });
    if (!property) throw new NotFoundError("Propiedad no encontrada");
    return serializeProperty(property);
  }

  async create(input: CreatePropertyInput) {
    const lookups = await resolveLookups(input);

    const amenities = await prisma.amenity.findMany({
      where: { nombre: { in: input.amenities } },
    });

    const property = await prisma.property.create({
      data: {
        ...lookups,
        direccion: input.direccion,
        precio: input.precio,
        m2_totales: input.m2_totales,
        m2_cubiertos: input.m2_cubiertos,
        ambientes: input.ambientes,
        dormitorios: input.dormitorios,
        banos: input.banos,
        piso: input.piso,
        antiguedad: input.antiguedad,
        descripcion: input.descripcion,
        lat: input.lat,
        lng: input.lng,
        apto_banco: input.apto_banco,
        permuta: input.permuta,
        photos: {
          create: input.fotos.map((url, i) => ({ url, orden: i })),
        },
        amenities: {
          create: amenities.map((a) => ({ amenity_id: a.id })),
        },
      },
      include: propertyInclude,
    });

    return serializeProperty(property);
  }

  async update(id: string, input: UpdatePropertyInput) {
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Propiedad no encontrada");

    const data: any = {};

    if (input.ciudad || input.barrio || input.tipo || input.operacion || input.moneda) {
      const resolved = await resolveLookups({
        ciudad: input.ciudad || (await prisma.city.findUnique({ where: { id: existing.city_id } }))!.nombre,
        barrio: input.barrio || (await prisma.barrio.findUnique({ where: { id: existing.barrio_id } }))!.nombre,
        tipo: input.tipo || (await prisma.propertyType.findUnique({ where: { id: existing.property_type_id } }))!.nombre,
        operacion: input.operacion || (await prisma.operation.findUnique({ where: { id: existing.operation_id } }))!.nombre,
        moneda: input.moneda || (await prisma.currency.findUnique({ where: { id: existing.currency_id } }))!.codigo,
      });
      Object.assign(data, resolved);
    }

    const scalarFields = [
      "direccion", "precio", "m2_totales", "m2_cubiertos",
      "ambientes", "dormitorios", "banos", "piso", "antiguedad",
      "descripcion", "lat", "lng", "activo", "apto_banco", "permuta",
    ] as const;
    for (const field of scalarFields) {
      if (input[field as keyof UpdatePropertyInput] !== undefined) {
        (data as any)[field] = input[field as keyof UpdatePropertyInput];
      }
    }

    const property = await prisma.property.update({
      where: { id },
      data,
      include: propertyInclude,
    });

    // Update photos if provided
    if (input.fotos !== undefined) {
      await prisma.propertyPhoto.deleteMany({ where: { property_id: id } });
      await prisma.propertyPhoto.createMany({
        data: input.fotos.map((url, i) => ({ property_id: id, url, orden: i })),
      });
    }

    // Update amenities if provided
    if (input.amenities !== undefined) {
      await prisma.propertyAmenity.deleteMany({ where: { property_id: id } });
      const ams = await prisma.amenity.findMany({ where: { nombre: { in: input.amenities } } });
      await prisma.propertyAmenity.createMany({
        data: ams.map((a) => ({ property_id: id, amenity_id: a.id })),
      });
    }

    return this.getById(id);
  }

  async delete(id: string) {
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Propiedad no encontrada");

    await prisma.property.delete({ where: { id } });
  }
}

export const propertyService = new PropertyService();
