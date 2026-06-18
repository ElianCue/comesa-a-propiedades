import { prisma } from "../prisma";
import { NotFoundError } from "../errors";
import type { CreatePropertyInput, UpdatePropertyInput } from "../validators/property.validator";
import { matchAndNotify } from "./alert.service";

const propertyInclude = {
  city: { select: { nombre: true, slug: true } },
  barrio: { select: { nombre: true } },
  property_type: { select: { nombre: true, slug: true } },
  operation: { select: { nombre: true, slug: true } },
  currency: { select: { codigo: true, simbolo: true } },
  photos: { select: { url: true, alt: true, orden: true }, orderBy: { orden: "asc" as const } },
  amenities: { select: { amenity: { select: { nombre: true, slug: true, icono: true } } } },
  detalles: { select: { seccion: true, clave: true, valor: true }, orderBy: { clave: "asc" as const } },
};

const listingInclude = {
  city: { select: { nombre: true } },
  barrio: { select: { nombre: true } },
  property_type: { select: { nombre: true, slug: true } },
  operation: { select: { nombre: true } },
  currency: { select: { codigo: true } },
  photos: { select: { url: true, orden: true }, orderBy: { orden: "asc" as const } },
  amenities: { select: { amenity: { select: { nombre: true } } } },
};

export function serializeProperty(p: any) {
  const amenityNames = p.amenities.map((pa: any) => pa.amenity.nombre);

  const detallesBySeccion: Record<string, Array<{ clave: string; valor: string }>> = {};
  if (p.detalles) {
    for (const d of p.detalles) {
      if (!detallesBySeccion[d.seccion]) detallesBySeccion[d.seccion] = [];
      detallesBySeccion[d.seccion].push({ clave: d.clave, valor: d.valor });
    }
  }

  return {
    id: p.id,
    ciudad: p.city.nombre,
    barrio: p.barrio?.nombre ?? "",
    tipo: p.property_type.nombre,
    operacion: p.operation.nombre,
    moneda: p.currency.codigo,
    direccion: p.direccion,
    precio: p.precio,
    m2Totales: Number(p.m2_totales),
    m2Cubiertos: Number(p.m2_cubiertos),
    m2Terreno: p.m2_terreno ? Number(p.m2_terreno) : undefined,
    m2Descubierta: p.m2_descubierta ? Number(p.m2_descubierta) : undefined,
    ambientes: p.ambientes,
    dormitorios: p.dormitorios,
    banos: p.banos,
    cantPlantas: p.cant_plantas || undefined,
    piso: p.piso,
    antiguedad: p.antiguedad,
    expensas: p.expensas || undefined,
    descripcion: p.descripcion,
    lat: p.lat,
    lng: p.lng,
    cochera: amenityNames.includes("Cochera"),
    balcon: amenityNames.includes("Balcón"),
    jardin: amenityNames.includes("Jardín"),
    parrilla: amenityNames.includes("Parrilla"),
    pileta: amenityNames.includes("Pileta"),
    aptoBanco: p.apto_banco,
    permuta: p.permuta,
    fotos: p.photos.map((ph: any) => ph.url).filter(Boolean),
    amenities: amenityNames,
    detalles: detallesBySeccion,
    activo: p.activo,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

async function resolveLookups(input: {
  ciudad: string;
  barrio?: string;
  tipo: string;
  operacion: string;
  moneda: string;
}) {
  try {
    const city = await prisma.city.findUnique({ where: { nombre: input.ciudad } });
    if (!city) {
      throw new NotFoundError(`Ciudad "${input.ciudad}" no encontrada`);
    }

    let barrio_id: string | null = null;
    if (input.barrio) {
      const barrio = await prisma.barrio.findFirst({ where: { nombre: input.barrio, city_id: city.id } });
      if (!barrio) {
        throw new NotFoundError(`Barrio "${input.barrio}" no encontrado en la ciudad "${input.ciudad}"`);
      }
      barrio_id = barrio.id;
    }

    const property_type = await prisma.propertyType.findUnique({ where: { nombre: input.tipo } });
    if (!property_type) {
      throw new NotFoundError(`Tipo de propiedad "${input.tipo}" no encontrado`);
    }

    const operation = await prisma.operation.findUnique({ where: { nombre: input.operacion } });
    if (!operation) {
      throw new NotFoundError(`Operación "${input.operacion}" no encontrada`);
    }

    const currency = await prisma.currency.findUnique({ where: { codigo: input.moneda } });
    if (!currency) {
      throw new NotFoundError(`Moneda "${input.moneda}" no encontrada`);
    }

    return {
      city_id: city.id,
      barrio_id,
      property_type_id: property_type.id,
      operation_id: operation.id,
      currency_id: currency.id,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new NotFoundError("Error al buscar datos de referencia");
  }
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
    activo?: boolean;
    cursor?: string;
    limit: number;
  }) {
    const where: any = {};
    if (filters.activo !== undefined) {
      where.activo = filters.activo;
    }

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
      const usd = await prisma.currency.findUnique({ where: { codigo: "USD" } });
      if (usd) where.currency_id = usd.id;
      where.precio = { lte: filters.precioMax };
    }
    if (filters.aptoBanco !== undefined) {
      where.apto_banco = filters.aptoBanco;
    }
    if (filters.permuta !== undefined) {
      where.permuta = filters.permuta;
    }

    const take = Math.min(filters.limit, 200);

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

    const serializeListing = (p: any) => {
      const amenityNames = (p.amenities || []).map((pa: any) => pa.amenity.nombre);
      return {
        id: p.id,
        ciudad: p.city?.nombre,
        barrio: p.barrio?.nombre,
        tipo: p.property_type?.nombre,
        operacion: p.operation?.nombre,
        direccion: p.direccion,
        precio: p.precio,
        moneda: p.currency?.codigo || "USD",
        m2Totales: Number(p.m2_totales),
        m2Cubiertos: Number(p.m2_cubiertos),
        m2Terreno: p.m2_terreno ? Number(p.m2_terreno) : undefined,
        m2Descubierta: p.m2_descubierta ? Number(p.m2_descubierta) : undefined,
        ambientes: p.ambientes,
        dormitorios: p.dormitorios,
        banos: p.banos,
        cantPlantas: p.cant_plantas || undefined,
        piso: p.piso,
        antiguedad: p.antiguedad,
        expensas: p.expensas || undefined,
        cochera: amenityNames.includes("Cochera"),
        balcon: amenityNames.includes("Balcón"),
        jardin: amenityNames.includes("Jardín"),
        parrilla: amenityNames.includes("Parrilla"),
        pileta: amenityNames.includes("Pileta"),
        aptoBanco: p.apto_banco,
        permuta: p.permuta,
        descripcion: p.descripcion,
        lat: p.lat,
        lng: p.lng,
        activo: p.activo,
        amenities: amenityNames,
        fotos: ((p.photos || []).map((ph: any) => ph.url).filter(Boolean)) || [],
      };
    };

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
        m2_terreno: input.m2_terreno || undefined,
        m2_descubierta: input.m2_descubierta || undefined,
        cant_plantas: input.cant_plantas || undefined,
        expensas: input.expensas || undefined,
        photos: {
          create: input.fotos.map((url, i) => ({ url, orden: i })),
        },
        amenities: {
          create: amenities.map((a) => ({ amenity_id: a.id })),
        },
        detalles: input.detalles && Object.keys(input.detalles).length > 0
          ? {
              create: Object.entries(input.detalles).map(([clave, valor]) => ({
                seccion: "Características",
                clave,
                valor,
              })),
            }
          : undefined,
      },
      include: propertyInclude,
    });

    const serialized = serializeProperty(property);
    matchAndNotify(serialized).catch((err: unknown) =>
      console.error("[property] Error matching alerts:", err)
    );
    return serialized;
  }

  async update(id: string, input: UpdatePropertyInput) {
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Propiedad no encontrada");

    const data: any = {};

    if (input.ciudad || input.barrio || input.tipo || input.operacion || input.moneda) {
      const city = input.ciudad ? null : await prisma.city.findUnique({ where: { id: existing.city_id } });
      const barrio = input.barrio ? null : existing.barrio_id ? await prisma.barrio.findUnique({ where: { id: existing.barrio_id } }) : null;
      const ptype = input.tipo ? null : await prisma.propertyType.findUnique({ where: { id: existing.property_type_id } });
      const op = input.operacion ? null : await prisma.operation.findUnique({ where: { id: existing.operation_id } });
      const cur = input.moneda ? null : await prisma.currency.findUnique({ where: { id: existing.currency_id } });

      const resolved = await resolveLookups({
        ciudad: input.ciudad || city!.nombre,
        barrio: input.barrio || barrio!.nombre,
        tipo: input.tipo || ptype!.nombre,
        operacion: input.operacion || op!.nombre,
        moneda: input.moneda || cur!.codigo,
      });
      Object.assign(data, resolved);
    }

    const scalarFields = [
      "direccion", "precio", "m2_totales", "m2_cubiertos",
      "ambientes", "dormitorios", "banos", "piso", "antiguedad",
      "descripcion", "lat", "lng", "activo", "apto_banco", "permuta",
      "m2_terreno", "m2_descubierta", "cant_plantas", "expensas",
    ] as const;
    for (const field of scalarFields) {
      if ((input as any)[field] !== undefined) {
        (data as any)[field] = (input as any)[field];
      }
    }

    await prisma.property.update({
      where: { id },
      data,
    });

    if (input.fotos !== undefined) {
      await prisma.propertyPhoto.deleteMany({ where: { property_id: id } });
      await prisma.propertyPhoto.createMany({
        data: input.fotos.map((url, i) => ({ property_id: id, url, orden: i })),
      });
    }

    if (input.amenities !== undefined) {
      await prisma.propertyAmenity.deleteMany({ where: { property_id: id } });
      const ams = await prisma.amenity.findMany({ where: { nombre: { in: input.amenities } } });
      await prisma.propertyAmenity.createMany({
        data: ams.map((a) => ({ property_id: id, amenity_id: a.id })),
      });
    }

    if (input.detalles !== undefined) {
      await prisma.propertyDetail.deleteMany({ where: { property_id: id } });
      const entries = Object.entries(input.detalles);
      if (entries.length > 0) {
        await prisma.propertyDetail.createMany({
          data: entries.map(([clave, valor]) => ({
            property_id: id,
            seccion: "Características",
            clave,
            valor,
          })),
        });
      }
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
