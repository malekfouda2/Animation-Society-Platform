import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectDatabase, type Database } from "../../src/db/mongo.js";

/**
 * Runs against a real replica set (npm run db:up). Uses an isolated throwaway database.
 * Opt-in via MONGODB_URI_TEST so unit tests never need Docker.
 */
const uri = process.env["MONGODB_URI_TEST"];

describe.skipIf(!uri)("MongoDB replica set (integration)", () => {
  let db: Database;
  const Probe = mongoose.model("IntegrationProbe", new mongoose.Schema({ key: { type: String, unique: true } }));

  beforeAll(async () => {
    db = await connectDatabase(uri ?? "");
    await Probe.createCollection();
    await Probe.syncIndexes();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await db.disconnect();
  });

  it("reports a transaction-capable replica set", async () => {
    expect(await db.status()).toEqual({ connected: true, replicaSet: true });
  });

  it("commits a multi-document transaction", async () => {
    await mongoose.connection.transaction(async (session) => {
      await Probe.create([{ key: "a" }, { key: "b" }], { session, ordered: true });
    });
    expect(await Probe.countDocuments({ key: { $in: ["a", "b"] } })).toBe(2);
  });

  it("rolls back every write when the transaction fails", async () => {
    await expect(
      mongoose.connection.transaction(async (session) => {
        await Probe.create([{ key: "c" }], { session });
        await Probe.create([{ key: "a" }], { session }); // duplicate key -> abort
      }),
    ).rejects.toThrow(/duplicate key/);
    expect(await Probe.countDocuments({ key: "c" })).toBe(0);
  });
});
