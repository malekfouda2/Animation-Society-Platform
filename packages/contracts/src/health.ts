import { z } from "zod";

export const API_BASE_PATH = "/api/v1";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("api"),
  time: z.iso.datetime(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const readinessCheckSchema = z.object({
  name: z.string(),
  ok: z.boolean(),
  detail: z.string().optional(),
});

export const readinessResponseSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  checks: z.array(readinessCheckSchema),
});
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
