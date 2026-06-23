import {
  createPropertySchema,
  updatePropertySchema,
} from "../src/lib/api/validators/property.validator";

let passed = 0;
let failed = 0;
const errors: string[] = [];

const BASE = {
  ciudad: "La Plata",
  tipo: "Casa",
  operacion: "Venta",
  moneda: "USD",
  direccion: "Calle Falsa 123",
  precio: 50000,
  m2_totales: 100,
  m2_cubiertos: 80,
  ambientes: 3,
  dormitorios: 2,
  banos: 1,
  descripcion: "Hermosa propiedad",
  lat: -34.9215,
  lng: -57.9545,
};

function assert(condition: boolean, msg: string) {
  if (!condition) {
    failed++;
    errors.push(`  FAIL: ${msg}`);
  } else {
    passed++;
    console.log(`  OK:   ${msg}`);
  }
}

// ─── T1: Acepta 0 en campos que ahora son nonnegative ───
{
  const input = { ...BASE, ambientes: 0, dormitorios: 0, banos: 0, m2_cubiertos: 0 };
  const r = createPropertySchema.safeParse(input);
  assert(r.success, "T1: ambientes=0, dormitorios=0, banos=0, m2_cubiertos=0 debe ser válido");
}

// ─── T2: Acepta solo algunos campos en 0 ───
{
  const input = { ...BASE, dormitorios: 0, banos: 0 };
  const r = createPropertySchema.safeParse(input);
  assert(r.success, "T2: solo dormitorios=0, banos=0 debe ser válido");
}

// ─── T3: Rechaza negativos ───
{
  const r = createPropertySchema.safeParse({ ...BASE, ambientes: -1 });
  assert(!r.success, "T3: ambientes=-1 debe ser inválido");
}
{
  const r = createPropertySchema.safeParse({ ...BASE, dormitorios: -1 });
  assert(!r.success, "T3b: dormitorios=-1 debe ser inválido");
}
{
  const r = createPropertySchema.safeParse({ ...BASE, banos: -1 });
  assert(!r.success, "T3c: banos=-1 debe ser inválido");
}
{
  const r = createPropertySchema.safeParse({ ...BASE, m2_cubiertos: -1 });
  assert(!r.success, "T3d: m2_cubiertos=-1 debe ser inválido");
}

// ─── T4: precio=0 ahora es válido (cambiado a nonnegative) ───
{
  const r = createPropertySchema.safeParse({ ...BASE, precio: 0 });
  assert(r.success, "T4: precio=0 debe ser válido (ahora .nonnegative())");
}
{
  const r = createPropertySchema.safeParse({ ...BASE, precio: -1 });
  assert(!r.success, "T4b: precio=-1 debe ser inválido");
}

// ─── T5: m2_totales=0 ahora es válido (cambiado a nonnegative) ───
{
  const r = createPropertySchema.safeParse({ ...BASE, m2_totales: 0 });
  assert(r.success, "T5: m2_totales=0 debe ser válido (ahora .nonnegative())");
}
{
  const r = createPropertySchema.safeParse({ ...BASE, m2_totales: -1 });
  assert(!r.success, "T5b: m2_totales=-1 debe ser inválido");
}

// ─── T6: Optional fields ausentes son válidos ───
{
  const input = { ...BASE };
  delete (input as any).m2_terreno;
  delete (input as any).m2_descubierta;
  delete (input as any).cant_plantas;
  delete (input as any).expensas;
  const r = createPropertySchema.safeParse(input);
  assert(r.success, "T6: todos los optional ausentes debe ser válido");
}

// ─── T7: m2_terreno: undefined es válido ───
{
  const r = createPropertySchema.safeParse({ ...BASE, m2_terreno: undefined });
  assert(r.success, "T7: m2_terreno=undefined debe ser válido");
}

// ─── T8: m2_terreno=0 sigue siendo inválido (sigue positive.optional) ───
{
  const r = createPropertySchema.safeParse({ ...BASE, m2_terreno: 0 });
  assert(!r.success, "T8: m2_terreno=0 debe ser inválido (sigue .positive().optional())");
}
{
  const r = createPropertySchema.safeParse({ ...BASE, m2_descubierta: 0 });
  assert(!r.success, "T8b: m2_descubierta=0 debe ser inválido (sigue .positive().optional())");
}
{
  const r = createPropertySchema.safeParse({ ...BASE, cant_plantas: 0 });
  assert(!r.success, "T8c: cant_plantas=0 debe ser inválido (sigue .positive().optional())");
}

// ─── T9: .int() constraint sigue activa ───
{
  const r = createPropertySchema.safeParse({ ...BASE, ambientes: 1.5 });
  assert(!r.success, "T9: ambientes=1.5 debe ser inválido (sigue .int())");
}
{
  const r = createPropertySchema.safeParse({ ...BASE, dormitorios: 2.7 });
  assert(!r.success, "T9b: dormitorios=2.7 debe ser inválido (sigue .int())");
}
{
  const r = createPropertySchema.safeParse({ ...BASE, banos: 0.5 });
  assert(!r.success, "T9c: banos=0.5 debe ser inválido (sigue .int())");
}

// ─── T10: updateSchema.partial() permite omitir cualquier campo ───
{
  const r = updatePropertySchema.safeParse({});
  assert(r.success, "T10: objeto vacío en update debe ser válido (partial)");
}
{
  const r = updatePropertySchema.safeParse({ ambientes: 0 });
  assert(r.success, "T10b: update con solo ambientes=0 debe ser válido");
}
{
  const r = updatePropertySchema.safeParse({ dormitorios: 0, banos: 0 });
  assert(r.success, "T10c: update con dormitorios=0, banos=0 debe ser válido");
}

// ─── T11: m2Terreno opcional en serialización (simulación) ───
// Verificamos que si se pasa undefined, el schema lo acepta
{
  const r = createPropertySchema.safeParse({ ...BASE, m2_terreno: undefined, m2_descubierta: undefined, cant_plantas: undefined });
  assert(r.success, "T11: todos los opcionales como undefined debe ser válido");
}

// ─── T12: Sanity check: valores normales siguen funcionando ───
{
  const r = createPropertySchema.safeParse(BASE);
  assert(r.success, "T12: payload base debe ser válido");
}

// ─── T13: Campos required no pueden faltar ───
{
  const input = { ...BASE };
  delete (input as any).ambientes;
  const r = createPropertySchema.safeParse(input);
  assert(!r.success, "T13: ambientes ausente debe ser inválido");
}
{
  const input = { ...BASE };
  delete (input as any).dormitorios;
  const r = createPropertySchema.safeParse(input);
  assert(!r.success, "T13b: dormitorios ausente debe ser inválido");
}
{
  const input = { ...BASE };
  delete (input as any).banos;
  const r = createPropertySchema.safeParse(input);
  assert(!r.success, "T13c: banos ausente debe ser inválido");
}

// ─── Report ───
console.log(`\n${"─".repeat(40)}`);
console.log(`${passed}/${passed + failed} tests passed`);
if (failed > 0) {
  console.log("\nErrores:");
  for (const e of errors) console.log(e);
  process.exit(1);
}
