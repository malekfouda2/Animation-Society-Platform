import { hash, verify } from "@node-rs/argon2";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from "node:crypto";

/** OWASP Password Storage Cheat Sheet minimum for Argon2id (19 MiB, 2 iterations, 1 lane). */
// algorithm 2 = Argon2id (the package exports it as a const enum, unusable under verbatimModuleSyntax).
const ARGON2 = { algorithm: 2, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2);
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;
/** Spends the same work as a real check so unknown emails are not revealed by response time. */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword("timing-equaliser-not-a-real-password");
  await verifyPassword(await dummyHash, password);
}

/** 256-bit random token for cookies and emailed links (base64url, 43 characters). */
export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Tokens are stored only as SHA-256 digests; they are high-entropy, so a fast hash is sufficient. */
export function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
/** Recovery code shown to the user, e.g. "K7QXM-2RTAD" (50 bits). Stored only as a digest. */
export function recoveryCode(): string {
  let s = "";
  for (let i = 0; i < 10; i++) s += BASE32.charAt(randomInt(32));
  return `${s.slice(0, 5)}-${s.slice(5)}`;
}
export function normaliseRecoveryCode(code: string): string {
  return code.replace(/-/g, "");
}

/** AES-256-GCM with a key kept outside the database. Output: v1.<iv>.<tag>.<ciphertext> (base64url). */
export function createSecretBox(keyBase64: string) {
  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== 32) throw new Error("secret box key must be 32 bytes");
  return {
    seal(plain: string): string {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
      return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
    },
    open(sealed: string): string {
      const [v, iv, tag, data] = sealed.split(".");
      if (v !== "v1" || !iv || !tag || !data) throw new Error("unrecognised sealed secret");
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
    },
  };
}
export type SecretBox = ReturnType<typeof createSecretBox>;
