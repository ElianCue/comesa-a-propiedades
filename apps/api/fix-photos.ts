import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.propertyPhoto.findMany();
  let deleted = 0;
  for (const ph of all) {
    if (!/^https?:\/\//i.test(ph.url)) {
      await prisma.propertyPhoto.delete({ where: { id: ph.id } });
      deleted++;
      console.log("  ✗ deleted: " + ph.url.substring(0, 60));
    }
  }
  console.log("\n✓ " + deleted + " fotos inválidas eliminadas");
  const remaining = await prisma.propertyPhoto.count();
  console.log("  Quedan: " + remaining);
  await prisma.$disconnect();
}
main().catch(console.error);
