import { describe, expect, it } from "vitest";
import { EnvValidationError, loadEnv } from "../src/config/env.js";

const valid = {
  NODE_ENV: "development",
  MONGODB_URI: "mongodb://127.0.0.1:27017/test?replicaSet=rs0",
  PUBLIC_ORIGIN: "http://localhost:3100",
  PAYMENT_MODE: "mock",
  EMAIL_MODE: "mock",
  MFA_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
};

describe("loadEnv", () => {
  it("accepts a valid development configuration and applies defaults", () => {
    const env = loadEnv(valid);
    expect(env.API_PORT).toBe(4100);
    expect(env.API_HOST).toBe("127.0.0.1");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("names every missing required variable", () => {
    const run = () => loadEnv({});
    expect(run).toThrow(EnvValidationError);
    try {
      run();
    } catch (err) {
      const problems = (err as EnvValidationError).problems.join("\n");
      for (const key of ["MONGODB_URI", "PUBLIC_ORIGIN", "PAYMENT_MODE", "EMAIL_MODE", "MFA_ENCRYPTION_KEY"]) {
        expect(problems).toContain(key);
      }
    }
  });

  it("refuses mock integrations and plain http in production", () => {
    try {
      loadEnv({ ...valid, NODE_ENV: "production" });
      expect.unreachable();
    } catch (err) {
      const problems = (err as EnvValidationError).problems.join("\n");
      expect(problems).toContain("PAYMENT_MODE");
      expect(problems).toContain("EMAIL_MODE");
      expect(problems).toContain("PUBLIC_ORIGIN");
    }
  });

  it("refuses sandbox integrations in production", () => {
    expect(() =>
      loadEnv({
        ...valid,
        NODE_ENV: "production",
        PUBLIC_ORIGIN: "https://example.org",
        PAYMENT_MODE: "sandbox",
        EMAIL_MODE: "live",
      }),
    ).toThrow(/PAYMENT_MODE/);
  });

  it("never echoes supplied values in error messages", () => {
    const secret = "mongodb-not-a-url-s3cr3t-password";
    try {
      loadEnv({ ...valid, MONGODB_URI: secret });
      expect.unreachable();
    } catch (err) {
      expect((err as Error).message).not.toContain("s3cr3t");
    }
  });
});

describe("MFA_ENCRYPTION_KEY", () => {
  const base = {
    NODE_ENV: "development",
    MONGODB_URI: "mongodb://127.0.0.1:27017/test?replicaSet=rs0",
    PUBLIC_ORIGIN: "http://localhost:3100",
    PAYMENT_MODE: "mock",
    EMAIL_MODE: "mock",
  };
  it("rejects a key that is not 32 bytes, without echoing it", () => {
    try {
      loadEnv({ ...base, MFA_ENCRYPTION_KEY: "c2hvcnQ=" });
      expect.unreachable();
    } catch (err) {
      const problems = (err as EnvValidationError).problems.join("\n");
      expect(problems).toContain("MFA_ENCRYPTION_KEY");
      expect(problems).not.toContain("c2hvcnQ=");
    }
  });
});
