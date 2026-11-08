import { pino } from "pino";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { healthResponseSchema, readinessResponseSchema, apiErrorSchema } from "@as/contracts";
import { createApp } from "../src/app.js";
import type { DatabaseStatus } from "../src/db/mongo.js";

const logger = pino({ level: "silent" });
const appWith = (status: () => Promise<DatabaseStatus>) => createApp({ logger, databaseStatus: status });

describe("GET /api/v1/health", () => {
  it("reports liveness without touching the database", async () => {
    let called = false;
    const res = await request(appWith(() => { called = true; return Promise.resolve({ connected: false, replicaSet: false }); }))
      .get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(healthResponseSchema.parse(res.body).status).toBe("ok");
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.headers["x-request-id"]).toBeTruthy();
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(called).toBe(false);
  });
});

describe("GET /api/v1/ready", () => {
  it("is ready when connected to a replica set", async () => {
    const res = await request(appWith(() => Promise.resolve({ connected: true, replicaSet: true }))).get("/api/v1/ready");
    expect(res.status).toBe(200);
    expect(readinessResponseSchema.parse(res.body).status).toBe("ready");
  });

  it("is not ready on a standalone server (no transactions)", async () => {
    const res = await request(
      appWith(() => Promise.resolve({ connected: true, replicaSet: false, detail: "standalone server; transactions unavailable" })),
    ).get("/api/v1/ready");
    expect(res.status).toBe(503);
    const body = readinessResponseSchema.parse(res.body);
    expect(body.checks.find((c) => c.name === "transactions")?.ok).toBe(false);
  });

  it("is not ready when the status probe throws", async () => {
    const res = await request(appWith(() => Promise.reject(new Error("boom: mongodb://user:pw@host")))).get("/api/v1/ready");
    expect(res.status).toBe(503);
    expect(JSON.stringify(res.body)).not.toContain("pw@host");
  });
});

describe("error format", () => {
  const app = appWith(() => Promise.resolve({ connected: true, replicaSet: true }));

  it("returns structured 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/nope");
    expect(res.status).toBe(404);
    expect(apiErrorSchema.parse(res.body).error.code).toBe("not_found");
  });

  it("returns structured 400 for malformed JSON", async () => {
    const res = await request(app).post("/api/v1/nope").set("Content-Type", "application/json").send("{bad");
    expect(res.status).toBe(400);
    expect(apiErrorSchema.parse(res.body).error.code).toBe("validation_failed");
  });

  it("echoes only well-formed upstream request IDs", async () => {
    const good = await request(app).get("/api/v1/health").set("X-Request-Id", "abc12345-proxy");
    expect(good.headers["x-request-id"]).toBe("abc12345-proxy");
    const bad = await request(app).get("/api/v1/health").set("X-Request-Id", "<script>");
    expect(bad.headers["x-request-id"]).not.toBe("<script>");
  });
});
