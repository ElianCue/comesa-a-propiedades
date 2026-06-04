import type { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../lib/errors";
import { ApiResponse } from "../lib/api-response";
import { logger } from "../lib/logger";

function isPrismaError(err: Error): boolean {
  const name = err.constructor?.name || "";
  return name.startsWith("Prisma") || name.startsWith("PrismaClient");
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(ApiResponse.error(err));
    return;
  }

  logger.error({ err }, "Unexpected error");

  const message =
    process.env.NODE_ENV === "production" || isPrismaError(err)
      ? "Error interno del servidor"
      : err.message;

  res.status(500).json({
    status: "error",
    message,
  });
}
