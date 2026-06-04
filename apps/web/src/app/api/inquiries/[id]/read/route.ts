import { NextRequest, NextResponse } from "next/server";
import { inquiryService } from "@/lib/api/services/inquiry.service";
import { getAuthFromRequest } from "@/lib/api/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    getAuthFromRequest(request);

    const { id } = await params;
    const inquiry = await inquiryService.markAsRead(id);

    return NextResponse.json({ status: "success", data: inquiry });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status }
    );
  }
}
