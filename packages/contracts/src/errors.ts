import { z } from "zod";

/** Stable machine-readable error codes. UI maps these to translation keys. */
export const ERROR_CODES = [
  "validation_failed",
  "unauthenticated",
  "invalid_credentials",
  "email_unverified",
  "mfa_required",
  "token_invalid",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "internal_error",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    requestId: z.string().optional(),
    fields: z.record(z.string(), z.array(z.string())).optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
