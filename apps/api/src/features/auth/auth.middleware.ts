import type { Role } from "@as/contracts";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { HttpError } from "../../http/errors.js";
import { SESSION_POLICY, type AuthenticatedSession, type AuthService } from "./auth.service.js";

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthenticatedSession;
  }
}

/** "__Host-" binds the cookie to this exact origin over HTTPS (no Domain, Path=/). */
export function sessionCookieName(secure: boolean): string {
  return secure ? "__Host-as_session" : "as_session";
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) {
      const value = part.slice(i + 1).trim();
      return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : undefined;
    }
  }
  return undefined;
}

export interface CookieConfig {
  secure: boolean;
}

export function setSessionCookie(res: Response, cfg: CookieConfig, token: string, expiresAt: Date): void {
  res.cookie(sessionCookieName(cfg.secure), token, {
    httpOnly: true,
    secure: cfg.secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: Response, cfg: CookieConfig): void {
  res.clearCookie(sessionCookieName(cfg.secure), { httpOnly: true, secure: cfg.secure, sameSite: "lax", path: "/" });
}

/** Attaches req.auth when the cookie names a live session. Never rejects on its own. */
export function loadSession(service: AuthService, cfg: CookieConfig): RequestHandler {
  return (req, _res, next) => {
    const token = readCookie(req, sessionCookieName(cfg.secure));
    if (!token) {
      next();
      return;
    }
    service.authenticate(token).then((auth) => {
      if (auth) req.auth = auth;
      next();
    }, next);
  };
}

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF defence for cookie-authenticated routes: state-changing requests must carry the site's own
 * Origin (with SameSite=Lax cookies as the second layer). Webhooks must never sit behind this;
 * they authenticate by provider signature instead.
 */
export function requireSameOrigin(publicOrigin: string): RequestHandler {
  return (req, _res, next) => {
    if (UNSAFE.has(req.method) && req.get("origin") !== publicOrigin) {
      next(new HttpError("forbidden", "Cross-origin request refused"));
      return;
    }
    next();
  };
}

function guard(check: (req: Request) => void): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      check(req);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Any signed-in account whose session is complete (staff: second factor passed). */
export const requireUser: RequestHandler = guard((req) => {
  if (!req.auth) throw new HttpError("unauthenticated", "Sign in to continue");
  if (req.auth.staff && !req.auth.mfaVerified) throw new HttpError("mfa_required", "Complete two-step sign-in");
});

/** A staff session still between the password step and the second factor (or already past it). */
export const requireStaffSession: RequestHandler = guard((req) => {
  if (!req.auth) throw new HttpError("unauthenticated", "Sign in to continue");
  if (!req.auth.staff) throw new HttpError("forbidden", "Staff only");
});

/** Role check done on the server for every protected route; the UI hiding a link is not access control. */
export function requireRole(...roles: Role[]): RequestHandler {
  return guard((req) => {
    if (!req.auth) throw new HttpError("unauthenticated", "Sign in to continue");
    if (req.auth.staff && !req.auth.mfaVerified) throw new HttpError("mfa_required", "Complete two-step sign-in");
    if (!roles.includes(req.auth.role)) throw new HttpError("forbidden", "You don't have access to this");
  });
}

/** For sensitive actions: the session must have shown a password or authenticator code recently. */
export function requireRecentAuth(now: () => Date = () => new Date()): RequestHandler {
  return guard((req) => {
    const at = req.auth?.reauthAt;
    if (!at || now().getTime() - at.getTime() > SESSION_POLICY.reauthMs) {
      throw new HttpError("forbidden", "Confirm it's you to continue", { reauth: ["reauth_required"] });
    }
  });
}
