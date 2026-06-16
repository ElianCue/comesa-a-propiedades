import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌆 Sincronizando ciudades y barrios...\n");

  const entries: { ciudad: string; barrios: string[] }[] = [
    { ciudad: "La Plata", barrios: ["Centro", "Tolosa", "Gonnet", "City Bell", "Villa Elisa", "Altos de San Lorenzo", "Los Hornos", "San Carlos", "Ringuelet"] },
    { ciudad: "Mar del Plata", barrios: ["Centro", "La Perla", "Playa Grande"] },
  ];

  for (const { ciudad, barrios } of entries) {
    const slug = ciudad
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

    const city = await prisma.city.upsert({
      where: { nombre: ciudad },
      update: { slug },
      create: { nombre: ciudad, slug },
    });
    console.log(`  ✓ ${ciudad}`);

    for (const nombre of barrios) {
      await prisma.barrio.upsert({
        where: { city_id_nombre: { city_id: city.id, nombre } },
        update: {},
        create: { nombre, city_id: city.id },
      });
    }
    console.log(`    ${barrios.length} barrios`);
  }

  console.log("\n✅ Sincronización completa!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
