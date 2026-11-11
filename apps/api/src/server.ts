import { createApp } from "./app.js";
import { EnvValidationError, loadEnv } from "./config/env.js";
import { connectDatabase } from "./db/mongo.js";
import { createAuthService } from "./features/auth/auth.service.js";
import { createSecretBox } from "./features/auth/secrets.js";
import { ContactMessage } from "./features/contact/contact.model.js";
import { createMailer, localInboxTransport } from "./features/email/email.service.js";
import { mongoContactStore, outboxContactMailer } from "./features/contact/contact.service.js";
import { createContentService } from "./features/content/content.service.js";
import { createMediaService } from "./features/media/media.service.js";
import { resolve } from "node:path";
import { createLogger } from "./logger.js";

async function main(): Promise<void> {
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    if (err instanceof EnvValidationError) {
      process.stderr.write(`${err.message}\nSee apps/api/.env.example.\n`);
      process.exit(1);
    }
    throw err;
  }

  const logger = createLogger(env.LOG_LEVEL);
  logger.info({ nodeEnv: env.NODE_ENV, paymentMode: env.PAYMENT_MODE, emailMode: env.EMAIL_MODE }, "starting api");

  const database = await connectDatabase(env.MONGODB_URI).catch((err: unknown) => {
    logger.fatal({ err }, "database connection failed; is MongoDB running? (npm run db:up)");
    process.exit(1);
  });

  if (env.EMAIL_MODE !== "mock") {
    // No real email adapter exists yet; refuse to pretend messages are delivered.
    logger.fatal({ emailMode: env.EMAIL_MODE }, "no email adapter is implemented for this EMAIL_MODE yet");
    process.exit(1);
  }
  const mailer = createMailer(localInboxTransport);
  const media = createMediaService({ dir: resolve(env.MEDIA_DIR) });
  const secure = env.NODE_ENV === "production";
  const app = createApp({
    logger,
    databaseStatus: () => database.status(),
    trustProxy: env.NODE_ENV === "production",
    contact: {
      store: mongoContactStore(ContactMessage),
      mailer: outboxContactMailer(mailer, env.CONTACT_INBOX, (msg, fields) => { logger.info(fields, msg); }),
      publicOrigin: env.PUBLIC_ORIGIN,
    },
    auth: {
      service: createAuthService({ mailer, secretBox: createSecretBox(env.MFA_ENCRYPTION_KEY), publicOrigin: env.PUBLIC_ORIGIN }),
      cookies: { secure },
      publicOrigin: env.PUBLIC_ORIGIN,
    },
    content: { service: createContentService({ media }), publicOrigin: env.PUBLIC_ORIGIN },
    media: { service: media, publicOrigin: env.PUBLIC_ORIGIN },
    // The local inbox exposes sign-in links: mock email only (enforced above), never in production.
    devInbox: env.NODE_ENV !== "production",
  });
  const server = app.listen(env.API_PORT, env.API_HOST, () => {
    logger.info({ host: env.API_HOST, port: env.API_PORT }, "api listening");
  });
  server.on("error", (err) => {
    logger.fatal({ err }, "api failed to listen (port in use? set API_PORT)");
    void database.disconnect().finally(() => process.exit(1));
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "shutting down");
    server.close(() => {
      void database.disconnect().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => { shutdown("SIGTERM"); });
  process.on("SIGINT", () => { shutdown("SIGINT"); });
}

void main();
