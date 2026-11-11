import {
  isStaffRole,
  type Locale,
  type LoginInput,
  type MfaVerifyInput,
  type ProfileUpdateInput,
  type RegisterInput,
  type Role,
  type SessionUser,
  type SignInNext,
} from "@as/contracts";
import mongoose, { type ClientSession, type Types } from "mongoose";
import { generateSecret, generateURI, verify as verifyTotp } from "otplib";
import QRCode from "qrcode";
import { HttpError } from "../../http/errors.js";
import { audit } from "../audit/audit.model.js";
import type { Mailer } from "../email/email.service.js";
import { AuthToken, MfaCredential, Session, User, type TokenPurpose } from "./auth.models.js";
import {
  burnPasswordCheck,
  digest,
  hashPassword,
  normaliseRecoveryCode,
  randomToken,
  recoveryCode,
  verifyPassword,
  type SecretBox,
} from "./secrets.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Session lifetimes (assumption recorded in DECISIONS, reversible): members stay signed in for up to
 * 30 days and 14 idle days; staff sessions end after 12 hours or 30 idle minutes. A staff session
 * must pass the second factor within 10 minutes of the password step.
 */
export const SESSION_POLICY = {
  member: { idleMs: 14 * DAY, absoluteMs: 30 * DAY },
  staff: { idleMs: 30 * MINUTE, absoluteMs: 12 * HOUR },
  mfaPendingMs: 10 * MINUTE,
  /** lastSeenAt is written at most this often, so reads stay cheap. */
  touchEveryMs: MINUTE,
  /** Wrong second-factor attempts before the session is revoked. */
  mfaMaxFailures: 5,
  /** A sensitive action needs a password or code proof this recent. */
  reauthMs: 10 * MINUTE,
} as const;

export const TOKEN_TTL: Record<TokenPurpose, number> = {
  verify_email: DAY,
  reset_password: HOUR,
  set_password: 2 * DAY,
};

const RECOVERY_CODE_COUNT = 10;
/** Standard authenticator settings (SHA-1, 6 digits, 30 s), which every common app supports. */
const TOTP_PERIOD = 30;

export interface AuthServiceDeps {
  mailer: Mailer;
  secretBox: SecretBox;
  publicOrigin: string;
  now?: () => Date;
  /** Authenticator issuer label shown in the app. */
  mfaIssuer?: string;
}

export interface AuthenticatedSession {
  sessionId: string;
  userId: string;
  role: Role;
  locale: Locale;
  email: string;
  name: string;
  staff: boolean;
  mfaVerified: boolean;
  reauthAt: Date | null;
  startedAt: Date;
}

interface UserLike {
  _id: Types.ObjectId;
  email: string;
  name: string;
  role: Role;
  locale: Locale;
}

function policyFor(role: Role) {
  return isStaffRole(role) ? SESSION_POLICY.staff : SESSION_POLICY.member;
}

async function inTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  return mongoose.connection.transaction(fn);
}

export function createAuthService({ mailer, secretBox, publicOrigin, now = () => new Date(), mfaIssuer = "Animation Society" }: AuthServiceDeps) {
  const link = (locale: Locale, path: string, token?: string) =>
    `${publicOrigin}/${locale}/${path}${token ? `?token=${token}` : ""}`;

  async function issueToken(userId: Types.ObjectId, purpose: TokenPurpose, session?: ClientSession): Promise<string> {
    const t = now();
    // Only the newest link of a purpose works: earlier unused ones are retired.
    await AuthToken.updateMany({ userId, purpose, usedAt: null }, { usedAt: t }, session ? { session } : {});
    const token = randomToken();
    await AuthToken.create([{ tokenHash: digest(token), userId, purpose, expiresAt: new Date(t.getTime() + TOKEN_TTL[purpose]) }], session ? { session } : {});
    return token;
  }

  /** Marks a token used exactly once; a second use, an expired or a foreign-purpose token fails. */
  async function consumeToken(token: string, purposes: TokenPurpose[], session: ClientSession) {
    const doc = await AuthToken.findOneAndUpdate(
      { tokenHash: digest(token), purpose: { $in: purposes }, usedAt: null, expiresAt: { $gt: now() } },
      { usedAt: now() },
      { session, returnDocument: "after" },
    );
    if (!doc) throw new HttpError("token_invalid", "This link is invalid, expired or already used");
    return doc;
  }

  async function createSession(user: UserLike, userAgent: string, opts: { mfaVerified?: boolean; session?: ClientSession } = {}) {
    const t = now();
    const token = randomToken();
    const [doc] = await Session.create(
      [
        {
          tokenHash: digest(token),
          userId: user._id,
          startedAt: t,
          expiresAt: new Date(t.getTime() + policyFor(user.role).absoluteMs),
          lastSeenAt: t,
          mfaVerifiedAt: opts.mfaVerified ? t : null,
          reauthAt: t,
          userAgent: userAgent.slice(0, 300),
        },
      ],
      opts.session ? { session: opts.session } : {},
    );
    if (!doc) throw new Error("session not created");
    return { token, expiresAt: doc.expiresAt };
  }

  /** New cookie token for the same session (after the second factor or a password change). */
  async function rotateSession(sessionId: string, extra: Record<string, unknown> = {}) {
    const token = randomToken();
    const doc = await Session.findByIdAndUpdate(sessionId, { tokenHash: digest(token), ...extra }, { returnDocument: "after" });
    if (!doc) throw new HttpError("unauthenticated", "Session ended");
    return { token, expiresAt: doc.expiresAt };
  }

  async function mfaStateOf(auth: Pick<AuthenticatedSession, "staff" | "mfaVerified" | "userId">): Promise<SessionUser["mfa"]> {
    if (!auth.staff) return "not_required";
    if (auth.mfaVerified) return "verified";
    const cred = await MfaCredential.findOne({ userId: auth.userId }, { enrolledAt: 1 }).lean();
    return cred?.enrolledAt ? "verify" : "enroll";
  }

  async function toSessionUser(auth: AuthenticatedSession): Promise<SessionUser> {
    return { id: auth.userId, email: auth.email, name: auth.name, role: auth.role, locale: auth.locale, mfa: await mfaStateOf(auth) };
  }

  function nextStep(mfa: SessionUser["mfa"]): SignInNext {
    return mfa === "enroll" ? "mfa_enroll" : mfa === "verify" ? "mfa_verify" : "done";
  }

  async function checkTotp(userId: string, code: string, field: "secretSealed" | "pendingSecretSealed") {
    const cred = await MfaCredential.findOne({ userId });
    const sealed = cred?.[field];
    if (!cred || !sealed) return null;
    const epoch = Math.floor(now().getTime() / 1000);
    const result = await verifyTotp({
      secret: secretBox.open(sealed),
      token: code,
      epoch,
      // One 30-second step either side, for phone clock drift.
      epochTolerance: 30,
      afterTimeStep: cred.lastTimeStep,
    });
    if (!result.valid) return null;
    const timeStep = Math.floor(epoch / TOTP_PERIOD) + result.delta;
    // Atomic replay guard: the same code (time step) is accepted once, even under concurrent requests.
    const claimed = await MfaCredential.updateOne(
      { _id: cred._id, lastTimeStep: { $lt: timeStep } },
      { lastTimeStep: timeStep },
    );
    return claimed.modifiedCount === 1 ? cred : null;
  }

  async function recordMfaFailure(sessionId: string): Promise<never> {
    const doc = await Session.findByIdAndUpdate(sessionId, { $inc: { mfaFailures: 1 } }, { returnDocument: "after" });
    if (!doc || doc.mfaFailures >= SESSION_POLICY.mfaMaxFailures) {
      await Session.deleteOne({ _id: sessionId });
      throw new HttpError("unauthenticated", "Too many wrong codes; sign in again");
    }
    throw new HttpError("validation_failed", "That code didn't work", { code: ["code_wrong"] });
  }

  function newRecoveryCodes() {
    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, recoveryCode);
    return { codes, stored: codes.map((c) => ({ hash: digest(normaliseRecoveryCode(c)), usedAt: null })) };
  }

  return {
    /**
     * Resolves a cookie token to an active session, enforcing absolute, idle and MFA-pending expiry
     * at request time (the TTL index only cleans up later).
     */
    async authenticate(token: string): Promise<AuthenticatedSession | null> {
      const t = now();
      const session = await Session.findOne({ tokenHash: digest(token) }).lean();
      if (!session) return null;
      const user = await User.findById(session.userId, { email: 1, name: 1, role: 1, locale: 1, status: 1 }).lean();
      const staff = user ? isStaffRole(user.role) : false;
      const expired =
        !user ||
        user.status !== "active" ||
        session.expiresAt <= t ||
        session.lastSeenAt.getTime() + policyFor(user.role).idleMs <= t.getTime() ||
        (staff && !session.mfaVerifiedAt && session.startedAt.getTime() + SESSION_POLICY.mfaPendingMs <= t.getTime());
      if (expired) {
        await Session.deleteOne({ _id: session._id });
        return null;
      }
      if (t.getTime() - session.lastSeenAt.getTime() >= SESSION_POLICY.touchEveryMs) {
        await Session.updateOne({ _id: session._id }, { lastSeenAt: t });
      }
      return {
        sessionId: String(session._id),
        userId: String(user._id),
        role: user.role,
        locale: user.locale,
        email: user.email,
        name: user.name,
        staff,
        mfaVerified: Boolean(session.mfaVerifiedAt),
        reauthAt: session.reauthAt ?? null,
        startedAt: session.startedAt,
      };
    },

    toSessionUser,

    /** Always resolves the same way whether or not the email is registered (no account enumeration). */
    async register(input: RegisterInput): Promise<void> {
      // Hash first so new and existing emails cost the same time.
      const passwordHash = await hashPassword(input.password);
      const existing = await User.findOne({ email: input.email });
      if (existing) {
        if (!existing.emailVerifiedAt && existing.passwordHash) {
          const token = await issueToken(existing._id, "verify_email");
          await mailer.send(existing.email, existing.locale, { template: "verify_email", vars: { name: existing.name, link: link(existing.locale, "verify-email", token) } });
        } else {
          await mailer.send(existing.email, existing.locale, {
            template: "account_exists",
            vars: { name: existing.name, signInLink: link(existing.locale, "sign-in"), resetLink: link(existing.locale, "forgot-password") },
          });
        }
        return;
      }
      const emailId = await inTransaction(async (session) => {
        const [user] = await User.create([{ email: input.email, name: input.name, passwordHash, locale: input.locale, role: "member" }], { session });
        if (!user) throw new Error("user not created");
        const token = await issueToken(user._id, "verify_email", session);
        return mailer.queue(user.email, user.locale, { template: "verify_email", vars: { name: user.name, link: link(user.locale, "verify-email", token) } }, { session });
      }).catch((err: unknown) => {
        // Lost a race with a concurrent sign-up for the same email: answer as if accepted.
        if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) return null;
        throw err;
      });
      if (emailId) await mailer.deliver(emailId);
    },

    async resendVerification(email: string): Promise<void> {
      const user = await User.findOne({ email, emailVerifiedAt: null, status: "active", passwordHash: { $ne: null } });
      if (!user) return;
      const token = await issueToken(user._id, "verify_email");
      await mailer.send(user.email, user.locale, { template: "verify_email", vars: { name: user.name, link: link(user.locale, "verify-email", token) } });
    },

    async verifyEmail(token: string): Promise<void> {
      await inTransaction(async (session) => {
        const doc = await consumeToken(token, ["verify_email"], session);
        await User.updateOne({ _id: doc.userId, emailVerifiedAt: null }, { emailVerifiedAt: now() }, { session });
      });
    },

    async signIn(input: LoginInput, userAgent: string) {
      const user = await User.findOne({ email: input.email });
      if (!user?.passwordHash) {
        await burnPasswordCheck(input.password);
        throw new HttpError("invalid_credentials", "Email or password is incorrect");
      }
      if (!(await verifyPassword(user.passwordHash, input.password)) || user.status !== "active") {
        throw new HttpError("invalid_credentials", "Email or password is incorrect");
      }
      // Only revealed after a correct password, so it does not leak which emails exist.
      if (!user.emailVerifiedAt) throw new HttpError("email_unverified", "Confirm your email before signing in");
      const { token, expiresAt } = await createSession(user, userAgent);
      const auth: AuthenticatedSession = {
        sessionId: "",
        userId: String(user._id),
        role: user.role,
        locale: user.locale,
        email: user.email,
        name: user.name,
        staff: isStaffRole(user.role),
        mfaVerified: false,
        reauthAt: now(),
        startedAt: now(),
      };
      const sessionUser = await toSessionUser(auth);
      return { token, expiresAt, result: { next: nextStep(sessionUser.mfa), user: sessionUser } };
    },

    async signOut(token: string): Promise<void> {
      await Session.deleteOne({ tokenHash: digest(token) });
    },

    async requestPasswordReset(email: string): Promise<void> {
      const user = await User.findOne({ email, status: "active" });
      if (!user) return;
      const token = await issueToken(user._id, "reset_password");
      await mailer.send(user.email, user.locale, { template: "reset_password", vars: { name: user.name, link: link(user.locale, "reset-password", token) } });
    },

    /** Reset (forgot password) or first password for an invited staff member. Ends every session. */
    async resetPassword(token: string, password: string): Promise<void> {
      const passwordHash = await hashPassword(password);
      const notice = await inTransaction(async (session) => {
        const doc = await consumeToken(token, ["reset_password", "set_password"], session);
        const user = await User.findById(doc.userId, null, { session });
        if (!user || user.status !== "active") throw new HttpError("token_invalid", "This link is invalid, expired or already used");
        const t = now();
        const wasSet = Boolean(user.passwordHash);
        user.passwordHash = passwordHash;
        user.passwordChangedAt = t;
        // Following the emailed link proves the inbox.
        user.emailVerifiedAt ??= t;
        await user.save({ session });
        await Session.deleteMany({ userId: user._id }, { session });
        // Other outstanding reset links stop working too.
        await AuthToken.updateMany({ userId: user._id, purpose: { $in: ["reset_password", "set_password"] }, usedAt: null }, { usedAt: t }, { session });
        await audit({ actorId: String(user._id), actorKind: "user", action: doc.purpose === "set_password" ? "auth.password_set" : "auth.password_reset", targetType: "user", targetId: String(user._id) }, t, session);
        if (!wasSet) return null;
        return mailer.queue(user.email, user.locale, { template: "password_changed", vars: { name: user.name, resetLink: link(user.locale, "forgot-password") } }, { session });
      });
      if (notice) await mailer.deliver(notice);
    },

    async changePassword(auth: AuthenticatedSession, currentPassword: string, newPassword: string) {
      const user = await User.findById(auth.userId);
      if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, currentPassword))) {
        throw new HttpError("validation_failed", "Current password is incorrect", { currentPassword: ["password_wrong"] });
      }
      const passwordHash = await hashPassword(newPassword);
      const t = now();
      const emailId = await inTransaction(async (session) => {
        await User.updateOne({ _id: user._id }, { passwordHash, passwordChangedAt: t }, { session });
        await Session.deleteMany({ userId: user._id, _id: { $ne: auth.sessionId } }, { session });
        await audit({ actorId: auth.userId, actorKind: "user", action: "auth.password_changed", targetType: "user", targetId: auth.userId }, t, session);
        return mailer.queue(user.email, user.locale, { template: "password_changed", vars: { name: user.name, resetLink: link(user.locale, "forgot-password") } }, { session });
      });
      await mailer.deliver(emailId);
      return rotateSession(auth.sessionId, { reauthAt: t });
    },

    async updateProfile(auth: AuthenticatedSession, input: ProfileUpdateInput): Promise<void> {
      // Whitelisted fields only (the schema is strict): role, email and status are never taken from the client.
      await User.updateOne({ _id: auth.userId }, { name: input.name, locale: input.locale });
    },

    async startMfaEnrollment(auth: AuthenticatedSession) {
      const existing = await MfaCredential.findOne({ userId: auth.userId }, { enrolledAt: 1 }).lean();
      if (existing?.enrolledAt) throw new HttpError("forbidden", "An authenticator is already set up");
      const secret = generateSecret();
      await MfaCredential.updateOne({ userId: auth.userId }, { $set: { pendingSecretSealed: secretBox.seal(secret) } }, { upsert: true });
      const uri = generateURI({ issuer: mfaIssuer, label: auth.email, secret });
      const qrSvg = await QRCode.toString(uri, { type: "svg", errorCorrectionLevel: "M", margin: 2 });
      return { uri, secret, qrSvg };
    },

    async confirmMfaEnrollment(auth: AuthenticatedSession, code: string) {
      const cred = await checkTotp(auth.userId, code, "pendingSecretSealed");
      if (!cred?.pendingSecretSealed) return recordMfaFailure(auth.sessionId);
      const { codes, stored } = newRecoveryCodes();
      const t = now();
      await MfaCredential.updateOne(
        { _id: cred._id, enrolledAt: null },
        { secretSealed: cred.pendingSecretSealed, pendingSecretSealed: null, enrolledAt: t, recoveryCodes: stored },
      );
      await audit({ actorId: auth.userId, actorKind: "user", action: "mfa.enrolled", targetType: "user", targetId: auth.userId }, t);
      const rotated = await rotateSession(auth.sessionId, { mfaVerifiedAt: t, reauthAt: t, mfaFailures: 0 });
      return { recoveryCodes: codes, ...rotated };
    },

    async verifyMfa(auth: AuthenticatedSession, input: MfaVerifyInput) {
      const t = now();
      if ("code" in input) {
        const cred = await checkTotp(auth.userId, input.code, "secretSealed");
        if (!cred?.enrolledAt) return recordMfaFailure(auth.sessionId);
      } else {
        const used = await MfaCredential.updateOne(
          { userId: auth.userId, enrolledAt: { $ne: null }, recoveryCodes: { $elemMatch: { hash: digest(normaliseRecoveryCode(input.recoveryCode)), usedAt: null } } },
          { $set: { "recoveryCodes.$.usedAt": t } },
        );
        if (used.modifiedCount !== 1) return recordMfaFailure(auth.sessionId);
        await audit({ actorId: auth.userId, actorKind: "user", action: "mfa.recovery_code_used", targetType: "user", targetId: auth.userId }, t);
      }
      return rotateSession(auth.sessionId, { mfaVerifiedAt: t, reauthAt: t, mfaFailures: 0 });
    },

    /** Fresh proof for a sensitive action: the authenticator code for staff, the password for members. */
    async reauthenticate(auth: AuthenticatedSession, proof: { code?: string | undefined; password?: string | undefined }) {
      if (auth.staff) {
        if (!proof.code || !(await checkTotp(auth.userId, proof.code, "secretSealed"))) return recordMfaFailure(auth.sessionId);
      } else {
        const user = await User.findById(auth.userId, { passwordHash: 1 }).lean();
        if (!proof.password || !user?.passwordHash || !(await verifyPassword(user.passwordHash, proof.password))) {
          throw new HttpError("validation_failed", "Password is incorrect", { password: ["password_wrong"] });
        }
      }
      await Session.updateOne({ _id: auth.sessionId }, { reauthAt: now() });
    },

    /** Replaces all recovery codes; needs a code from the authenticator in the same request. */
    async regenerateRecoveryCodes(auth: AuthenticatedSession, code: string) {
      const cred = await checkTotp(auth.userId, code, "secretSealed");
      if (!cred?.enrolledAt) return recordMfaFailure(auth.sessionId);
      const { codes, stored } = newRecoveryCodes();
      const t = now();
      await MfaCredential.updateOne({ _id: cred._id }, { recoveryCodes: stored });
      await Session.updateOne({ _id: auth.sessionId }, { reauthAt: t });
      await audit({ actorId: auth.userId, actorKind: "user", action: "mfa.recovery_codes_regenerated", targetType: "user", targetId: auth.userId }, t);
      return { recoveryCodes: codes };
    },

    async recoveryCodesLeft(userId: string): Promise<number> {
      const cred = await MfaCredential.findOne({ userId }, { recoveryCodes: 1 }).lean();
      return cred?.recoveryCodes.filter((c) => !c.usedAt).length ?? 0;
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
