import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/api/auth";
import { prisma } from "@/lib/api/prisma";

export async function GET(request: Request) {
  try {
    const payload = getAuthFromRequest(request);
    const admin = await prisma.admin.findUnique({ where: { id: payload.adminId } });
    if (!admin) {
      return NextResponse.json({ status: "success", data: null });
    }
    return NextResponse.json({
      status: "success",
      data: { id: admin.id, email: admin.email, nombre: admin.nombre },
    });
  } catch {
    return NextResponse.json({ status: "success", data: null });
  }
}
