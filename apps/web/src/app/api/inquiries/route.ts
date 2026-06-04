import { NextRequest, NextResponse } from "next/server";
import { inquiryService } from "@/lib/api/services/inquiry.service";
import { getAuthFromRequest } from "@/lib/api/auth";
import { validate } from "@/lib/api/validation";
import { createInquirySchema } from "@/lib/api/validators/inquiry.validator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = await validate(createInquirySchema, body);
    const inquiry = await inquiryService.create(input);

    return NextResponse.json({ status: "success", data: inquiry }, { status: 201 });
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

export async function GET(request: NextRequest) {
  try {
    getAuthFromRequest(request);
    const inquiries = await inquiryService.list();
    return NextResponse.json({ status: "success", data: inquiries });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status }
    );
  }
}
