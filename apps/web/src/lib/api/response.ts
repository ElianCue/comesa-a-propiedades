import type { AppError } from "./errors";

export class ApiResponse {
  static success<T>(data: T, status: number = 200) {
    return { status: "success", data };
  }

  static error(err: AppError) {
    return {
      status: "error",
      message: err.message,
      ...((err as any).errors ? { errors: (err as any).errors } : {}),
    };
  }

  static paginated<T>(data: T[], total: number, cursor?: string) {
    return {
      status: "success",
      data,
      meta: { total, cursor },
    };
  }
}
