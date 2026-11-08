import { randomUUID } from "node:crypto";
import { API_BASE_PATH } from "@as/contracts";
import express, { type Express } from "express";
import helmet from "helmet";
import type { Logger } from "pino";
import { pinoHttp } from "pino-http";
import type { DatabaseStatus } from "./db/mongo.js";
import { contactRouter, type ContactDeps } from "./features/contact/contact.routes.js";
import { healthRouter } from "./features/health/health.routes.js";
import { errorHandler, notFoundHandler } from "./http/errors.js";

export interface AppDeps {
  logger: Logger;
  databaseStatus: () => Promise<DatabaseStatus>;
  /** Set when running behind the production reverse proxy so req.ip/secure are correct. */
  trustProxy?: boolean;
  /** Contact form endpoint; omitted in tests that don't need it. */
  contact?: ContactDeps;
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

export function createApp({ logger, databaseStatus, trustProxy = false, contact }: AppDeps): Express {
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
  if (contact) app.use(API_BASE_PATH, contactRouter(contact));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
