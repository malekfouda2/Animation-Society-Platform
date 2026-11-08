import type { ApiError, ErrorCode } from "@as/contracts";
import type { ErrorRequestHandler, Request, RequestHandler } from "express";
import { ZodError } from "zod";

const STATUS_BY_CODE: Readonly<Record<ErrorCode, number>> = {
  validation_failed: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  rate_limited: 429,
  internal_error: 500,
};

/** Throw from services/controllers for expected failures; mapped to a safe JSON body. */
export class HttpError extends Error {
  readonly status: number;
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "HttpError";
    this.status = STATUS_BY_CODE[code];
  }
}

function body(code: ErrorCode, message: string, requestId: string, fields?: Record<string, string[]>): ApiError {
  return { error: { code, message, requestId, ...(fields ? { fields } : {}) } };
}

/** pino-http assigns the ID; it is always a string here (see genReqId in app.ts). */
export function requestIdOf(req: Request): string {
  return typeof req.id === "string" || typeof req.id === "number" ? String(req.id) : "unknown";
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(body("not_found", "Resource not found", requestIdOf(req)));
};

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const requestId = requestIdOf(req);
  if (err instanceof HttpError) {
    res.status(err.status).json(body(err.code, err.message, requestId, err.fields));
    return;
  }
  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      (fields[key] ??= []).push(issue.message);
    }
    res.status(400).json(body("validation_failed", "Invalid request", requestId, fields));
    return;
  }
  // Malformed JSON bodies from express.json().
  if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.parse.failed") {
    res.status(400).json(body("validation_failed", "Malformed JSON body", requestId));
    return;
  }
  if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.too.large") {
    res.status(413).json(body("validation_failed", "Request body too large", requestId));
    return;
  }
  // Unexpected: log full detail server-side, return nothing internal to the client.
  req.log.error({ err }, "unhandled error");
  res.status(500).json(body("internal_error", "Internal server error", requestId));
};
