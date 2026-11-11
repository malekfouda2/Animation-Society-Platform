import {
  changePasswordSchema,
  emailRequestSchema,
  loginSchema,
  mfaConfirmSchema,
  mfaVerifySchema,
  profileUpdateSchema,
  registerSchema,
  resetPasswordSchema,
  totpCodeSchema,
  verifyEmailSchema,
} from "@as/contracts";
import { Router, type Request } from "express";
import { z } from "zod";
import { HttpError } from "../../http/errors.js";
import { createRateLimiter } from "../../http/rate-limit.js";
import {
  clearSessionCookie,
  readCookie,
  requireSameOrigin,
  requireStaffSession,
  requireUser,
  sessionCookieName,
  setSessionCookie,
  type CookieConfig,
} from "./auth.middleware.js";
import type { AuthService } from "./auth.service.js";

export interface AuthRouteDeps {
  service: AuthService;
  cookies: CookieConfig;
  publicOrigin: string;
  /** Multiplier for tests; 1 in the app. */
  rateLimitScale?: number;
}

const MIN = 60_000;

function authOf(req: Request) {
  if (!req.auth) throw new HttpError("unauthenticated", "Sign in to continue");
  return req.auth;
}

export function authRouter({ service, cookies, publicOrigin, rateLimitScale = 1 }: AuthRouteDeps): Router {
  const router = Router();
  const limiter = (limit: number, windowMs: number) => {
    const allow = createRateLimiter(Math.max(1, Math.round(limit * rateLimitScale)), windowMs);
    return (key: string) => {
      if (!allow(key)) throw new HttpError("rate_limited", "Too many attempts; try again later");
    };
  };
  const ipKey = (req: Request) => req.ip ?? "unknown";
  const limits = {
    registerIp: limiter(10, 60 * MIN),
    signInIp: limiter(30, 15 * MIN),
    signInEmail: limiter(10, 15 * MIN),
    emailLinkIp: limiter(10, 60 * MIN),
    emailLinkTarget: limiter(3, 60 * MIN),
    tokenIp: limiter(30, 60 * MIN),
    mfaIp: limiter(30, 15 * MIN),
  };

  router.use(["/auth", "/account"], (_req, res, next) => {
    // Personal responses: never cached by the browser or any proxy.
    res.set("Cache-Control", "no-store");
    next();
  });
  router.use(["/auth", "/account"], requireSameOrigin(publicOrigin));

  router.post("/auth/register", async (req, res) => {
    limits.registerIp(ipKey(req));
    await service.register(registerSchema.parse(req.body));
    res.status(202).json({ status: "accepted" });
  });

  router.post("/auth/verify-email", async (req, res) => {
    limits.tokenIp(ipKey(req));
    await service.verifyEmail(verifyEmailSchema.parse(req.body).token);
    res.json({ status: "verified" });
  });

  router.post("/auth/verify-email/resend", async (req, res) => {
    limits.emailLinkIp(ipKey(req));
    const { email } = emailRequestSchema.parse(req.body);
    limits.emailLinkTarget(`verify:${email}`);
    await service.resendVerification(email);
    res.status(202).json({ status: "accepted" });
  });

  router.post("/auth/sign-in", async (req, res) => {
    limits.signInIp(ipKey(req));
    const input = loginSchema.parse(req.body);
    limits.signInEmail(input.email);
    const old = readCookie(req, sessionCookieName(cookies.secure));
    if (old) await service.signOut(old);
    const { token, expiresAt, result } = await service.signIn(input, req.get("user-agent") ?? "");
    setSessionCookie(res, cookies, token, expiresAt);
    res.json(result);
  });

  router.post("/auth/sign-out", async (req, res) => {
    const token = readCookie(req, sessionCookieName(cookies.secure));
    if (token) await service.signOut(token);
    clearSessionCookie(res, cookies);
    res.status(204).end();
  });

  router.get("/auth/session", async (req, res) => {
    res.json(await service.toSessionUser(authOf(req)));
  });

  router.post("/auth/password/forgot", async (req, res) => {
    limits.emailLinkIp(ipKey(req));
    const { email } = emailRequestSchema.parse(req.body);
    limits.emailLinkTarget(`reset:${email}`);
    await service.requestPasswordReset(email);
    res.status(202).json({ status: "accepted" });
  });

  router.post("/auth/password/reset", async (req, res) => {
    limits.tokenIp(ipKey(req));
    const { token, password } = resetPasswordSchema.parse(req.body);
    await service.resetPassword(token, password);
    // Every session was revoked, including this browser's.
    clearSessionCookie(res, cookies);
    res.json({ status: "password_set" });
  });

  router.post("/auth/mfa/enroll", requireStaffSession, async (req, res) => {
    limits.mfaIp(ipKey(req));
    res.json(await service.startMfaEnrollment(authOf(req)));
  });

  router.post("/auth/mfa/enroll/confirm", requireStaffSession, async (req, res) => {
    limits.mfaIp(ipKey(req));
    const { code } = mfaConfirmSchema.parse(req.body);
    const { recoveryCodes, token, expiresAt } = await service.confirmMfaEnrollment(authOf(req), code);
    setSessionCookie(res, cookies, token, expiresAt);
    res.json({ recoveryCodes });
  });

  router.post("/auth/mfa/verify", requireStaffSession, async (req, res) => {
    limits.mfaIp(ipKey(req));
    const auth = authOf(req);
    const { token, expiresAt } = await service.verifyMfa(auth, mfaVerifySchema.parse(req.body));
    setSessionCookie(res, cookies, token, expiresAt);
    res.json(await service.toSessionUser({ ...auth, mfaVerified: true }));
  });

  router.post("/auth/mfa/recovery-codes", requireUser, requireStaffSession, async (req, res) => {
    limits.mfaIp(ipKey(req));
    const { code } = z.object({ code: totpCodeSchema }).strict().parse(req.body);
    res.json(await service.regenerateRecoveryCodes(authOf(req), code));
  });

  router.get("/auth/mfa/recovery-codes", requireUser, requireStaffSession, async (req, res) => {
    res.json({ remaining: await service.recoveryCodesLeft(authOf(req).userId) });
  });

  router.post("/auth/reauth", requireUser, async (req, res) => {
    limits.mfaIp(ipKey(req));
    const proof = z.object({ code: totpCodeSchema.optional(), password: z.string().max(128).optional() }).strict().parse(req.body);
    await service.reauthenticate(authOf(req), proof);
    res.json({ status: "confirmed" });
  });

  router.patch("/account/profile", requireUser, async (req, res) => {
    const auth = authOf(req);
    const input = profileUpdateSchema.parse(req.body);
    await service.updateProfile(auth, input);
    res.json(await service.toSessionUser({ ...auth, ...input }));
  });

  router.post("/account/password", requireUser, async (req, res) => {
    limits.signInIp(ipKey(req));
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const { token, expiresAt } = await service.changePassword(authOf(req), currentPassword, newPassword);
    setSessionCookie(res, cookies, token, expiresAt);
    res.json({ status: "password_changed" });
  });

  return router;
}
