import { NextRequest, NextResponse } from "next/server";
import { inquiryService } from "@/lib/api/services/inquiry.service";
import { getAuthFromRequest } from "@/lib/api/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    getAuthFromRequest(request);

    const { id } = await params;
    await inquiryService.delete(id);

    return NextResponse.json(null, { status: 204 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status }
    );
  }
}
