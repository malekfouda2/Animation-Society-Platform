import { API_BASE_PATH, apiErrorSchema, type ErrorCode } from "@as/contracts";

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; code: ErrorCode | "network"; fields: Record<string, string[]> };

/** Browser call to the same-origin API. The session cookie travels automatically (HttpOnly). */
export async function callApi<T = unknown>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE_PATH}${path}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? null : JSON.stringify(body),
    });
    const json: unknown = res.status === 204 ? null : await res.json().catch(() => null);
    if (res.ok) return { ok: true, status: res.status, data: json as T };
    const parsed = apiErrorSchema.safeParse(json);
    return {
      ok: false,
      status: res.status,
      code: parsed.success ? parsed.data.error.code : "internal_error",
      fields: parsed.success ? parsed.data.error.fields ?? {} : {},
    };
  } catch {
    return { ok: false, status: 0, code: "network", fields: {} };
  }
}
