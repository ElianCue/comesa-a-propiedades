import type { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "./errors";

export async function validate<T>(schema: AnyZodObject, data: unknown): Promise<T> {
  try {
    return await schema.parseAsync(data) as T;
  } catch (error: unknown) {
    const zodError = error as ZodError;
    const errors = zodError.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    throw new ValidationError("Error de validación", errors);
  }
}
