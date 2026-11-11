import type mongoose from "mongoose";
import { Schema } from "mongoose";
import { defineModel } from "../../db/model.js";

/**
 * Append-only record of material actions (who, what, when, to whom, why). The application never
 * updates or deletes these documents. Never store passwords, tokens, codes or payment data in meta.
 */
const auditEventSchema = new Schema(
  {
    /** User ID of the actor, or null for the operator CLI / system. */
    actorId: { type: Schema.Types.ObjectId, default: null, ref: "User" },
    actorKind: { type: String, required: true, enum: ["user", "cli", "system"] },
    action: { type: String, required: true, maxlength: 80 },
    targetType: { type: String, required: true, maxlength: 40 },
    targetId: { type: String, required: true, maxlength: 64 },
    reason: { type: String, maxlength: 500, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
    at: { type: Date, required: true },
  },
  { collection: "auditEvents", versionKey: false },
);
auditEventSchema.index({ targetType: 1, targetId: 1, at: -1 });
auditEventSchema.index({ actorId: 1, at: -1 });
auditEventSchema.index({ at: -1 });

export const AuditEvent = defineModel("AuditEvent", auditEventSchema);

export interface AuditEntry {
  actorId: string | null;
  actorKind: "user" | "cli" | "system";
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export async function audit(entry: AuditEntry, at: Date, session?: mongoose.ClientSession): Promise<void> {
  await AuditEvent.create([{ ...entry, reason: entry.reason ?? null, meta: entry.meta ?? {}, at }], session ? { session } : {});
}
