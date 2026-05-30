import { prisma } from "../src/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-ci";

export async function seedTestFixtures() {
  const ts = Date.now();
  const city = await prisma.city.upsert({
    where: { nombre: "__Test_City__" },
    update: {},
    create: { nombre: "__Test_City__", slug: "__test-city-" + ts },
  });

  const centro = await prisma.barrio.create({
    data: { nombre: "__Test_Barrio__" + ts, city_id: city.id },
  });

  const casa = await prisma.propertyType.upsert({
    where: { nombre: "__Test_Casa__" },
    update: {},
    create: { nombre: "__Test_Casa__", slug: "__test-casa__" },
  });

  const venta = await prisma.operation.upsert({
    where: { nombre: "__Test_Venta__" },
    update: {},
    create: { nombre: "__Test_Venta__", slug: "__test-venta__" },
  });

  const usd = await prisma.currency.upsert({
    where: { codigo: "USD" },
    update: {},
    create: { codigo: "USD", simbolo: "$" },
  });

  const cochera = await prisma.amenity.upsert({
    where: { nombre: "Cochera" },
    update: {},
    create: { nombre: "Cochera", slug: "cochera", icono: "car" },
  });

  const admin = await prisma.admin.create({
    data: {
      email: `__test__admin_${Date.now()}@test.com`,
      password: "$2a$10$dummyhashfortestingonly1234567890abcd",
      nombre: "Test Admin",
    },
  });

  const property = await prisma.property.create({
    data: {
      city_id: city.id,
      barrio_id: centro.id,
      property_type_id: casa.id,
      operation_id: venta.id,
      currency_id: usd.id,
      direccion: "__Test__Calle 123",
      precio: 250000,
      m2_totales: 120,
      m2_cubiertos: 80,
      ambientes: 3,
      dormitorios: 2,
      banos: 1,
      descripcion: "__Test__propiedad de prueba",
      lat: -34.9205,
      lng: -57.9355,
      activo: true,
      apto_banco: true,
      permuta: false,
    },
  });

  await prisma.propertyPhoto.create({
    data: { property_id: property.id, url: "__test__https://res.cloudinary.com/test/image1.jpg", orden: 0 },
  });
  await prisma.propertyPhoto.create({
    data: { property_id: property.id, url: "__test__https://res.cloudinary.com/test/image2.jpg", orden: 1 },
  });

  await prisma.propertyAmenity.create({
    data: { property_id: property.id, amenity_id: cochera.id },
  });

  return {
    city, centro, casa, venta, usd, cochera, admin, property,
  };
}

export function generateTestToken(adminId: string): string {
  return jwt.sign(
    { adminId, email: "__test__admin@test.com" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}
