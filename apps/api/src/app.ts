import { randomUUID } from "node:crypto";
import { API_BASE_PATH } from "@as/contracts";
import express, { type Express } from "express";
import helmet from "helmet";
import type { Logger } from "pino";
import { pinoHttp } from "pino-http";
import type { DatabaseStatus } from "./db/mongo.js";
import { adminRouter } from "./features/admin/admin.routes.js";
import { loadSession } from "./features/auth/auth.middleware.js";
import { authRouter, type AuthRouteDeps } from "./features/auth/auth.routes.js";
import { contactRouter, type ContactDeps } from "./features/contact/contact.routes.js";
import { adminContentRouter, publicContentRouter, type ContentDeps } from "./features/content/content.routes.js";
import { devInboxRouter } from "./features/email/email.routes.js";
import { adminMediaRouter, mediaRouter, type MediaDeps } from "./features/media/media.routes.js";
import { healthRouter } from "./features/health/health.routes.js";
import { errorHandler, notFoundHandler } from "./http/errors.js";

export interface AppDeps {
  logger: Logger;
  databaseStatus: () => Promise<DatabaseStatus>;
  /** Set when running behind the production reverse proxy so req.ip/secure are correct. */
  trustProxy?: boolean;
  /** Contact form endpoint; omitted in tests that don't need it. */
  contact?: ContactDeps;
  /** Accounts, sessions and staff two-step sign-in; omitted in tests that don't need them. */
  auth?: AuthRouteDeps;
  /** Public content read API, and (with auth) the staff editing API. */
  content?: ContentDeps;
  /** Image uploads (staff) and image serving. Needs auth for uploads. */
  media?: MediaDeps;
  /** Development-only local inbox route. Never enable in production (server.ts guards this). */
  devInbox?: boolean;
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

export function createApp({ logger, databaseStatus, trustProxy = false, contact, auth, content, media, devInbox = false }: AppDeps): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", trustProxy ? 1 : false);

  app.use(
    pinoHttp({
      logger,
      // Accept a well-formed upstream request ID (reverse proxy), otherwise generate one.
      genReqId: (req, res) => {
        const incoming = req.headers["x-request-id"];
        const id = typeof incoming === "string" && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === `${API_BASE_PATH}/health` },
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));

  app.use(API_BASE_PATH, healthRouter({ databaseStatus }));
  if (auth) {
    app.use(API_BASE_PATH, loadSession(auth.service, auth.cookies));
    app.use(API_BASE_PATH, authRouter(auth));
    app.use(API_BASE_PATH, adminRouter());
    if (content) app.use(API_BASE_PATH, adminContentRouter(content));
    if (media) app.use(API_BASE_PATH, adminMediaRouter(media));
  }
  if (media) app.use(API_BASE_PATH, mediaRouter(media));
  if (content) app.use(API_BASE_PATH, publicContentRouter(content));
  if (contact) app.use(API_BASE_PATH, contactRouter(contact));
  if (devInbox) app.use(API_BASE_PATH, devInboxRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
