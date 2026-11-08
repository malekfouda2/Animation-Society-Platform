import type { HealthResponse, ReadinessResponse } from "@as/contracts";
import { Router } from "express";
import type { DatabaseStatus } from "../../db/mongo.js";

export interface HealthDeps {
  databaseStatus: () => Promise<DatabaseStatus>;
  now?: () => Date;
}

export function healthRouter({ databaseStatus, now = () => new Date() }: HealthDeps): Router {
  const router = Router();

  // Liveness: process is up. No dependencies checked, no internals exposed.
  router.get("/health", (_req, res) => {
    const payload: HealthResponse = { status: "ok", service: "api", time: now().toISOString() };
    res.set("Cache-Control", "no-store").json(payload);
  });

  // Readiness: dependencies usable. Database must be a replica set (transactions).
  router.get("/ready", async (_req, res) => {
    const db = await databaseStatus().catch(
      (): DatabaseStatus => ({ connected: false, replicaSet: false, detail: "status check failed" }),
    );
    const checks: ReadinessResponse["checks"] = [
      { name: "database", ok: db.connected, ...(db.connected ? {} : { detail: db.detail ?? "unavailable" }) },
      {
        name: "transactions",
        ok: db.replicaSet,
        ...(db.replicaSet ? {} : { detail: db.detail ?? "replica set required" }),
      },
    ];
    const ready = checks.every((c) => c.ok);
    const payload: ReadinessResponse = { status: ready ? "ready" : "not_ready", checks };
    res.status(ready ? 200 : 503).set("Cache-Control", "no-store").json(payload);
  });

  return router;
}
