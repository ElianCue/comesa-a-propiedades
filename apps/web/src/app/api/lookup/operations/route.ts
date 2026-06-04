import { NextResponse } from "next/server";
import { lookupService } from "@/lib/api/services/lookup.service";

export async function GET() {
  try {
    const operations = await lookupService.getOperations();
    return NextResponse.json({ status: "success", data: operations });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
