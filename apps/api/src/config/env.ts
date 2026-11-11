import { z } from "zod";

const integrationMode = z.enum(["mock", "sandbox", "live"]);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4100),
    /** Explicit bind address so a port collision fails loudly instead of splitting IPv4/IPv6. */
    API_HOST: z.string().min(1).default("127.0.0.1"),
    MONGODB_URI: z
      .string()
      .min(1)
      .refine((v) => v.startsWith("mongodb://") || v.startsWith("mongodb+srv://"), {
        message: "must be a mongodb:// or mongodb+srv:// connection string",
      }),
    PUBLIC_ORIGIN: z.url(),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    PAYMENT_MODE: integrationMode,
    EMAIL_MODE: integrationMode,
    /** Directory for uploaded images (persistent storage in production; never inside the web app's public folder). */
    MEDIA_DIR: z.string().min(1).default("var/media"),
    /** Society mailbox that receives contact-form messages. Unset: messages are stored only (D06). */
    CONTACT_INBOX: z.union([z.literal(""), z.email()]).default("").transform((v) => (v === "" ? null : v.toLowerCase())),
    /**
     * 32-byte key (base64) that encrypts staff authenticator secrets. Kept outside the database so a
     * database copy alone cannot generate codes. Generate with: openssl rand -base64 32
     */
    MFA_ENCRYPTION_KEY: z
      .string()
      .refine((v) => /^[A-Za-z0-9+/]{43}=$/.test(v) && Buffer.from(v, "base64").length === 32, {
        message: "must be 32 random bytes encoded as base64 (openssl rand -base64 32)",
      }),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    // Production must never run simulated integrations or plain-HTTP public origins.
    if (env.PAYMENT_MODE !== "live") {
      ctx.addIssue({ code: "custom", path: ["PAYMENT_MODE"], message: "must be 'live' in production" });
    }
    if (env.EMAIL_MODE !== "live") {
      ctx.addIssue({ code: "custom", path: ["EMAIL_MODE"], message: "must be 'live' in production" });
    }
    if (!env.PUBLIC_ORIGIN.startsWith("https://")) {
      ctx.addIssue({ code: "custom", path: ["PUBLIC_ORIGIN"], message: "must use https in production" });
    }
  });

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "EnvValidationError";
  }
}

/**
 * Validates process environment. Error messages name variables and rules only;
 * they never echo supplied values, so secrets cannot leak into logs.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;
  const problems = result.error.issues.map((issue) => {
    const key = issue.path.join(".") || "(root)";
    const reason = issue.input === undefined ? "is required" : issue.message;
    return `${key}: ${reason}`;
  });
  throw new EnvValidationError(problems);
}
