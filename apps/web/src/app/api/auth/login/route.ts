import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/api/services/auth.service";
import { validate } from "@/lib/api/validation";
import { loginSchema } from "@/lib/api/validators/auth.validator";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = await validate(loginSchema, body);
    const result = await authService.login(input.email, input.password);

    const cookieStore = await cookies();
    cookieStore.set("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.json({ status: "success", data: result.admin });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "error", message: error.message || "Error interno del servidor" },
      { status }
    );
  }
}
