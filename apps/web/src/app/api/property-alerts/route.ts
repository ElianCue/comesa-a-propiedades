import { NextRequest, NextResponse } from "next/server";
import { createAlert } from "@/lib/api/services/alert.service";
import { validate } from "@/lib/api/validation";
import { createAlertSchema } from "@/lib/api/validators/alert.validator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = await validate(createAlertSchema, body);
    const alert = await createAlert(input);

    return NextResponse.json({ status: "success", data: { ok: true, id: alert.id } }, { status: 201 });
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
