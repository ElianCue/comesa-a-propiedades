import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const CWD = process.cwd();
import minimist from "minimist";

const argv = minimist(process.argv.slice(2), { boolean: ["dry-run"], string: ["file", "out"] });
const CSV_PATH = path.resolve(CWD, argv.file || "datos-argenprop.csv");
const OUT_PATH = argv.out ? path.resolve(CWD, argv.out) : CSV_PATH;
const DRY = Boolean(argv["dry-run"]);

function csv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  if (!existsSync(CSV_PATH)) {
    console.error("CSV not found: datos-argenprop.csv");
    process.exit(1);
  }

  const content = readFileSync(CSV_PATH, "utf-8");
  const rows = parse(content, { columns: true, skip_empty_lines: true, bom: true }) as Record<string, string>[];

  console.log(`Rows: ${rows.length}`);

  const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
  const UA = "ComensanaPropiedadesBot/1.0";

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.lat && r.lng) continue; // already has coords

    const parts = [r.direccion, r.barrio, r.ciudad, "Argentina"].filter(Boolean);
    const query = parts.join(", ");
    try {
      const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) {
        console.log(`  ${i + 1}/${rows.length}: HTTP ${res.status} — ${query}`);
        continue;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        rows[i].lat = data[0].lat;
        rows[i].lng = data[0].lon;
        console.log(`  ${i + 1}/${rows.length}: ${rows[i].lat},${rows[i].lng}`);
      } else {
        console.log(`  ${i + 1}/${rows.length}: no result — ${query}`);
      }
    } catch (e: any) {
      console.log(`  ${i + 1}/${rows.length}: error ${e?.message || e}`);
    }

    // sleep 1s to be polite
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Write back CSV
  const header = Object.keys(rows[0] || {}).join(",");
  const out = [header].concat(rows.map((r) => Object.values(r).map(csv).join(","))).join("\n");
  if (DRY) {
    console.log(`DRY RUN - would write to ${OUT_PATH}`);
  } else {
    writeFileSync(OUT_PATH, "\uFEFF" + out, "utf-8");
    console.log(`Updated CSV with geocoded coords: ${OUT_PATH}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
