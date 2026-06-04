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
