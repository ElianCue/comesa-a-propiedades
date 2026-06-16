import { NextRequest, NextResponse } from "next/server";
import { lookupService } from "@/lib/api/services/lookup.service";

export async function GET() {
  try {
    const cities = await lookupService.getCities();
    return NextResponse.json({ status: "success", data: cities });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.nombre || typeof body.nombre !== "string" || !body.nombre.trim()) {
      return NextResponse.json(
        { status: "error", message: "El nombre de la ciudad es obligatorio" },
        { status: 400 }
      );
    }
    const city = await lookupService.createCity({ nombre: body.nombre.trim() });
    return NextResponse.json({ status: "success", data: city }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
