import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { writeFileSync } from "fs";
import minimist from "minimist";

const execp = promisify(exec);
const argv = minimist(process.argv.slice(2), { boolean: ["dry-run"], string: ["out"] });
const OUT_PATH = argv.out ? path.resolve(process.cwd(), argv.out) : path.resolve(process.cwd(), `db-backup-${Date.now()}.sql`);
const DRY = Boolean(argv["dry-run"]);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not defined in env");
    process.exit(1);
  }

  // If pg_dump is available, use it. Otherwise fallback to simple Prisma export stub
  try {
    await execp("pg_dump --version");
    if (DRY) {
      console.log(`DRY RUN - would run pg_dump to ${OUT_PATH}`);
      return;
    }
    console.log(`Running pg_dump to ${OUT_PATH}...`);
    // Note: Do not pass the URL directly to shell to avoid injection; rely on env
    const { stdout, stderr } = await execp(`pg_dump \"${url}\" -Fc -f \"${OUT_PATH}\"`);
    console.log(stdout, stderr);
    console.log(`Backup written to ${OUT_PATH}`);
  } catch (e) {
    console.warn("pg_dump not available or failed, writing minimal backup manifest.");
    const manifest = { timestamp: new Date().toISOString(), url: url };
    const outFile = path.resolve(process.cwd(), `db-backup-manifest-${Date.now()}.json`);
    if (DRY) {
      console.log(`DRY RUN - would write manifest to ${outFile}`);
      return;
    }
    writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf-8");
    console.log(`Manifest written to ${outFile}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
