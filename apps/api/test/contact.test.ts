import { pino } from "pino";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { apiErrorSchema } from "@as/contracts";
import { createApp } from "../src/app.js";
import type { ContactStore } from "../src/features/contact/contact.service.js";

const ORIGIN = "http://localhost:3100";
const valid = { name: "Test Person", email: "test@example.com", subject: "Hello", message: "A message long enough.", locale: "en" };

function setup(limit = 5) {
  const saved: unknown[] = [];
  const notified: string[] = [];
  const store: ContactStore = { save: (m) => { saved.push(m); return Promise.resolve({ id: `id-${saved.length}` }); } };
  const app = createApp({
    logger: pino({ level: "silent" }),
    databaseStatus: () => Promise.resolve({ connected: true, replicaSet: true }),
    contact: {
      store,
      mailer: { mode: "mock", notifySociety: (id) => { notified.push(id); return Promise.resolve(); } },
      publicOrigin: ORIGIN,
      rateLimit: { limit, windowMs: 60_000 },
    },
  });
  return { app, saved, notified };
}

describe("POST /api/v1/contact", () => {
  it("stores a valid same-origin message and notifies the mailer", async () => {
    const { app, saved, notified } = setup();
    const res = await request(app).post("/api/v1/contact").set("Origin", ORIGIN).send(valid);
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ status: "accepted" });
    expect(saved).toHaveLength(1);
    expect(notified).toEqual(["id-1"]);
  });

  it("refuses cross-origin or origin-less submissions", async () => {
    const { app, saved } = setup();
    const cross = await request(app).post("/api/v1/contact").set("Origin", "https://evil.example").send(valid);
    expect(cross.status).toBe(403);
    const none = await request(app).post("/api/v1/contact").send(valid);
    expect(none.status).toBe(403);
    expect(saved).toHaveLength(0);
  });

  it("returns field errors for invalid input without storing", async () => {
    const { app, saved } = setup();
    const res = await request(app).post("/api/v1/contact").set("Origin", ORIGIN).send({ ...valid, email: "nope", message: "short" });
    expect(res.status).toBe(400);
    const body = apiErrorSchema.parse(res.body);
    expect(Object.keys(body.error.fields ?? {})).toEqual(expect.arrayContaining(["email", "message"]));
    expect(saved).toHaveLength(0);
  });

  it("accepts but discards honeypot submissions", async () => {
    const { app, saved, notified } = setup();
    const res = await request(app).post("/api/v1/contact").set("Origin", ORIGIN).send({ ...valid, website: "http://spam" });
    expect(res.status).toBe(202);
    expect(saved).toHaveLength(0);
    expect(notified).toHaveLength(0);
  });

  it("rate-limits repeated submissions", async () => {
    const { app } = setup(2);
    for (let i = 0; i < 2; i++) {
      expect((await request(app).post("/api/v1/contact").set("Origin", ORIGIN).send(valid)).status).toBe(202);
    }
    const res = await request(app).post("/api/v1/contact").set("Origin", ORIGIN).send(valid);
    expect(res.status).toBe(429);
    expect(apiErrorSchema.parse(res.body).error.code).toBe("rate_limited");
  });

  it("rejects line breaks in single-line fields (header injection)", async () => {
    const { app, saved } = setup();
    const res = await request(app).post("/api/v1/contact").set("Origin", ORIGIN).send({ ...valid, subject: "Hi\r\nBcc: x@y.z" });
    expect(res.status).toBe(400);
    expect(saved).toHaveLength(0);
  });

  it("strips unknown fields", async () => {
    const { app, saved } = setup();
    await request(app).post("/api/v1/contact").set("Origin", ORIGIN).send({ ...valid, extra: "x" });
    expect(saved[0]).not.toHaveProperty("extra");
  });
});
