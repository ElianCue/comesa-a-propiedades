import { NextRequest, NextResponse } from "next/server";
import { propertyService } from "@/lib/api/services/property.service";
import { getAuthFromRequest } from "@/lib/api/auth";
import { validate } from "@/lib/api/validation";
import { propertyQuerySchema, createPropertySchema } from "@/lib/api/validators/property.validator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const raw: Record<string, string | null> = {
      ciudad: searchParams.get("ciudad"),
      operacion: searchParams.get("operacion"),
      tipo: searchParams.get("tipo"),
      barrio: searchParams.get("barrio"),
      precioMax: searchParams.get("precioMax"),
      activo: searchParams.get("activo"),
      cursor: searchParams.get("cursor"),
      limit: searchParams.get("limit"),
    };
    const cleaned = Object.fromEntries(
      Object.entries(raw).filter(([_, v]) => v !== null)
    );
    const filters = await validate(propertyQuerySchema, cleaned);

    const result = await propertyService.list({
      ...filters,
      precioMax: filters.precioMax ?? undefined,
      activo: filters.activo ?? undefined,
      cursor: filters.cursor ?? undefined,
    });

    return NextResponse.json({ status: "success", ...result });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    getAuthFromRequest(request);

    const body = await request.json();
    const input = await validate(createPropertySchema, body);
    const property = await propertyService.create(input);

    return NextResponse.json({ status: "success", data: property }, { status: 201 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Error interno del servidor",
        ...(error.errors ? { errors: error.errors } : {}),
      },
      { status }
    );
  }
}
