import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LP_BARRIOS_NUEVOS = [
  "Barrio Norte", "Dolores", "Estacion Gomez", "Ignacio Correas Arana",
  "Jose Hernandez", "Lisandro Olmos", "Melchor Romero",
  "Parque Saavedra", "Parque San Martín", "Villa Elvira",
  "Sin barrio",
];

const MDP_BARRIOS_NUEVOS = [
  "Barrio Colinas de Peralta Ramos", "Punta Mogotes", "Terminal", "Varese",
  "Sin barrio",
];

const TIPOS_NUEVOS = [
  { nombre: "Campo", slug: "campo" },
  { nombre: "Oficina", slug: "oficina" },
  { nombre: "Hotel", slug: "hotel" },
  { nombre: "Negocio Especial", slug: "negocio-especial" },
  { nombre: "Quinta", slug: "quinta" },
  { nombre: "Fondo Comercio", slug: "fondo-comercio" },
  { nombre: "Galpon", slug: "galpon" },
  { nombre: "Cochera", slug: "cochera" },
];

async function main() {
  console.log("Actualizando lookup tables...\n");

  const cities = await prisma.city.findMany();
  const lp = cities.find((c) => c.nombre === "La Plata");
  const mdp = cities.find((c) => c.nombre === "Mar del Plata");

  if (!lp || !mdp) {
    console.log("❌ Ciudades no encontradas. Ejecutá primero pnpm db:seed");
    await prisma.$disconnect();
    return;
  }

  // ── Nuevas ciudades ──
  let st = cities.find((c) => c.nombre === "Santa Teresita");
  if (!st) {
    st = await prisma.city.create({ data: { nombre: "Santa Teresita", slug: "santa-teresita" } });
    console.log("  + Ciudad: Santa Teresita");
  }

  const SANTA_TERESITA_BARRIOS = ["Centro"];
  for (const nombre of SANTA_TERESITA_BARRIOS) {
    const exists = await prisma.barrio.findFirst({
      where: { nombre, city_id: st.id },
    });
    if (!exists) {
      await prisma.barrio.create({ data: { nombre, city_id: st.id } });
      console.log(`  + Barrio ST: ${nombre}`);
    }
  }

  // ── Barrios ──
  let count = 0;
  for (const nombre of LP_BARRIOS_NUEVOS) {
    const exists = await prisma.barrio.findFirst({
      where: { nombre, city_id: lp.id },
    });
    if (!exists) {
      await prisma.barrio.create({ data: { nombre, city_id: lp.id } });
      console.log(`  + Barrio LP: ${nombre}`);
      count++;
    }
  }
  for (const nombre of MDP_BARRIOS_NUEVOS) {
    const exists = await prisma.barrio.findFirst({
      where: { nombre, city_id: mdp.id },
    });
    if (!exists) {
      await prisma.barrio.create({ data: { nombre, city_id: mdp.id } });
      console.log(`  + Barrio MDP: ${nombre}`);
      count++;
    }
  }
  if (count === 0) console.log("  ✓ Todos los barrios ya existen");
  else console.log(`  → ${count} barrios agregados`);

  // ── Property Types ──
  count = 0;
  for (const t of TIPOS_NUEVOS) {
    const exists = await prisma.propertyType.findUnique({
      where: { nombre: t.nombre },
    });
    if (!exists) {
      await prisma.propertyType.create({ data: t });
      console.log(`  + Tipo: ${t.nombre}`);
      count++;
    }
  }
  if (count === 0) console.log("  ✓ Todos los tipos ya existen");
  else console.log(`  → ${count} tipos agregados`);

  console.log("\n✅ Lookup tables actualizadas.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
