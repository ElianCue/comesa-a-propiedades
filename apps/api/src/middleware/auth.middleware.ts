import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../lib/errors";

export interface AuthPayload {
  adminId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedError("Token no proporcionado");
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as AuthPayload;

    req.admin = payload;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError("Token inválido o expirado"));
    }
  }
}
