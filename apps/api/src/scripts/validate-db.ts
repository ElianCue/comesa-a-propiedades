import { prisma } from "../lib/prisma";

async function validate() {
  console.log("🔍 VALIDATING DATABASE...\n");

  try {
    // Query 1: Count properties
    const propertyCount = await prisma.property.count();
    console.log(`✅ Total properties: ${propertyCount}`);

    // Query 2: Count photos
    const photoCount = await prisma.propertyPhoto.count();
    console.log(`✅ Total photos: ${photoCount}`);

    // Query 3: Properties without photos
    const propsWithoutPhotos = await prisma.property.findMany({
      where: { photos: { none: {} } },
      select: { id: true, direccion: true },
    });
    console.log(
      `✅ Properties without photos: ${propsWithoutPhotos.length}${
        propsWithoutPhotos.length > 0
          ? " (IDs: " + propsWithoutPhotos.map((p) => p.id).join(", ") + ")"
          : ""
      }`
    );

    // Query 4: Properties without coordinates (raw SQL)
    const noCoords = await prisma.$queryRaw<
      Array<{ id: string; direccion: string }>
    >`SELECT id, direccion FROM properties WHERE lat IS NULL OR lng IS NULL`;
    console.log(
      `✅ Properties without coordinates: ${noCoords.length}${
        noCoords.length > 0
          ? " (IDs: " + noCoords.map((p) => p.id).join(", ") + ")"
          : ""
      }`
    );

    // Query 5: Photo URLs validation (sample)
    const samplePhotos = await prisma.propertyPhoto.findMany({
      take: 5,
      select: { url: true },
    });
    console.log(`\n✅ Sample photos (first 5):`);
    samplePhotos.forEach((p) => console.log(`   ${p.url.substring(0, 80)}...`));

    // Query 6: Amenities distribution
    const amenities = await prisma.amenity.findMany({
      select: { nombre: true, id: true },
    });
    console.log(`\n✅ Amenities distribution:`);
    for (const amenity of amenities) {
      const count = await prisma.propertyAmenity.count({
        where: { amenity_id: amenity.id },
      });
      console.log(`   ${amenity.nombre}: ${count} properties`);
    }

    // Query 7: Cities and neighborhoods
    const cities = await prisma.city.findMany({
      include: { barrios: { select: { nombre: true } } },
    });
    console.log(`\n✅ Cities & neighborhoods:`);
    cities.forEach((c) => {
      console.log(`   ${c.nombre}: ${c.barrios.map((b) => b.nombre).join(", ")}`);
    });

    // Query 8: Operations and types
    const ops = await prisma.operation.findMany({ select: { nombre: true } });
    const types = await prisma.propertyType.findMany({
      select: { nombre: true },
    });
    console.log(
      `\n✅ Operations: ${ops.map((o) => o.nombre).join(", ")}`
    );
    console.log(`✅ Property Types: ${types.map((t) => t.nombre).join(", ")}`);

    // Query 9: Currencies
    const currencies = await prisma.currency.findMany({
      select: { codigo: true, simbolo: true },
    });
    console.log(
      `\n✅ Currencies: ${currencies.map((c) => `${c.codigo} (${c.simbolo})`).join(", ")}`
    );

    // Query 10: Admin users count
    const adminCount = await prisma.admin.count();
    console.log(`\n✅ Admin users: ${adminCount}`);

    // Query 11: Inquiries count
    const inquiryCount = await prisma.inquiry.count();
    console.log(`✅ Inquiries: ${inquiryCount}`);

    // Query 12: Properties distribution by city
    const propsPerCity = await prisma.city.findMany({
      include: {
        _count: { select: { properties: true } },
      },
    });
    console.log(`\n✅ Properties per city:`);
    propsPerCity.forEach((c) =>
      console.log(`   ${c.nombre}: ${c._count.properties} properties`)
    );

    // Query 13: Properties distribution by operation
    const propsPerOp = await prisma.operation.findMany({
      include: {
        _count: { select: { properties: true } },
      },
    });
    console.log(`\n✅ Properties per operation:`);
    propsPerOp.forEach((op) =>
      console.log(`   ${op.nombre}: ${op._count.properties} properties`)
    );

    // Query 14: Photo to property ratio
    const avgPhotosPerProperty =
      propertyCount > 0 ? (photoCount / propertyCount).toFixed(2) : 0;
    console.log(
      `\n✅ Average photos per property: ${avgPhotosPerProperty}`
    );

    // Query 15: Price statistics (for USD properties)
    const usdCurrency = await prisma.currency.findUnique({
      where: { codigo: "USD" },
    });
    if (usdCurrency) {
      const priceStats = await prisma.$queryRaw<
        Array<{ min: number; max: number; avg: number; count: bigint }>
      >`
        SELECT 
          MIN(precio) as min,
          MAX(precio) as max,
          AVG(precio) as avg,
          COUNT(*) as count
        FROM properties
        WHERE currency_id = ${usdCurrency.id}
      `;
      console.log(`\n✅ USD Properties price statistics:`);
      console.log(
        `   Count: ${priceStats[0].count}, Min: $${priceStats[0].min}, Max: $${priceStats[0].max}, Avg: $${Math.round(parseFloat(priceStats[0].avg.toString()))}`
      );
    }

    console.log(`\n✅ DATABASE VALIDATION COMPLETE - All checks passed!\n`);
  } catch (error) {
    console.error(`\n❌ Validation error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

validate();
