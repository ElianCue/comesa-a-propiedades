import { NextResponse } from "next/server";
import { prisma } from "@/lib/api/prisma";

export async function GET() {
  const dbStart = Date.now();
  let dbOk = false;
  let propertyCount = 0;
  try {
    propertyCount = await prisma.property.count();
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const dbMs = Date.now() - dbStart;

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbOk,
      responseTime: dbMs,
      propertyCount,
    },
    env: process.env.NODE_ENV || "development",
  });
}
