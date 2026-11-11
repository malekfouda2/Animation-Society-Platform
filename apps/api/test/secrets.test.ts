import { recoveryCodeSchema } from "@as/contracts";
import { describe, expect, it } from "vitest";
import { createSecretBox, digest, hashPassword, randomToken, recoveryCode, verifyPassword } from "../src/features/auth/secrets.js";
import { createRateLimiter } from "../src/http/rate-limit.js";

describe("auth secrets", () => {
  it("hashes passwords with Argon2id and verifies them", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(await verifyPassword(stored, "correct horse battery")).toBe(true);
    expect(await verifyPassword(stored, "wrong")).toBe(false);
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
  });

  it("makes 256-bit URL-safe tokens and stores only digests", () => {
    const a = randomToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomToken()).not.toBe(a);
    expect(digest(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("seals secrets so a changed ciphertext or a different key fails", () => {
    const box = createSecretBox(Buffer.alloc(32, 1).toString("base64"));
    const sealed = box.seal("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP");
    expect(sealed).not.toContain("JBSWY3DP");
    expect(box.open(sealed)).toBe("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP");
    const parts = sealed.split(".");
    const flipped = [...parts.slice(0, 3), `A${(parts[3] ?? "").slice(1)}`].join(".");
    expect(() => box.open(flipped)).toThrow();
    expect(() => createSecretBox(Buffer.alloc(32, 2).toString("base64")).open(sealed)).toThrow();
  });

  it("formats recovery codes that the shared schema accepts", () => {
    const code = recoveryCode();
    expect(code).toMatch(/^[A-Z2-7]{5}-[A-Z2-7]{5}$/);
    expect(recoveryCodeSchema.parse(` ${code.toLowerCase()} `)).toBe(code);
  });

  it("limits by key and resets after the window", () => {
    let t = 0;
    const allow = createRateLimiter(2, 1000, () => t);
    expect([allow("a"), allow("a"), allow("a"), allow("b")]).toEqual([true, true, false, true]);
    t = 1000;
    expect(allow("a")).toBe(true);
  });
});
