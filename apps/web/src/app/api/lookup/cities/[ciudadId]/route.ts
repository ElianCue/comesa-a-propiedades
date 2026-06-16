import { NextRequest, NextResponse } from "next/server";
import { lookupService } from "@/lib/api/services/lookup.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ciudadId: string }> }
) {
  try {
    const { ciudadId } = await params;
    const city = await lookupService.getCityById(ciudadId);
    if (!city) {
      return NextResponse.json(
        { status: "error", message: "Ciudad no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: "success", data: city });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ciudadId: string }> }
) {
  try {
    const { ciudadId } = await params;
    const body = await request.json();
    if (!body.nombre || typeof body.nombre !== "string" || !body.nombre.trim()) {
      return NextResponse.json(
        { status: "error", message: "El nombre de la ciudad es obligatorio" },
        { status: 400 }
      );
    }
    const city = await lookupService.updateCity(ciudadId, { nombre: body.nombre.trim() });
    return NextResponse.json({ status: "success", data: city });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ ciudadId: string }> }
) {
  try {
    const { ciudadId } = await params;
    await lookupService.deleteCity(ciudadId);
    return NextResponse.json({ status: "success", message: "Ciudad eliminada correctamente" });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
