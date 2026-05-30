import { parse } from "csv-parse/sync";
import { readFileSync, existsSync } from "fs";

interface ColumnMapping {
  campo: string;
  required?: boolean;
  default?: unknown;
  transform?: (v: string) => unknown;
}

interface CsvMapping {
  columnas: Record<string, ColumnMapping>;
  columnAliases?: Record<string, string>;
  amenityFields?: string[];
  amenityMapping?: Record<string, string>;
}

async function loadMapping(mapName: string): Promise<CsvMapping> {
  try {
    const mod = await import(`./maps/${mapName}`);
    return mod.default as CsvMapping;
  } catch (e) {
    console.error(`Mapping no encontrado: ${mapName}`, e);
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

async function main() {
  const args = process.argv.slice(2);
  const fileFlag = args.indexOf("--file");
  const mapFlag = args.indexOf("--map");

  const filePath = fileFlag !== -1 ? args[fileFlag + 1] : "datos-argenprop.csv";
  const mapName = mapFlag !== -1 ? args[mapFlag + 1] : "argenprop";

  if (!existsSync(filePath)) {
    console.error(`Archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  const mapping = await loadMapping(mapName);
  const csvContent = readFileSync(filePath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  if (records.length === 0) {
    console.log("CSV vacío.");
    return;
  }

  const headers = Object.keys(records[0]);
  const normalizedHeaders = headers.map((col) => normalizeHeader(col, mapping));

  const missing: { idx: number; direccion: string; ciudad?: string; barrio?: string; fotos?: string }[] = [];
  let withFotos = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const mapped = mapRow(row, normalizedHeaders, headers, mapping);
    const fotos = Array.isArray(mapped.fotos) ? (mapped.fotos as string[]) : [];
    if (!fotos || fotos.length === 0) {
      missing.push({
        idx: i + 2,
        direccion: String(mapped.direccion || ""),
        ciudad: String(mapped.ciudad || ""),
        barrio: String(mapped.barrio || ""),
        fotos: Array.isArray(mapped.fotos) ? (mapped.fotos as string[]).join("|") : String(mapped.fotos || ""),
      });
    } else {
      withFotos++;
    }
  }

  console.log(`Total registros: ${records.length}`);
  console.log(`Con fotos: ${withFotos}`);
  console.log(`Sin fotos: ${missing.length}`);

  if (missing.length > 0) {
    console.log(`\nLista (primeras 50) de propiedades sin fotos:`);
    for (const m of missing.slice(0, 50)) {
      console.log(`  Fila ${m.idx}: ${m.direccion} — ${m.ciudad} / ${m.barrio} — fotos: "${m.fotos}"`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
