import type { AnyZodObject, ZodError, z } from "zod";
import { ValidationError } from "./errors";

export async function validate<T extends AnyZodObject>(schema: T, data: unknown): Promise<z.infer<T>> {
  try {
    return await schema.parseAsync(data) as z.infer<T>;
  } catch (error: unknown) {
    const zodError = error as ZodError;
    const errors = zodError.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    throw new ValidationError("Error de validación", errors);
  }
}
