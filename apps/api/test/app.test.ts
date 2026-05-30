import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/index";
import { prisma } from "../src/lib/prisma";
import { seedTestFixtures, generateTestToken } from "./fixtures";

const runIntegration = Boolean(process.env.INTEGRATION_TEST);

describe.runIf(runIntegration)("Auth", () => {
  let adminId: string;

  beforeAll(async () => {
    const f = await seedTestFixtures();
    adminId = f.admin.id;
  }, 30000);

  it("POST /api/auth/login returns 401 for wrong credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong@test.com", password: "wrong" });

    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me returns admin with valid token", async () => {
    const token = generateTestToken(adminId);
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it("GET /api/auth/me returns null without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});

describe("Public API (no auth required)", () => {
  it("GET /api/health returns status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
  });

  it("GET /api/lookup/cities returns array", async () => {
    const res = await request(app).get("/api/lookup/cities");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/lookup/amenities returns array", async () => {
    const res = await request(app).get("/api/lookup/amenities");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/lookup/property-types returns array", async () => {
    const res = await request(app).get("/api/lookup/property-types");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/lookup/operations returns array", async () => {
    const res = await request(app).get("/api/lookup/operations");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/lookup/currencies returns array", async () => {
    const res = await request(app).get("/api/lookup/currencies");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("has all required routes defined", () => {
    const router = (app as any)._router;
    expect(router).toBeDefined();
  });
});

describe.runIf(runIntegration)("Property CRUD", () => {
  let f: any;
  let propertyId: string;
  let authToken: string;

  beforeAll(async () => {
    f = await seedTestFixtures();
    authToken = generateTestToken(f.admin.id);
    propertyId = f.property.id;
  }, 30000);

  it("POST /api/properties creates a new property", async () => {
    const res = await request(app)
      .post("/api/properties")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        ciudad: "__Test_City__",
        barrio: f.centro.nombre,
        tipo: "__Test_Casa__",
        operacion: "__Test_Venta__",
        moneda: "USD",
        direccion: "__Test__Nueva 456",
        precio: 300000,
        m2_totales: 150,
        m2_cubiertos: 100,
        ambientes: 4,
        dormitorios: 3,
        banos: 2,
        descripcion: "__Test__Casa creada en test",
        lat: -34.92,
        lng: -57.93,
        fotos: ["https://res.cloudinary.com/test/new-image.jpg"],
        amenities: ["Cochera"],
        apto_banco: true,
        permuta: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.direccion).toContain("Nueva 456");
  }, 15000);

  it("POST /api/properties rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/api/properties")
      .send({
        ciudad: "__Test_City__", barrio: f.centro.nombre, tipo: "__Test_Casa__",
        operacion: "__Test_Venta__", moneda: "USD",
        direccion: "X", precio: 100, m2_totales: 1, m2_cubiertos: 1,
        ambientes: 1, dormitorios: 1, banos: 1, descripcion: "x", lat: 0, lng: 0,
      });

    expect(res.status).toBe(401);
  });

  it("POST /api/properties validates required fields", async () => {
    const res = await request(app)
      .post("/api/properties")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ ciudad: "__Test_City__" });

    expect(res.status).toBe(400);
  });

  it("GET /api/properties/:id retrieves a property", async () => {
    const res = await request(app)
      .get(`/api/properties/${propertyId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(propertyId);
  });

  it("GET /api/properties/:id returns 404 for missing", async () => {
    const res = await request(app).get("/api/properties/nonexistent");
    expect(res.status).toBe(404);
  });

  it("PUT /api/properties/:id updates a property", async () => {
    const res = await request(app)
      .put(`/api/properties/${propertyId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ precio: 280000, descripcion: "__Test__Actualizada" });

    expect(res.status).toBe(200);
    expect(res.body.data.precio).toBe(280000);
    expect(res.body.data.descripcion).toContain("Actualizada");
  });

  it("PUT /api/properties/:id rejects unauthenticated", async () => {
    const res = await request(app)
      .put(`/api/properties/${propertyId}`)
      .send({ precio: 999999 });

    expect(res.status).toBe(401);
  });

  it("DELETE /api/properties/:id deletes a property", async () => {
    const createRes = await request(app)
      .post("/api/properties")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        ciudad: "__Test_City__", barrio: f.centro.nombre, tipo: "__Test_Casa__",
        operacion: "__Test_Venta__", moneda: "USD",
        direccion: "__Test__Para borrar", precio: 100000,
        m2_totales: 1, m2_cubiertos: 1, ambientes: 1,
        dormitorios: 1, banos: 1, descripcion: "__Test__a eliminar",
        lat: -34.92, lng: -57.93,
      });

    const newId = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/properties/${newId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(204);

    const checkRes = await request(app).get(`/api/properties/${newId}`);
    expect(checkRes.status).toBe(404);
  });

  it("DELETE /api/properties/:id rejects unauthenticated", async () => {
    const res = await request(app)
      .delete(`/api/properties/${propertyId}`);
    expect(res.status).toBe(401);
  });
});

describe.runIf(runIntegration)("Lookup Endpoints", () => {
  let f: any;
  let cityId: string;

  beforeAll(async () => {
    f = await seedTestFixtures();
    cityId = f.city.id;
    // also create a second barrio for the city
    await prisma.barrio.create({
      data: { nombre: "__Test_Barrio_2__" + Date.now(), city_id: f.city.id },
    });
  }, 30000);

  it("GET /api/lookup/cities includes test city", async () => {
    const res = await request(app).get("/api/lookup/cities");
    expect(res.status).toBe(200);
    const names = res.body.data.map((c: any) => c.nombre);
    expect(names).toContain("__Test_City__");
  });

  it("GET /api/lookup/barrios lists neighborhoods", async () => {
    const res = await request(app).get("/api/lookup/barrios");
    expect(res.status).toBe(200);
    const names = res.body.data.map((b: any) => b.nombre);
    expect(names).toContain(f.centro.nombre);
  });

  it("GET /api/lookup/cities/:id/barrios returns barrios for a city", async () => {
    const res = await request(app).get(`/api/lookup/cities/${cityId}/barrios`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.map((b: any) => b.nombre)).toContain(f.centro.nombre);
  });
});
