import { LOCALES } from "@as/contracts";
import { Schema, type InferSchemaType } from "mongoose";
import { defineModel } from "../../db/model.js";

/**
 * Outbox of every business email, written before the request that caused it succeeds.
 * In mock mode this collection IS the local development inbox (nothing leaves the machine).
 * With a real provider, the body is cleared after delivery because it can contain sign-in links.
 */
const emailSchema = new Schema(
  {
    to: { type: String, required: true, maxlength: 254 },
    locale: { type: String, required: true, enum: LOCALES },
    template: { type: String, required: true, maxlength: 40 },
    subject: { type: String, required: true, maxlength: 200 },
    text: { type: String, default: null, maxlength: 10_000 },
    /** Optional business key so a retried event cannot queue the same email twice. */
    dedupeKey: { type: String, default: undefined },
    mode: { type: String, required: true, enum: ["mock", "sandbox", "live"] },
    status: { type: String, required: true, enum: ["pending", "delivered", "failed"], default: "pending" },
    attempts: { type: Number, default: 0 },
    deliveredAt: { type: Date, default: null },
    lastError: { type: String, default: null, maxlength: 300 },
  },
  { timestamps: true, collection: "emails" },
);
emailSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } });
emailSchema.index({ createdAt: -1 });
emailSchema.index({ status: 1, createdAt: 1 });
export type EmailDoc = InferSchemaType<typeof emailSchema>;
export const Email = defineModel("Email", emailSchema);
