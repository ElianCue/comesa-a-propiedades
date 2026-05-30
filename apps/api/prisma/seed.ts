import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Ciudades ──
  const lp = await prisma.city.create({ data: { nombre: "La Plata", slug: "la-plata" } });
  const mdp = await prisma.city.create({ data: { nombre: "Mar del Plata", slug: "mar-del-plata" } });
  console.log("  ✓ Cities");

  // ── Barrios ──
  const lpBarrios = [
    "Centro", "Tolosa", "Gonnet", "City Bell",
    "Villa Elisa", "Altos de San Lorenzo", "Los Hornos", "San Carlos", "Ringuelet",
  ];
  const mdpBarrios = ["Centro", "La Perla", "Playa Grande"];

  const barrios: Record<string, string> = {};
  for (const nombre of lpBarrios) {
    const b = await prisma.barrio.create({ data: { nombre, city_id: lp.id } });
    barrios[nombre] = b.id;
  }
  for (const nombre of mdpBarrios) {
    const b = await prisma.barrio.create({ data: { nombre, city_id: mdp.id } });
    barrios[nombre] = b.id;
  }
  console.log("  ✓ Barrios");

  // ── Property Types ──
  const casa = await prisma.propertyType.create({ data: { nombre: "Casa", slug: "casa" } });
  const depto = await prisma.propertyType.create({ data: { nombre: "Depto", slug: "depto" } });
  const ph = await prisma.propertyType.create({ data: { nombre: "PH", slug: "ph" } });
  const local = await prisma.propertyType.create({ data: { nombre: "Local", slug: "local" } });
  const terreno = await prisma.propertyType.create({ data: { nombre: "Terreno", slug: "terreno" } });
  const campo = await prisma.propertyType.create({ data: { nombre: "Campo", slug: "campo" } });
  const oficina = await prisma.propertyType.create({ data: { nombre: "Oficina", slug: "oficina" } });
  const hotel = await prisma.propertyType.create({ data: { nombre: "Hotel", slug: "hotel" } });
  const negocioEspecial = await prisma.propertyType.create({ data: { nombre: "Negocio Especial", slug: "negocio-especial" } });
  const quinta = await prisma.propertyType.create({ data: { nombre: "Quinta", slug: "quinta" } });
  const fondoComercio = await prisma.propertyType.create({ data: { nombre: "Fondo Comercio", slug: "fondo-comercio" } });
  const galpon = await prisma.propertyType.create({ data: { nombre: "Galpon", slug: "galpon" } });
  const cochera = await prisma.propertyType.create({ data: { nombre: "Cochera", slug: "cochera" } });
  const tipos = {
    Casa: casa.id, Depto: depto.id, PH: ph.id, Local: local.id, Terreno: terreno.id,
    Campo: campo.id, Oficina: oficina.id, Hotel: hotel.id,
    "Negocio Especial": negocioEspecial.id, Quinta: quinta.id,
    "Fondo Comercio": fondoComercio.id, Galpon: galpon.id, Cochera: cochera.id,
  };
  console.log("  ✓ Property types");

  // ── Operations ──
  const venta = await prisma.operation.create({ data: { nombre: "Venta", slug: "venta" } });
  const alquiler = await prisma.operation.create({ data: { nombre: "Alquiler", slug: "alquiler" } });
  const ops = { Venta: venta.id, Alquiler: alquiler.id };
  console.log("  ✓ Operations");

  // ── Currencies ──
  const usd = await prisma.currency.create({ data: { codigo: "USD", simbolo: "US$" } });
  const ars = await prisma.currency.create({ data: { codigo: "ARS", simbolo: "$" } });
  const monedas = { USD: usd.id, ARS: ars.id };
  console.log("  ✓ Currencies");

  // ── Amenities ──
  const amenityData = [
    { nombre: "Cochera", slug: "cochera", icono: "Car" },
    { nombre: "Balcón", slug: "balcon", icono: "Expand" },
    { nombre: "Jardín", slug: "jardin", icono: "TreePine" },
    { nombre: "Parrilla", slug: "parrilla", icono: "CookingPot" },
    { nombre: "Pileta", slug: "pileta", icono: "Waves" },
  ];
  const amenities: Record<string, string> = {};
  for (const a of amenityData) {
    const amenity = await prisma.amenity.create({ data: a });
    amenities[a.nombre] = amenity.id;
  }
  console.log("  ✓ Amenities");

  // ── Properties ──
  const properties = [
    {
      ciudad: "La Plata", barrio: "Centro", tipo: "Casa", operacion: "Venta",
      direccion: "Calle 47 entre 12 y 13", precio: 185000, moneda: "USD",
      m2_totales: 280, m2_cubiertos: 220, ambientes: 5, dormitorios: 3, banos: 2,
      cochera: true, balcon: false, jardin: true, parrilla: true, pileta: false,
      antiguedad: "15 años",
      descripcion: "Hermosa casa familiar en pleno centro de La Plata, con jardín amplio y quincho con parrilla. Pisos de madera, cocina renovada, excelente luminosidad.",
      lat: -34.9214, lng: -57.9544,
      fotos: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      ],
    },
    {
      ciudad: "La Plata", barrio: "Centro", tipo: "Depto", operacion: "Alquiler",
      direccion: "Calle 7 N° 1234, Piso 5", precio: 420000, moneda: "ARS",
      m2_totales: 65, m2_cubiertos: 60, ambientes: 2, dormitorios: 1, banos: 1,
      cochera: false, balcon: true, jardin: false, parrilla: false, pileta: false,
      piso: "5° A", antiguedad: "10 años",
      descripcion: "Departamento luminoso de 2 ambientes a metros de la Plaza San Martín. Balcón con vista despejada, edificio con encargado.",
      lat: -34.9216, lng: -57.9540,
      fotos: [
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
      ],
    },
    {
      ciudad: "Mar del Plata", barrio: "Playa Grande", tipo: "Casa", operacion: "Venta",
      direccion: "Av. Colón 3245", precio: 320000, moneda: "USD",
      m2_totales: 350, m2_cubiertos: 250, ambientes: 6, dormitorios: 4, banos: 3,
      cochera: true, balcon: false, jardin: true, parrilla: true, pileta: true,
      antiguedad: "5 años",
      descripcion: "Impecable casa en Playa Grande a dos cuadras del mar. Amplios espacios con diseño moderno, pileta y parrilla. La mejor zona de Mar del Plata.",
      lat: -38.0055, lng: -57.5426,
      fotos: [
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
      ],
    },
    {
      ciudad: "Mar del Plata", barrio: "Centro", tipo: "Depto", operacion: "Venta",
      direccion: "San Martín 2850, Piso 12", precio: 145000, moneda: "USD",
      m2_totales: 80, m2_cubiertos: 70, ambientes: 3, dormitorios: 2, banos: 2,
      cochera: true, balcon: true, jardin: false, parrilla: false, pileta: false,
      piso: "12° A", antiguedad: "10 años",
      descripcion: "Departamento con vista al mar en pleno centro de Mardel. Cochera cubierta incluida. Excelente inversión.",
      lat: -38.0020, lng: -57.5570,
      fotos: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
        "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80",
      ],
    },
    {
      ciudad: "Mar del Plata", barrio: "La Perla", tipo: "PH", operacion: "Alquiler",
      direccion: "Bolívar 1850", precio: 280000, moneda: "ARS",
      m2_totales: 90, m2_cubiertos: 70, ambientes: 3, dormitorios: 2, banos: 1,
      cochera: false, balcon: false, jardin: true, parrilla: true, pileta: false,
      antiguedad: "20 años",
      descripcion: "PH con patio en La Perla, a metros de la playa. Ideal para disfrutar el verano o como vivienda permanente.",
      lat: -38.0120, lng: -57.5380,
      fotos: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
      ],
    },
  ];

  for (const p of properties) {
    const amenitiesList: string[] = [];
    if (p.cochera) amenitiesList.push("Cochera");
    if (p.balcon) amenitiesList.push("Balcón");
    if (p.jardin) amenitiesList.push("Jardín");
    if (p.parrilla) amenitiesList.push("Parrilla");
    if (p.pileta) amenitiesList.push("Pileta");

    const property = await prisma.property.create({
      data: {
        city_id: p.ciudad === "La Plata" ? lp.id : mdp.id,
        barrio_id: barrios[p.barrio],
        property_type_id: tipos[p.tipo as keyof typeof tipos],
        operation_id: ops[p.operacion as keyof typeof ops],
        currency_id: monedas[p.moneda as keyof typeof monedas],
        direccion: p.direccion,
        precio: p.precio,
        m2_totales: p.m2_totales,
        m2_cubiertos: p.m2_cubiertos,
        ambientes: p.ambientes,
        dormitorios: p.dormitorios,
        banos: p.banos,
        piso: (p as any).piso,
        antiguedad: p.antiguedad,
        descripcion: p.descripcion,
        lat: p.lat,
        lng: p.lng,
        activo: true,
        photos: {
          create: p.fotos.map((url, i) => ({ url, orden: i })),
        },
        amenities: {
          create: amenitiesList.map((a) => ({ amenity_id: amenities[a] })),
        },
      },
    });
    console.log(`  ✓ ${p.tipo} en ${p.barrio}, ${p.ciudad}`);
  }

  // ── Admin ──
  const adminEmail = process.env.ADMIN_EMAIL || "admin@comesana.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "comesana2025";
  const hashed = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { password: hashed },
    create: {
      email: adminEmail,
      password: hashed,
      nombre: "Admin",
    },
  });
  console.log("  ✓ Admin user");

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
