import { z } from "zod";

const origin = z.url().refine((v) => !v.endsWith("/"), { message: "must not end with '/'" });

const schema = z.object({
  /** Origin the Next.js server uses to reach Express. Server-side only. */
  API_INTERNAL_ORIGIN: origin,
  /** Public origin of the site, for canonical and alternate-language links. */
  PUBLIC_ORIGIN: origin,
});

export type WebEnv = z.infer<typeof schema>;

/** Server-only. Fails with variable names only, never values. */
export function loadWebEnv(source: Record<string, string | undefined> = process.env): WebEnv {
  const result = schema.safeParse(source);
  if (result.success) return result.data;
  const problems = result.error.issues.map(
    (i) => `  - ${i.path.join(".")}: ${i.input === undefined ? "is required" : i.message}`,
  );
  throw new Error(`Invalid web environment configuration:\n${problems.join("\n")}\nSee apps/web/.env.example.`);
}
