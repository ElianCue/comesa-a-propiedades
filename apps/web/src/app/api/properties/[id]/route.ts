import { NextRequest, NextResponse } from "next/server";
import { propertyService } from "@/lib/api/services/property.service";
import { getAuthFromRequest } from "@/lib/api/auth";
import { validate } from "@/lib/api/validation";
import { updatePropertySchema } from "@/lib/api/validators/property.validator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await propertyService.getById(id);
    return NextResponse.json({ status: "success", data: property });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    getAuthFromRequest(request);

    const { id } = await params;
    const body = await request.json();
    const input = await validate(updatePropertySchema, body);
    const property = await propertyService.update(id, input);

    return NextResponse.json({ status: "success", data: property });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    getAuthFromRequest(request);

    const { id } = await params;
    await propertyService.delete(id);

    return NextResponse.json(null, { status: 204 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status }
    );
  }
}
