const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiErrorData {
  status: string;
  message: string;
  errors?: { field: string; message: string }[];
}

export class ApiError extends Error {
  constructor(public data: ApiErrorData, public status: number) {
    super(data.message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(json, res.status);
  }

  return json.data ?? json;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
