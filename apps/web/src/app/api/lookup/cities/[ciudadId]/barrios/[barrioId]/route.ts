import { NextRequest, NextResponse } from "next/server";
import { lookupService } from "@/lib/api/services/lookup.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ciudadId: string; barrioId: string }> }
) {
  try {
    const { barrioId } = await params;
    const body = await request.json();
    if (!body.nombre || typeof body.nombre !== "string" || !body.nombre.trim()) {
      return NextResponse.json(
        { status: "error", message: "El nombre del barrio es obligatorio" },
        { status: 400 }
      );
    }
    const barrio = await lookupService.updateBarrio(barrioId, { nombre: body.nombre.trim() });
    return NextResponse.json({ status: "success", data: barrio });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ ciudadId: string; barrioId: string }> }
) {
  try {
    const { barrioId } = await params;
    await lookupService.deleteBarrio(barrioId);
    return NextResponse.json({ status: "success", message: "Barrio eliminado correctamente" });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
