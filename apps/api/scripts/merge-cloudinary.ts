import { parse } from "csv-parse/sync";
import { readFileSync, writeFileSync } from "fs";

const CSV_PATH = "datos-argenprop.csv";
const CLOUD_NAME = "dkwd8oqdh";
const FOLDER = "comesana-propiedades";

const content = readFileSync(CSV_PATH, "utf-8");
const records = parse(content, { columns: true, skip_empty_lines: true, trim: true, bom: true });

const allRows: string[] = [];
const headers = Object.keys(records[0]);
allRows.push(headers.join(","));

for (const row of records) {
  const oldFotos = (row.fotos || "").split("|").filter(Boolean);
  const id = row._id || "";
  const cloudFotos = oldFotos.map((_: string, i: number) =>
    `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${FOLDER}/argenprop-${id}-${i}`
  );
  // If no id, try to extract from old URLs
  if (cloudFotos.length === 0) {
    for (let i = 0; i < oldFotos.length; i++) {
      cloudFotos.push(
        `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${FOLDER}/unknown-${i}`
      );
    }
  }
  row.fotos = cloudFotos.join("|");
  const vals = headers.map((h) => {
    const v = String(row[h] ?? "");
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  });
  allRows.push(vals.join(","));
}

writeFileSync(CSV_PATH, "\uFEFF" + allRows.join("\n"), "utf-8");
console.log(`✓ ${records.length} rows updated with Cloudinary URLs → ${CSV_PATH}`);
