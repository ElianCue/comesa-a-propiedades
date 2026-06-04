import { NextResponse } from "next/server";
import { lookupService } from "@/lib/api/services/lookup.service";

export async function GET() {
  try {
    const amenities = await lookupService.getAmenities();
    return NextResponse.json({ status: "success", data: amenities });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
