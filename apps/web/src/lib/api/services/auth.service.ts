import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { UnauthorizedError } from "../errors";

export interface AuthPayload {
  adminId: string;
  email: string;
}

export class AuthService {
  async login(email: string, password: string): Promise<{ token: string; admin: { id: string; email: string; nombre: string } }> {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const payload: AuthPayload = { adminId: admin.id, email: admin.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "24h" });

    return {
      token,
      admin: { id: admin.id, email: admin.email, nombre: admin.nombre },
    };
  }

  async verify(token: string): Promise<{ id: string; email: string; nombre: string }> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
      const admin = await prisma.admin.findUnique({ where: { id: payload.adminId } });
      if (!admin) throw new UnauthorizedError("Admin no encontrado");
      return { id: admin.id, email: admin.email, nombre: admin.nombre };
    } catch {
      throw new UnauthorizedError("Token inválido o expirado");
    }
  }
}

export const authService = new AuthService();
