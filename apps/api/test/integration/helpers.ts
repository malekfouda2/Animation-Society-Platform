import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mongoose from "mongoose";
import { pino } from "pino";
import { createApp } from "../../src/app.js";
import { connectDatabase, type Database } from "../../src/db/mongo.js";
import { createAuthService } from "../../src/features/auth/auth.service.js";
import { createSecretBox } from "../../src/features/auth/secrets.js";
import { ContactMessage } from "../../src/features/contact/contact.model.js";
import { mongoContactStore, outboxContactMailer } from "../../src/features/contact/contact.service.js";
import { createContentService } from "../../src/features/content/content.service.js";
import { Email } from "../../src/features/email/email.model.js";
import { createMediaService } from "../../src/features/media/media.service.js";
import { createMailer, localInboxTransport } from "../../src/features/email/email.service.js";

export const ORIGIN = "http://localhost:3100";
export const SOCIETY_INBOX = "society-inbox@example.test";

/** Same replica set, a database of its own per test file (files run in parallel). */
export function testUri(dbName: string): string | undefined {
  const uri = process.env["MONGODB_URI_TEST"];
  if (!uri) return undefined;
  const u = new URL(uri);
  u.pathname = `/${dbName}`;
  return u.toString();
}

export async function connectFresh(uri: string): Promise<Database> {
  const db = await connectDatabase(uri);
  await mongoose.connection.dropDatabase();
  // Unique indexes must exist before tests rely on them.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  return db;
}

/** Controllable clock for expiry tests. */
export function testClock(start = new Date(Math.floor(Date.now() / 60_000) * 60_000)) {
  // Starts at the real time: the test client drops cookies whose expiry is already past.
  let t = start.getTime();
  return {
    now: () => new Date(t),
    advance: (ms: number) => { t += ms; },
  };
}

export function buildApp(clock: { now: () => Date }) {
  const mailer = createMailer(localInboxTransport, clock.now);
  const service = createAuthService({
    mailer,
    secretBox: createSecretBox(Buffer.alloc(32, 9).toString("base64")),
    publicOrigin: ORIGIN,
    now: clock.now,
  });
  const media = createMediaService({ dir: mkdtempSync(join(tmpdir(), "as-media-")), now: clock.now });
  return createApp({
    logger: pino({ level: "silent" }),
    databaseStatus: () => Promise.resolve({ connected: true, replicaSet: true }),
    auth: { service, cookies: { secure: false }, publicOrigin: ORIGIN, rateLimitScale: 100 },
    content: { service: createContentService({ now: clock.now, media }), publicOrigin: ORIGIN },
    media: { service: media, publicOrigin: ORIGIN },
    contact: {
      store: mongoContactStore(ContactMessage),
      mailer: outboxContactMailer(mailer, SOCIETY_INBOX, () => undefined),
      publicOrigin: ORIGIN,
    },
    devInbox: true,
  });
}

/** Newest email to an address, and the token in its first link. */
export async function lastEmail(to: string) {
  const email = await Email.findOne({ to }).sort({ createdAt: -1, _id: -1 }).lean();
  if (!email) throw new Error(`no email to ${to}`);
  const token = /token=([A-Za-z0-9_-]{43})/.exec(email.text ?? "")?.[1];
  return { ...email, token };
}
