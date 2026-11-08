import { pino, type Logger } from "pino";

/** Paths redacted from every log line. Extend when adding sensitive fields. */
export const REDACT_PATHS = [
  "req.headers.cookie",
  "req.headers.authorization",
  "res.headers[\"set-cookie\"]",
  "*.password",
  "*.passwordHash",
  "*.token",
  "*.secret",
  "*.mfaSecret",
  "*.recoveryCodes",
];

export function createLogger(level: string): Logger {
  return pino({ level, redact: { paths: REDACT_PATHS, censor: "[redacted]" } });
}
