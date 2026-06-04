import jwt from "jsonwebtoken";
import { UnauthorizedError } from "./errors";

export interface AuthPayload {
  adminId: string;
  email: string;
}

export function getAuthFromRequest(request: Request): AuthPayload {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );

  const token =
    cookies.token ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new UnauthorizedError("Token no proporcionado");
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
  } catch {
    throw new UnauthorizedError("Token inválido o expirado");
  }
}
