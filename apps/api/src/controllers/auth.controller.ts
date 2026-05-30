import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { ApiResponse } from "../lib/api-response";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24h
      });

      res.json(ApiResponse.success(result.admin));
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response) {
    res.clearCookie("token");
    res.json(ApiResponse.success({ message: "Sesión cerrada" }));
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.json(ApiResponse.success(null));
        return;
      }
      const admin = await authService.verify(token);
      res.json(ApiResponse.success(admin));
    } catch {
      res.json(ApiResponse.success(null));
    }
  }
}

export const authController = new AuthController();
