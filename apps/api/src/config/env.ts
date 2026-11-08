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
