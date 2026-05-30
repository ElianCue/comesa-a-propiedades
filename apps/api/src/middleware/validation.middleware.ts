import type { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../lib/errors";

export function validate(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = await schema.parseAsync(req.body);
      req.body = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        next(new ValidationError("Error de validación", errors));
      } else {
        next(error);
      }
    }
  };
}
