import "server-only";
import { API_BASE_PATH, sessionUserSchema, type SessionUser } from "@as/contracts";
import { cookies } from "next/headers";
import { loadWebEnv } from "@/config/env";

/** Session cookie names (production uses the "__Host-" prefixed one). */
const SESSION_COOKIES = ["__Host-as_session", "as_session"] as const;

/**
 * Server-side call to the API on behalf of the current visitor. Forwards only the session cookie,
 * never other cookies, and never caches: these responses are personal.
 */
export async function apiFromServer(path: string): Promise<Response> {
  const jar = await cookies();
  const cookie = SESSION_COOKIES.flatMap((name) => {
    const value = jar.get(name)?.value;
    return value ? [`${name}=${value}`] : [];
  }).join("; ");
  return fetch(`${loadWebEnv().API_INTERNAL_ORIGIN}${API_BASE_PATH}${path}`, {
    headers: cookie ? { cookie } : {},
    cache: "no-store",
  });
}

/** The signed-in account, or null. Throws when the API cannot be reached (shown by the error page). */
export async function getSession(): Promise<SessionUser | null> {
  const res = await apiFromServer("/auth/session");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`session lookup failed (${res.status})`);
  return sessionUserSchema.parse(await res.json());
}

/** Where a signed-in account should land: staff who still owe the second factor go there first. */
export function homeFor(locale: string, user: SessionUser): string {
  if (user.mfa === "enroll") return `/${locale}/two-factor/setup`;
  if (user.mfa === "verify") return `/${locale}/two-factor`;
  return user.role === "member" ? `/${locale}/member` : `/${locale}/admin`;
}

/** Accepts only a same-site path in this locale (no open redirects to other hosts). */
export function safeNext(locale: string, next: string | string[] | undefined): string | undefined {
  if (typeof next !== "string") return undefined;
  return next.startsWith(`/${locale}/`) && !next.startsWith("//") && !next.includes("\\") ? next : undefined;
}
