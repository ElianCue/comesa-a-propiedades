import { parse } from "csv-parse/sync";
import { readFileSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Types ──

export interface ColumnMapping {
  campo: string;
  required?: boolean;
  default?: unknown;
  transform?: (v: string) => unknown;
}

export interface CsvMapping {
  columnas: Record<string, ColumnMapping>;
  columnAliases?: Record<string, string>;
  amenityFields?: string[];
  amenityMapping?: Record<string, string>;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: { fila: number; motivo: string }[];
}

// ── CLI args ──

const args = process.argv.slice(2);
const fileFlag = args.indexOf("--file");
const mapFlag = args.indexOf("--map");

const filePath = fileFlag !== -1 ? args[fileFlag + 1] : "";
const mapName = mapFlag !== -1 ? args[mapFlag + 1] : "argenprop";
const dryRun = args.includes("--dry-run");

if (!filePath) {
  console.error("Uso: npx tsx scripts/import-csv.ts --file ruta.csv [--map argenprop] [--dry-run]");
  process.exit(1);
}

if (!existsSync(filePath)) {
  console.error(`Archivo no encontrado: ${filePath}`);
  process.exit(1);
}

// ── Helpers ──

async function loadMapping(mapName: string): Promise<CsvMapping> {
  try {
    const mod = await import(`./maps/${mapName}`);
    console.log(`Mapping cargado: ${mapName}`);
    return mod.default;
  } catch {
    console.error(`Mapping no encontrado: ${mapName}`);
    process.exit(1);
  }
}

function normalizeHeader(col: string, mapping: CsvMapping): string {
  const key = col
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return mapping.columnAliases?.[col.toLowerCase().trim()] || key;
}

// ── Main ──

async function main() {
  const mapping = await loadMapping(mapName);

  const csvContent = readFileSync(filePath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  });

  if (records.length === 0) {
    console.log("CSV vacío, nada que importar.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\nRegistros leídos: ${records.length}`);
  if (dryRun) console.log("→ Modo dry-run, no se guardarán cambios.\n");

  // Normalize column headers
  const headers = Object.keys(records[0]);
  const normalizedHeaders = headers.map((col) => normalizeHeader(col, mapping));
  console.log("Columnas detectadas:", headers.join(", "));

  // Pre-load lookup tables
  const [cities, barrios, propertyTypes, operations, currencies, allAmenities] =
    await Promise.all([
      prisma.city.findMany(),
      prisma.barrio.findMany({ include: { city: true } }),
      prisma.propertyType.findMany(),
      prisma.operation.findMany(),
      prisma.currency.findMany(),
      prisma.amenity.findMany(),
    ]);

  const cityByName = new Map(cities.map((c) => [c.nombre, c]));
  const tipoByName = new Map(propertyTypes.map((t) => [t.nombre, t]));
  const opByName = new Map(operations.map((o) => [o.nombre, o]));
  const curByCode = new Map(currencies.map((c) => [c.codigo, c]));
  const amenityByName = new Map(allAmenities.map((a) => [a.nombre, a]));

  // Process rows
  const result: ImportResult = {
    total: records.length,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const fila = i + 2;

    try {
      const mapped = mapRow(row, normalizedHeaders, headers, mapping);

      // Validate required
      const missing = Object.entries(mapping.columnas)
        .filter(([_, col]) => col.required)
        .filter(([_, col]) => {
          const val = mapped[col.campo];
          return val === undefined || val === null || val === "";
        });

      if (missing.length > 0) {
        result.errors.push({
          fila,
          motivo: `Campos requeridos faltantes: ${missing.map(([k]) => k).join(", ")}`,
        });
        result.skipped++;
        continue;
      }

      // Resolve lookups
      const city = cityByName.get(mapped.ciudad as string);
      if (!city) {
        result.errors.push({
          fila,
          motivo: `Ciudad no encontrada: ${mapped.ciudad}`,
        });
        result.skipped++;
        continue;
      }

      const barrioRec = barrios.find(
        (b) =>
          b.nombre === (mapped.barrio as string) && b.city_id === city.id
      );
      if (!barrioRec) {
        result.errors.push({
          fila,
          motivo: `Barrio no encontrado: ${mapped.barrio} en ${mapped.ciudad}`,
        });
        result.skipped++;
        continue;
      }

      const tipo = tipoByName.get(mapped.tipo as string);
      if (!tipo) {
        result.errors.push({ fila, motivo: `Tipo no encontrado: ${mapped.tipo}` });
        result.skipped++;
        continue;
      }

      const op = opByName.get(mapped.operacion as string);
      if (!op) {
        result.errors.push({
          fila,
          motivo: `Operación no encontrada: ${mapped.operacion}`,
        });
        result.skipped++;
        continue;
      }

      const moneda = (mapped.moneda as string) || "USD";
      const cur = curByCode.get(moneda);
      if (!cur) {
        result.errors.push({ fila, motivo: `Moneda no encontrada: ${moneda}` });
        result.skipped++;
        continue;
      }

      // Build amenities
      const amenityIds: string[] = [];
      if (mapping.amenityFields) {
        for (const field of mapping.amenityFields) {
          const val = mapped[field];
          if (val === true || val === "true" || val === true) {
            const name =
              mapping.amenityMapping?.[field] ||
              field.charAt(0).toUpperCase() + field.slice(1);
            const amenity = amenityByName.get(name);
            if (amenity) amenityIds.push(amenity.id);
          }
        }
      }

      const fotos = Array.isArray(mapped.fotos) ? (mapped.fotos as string[]) : [];

      // Handle amenitiesExtra (from detail page boolean features)
      const extraAmenities: string[] = mapped.amenitiesExtra as string[] || [];
      for (const name of extraAmenities) {
        const normalized = name.trim();
        const existingAmenity = allAmenities.find(
          (a) => a.nombre.toLowerCase() === normalized.toLowerCase()
        );
        if (existingAmenity) {
          if (!amenityIds.includes(existingAmenity.id)) amenityIds.push(existingAmenity.id);
        } else {
          // Create new amenity on the fly
          const slug = normalized
            .toLowerCase()
            .replace(/[^a-z0-9áéíóúñü\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
          try {
            const created = await prisma.amenity.create({
              data: { nombre: normalized, slug, grupo: null },
            });
            allAmenities.push(created);
            amenityByName.set(created.nombre, created);
            amenityIds.push(created.id);
          } catch {
            // Duplicate or error, skip
          }
        }
      }

      if (dryRun) {
        console.log(
          `[${fila}] ${mapped.direccion}, ${mapped.barrio} — ${mapped.operacion} — $${mapped.precio}`
        );
        continue;
      }

      // Check for duplicate by direccion + barrio + operacion
      const existing = await prisma.property.findFirst({
        where: {
          direccion: mapped.direccion as string,
          barrio_id: barrioRec.id,
          operation_id: op.id,
        },
      });

      if (existing) {
        // Update existing
        await prisma.property.update({
          where: { id: existing.id },
          data: {
            city_id: city.id,
            property_type_id: tipo.id,
            currency_id: cur.id,
            precio: Number(mapped.precio),
            m2_totales: Number(mapped.m2Totales),
            m2_cubiertos: Number(mapped.m2Cubiertos),
            ambientes: Number(mapped.ambientes),
            dormitorios: Number(mapped.dormitorios),
            banos: Number(mapped.banos),
            descripcion: mapped.descripcion as string,
            lat: (mapped.lat as number) ?? -34.9215,
            lng: (mapped.lng as number) ?? -57.9545,
            apto_banco: !!mapped.aptoBanco,
            permuta: !!mapped.permuta,
            piso: (mapped.piso as string) || null,
            antiguedad: (mapped.antiguedad as string) || null,
            m2_terreno: mapped.m2Terreno ? Number(mapped.m2Terreno) : undefined,
            m2_descubierta: mapped.m2Descubierta ? Number(mapped.m2Descubierta) : undefined,
            cant_plantas: mapped.cantPlantas ? Number(mapped.cantPlantas) : undefined,
            expensas: (mapped.expensas as string) || null,
            activo: true,
          },
        });

        if (fotos.length > 0) {
          await prisma.propertyPhoto.deleteMany({ where: { property_id: existing.id } });
          await prisma.propertyPhoto.createMany({
            data: fotos.map((url, idx) => ({
              property_id: existing.id,
              url,
              orden: idx,
            })),
          });
        }

        if (amenityIds.length > 0) {
          await prisma.propertyAmenity.deleteMany({ where: { property_id: existing.id } });
          await prisma.propertyAmenity.createMany({
            data: amenityIds.map((amenity_id) => ({
              property_id: existing.id,
              amenity_id,
            })),
          });
        }

        // Handle detalles (key-value specs from ArgentProp detail pages)
        if (mapped.detalles) {
          const entries = Object.entries(mapped.detalles as Record<string, string>);
          if (entries.length > 0) {
            await prisma.propertyDetail.deleteMany({ where: { property_id: existing.id } });
            await prisma.propertyDetail.createMany({
              data: entries.map(([clave, valor]) => ({
                property_id: existing.id,
                seccion: "Características",
                clave,
                valor,
              })),
            });
          }
        }

        result.imported++;
        process.stdout.write("u");
      } else {
        // Create new
        await prisma.property.create({
          data: {
            city_id: city.id,
            barrio_id: barrioRec.id,
            property_type_id: tipo.id,
            operation_id: op.id,
            currency_id: cur.id,
            direccion: mapped.direccion as string,
            precio: Number(mapped.precio),
            m2_totales: Number(mapped.m2Totales),
            m2_cubiertos: Number(mapped.m2Cubiertos),
            ambientes: Number(mapped.ambientes),
            dormitorios: Number(mapped.dormitorios),
            banos: Number(mapped.banos),
            descripcion: mapped.descripcion as string,
            lat: (mapped.lat as number) ?? -34.9215,
            lng: (mapped.lng as number) ?? -57.9545,
            apto_banco: !!mapped.aptoBanco,
            permuta: !!mapped.permuta,
            piso: (mapped.piso as string) || null,
            antiguedad: (mapped.antiguedad as string) || null,
            m2_terreno: mapped.m2Terreno ? Number(mapped.m2Terreno) : undefined,
            m2_descubierta: mapped.m2Descubierta ? Number(mapped.m2Descubierta) : undefined,
            cant_plantas: mapped.cantPlantas ? Number(mapped.cantPlantas) : undefined,
            expensas: (mapped.expensas as string) || null,
            activo: true,
            photos: {
              create: fotos.map((url, idx) => ({ url, orden: idx })),
            },
            amenities: {
              create: amenityIds.map((amenity_id) => ({ amenity_id })),
            },
            detalles: mapped.detalles
              ? {
                  create: Object.entries(mapped.detalles as Record<string, string>).map(
                    ([clave, valor]) => ({
                      seccion: "Características",
                      clave,
                      valor,
                    })
                  ),
                }
              : undefined,
          },
        });

        result.imported++;
        process.stdout.write(".");
      }
    } catch (e: any) {
      result.errors.push({ fila, motivo: e.message });
      result.skipped++;
    }
  }

  // Report
  console.log("\n\n── Resultado ──");
  console.log(`Total:         ${result.total}`);
  console.log(`Importados:    ${result.imported}`);
  console.log(`Saltados:      ${result.skipped}`);
  console.log(`Errores:       ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log("\nDetalle de errores:");
    for (const e of result.errors.slice(0, 20)) {
      console.log(`  Fila ${e.fila}: ${e.motivo}`);
    }
    if (result.errors.length > 20) {
      console.log(`  ... y ${result.errors.length - 20} más`);
    }
  }

  await prisma.$disconnect();
  process.exit(result.errors.length > 0 ? 1 : 0);
}

function mapRow(
  row: Record<string, string>,
  normalizedHeaders: string[],
  origHeaders: string[],
  mapping: CsvMapping
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  for (const [csvCol, colMapping] of Object.entries(mapping.columnas)) {
    const idx = normalizedHeaders.indexOf(csvCol);
    const raw = idx !== -1 ? row[origHeaders[idx]] : undefined;
    const val = raw !== undefined && raw !== "" ? raw : colMapping.default;

    if (val !== undefined && val !== null && colMapping.transform) {
      try {
        mapped[colMapping.campo] = colMapping.transform(String(val));
      } catch {
        mapped[colMapping.campo] = val;
      }
    } else {
      mapped[colMapping.campo] = val;
    }
  }

  return mapped;
}

main();
