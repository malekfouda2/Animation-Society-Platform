import { z } from "zod";
import { LOCALES } from "./locale.js";

/** Account roles. Members use the portal; editors manage public content; admins manage members and payments. */
export const ROLES = ["member", "editor", "admin"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES: readonly Role[] = ["editor", "admin"];
export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

/** NIST SP 800-63B style: length, not composition rules. Upper bound keeps hashing cost bounded. */
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
export const passwordSchema = z.string().min(PASSWORD_MIN, "password_short").max(PASSWORD_MAX, "password_long");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("email").max(254, "email"));

const singleLine = (max: number, key: string) =>
  z.string().trim().min(1, key).max(max, key).regex(/^[^\r\n]*$/, key);

export const nameSchema = singleLine(120, "name");

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  locale: z.enum(LOCALES),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  // Not passwordSchema: an old/short password must still get the generic credentials error.
  password: z.string().min(1, "password").max(PASSWORD_MAX, "password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const emailRequestSchema = z.object({ email: emailSchema, locale: z.enum(LOCALES) });
export type EmailRequestInput = z.infer<typeof emailRequestSchema>;

/** Opaque single-use token from an emailed link (base64url, 43 chars for 32 bytes). */
export const linkTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, "token");
export const verifyEmailSchema = z.object({ token: linkTokenSchema });
export const resetPasswordSchema = z.object({ token: linkTokenSchema, password: passwordSchema });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "password").max(PASSWORD_MAX, "password"),
  newPassword: passwordSchema,
});

export const profileUpdateSchema = z.object({ name: nameSchema, locale: z.enum(LOCALES) }).strict();
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/** Six-digit authenticator code. */
export const totpCodeSchema = z.string().regex(/^\d{6}$/, "code");
/** Recovery code as shown to the user: two groups of five base32 characters. */
export const recoveryCodeSchema = z
  .string()
  .transform((v) => v.trim().toUpperCase().replace(/\s+/g, ""))
  .pipe(z.string().regex(/^[A-Z2-7]{5}-?[A-Z2-7]{5}$/, "recovery_code"));

export const mfaVerifySchema = z.union([
  z.object({ code: totpCodeSchema }).strict(),
  z.object({ recoveryCode: recoveryCodeSchema }).strict(),
]);
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export const mfaConfirmSchema = z.object({ code: totpCodeSchema }).strict();

/** What the next screen must be after a password sign-in. */
export const SIGN_IN_NEXT = ["done", "mfa_enroll", "mfa_verify"] as const;
export type SignInNext = (typeof SIGN_IN_NEXT)[number];

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(ROLES),
  locale: z.enum(LOCALES),
  /** Staff only: the session has not passed the second factor yet (or never enrolled one). */
  mfa: z.enum(["not_required", "enroll", "verify", "verified"]),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const signInResultSchema = z.object({ next: z.enum(SIGN_IN_NEXT), user: sessionUserSchema });
export type SignInResult = z.infer<typeof signInResultSchema>;

export const mfaEnrollmentSchema = z.object({
  /** otpauth:// URI for authenticator apps. */
  uri: z.string(),
  /** Base32 secret for manual entry. */
  secret: z.string(),
  /** QR code of the URI as an SVG document. */
  qrSvg: z.string(),
});
export type MfaEnrollment = z.infer<typeof mfaEnrollmentSchema>;

export const recoveryCodesSchema = z.object({ recoveryCodes: z.array(z.string()) });
