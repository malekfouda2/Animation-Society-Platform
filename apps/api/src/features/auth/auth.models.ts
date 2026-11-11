import { LOCALES, ROLES } from "@as/contracts";
import { Schema, type InferSchemaType } from "mongoose";
import { defineModel as model } from "../../db/model.js";

const userSchema = new Schema(
  {
    /** Normalised (trimmed, lower-case) and unique. Never used as a foreign key. */
    email: { type: String, required: true, maxlength: 254 },
    name: { type: String, required: true, maxlength: 120 },
    /** Null for staff invited by the CLI until they set a password from the emailed link. */
    passwordHash: { type: String, default: null },
    role: { type: String, required: true, enum: ROLES, default: "member" },
    locale: { type: String, required: true, enum: LOCALES },
    emailVerifiedAt: { type: Date, default: null },
    /** Disabled accounts cannot sign in; their sessions are revoked when disabled. */
    status: { type: String, required: true, enum: ["active", "disabled"], default: "active" },
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "users" },
);
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);

const sessionSchema = new Schema(
  {
    /** SHA-256 of the cookie token; the token itself is never stored. */
    tokenHash: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    /** When the password step happened (from the injectable clock, unlike createdAt). */
    startedAt: { type: Date, required: true },
    /** Absolute expiry. The TTL index only cleans up; expiry is always checked at request time. */
    expiresAt: { type: Date, required: true },
    /** Idle expiry is lastSeenAt + idle window (role-dependent). */
    lastSeenAt: { type: Date, required: true },
    /** Staff sessions are limited until the second factor passes. */
    mfaVerifiedAt: { type: Date, default: null },
    /** Last fresh proof (password or authenticator code) for sensitive actions. */
    reauthAt: { type: Date, default: null },
    /** Failed second-factor attempts on this session; the session is revoked at the limit. */
    mfaFailures: { type: Number, default: 0 },
    userAgent: { type: String, maxlength: 300, default: "" },
  },
  { timestamps: true, collection: "sessions" },
);
sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export type SessionDoc = InferSchemaType<typeof sessionSchema>;
export const Session = model("Session", sessionSchema);

export const TOKEN_PURPOSES = ["verify_email", "reset_password", "set_password"] as const;
export type TokenPurpose = (typeof TOKEN_PURPOSES)[number];

const authTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    purpose: { type: String, required: true, enum: TOKEN_PURPOSES },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "authTokens" },
);
authTokenSchema.index({ tokenHash: 1 }, { unique: true });
authTokenSchema.index({ userId: 1, purpose: 1 });
// Keep used/expired tokens a week for investigation, then let MongoDB remove them.
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });
export const AuthToken = model("AuthToken", authTokenSchema);

const mfaCredentialSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    /** Authenticator secret sealed with MFA_ENCRYPTION_KEY (AES-256-GCM). Null until enrolment starts. */
    secretSealed: { type: String, default: null },
    /** Secret offered during enrolment, not yet confirmed with a code. */
    pendingSecretSealed: { type: String, default: null },
    enrolledAt: { type: Date, default: null },
    /** Highest TOTP time step accepted; codes at or before it are refused (replay protection). */
    lastTimeStep: { type: Number, default: 0 },
    /** Ten single-use codes, stored as SHA-256 digests. Bounded, so embedding is safe. */
    recoveryCodes: [{ _id: false, hash: { type: String, required: true }, usedAt: { type: Date, default: null } }],
  },
  { timestamps: true, collection: "mfaCredentials" },
);
mfaCredentialSchema.index({ userId: 1 }, { unique: true });
export type MfaCredentialDoc = InferSchemaType<typeof mfaCredentialSchema>;
export const MfaCredential = model("MfaCredential", mfaCredentialSchema);
