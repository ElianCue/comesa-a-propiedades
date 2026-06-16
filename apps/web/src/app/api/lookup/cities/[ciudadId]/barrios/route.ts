import { NextRequest, NextResponse } from "next/server";
import { lookupService } from "@/lib/api/services/lookup.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ciudadId: string }> }
) {
  try {
    const { ciudadId } = await params;
    const barrios = await lookupService.getBarrios(ciudadId);
    return NextResponse.json({ status: "success", data: barrios });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ciudadId: string }> }
) {
  try {
    const { ciudadId } = await params;
    const body = await request.json();
    if (!body.nombre || typeof body.nombre !== "string" || !body.nombre.trim()) {
      return NextResponse.json(
        { status: "error", message: "El nombre del barrio es obligatorio" },
        { status: 400 }
      );
    }
    const barrio = await lookupService.createBarrio({ nombre: body.nombre.trim(), city_id: ciudadId });
    return NextResponse.json({ status: "success", data: barrio }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
